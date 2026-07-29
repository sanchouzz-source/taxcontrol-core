// ============================================================
// UserMembershipService v1.1.0
// Managed USER membership application service
//
// Security contract:
// - one USER row grants one email access to one organization
// - organization always comes from the authenticated SecurityContext
// - only ADMIN or DIRECTOR may mutate memberships
// - SYSTEM, custom grants and arbitrary organization input are rejected
// - email, UserID and OrganizationID are immutable after creation
// - the current membership cannot change its own role or deactivate itself
// - the last active ADMIN/DIRECTOR membership cannot be removed
// - Google `sub` binding is self-only and requires an internal GAS identity
// - all mutations pass through UserRepository for canonical events/audit
// ============================================================

console.log(
  "UserMembershipService v1.1.0"
);

const UserMembershipService = {
  version: "1.1.0",
  initialized: false,
  repository: null,
  managedBy:
    "UserMembershipService",
  privilegedRoles: [
    "ADMIN",
    "DIRECTOR",
  ],

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "UserRepository",
      "SecurityContext",
      "SecurityGuard",
      "RoleConstants",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "UserMembershipService requires " +
            name
        );
      }
    });

    [
      "create",
      "findById",
      "findAll",
      "update",
      "restore",
    ].forEach((method) => {
      if (
        typeof UserRepository[
          method
        ] !== "function"
      ) {
        throw new Error(
          "UserRepository API missing " +
            method
        );
      }
    });

    if (
      UserRepository.initialized !==
        true
    ) {
      throw new Error(
        "UserRepository is not initialized"
      );
    }

    this.repository =
      UserRepository;
    this.initialized = true;

    Logger.log(
      "UserMembershipService READY v" +
        this.version
    );

    return true;
  },

  reset() {
    this.repository = null;
    this.initialized = false;
    return true;
  },

  _requireReady() {
    if (!this.initialized) {
      throw new Error(
        "UserMembershipService is not initialized; call startERP()"
      );
    }

    return true;
  },

  _context() {
    this._requireReady();

    const context =
      SecurityContext.require();

    if (
      context.System === true ||
      context.Role === "SYSTEM"
    ) {
      throw new Error(
        "HUMAN_ADMIN_CONTEXT_REQUIRED"
      );
    }

    if (
      !context.UserID ||
      !context.OrganizationID
    ) {
      throw new Error(
        "AUTHENTICATION REQUIRED"
      );
    }

    return context;
  },

  _requirePermission(permission) {
    const context =
      this._context();

    SecurityGuard.require(
      permission
    );

    return context;
  },

  _requireAdministrator(
    permission
  ) {
    const context =
      this._requirePermission(
        permission
      );

    if (
      !this.privilegedRoles
        .includes(context.Role)
    ) {
      throw new Error(
        "USER_MEMBERSHIP_ADMIN_REQUIRED"
      );
    }

    return context;
  },

  _managedOptions(
    action
  ) {
    return {
      managedBy: this.managedBy,
      managementAction:
        String(action || "")
          .trim()
          .toUpperCase(),
    };
  },

  _lock() {
    if (
      typeof LockService ===
        "undefined" ||
      typeof LockService
        .getScriptLock !==
        "function"
    ) {
      return {
        tryLock() {
          return true;
        },
        releaseLock() {},
      };
    }

    return LockService
      .getScriptLock();
  },

  _withLock(callback) {
    const lock = this._lock();

    if (!lock.tryLock(30000)) {
      throw new Error(
        "USER_MEMBERSHIP_LOCK_UNAVAILABLE"
      );
    }

    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  },

  _isTrue(value) {
    if (value === true || value === 1) {
      return true;
    }

    return [
      "TRUE",
      "1",
      "YES",
      "Y",
      "ДА",
      "ACTIVE",
    ].includes(
      String(value || "")
        .trim()
        .toUpperCase()
    );
  },

  _isDeleted(row) {
    return !!(
      row &&
      this._isTrue(row.Deleted)
    );
  },

  _isActive(row) {
    return !!(
      row &&
      !this._isDeleted(row) &&
      this._isTrue(row.Active)
    );
  },

  _normalizeEmail(value) {
    const email =
      String(value || "")
        .trim()
        .toLowerCase();

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email)
    ) {
      throw new Error(
        "USER_EMAIL_INVALID"
      );
    }

    return email;
  },

  _normalizeName(value) {
    const name =
      String(value || "")
        .trim();

    if (name.length > 160) {
      throw new Error(
        "USER_NAME_TOO_LONG"
      );
    }

    return name;
  },

  _normalizeRole(value) {
    const role =
      RoleConstants.normalize(
        value
      );

    if (
      !role ||
      role === "SYSTEM" ||
      !RoleConstants.has(role)
    ) {
      throw new Error(
        "USER_ROLE_INVALID"
      );
    }

    return role;
  },

  _organizationFrom(
    input,
    context
  ) {
    const supplied =
      String(
        input.OrganizationID ||
        input.organizationId ||
        ""
      ).trim();
    const current =
      String(
        context.OrganizationID ||
        ""
      ).trim();

    if (!current) {
      throw new Error(
        "ORGANIZATION_CONTEXT_REQUIRED"
      );
    }

    if (
      supplied &&
      supplied !== current
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    return current;
  },

  _assertObject(
    value,
    label
  ) {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    ) {
      throw new Error(
        label +
          " must be an object"
      );
    }

    return value;
  },

  _assertAllowedKeys(
    input,
    allowed,
    label
  ) {
    const allowedSet =
      new Set(allowed);
    const unknown =
      Object.keys(input)
        .filter(
          (key) =>
            !allowedSet.has(key)
        );

    if (unknown.length) {
      throw new Error(
        label +
          " contains forbidden fields: " +
          unknown.join(", ")
      );
    }

    return true;
  },

  _allRows() {
    return this.repository.findAll(
      {},
      {
        includeDeleted: true,
      }
    );
  },

  _findRequired(userId) {
    const id =
      String(userId || "")
        .trim();

    if (!id) {
      throw new Error(
        "USER_ID_REQUIRED"
      );
    }

    const row =
      this.repository.findById(
        id,
        {
          includeDeleted: true,
        }
      );

    if (!row) {
      throw new Error(
        "USER_MEMBERSHIP_NOT_FOUND"
      );
    }

    return row;
  },

  _emailOf(row) {
    return String(
      row.Email ||
      row.Login ||
      ""
    )
      .trim()
      .toLowerCase();
  },

  _activeDuplicate(
    rows,
    email,
    excludeId
  ) {
    return rows.find((row) => {
      return (
        String(
          row.UserID || ""
        ) !==
          String(
            excludeId || ""
          ) &&
        this._emailOf(row) ===
          email &&
        this._isActive(row)
      );
    }) || null;
  },

  _anyDuplicate(
    rows,
    email
  ) {
    return rows.find(
      (row) =>
        this._emailOf(row) ===
          email
    ) || null;
  },

  _activePrivilegedCount(
    rows
  ) {
    return rows.filter((row) => {
      const role =
        RoleConstants.normalize(
          row.Role
        );

      return (
        this._isActive(row) &&
        this.privilegedRoles
          .includes(role)
      );
    }).length;
  },

  _assertActorStillAuthorized(
    actor,
    rows
  ) {
    const current =
      rows.find(
        (row) =>
          String(row.UserID) ===
          String(actor.UserID)
      ) || null;
    const currentRole =
      current
        ? RoleConstants.normalize(
          current.Role
        )
        : "";

    if (
      !current ||
      !this._isActive(current) ||
      currentRole !== actor.Role ||
      !this.privilegedRoles
        .includes(currentRole)
    ) {
      throw new Error(
        "ACTOR_MEMBERSHIP_STALE"
      );
    }

    return current;
  },

  _protectSelf(
    actor,
    row,
    action
  ) {
    if (
      String(actor.UserID) ===
      String(row.UserID)
    ) {
      throw new Error(
        "SELF_" +
          action +
          "_DENIED"
      );
    }

    return true;
  },

  _protectLastPrivileged(
    rows,
    row,
    nextRole,
    nextActive
  ) {
    const currentRole =
      RoleConstants.normalize(
        row.Role
      );
    const wasPrivileged =
      this.privilegedRoles
        .includes(currentRole) &&
      this._isActive(row);
    const willBePrivileged =
      nextActive === true &&
      this.privilegedRoles
        .includes(nextRole);

    if (
      wasPrivileged &&
      !willBePrivileged &&
      this._activePrivilegedCount(
        rows
      ) <= 1
    ) {
      throw new Error(
        "LAST_PRIVILEGED_MEMBERSHIP_PROTECTED"
      );
    }

    return true;
  },

  _publicRow(row) {
    return {
      UserID:
        String(row.UserID || ""),
      OrganizationID:
        String(
          row.OrganizationID || ""
        ),
      Email:
        this._emailOf(row),
      Name:
        String(row.Name || ""),
      Role:
        RoleConstants.normalize(
          row.Role
        ),
      Active:
        this._isActive(row),
      Deleted:
        this._isDeleted(row),
      CreatedAt:
        row.CreatedAt || "",
      UpdatedAt:
        row.UpdatedAt || "",
    };
  },

  listMemberships(
    options = {}
  ) {
    this._requirePermission(
      "USER_READ"
    );

    const includeInactive =
      options.includeInactive !==
        false;
    const includeDeleted =
      options.includeDeleted ===
        true;

    return this._allRows()
      .filter(
        (row) =>
          (
            includeDeleted ||
            !this._isDeleted(row)
          ) &&
          (
            includeInactive ||
            this._isActive(row)
          )
      )
      .map(
        (row) =>
          this._publicRow(row)
      )
      .sort((left, right) => {
        return (
          left.Email.localeCompare(
            right.Email
          ) ||
          left.UserID.localeCompare(
            right.UserID
          )
        );
      });
  },

  getMembership(userId) {
    this._requirePermission(
      "USER_READ"
    );

    return this._publicRow(
      this._findRequired(userId)
    );
  },

  createMembership(
    input = {}
  ) {
    const actor =
      this._requireAdministrator(
        "USER_CREATE"
      );
    const source =
      this._assertObject(
        input,
        "Membership"
      );

    this._assertAllowedKeys(
      source,
      [
        "Email",
        "email",
        "Login",
        "login",
        "Name",
        "name",
        "Role",
        "role",
        "OrganizationID",
        "organizationId",
      ],
      "Membership"
    );

    const email =
      this._normalizeEmail(
        source.Email ||
        source.email ||
        source.Login ||
        source.login
      );
    const login =
      source.Login ||
      source.login;

    if (
      login &&
      this._normalizeEmail(
        login
      ) !== email
    ) {
      throw new Error(
        "USER_LOGIN_EMAIL_MISMATCH"
      );
    }

    const role =
      this._normalizeRole(
        source.Role ||
        source.role
      );
    const name =
      this._normalizeName(
        source.Name ||
        source.name
      );
    const organizationId =
      this._organizationFrom(
        source,
        actor
      );

    return this._withLock(() => {
      const rows =
        this._allRows();

      this._assertActorStillAuthorized(
        actor,
        rows
      );

      const duplicate =
        this._anyDuplicate(
          rows,
          email
        );

      if (duplicate) {
        throw new Error(
          "MEMBERSHIP_ALREADY_EXISTS: " +
            duplicate.UserID
        );
      }

      const result =
        this.repository.create(
          {
            OrganizationID:
              organizationId,
            Login: email,
            Email: email,
            Name: name,
            Role: role,
            Permissions: "",
            DeniedPermissions: "",
            Active: true,
            Deleted: false,
          },
          this._managedOptions(
            "CREATE"
          )
        );

      return this._publicRow(
        result
      );
    });
  },

  updateMembership(
    userId,
    changes = {}
  ) {
    const actor =
      this._requireAdministrator(
        "USER_UPDATE"
      );
    const patch =
      this._assertObject(
        changes,
        "Membership update"
      );

    this._assertAllowedKeys(
      patch,
      [
        "Name",
        "name",
        "Role",
        "role",
      ],
      "Membership update"
    );

    const hasName =
      Object.prototype
        .hasOwnProperty.call(
          patch,
          "Name"
        ) ||
      Object.prototype
        .hasOwnProperty.call(
          patch,
          "name"
        );
    const hasRole =
      Object.prototype
        .hasOwnProperty.call(
          patch,
          "Role"
        ) ||
      Object.prototype
        .hasOwnProperty.call(
          patch,
          "role"
        );

    if (!hasName && !hasRole) {
      throw new Error(
        "MEMBERSHIP_UPDATE_EMPTY"
      );
    }

    return this._withLock(() => {
      const row =
        this._findRequired(
          userId
        );

      if (this._isDeleted(row)) {
        throw new Error(
          "MEMBERSHIP_DELETED_USE_REACTIVATE"
        );
      }

      const data = {};
      const rows =
        this._allRows();

      this._assertActorStillAuthorized(
        actor,
        rows
      );

      if (hasName) {
        data.Name =
          this._normalizeName(
            patch.Name ||
            patch.name
          );
      }

      if (hasRole) {
        const nextRole =
          this._normalizeRole(
            patch.Role ||
            patch.role
          );
        const currentRole =
          RoleConstants.normalize(
            row.Role
          );

        if (nextRole !== currentRole) {
          this._protectSelf(
            actor,
            row,
            "ROLE_CHANGE"
          );
          this._protectLastPrivileged(
            rows,
            row,
            nextRole,
            this._isActive(row)
          );
          data.Role = nextRole;
        }
      }

      if (!Object.keys(data).length) {
        return this._publicRow(
          row
        );
      }

      const result =
        this.repository.update(
          row.UserID,
          data,
          this._managedOptions(
            "UPDATE"
          )
        );

      return this._publicRow(
        result
      );
    });
  },

  changeRole(userId, role) {
    return this.updateMembership(
      userId,
      {
        Role: role,
      }
    );
  },

  deactivateMembership(
    userId
  ) {
    const actor =
      this._requireAdministrator(
        "USER_DELETE"
      );

    return this._withLock(() => {
      const row =
        this._findRequired(
          userId
        );

      if (
        this._isDeleted(row) ||
        !this._isActive(row)
      ) {
        return this._publicRow(
          row
        );
      }

      this._protectSelf(
        actor,
        row,
        "DEACTIVATION"
      );

      const rows =
        this._allRows();

      this._assertActorStillAuthorized(
        actor,
        rows
      );

      const currentRole =
        RoleConstants.normalize(
          row.Role
        );

      this._protectLastPrivileged(
        rows,
        row,
        currentRole,
        false
      );

      const result =
        this.repository.update(
          row.UserID,
          {
            Active: false,
          },
          this._managedOptions(
            "DEACTIVATE"
          )
        );

      return this._publicRow(
        result
      );
    });
  },

  reactivateMembership(
    userId
  ) {
    const actor =
      this._requireAdministrator(
        "USER_RESTORE"
      );

    return this._withLock(() => {
      let row =
        this._findRequired(
          userId
        );
      const email =
        this._normalizeEmail(
          this._emailOf(row)
        );
      const role =
        this._normalizeRole(
          row.Role
        );
      const rows =
        this._allRows();

      this._assertActorStillAuthorized(
        actor,
        rows
      );

      const duplicate =
        this._activeDuplicate(
          rows,
          email,
          row.UserID
        );

      if (duplicate) {
        throw new Error(
          "ACTIVE_MEMBERSHIP_DUPLICATE: " +
            duplicate.UserID
        );
      }

      if (
        this._isActive(row)
      ) {
        return this._publicRow(
          row
        );
      }

      if (this._isDeleted(row)) {
        row =
          this.repository.restore(
            row.UserID,
            this._managedOptions(
              "RESTORE"
            )
          );
      }

      if (!this._isTrue(row.Active)) {
        row =
          this.repository.update(
            row.UserID,
            {
              Active: true,
              Role: role,
            },
            this._managedOptions(
              "REACTIVATE"
            )
          );
      }

      return this._publicRow(
        row
      );
    });
  },

  _normalizeGoogleSubject(
    value
  ) {
    const subject =
      String(value || "").trim();

    if (
      !subject ||
      subject.length > 255 ||
      !/^[A-Za-z0-9._:-]+$/
        .test(subject)
    ) {
      throw new Error(
        "GOOGLE_CREDENTIAL_INVALID"
      );
    }

    return subject;
  },

  bindGoogleSubject(
    subject,
    verifiedEmail
  ) {
    const actor =
      this._context();

    if (
      actor.Source !==
        "GAS_ACTIVE_USER_DIRECTORY"
    ) {
      throw new Error(
        "EXTERNAL_BINDING_REQUIRES_INTERNAL_SESSION"
      );
    }

    const normalizedSubject =
      this._normalizeGoogleSubject(
        subject
      );
    const email =
      this._normalizeEmail(
        verifiedEmail
      );

    if (
      email !==
        this._normalizeEmail(
          actor.Email
        )
    ) {
      throw new Error(
        "EXTERNAL_BINDING_EMAIL_MISMATCH"
      );
    }

    return this._withLock(() => {
      const rows =
        this._allRows();
      const current =
        rows.find(
          (row) =>
            String(row.UserID) ===
              String(actor.UserID) &&
            String(
              row.OrganizationID
            ) ===
              String(
                actor.OrganizationID
              )
        ) || null;

      if (
        !current ||
        !this._isActive(current) ||
        this._emailOf(current) !==
          email ||
        RoleConstants.normalize(
          current.Role
        ) !== actor.Role
      ) {
        throw new Error(
          "ACTOR_MEMBERSHIP_STALE"
        );
      }

      const existing =
        String(
          current.GoogleSubject ||
          ""
        ).trim();

      if (
        existing &&
        existing !==
          normalizedSubject
      ) {
        throw new Error(
          "EXTERNAL_BINDING_CONFLICT"
        );
      }

      const duplicate =
        rows.find(
          (row) =>
            String(row.UserID) !==
              String(
                current.UserID
              ) &&
            String(
              row.GoogleSubject ||
              ""
            ).trim() ===
              normalizedSubject
        ) || null;

      if (duplicate) {
        throw new Error(
          "EXTERNAL_BINDING_DUPLICATE"
        );
      }

      if (!existing) {
        this.repository.update(
          current.UserID,
          {
            GoogleSubject:
              normalizedSubject,
          },
          this._managedOptions(
            "BIND_GOOGLE_SUBJECT"
          )
        );
      }

      return {
        ...this._publicRow(
          current
        ),
        GoogleIdentityLinked:
          true,
        IdentityProvider:
          "GOOGLE",
      };
    });
  },

  health() {
    const repositoryReady =
      !!(
        this.repository &&
        this.repository
          .initialized === true
      );

    return {
      module:
        "UserMembershipService",
      version: this.version,
      initialized:
        this.initialized,
      repositoryReady,
      managedEntity: "USER",
      organizationFromRequest:
        false,
      customPermissionGrants:
        false,
      hardDeleteExposed:
        false,
      googleSubjectSelfBinding:
        true,
      googleSubjectExposed:
        false,
      status:
        this.initialized &&
        repositoryReady
          ? "OK"
          : "WARNING",
    };
  },
};

globalThis.UserMembershipService =
  UserMembershipService;
