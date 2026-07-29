// ============================================================
// ExternalUserResolver v1.0.0
// Verified Google subject -> active USER memberships
//
// Trust rules:
// - the Google subject comes only from GoogleIdTokenAuthenticator;
// - email is an additional consistency check, never the primary identifier;
// - role and organization always come from active USER rows;
// - an organization selector is only a verified choice among memberships;
// - duplicate or contradictory bindings fail closed.
// ============================================================

console.log("ExternalUserResolver v1.0.0");

const ExternalUserResolver = {
  version: "1.0.0",
  initialized: false,

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "Database",
      "SecurityContext",
      "SecurityGuard",
      "RoleConstants",
      "ExternalHttpContract",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ExternalUserResolver requires " +
            name
        );
      }
    });

    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  _error(code, internal) {
    return ExternalHttpContract
      .error(code, internal);
  },

  _assertReady() {
    if (!this.initialized) {
      this.init();
    }

    return true;
  },

  _isTrue(value) {
    if (
      value === true ||
      value === 1
    ) {
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
          // Delimiter parsing below is intentionally retained.
        }
      }

      return source
        .split(/[,;\n]/)
        .map((item) =>
          item.trim().toUpperCase()
        )
        .filter(Boolean);
    }

    return [];
  },

  _normalizeSubject(value) {
    return String(value || "")
      .trim();
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

  _loadRows(entity) {
    this._assertReady();

    return SecurityContext.runAsSystem(
      {
        organizationId: "SYSTEM",
        bypassOrganizationScope:
          true,
        source:
          "EXTERNAL_USER_RESOLVER",
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
            "External directory returned invalid rows"
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
        !this._isTrue(row.Deleted)
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

  _directory(identity) {
    const subject =
      this._normalizeSubject(
        identity.subject
      );
    const email =
      this._normalizeEmail(
        identity.email
      );
    const organizations =
      this._organizationMap();
    const subjectRows =
      this._loadRows("USER")
        .filter(
          (row) =>
            this._normalizeSubject(
              row.GoogleSubject
            ) === subject
        );
    const matching =
      subjectRows.filter(
        (row) =>
          this._normalizeEmail(
            row.Email ||
            row.Login
          ) === email
      );
    const invalid = [];
    const grouped = {};

    if (
      subjectRows.length &&
      !matching.length
    ) {
      throw this._error(
        "EXTERNAL_IDENTITY_EMAIL_MISMATCH",
        "Google subject email mismatch"
      );
    }

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

      if (this._isTrue(row.Deleted)) {
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

      grouped[organizationId]
        .push({
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
      .forEach(
        (organizationId) => {
          const candidates =
            grouped[
              organizationId
            ];

          if (
            candidates.length !== 1
          ) {
            invalid.push({
              OrganizationID:
                organizationId,
              reason:
                "DUPLICATE_EXTERNAL_IDENTITY_BINDING",
            });
            return;
          }

          memberships.push(
            candidates[0]
          );
        }
      );

    return {
      memberships,
      invalid,
      subjectRows:
        subjectRows.length,
    };
  },

  resolve(
    identity,
    options = {}
  ) {
    this._assertReady();

    if (
      !identity ||
      identity.provider !== "GOOGLE" ||
      !identity.subject ||
      !identity.email
    ) {
      throw this._error(
        "EXTERNAL_PRINCIPAL_INVALID",
        "Verified Google identity required"
      );
    }

    const directory =
      this._directory(identity);
    const memberships =
      directory.memberships;

    if (!memberships.length) {
      if (directory.invalid.length) {
        throw this._error(
          "EXTERNAL_IDENTITY_AMBIGUOUS",
          "No unambiguous active binding"
        );
      }

      throw this._error(
        "EXTERNAL_IDENTITY_NOT_LINKED",
        "Google subject has no active ERP binding"
      );
    }

    const requested =
      this._normalizeOrganization(
        options.organizationId ||
        options.OrganizationID
      );
    let selected = null;

    if (requested) {
      selected =
        memberships.find(
          (membership) =>
            membership
              .OrganizationID ===
            requested
        ) || null;

      if (!selected) {
        throw this._error(
          "CROSS_ORGANIZATION_ACCESS_DENIED",
          "External organization selector denied"
        );
      }
    } else if (
      memberships.length === 1
    ) {
      selected = memberships[0];
    } else {
      throw this._error(
        "ORGANIZATION_SELECTION_REQUIRED",
        "External identity has multiple memberships"
      );
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
      Email: selected.Email,
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
        "GOOGLE_ID_TOKEN_HTTP",
      IdentityProvider:
        "GOOGLE",
      ExternalAuthenticated: true,
    };
  },

  auditCurrentOrganization() {
    const context =
      SecurityContext.require();

    SecurityGuard.require(
      "SYSTEM_ADMIN"
    );

    const rows =
      Database.findAll(
        "USER",
        {
          includeDeleted: true,
        }
      );

    const report = {
      OrganizationID:
        context.OrganizationID,
      total: rows.length,
      linked: 0,
      missing: [],
      duplicateSubjects: [],
    };
    const subjects = {};

    rows.forEach((row) => {
      const subject =
        this._normalizeSubject(
          row.GoogleSubject
        );

      if (!subject) {
        report.missing.push({
          UserID:
            String(row.UserID || ""),
          Email:
            this._normalizeEmail(
              row.Email ||
              row.Login
            ),
        });
        return;
      }

      report.linked++;
      subjects[subject] =
        subjects[subject] || [];
      subjects[subject].push({
        UserID:
          String(row.UserID || ""),
        Email:
          this._normalizeEmail(
            row.Email ||
            row.Login
          ),
      });
    });

    Object.keys(subjects)
      .forEach((subject) => {
        if (
          subjects[subject]
            .length > 1
        ) {
          report
            .duplicateSubjects
            .push(
              subjects[subject]
            );
        }
      });

    report.status =
      report.missing.length ||
      report
        .duplicateSubjects.length
        ? "REVIEW_REQUIRED"
        : "READY";

    return report;
  },

  health() {
    return {
      module:
        "ExternalUserResolver",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      primaryIdentifier:
        "GOOGLE_SUBJECT",
      emailAsPrimaryIdentifier:
        false,
      roleFromRequest: false,
      organizationAsAuthority:
        false,
    };
  },
};

globalThis.ExternalUserResolver =
  ExternalUserResolver;
