// ============================================================
// TrustedUserResolver v1.0.0
// Google Apps Script identity -> trusted USER memberships
//
// Trust rules:
// - identity comes only from Session.getActiveUser().getEmail()
// - the script owner is never used as an identity fallback
// - roles and organizations come only from active USER rows
// - UserProperties stores only a preferred organization hint
// - every hint is revalidated against the directory on every execution
// ============================================================

console.log("TrustedUserResolver v1.0.0");

const TrustedUserResolver = {
  version: "1.0.0",
  initialized: false,

  preferenceKey:
    "TAXCONTROL_ACTIVE_ORGANIZATION",

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "SecurityContext",
      "RoleConstants",
      "Database",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "TrustedUserResolver requires " +
            name
        );
      }
    });

    if (
      typeof SecurityContext
        .runAsSystem !== "function" ||
      typeof Database.findAll !==
        "function"
    ) {
      throw new Error(
        "TrustedUserResolver dependencies invalid"
      );
    }

    this.initialized = true;
    return true;
  },

  _assertReady() {
    if (!this.initialized) {
      this.init();
    }

    return true;
  },

  _normalizeEmail(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  },

  _normalizeOrganization(value) {
    return String(value || "")
      .trim();
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

  _isDeleted(value) {
    return this._isTrue(value);
  },

  _parseList(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          String(item || "")
            .trim()
            .toUpperCase()
        )
        .filter(Boolean);
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    if (typeof value === "string") {
      const source = value.trim();

      if (
        source.startsWith("[") &&
        source.endsWith("]")
      ) {
        try {
          return this._parseList(
            JSON.parse(source)
          );
        } catch (error) {
          // Fall through to delimiter parsing.
        }
      }

      return source
        .split(/[,;\n]/)
        .map((item) =>
          item.trim().toUpperCase()
        )
        .filter(Boolean);
    }

    return [
      String(value)
        .trim()
        .toUpperCase(),
    ].filter(Boolean);
  },

  _activeEmail() {
    if (
      typeof Session === "undefined" ||
      typeof Session
        .getActiveUser !== "function"
    ) {
      throw new Error(
        "TRUSTED_IDENTITY_UNAVAILABLE: Session.getActiveUser unavailable"
      );
    }

    const activeUser =
      Session.getActiveUser();
    const email =
      activeUser &&
      typeof activeUser.getEmail ===
        "function"
        ? this._normalizeEmail(
          activeUser.getEmail()
        )
        : "";

    if (!email) {
      throw new Error(
        "TRUSTED_IDENTITY_UNAVAILABLE: active Google account email is empty"
      );
    }

    return email;
  },

  _userProperties() {
    if (
      typeof PropertiesService ===
        "undefined" ||
      typeof PropertiesService
        .getUserProperties !==
        "function"
    ) {
      return null;
    }

    return PropertiesService
      .getUserProperties();
  },

  _loadRows(entity) {
    this._assertReady();

    return SecurityContext.runAsSystem(
      {
        organizationId: "SYSTEM",
        bypassOrganizationScope:
          true,
        source:
          "TRUSTED_USER_RESOLVER",
      },
      () => {
        const rows =
          Database.findAll(
            entity,
            {
              includeDeleted: true,
              bypassOrganizationScope:
                true,
            }
          );

        if (!Array.isArray(rows)) {
          throw new Error(
            "Trusted directory returned invalid " +
              entity +
              " rows"
          );
        }

        return rows;
      }
    );
  },

  _organizationMap() {
    const result = {};

    this._loadRows(
      "ORGANIZATION"
    ).forEach((row) => {
      const organizationId =
        this._normalizeOrganization(
          row.OrganizationID
        );

      if (
        organizationId &&
        !this._isDeleted(row.Deleted)
      ) {
        result[organizationId] = {
          OrganizationID:
            organizationId,
          Name:
            String(
              row.Name ||
              row.LegalName ||
              organizationId
            ),
        };
      }
    });

    return result;
  },

  _directory(email) {
    const organizations =
      this._organizationMap();
    const matching = this._loadRows(
      "USER"
    ).filter((row) => {
      const rowEmail =
        this._normalizeEmail(
          row.Email ||
          row.Login
        );

      return rowEmail === email;
    });
    const invalid = [];
    const grouped = {};

    matching.forEach((row) => {
      const userId =
        String(row.UserID || "")
          .trim();
      const organizationId =
        this._normalizeOrganization(
          row.OrganizationID
        );
      const role =
        RoleConstants.normalize(
          row.Role
        );
      let reason = "";

      if (this._isDeleted(row.Deleted)) {
        reason = "USER_DELETED";
      } else if (
        !this._isTrue(row.Active)
      ) {
        reason = "USER_INACTIVE";
      } else if (!userId) {
        reason = "USER_ID_MISSING";
      } else if (!organizationId) {
        reason =
          "ORGANIZATION_ID_MISSING";
      } else if (
        !organizations[organizationId]
      ) {
        reason =
          "ORGANIZATION_NOT_FOUND";
      } else if (
        !role ||
        role === "SYSTEM" ||
        !RoleConstants.has(role)
      ) {
        reason = "ROLE_INVALID";
      }

      if (reason) {
        invalid.push({
          UserID: userId || null,
          OrganizationID:
            organizationId || null,
          reason,
        });
        return;
      }

      if (!grouped[organizationId]) {
        grouped[organizationId] = [];
      }

      grouped[organizationId].push({
        UserID: userId,
        Name:
          String(row.Name || ""),
        Email: email,
        Role: role,
        OrganizationID:
          organizationId,
        OrganizationName:
          organizations[
            organizationId
          ].Name,
        Permissions:
          this._parseList(
            row.Permissions
          ),
        DeniedPermissions:
          this._parseList(
            row.DeniedPermissions
          ),
      });
    });

    const memberships = [];

    Object.keys(grouped)
      .sort()
      .forEach((organizationId) => {
        const candidates =
          grouped[organizationId];

        if (candidates.length !== 1) {
          candidates.forEach(
            (candidate) => {
              invalid.push({
                UserID:
                  candidate.UserID,
                OrganizationID:
                  organizationId,
                reason:
                  "DUPLICATE_USER_MEMBERSHIP",
              });
            }
          );
          return;
        }

        memberships.push(
          candidates[0]
        );
      });

    return {
      email,
      matchingRows: matching.length,
      memberships,
      invalid,
    };
  },

  inspect() {
    this._assertReady();

    const email =
      this._activeEmail();
    const directory =
      this._directory(email);
    const properties =
      this._userProperties();
    const preferred =
      properties &&
      typeof properties
        .getProperty === "function"
        ? this._normalizeOrganization(
          properties.getProperty(
            this.preferenceKey
          )
        )
        : "";

    return {
      version: this.version,
      status:
        directory.memberships.length
          ? "READY"
          : "BLOCKED",
      email,
      preferredOrganizationID:
        preferred || null,
      matchingRows:
        directory.matchingRows,
      memberships:
        directory.memberships
          .map((membership) => ({
            UserID:
              membership.UserID,
            OrganizationID:
              membership
                .OrganizationID,
            OrganizationName:
              membership
                .OrganizationName,
            Role:
              membership.Role,
          })),
      invalidMemberships:
        directory.invalid,
    };
  },

  resolve(options = {}) {
    this._assertReady();

    const email =
      this._activeEmail();
    const directory =
      this._directory(email);
    const memberships =
      directory.memberships;

    if (!memberships.length) {
      throw new Error(
        "ACCESS_DENIED: no active USER membership for " +
          email
      );
    }

    const explicit =
      this._normalizeOrganization(
        options.organizationId ||
        options.OrganizationID
      );
    const properties =
      this._userProperties();
    const stored =
      !explicit &&
      properties &&
      typeof properties
        .getProperty === "function"
        ? this._normalizeOrganization(
          properties.getProperty(
            this.preferenceKey
          )
        )
        : "";
    const requested =
      explicit || stored;
    let selected = null;

    if (requested) {
      selected =
        memberships.find(
          (membership) =>
            membership
              .OrganizationID ===
            requested
        ) || null;

      if (!selected && explicit) {
        throw new Error(
          "CROSS_ORGANIZATION_ACCESS_DENIED"
        );
      }

      if (
        !selected &&
        stored &&
        properties &&
        typeof properties
          .deleteProperty ===
          "function"
      ) {
        properties.deleteProperty(
          this.preferenceKey
        );
      }
    }

    if (!selected) {
      if (memberships.length === 1) {
        selected = memberships[0];
      } else {
        throw new Error(
          "ORGANIZATION_SELECTION_REQUIRED: " +
            memberships
              .map(
                (membership) =>
                  membership
                    .OrganizationID
              )
              .join(", ")
        );
      }
    }

    const organizationMemberships =
      {};

    memberships.forEach(
      (membership) => {
        organizationMemberships[
          membership.OrganizationID
        ] = {
          UserID:
            membership.UserID,
          OrganizationID:
            membership
              .OrganizationID,
          Role: membership.Role,
          Permissions: [
            ...membership.Permissions,
          ],
          DeniedPermissions: [
            ...membership
              .DeniedPermissions,
          ],
        };
      }
    );

    return {
      UserID: selected.UserID,
      Name: selected.Name,
      Email: email,
      Role: selected.Role,
      OrganizationID:
        selected.OrganizationID,
      AllowedOrganizationIDs:
        memberships.map(
          (membership) =>
            membership.OrganizationID
        ),
      OrganizationMemberships:
        organizationMemberships,
      Permissions: [
        ...selected.Permissions,
      ],
      DeniedPermissions: [
        ...selected
          .DeniedPermissions,
      ],
      Source:
        "GAS_ACTIVE_USER_DIRECTORY",
    };
  },

  setPreferredOrganization(
    organizationId
  ) {
    this._assertReady();

    const target =
      this._normalizeOrganization(
        organizationId
      );

    if (!target) {
      throw new Error(
        "OrganizationID required"
      );
    }

    const email =
      this._activeEmail();
    const membership =
      this._directory(email)
        .memberships
        .find(
          (item) =>
            item.OrganizationID ===
            target
        );

    if (!membership) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    const properties =
      this._userProperties();

    if (
      !properties ||
      typeof properties
        .setProperty !== "function"
    ) {
      throw new Error(
        "UserProperties unavailable"
      );
    }

    properties.setProperty(
      this.preferenceKey,
      target
    );

    return this.resolve({
      organizationId: target,
    });
  },

  clearPreferredOrganization() {
    const properties =
      this._userProperties();

    if (
      properties &&
      typeof properties
        .deleteProperty === "function"
    ) {
      properties.deleteProperty(
        this.preferenceKey
      );
    }

    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module:
        "TrustedUserResolver",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      identityProvider:
        "Session.getActiveUser",
      effectiveUserFallback: false,
    };
  },
};

globalThis.TrustedUserResolver =
  TrustedUserResolver;
