// ============================================================
// TestTrustedAccessContract v1.1.0
// Non-destructive GAS contract for Packages H/I
// ============================================================

function runTrustedAccessContractTest() {
  const checks = [];

  const check = (
    name,
    callback
  ) => {
    try {
      callback();
      checks.push({
        name,
        status: "PASS",
      });
    } catch (error) {
      checks.push({
        name,
        status: "FAIL",
        error: error.message,
      });
    }
  };

  const assert = (
    condition,
    message
  ) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  if (
    typeof SystemInit !==
      "undefined" &&
    typeof SystemInit.isReady ===
      "function" &&
    SystemInit.isReady() !== true
  ) {
    startERP();
  }

  check(
    "TRUSTED_COMPONENTS_AVAILABLE",
    () => {
      assert(
        typeof TrustedUserResolver ===
          "object",
        "TrustedUserResolver unavailable"
      );
      assert(
        typeof TrustedEntryPoints ===
          "object",
        "TrustedEntryPoints unavailable"
      );
      assert(
        typeof OrganizationMigrationPlanStore ===
          "object",
        "OrganizationMigrationPlanStore unavailable"
      );
      assert(
        typeof OrganizationScopeMigration ===
          "object",
        "OrganizationScopeMigration unavailable"
      );
      assert(
        typeof UserMembershipService ===
          "object",
        "UserMembershipService unavailable"
      );
    }
  );

  check(
    "TRUSTED_RESOLVER_CONTRACT",
    () => {
      [
        "init",
        "resolve",
        "inspect",
        "setPreferredOrganization",
        "reset",
      ].forEach((method) => {
        assert(
          typeof TrustedUserResolver[
            method
          ] === "function",
          "Resolver method missing " +
            method
        );
      });
    }
  );

  check(
    "TRUSTED_ENTRY_CONTRACT",
    () => {
      [
        "init",
        "run",
        "runMenu",
        "identityStatus",
        "reset",
      ].forEach((method) => {
        assert(
          typeof TrustedEntryPoints[
            method
          ] === "function",
          "Entry method missing " +
            method
        );
      });
    }
  );

  check(
    "ADMIN_PERMISSIONS_REGISTERED",
    () => {
      assert(
        PermissionConstants.has(
          "SYSTEM_ADMIN"
        ),
        "SYSTEM_ADMIN missing"
      );
      assert(
        PermissionConstants.has(
          "DATA_MIGRATE"
        ),
        "DATA_MIGRATE missing"
      );
    }
  );

  check(
    "LIFECYCLE_ORDER",
    () => {
      const order =
        SystemInit.resolveOrder(
          SystemInit
            .componentDefinitions
        );
      const before = (
        left,
        right
      ) => {
        assert(
          order.indexOf(left) <
            order.indexOf(right),
          left +
            " must start before " +
            right
        );
      };

      before(
        "Database",
        "TrustedUserResolver"
      );
      before(
        "TrustedUserResolver",
        "UserMembershipService"
      );
      before(
        "UserMembershipService",
        "TrustedEntryPoints"
      );
    }
  );

  check(
    "MEMBERSHIP_SWITCH_CHANGES_ROLE",
    () => {
      const profile = {
        UserID: "USR_A",
        Email:
          "contract@example.test",
        Role: "MANAGER",
        OrganizationID:
          "ORG_A",
        OrganizationMemberships: {
          ORG_A: {
            UserID: "USR_A",
            Role: "MANAGER",
            Permissions: [],
            DeniedPermissions: [],
          },
          ORG_B: {
            UserID: "USR_B",
            Role: "ACCOUNTANT",
            Permissions: [],
            DeniedPermissions: [],
          },
        },
      };

      SecurityContext.runAs(
        profile,
        () => {
          assert(
            SecurityContext.getRole() ===
              "MANAGER",
            "Initial role invalid"
          );
          SecurityContext
            .switchOrganization(
              "ORG_B"
            );
          assert(
            SecurityContext.getRole() ===
              "ACCOUNTANT",
            "Membership role was not applied"
          );
          assert(
            SecurityContext
              .getOrganizationId() ===
              "ORG_B",
            "Organization was not switched"
          );
        }
      );
    }
  );

  check(
    "MEMBERSHIP_SCOPE_DENIES_UNKNOWN_ORG",
    () => {
      SecurityContext.runAs(
        {
          UserID: "USR_A",
          Role: "VIEWER",
          OrganizationID:
            "ORG_A",
          OrganizationMemberships: {
            ORG_A: {
              UserID: "USR_A",
              Role: "VIEWER",
            },
          },
        },
        () => {
          let denied = false;

          try {
            SecurityContext
              .switchOrganization(
                "ORG_X"
              );
          } catch (error) {
            denied =
              /CROSS_ORGANIZATION/
                .test(
                  error.message
                );
          }

          assert(
            denied,
            "Unknown organization accepted"
          );
        }
      );
    }
  );

  check(
    "MENU_ACTIONS_ARE_ALLOWLISTED",
    () => {
      const actions =
        TrustedEntryPoints
          .menuActions;

      assert(
        Object.keys(actions)
          .length >= 35,
        "Unexpected menu action count"
      );
      assert(
        actions.DATABASE_REPAIR
          .permission ===
          "SYSTEM_ADMIN",
        "Repair is not protected"
      );
      assert(
        actions.CLIENT_CREATE
          .permission ===
          "CLIENT_CREATE",
        "Client create permission invalid"
      );
      assert(
        actions
          .USER_MEMBERSHIP_CREATE
          .permission ===
          "USER_CREATE",
        "User create permission invalid"
      );
      assert(
        actions
          .USER_MEMBERSHIP_DEACTIVATE
          .permission ===
          "USER_DELETE",
        "User deactivate permission invalid"
      );
    }
  );

  check(
    "MENU_CALLBACKS_EXIST",
    () => {
      [
        "menuStartERP",
        "menuERPHealth",
        "menuERPDiagnostics",
        "menuCreateClient",
        "menuRepairDatabase",
        "menuTrustedIdentityStatus",
        "menuSelectERPOrganization",
        "menuShowUserMemberships",
        "menuCreateUserMembership",
        "menuChangeUserMembershipRole",
        "menuDeactivateUserMembership",
        "menuReactivateUserMembership",
        "menuOrganizationScopeAudit",
        "menuPrepareOrganizationScopeMigration",
        "menuValidateOrganizationScopeMigration",
      ].forEach((name) => {
        assert(
          typeof globalThis[name] ===
            "function",
          "Menu callback missing " +
            name
        );
      });
    }
  );

  check(
    "MIGRATION_REQUIRES_EXPLICIT_APPLY",
    () => {
      assert(
        typeof applyOrganizationScopeMigration ===
          "function",
        "Apply command unavailable"
      );
      assert(
        OrganizationMigrationPlanStore
          .approvalPhrase(
            "PLAN"
          ) === "APPLY PLAN",
        "Approval phrase invalid"
      );
    }
  );

  check(
    "WEB_API_REMAINS_CLOSED",
    () => {
      assert(
        typeof globalThis.doGet ===
          "undefined" &&
        typeof globalThis.doPost ===
          "undefined",
        "Package H must not enable web API"
      );
    }
  );

  check(
    "CONTEXT_RESTORED",
    () => {
      assert(
        SecurityContext.get() ===
          null,
        "Security context leaked"
      );
    }
  );

  const failed =
    checks.filter(
      (item) =>
        item.status === "FAIL"
    );
  const result = {
    package: "H.1",
    status:
      failed.length
        ? "FAIL"
        : "PASS",
    total: checks.length,
    passed:
      checks.length -
      failed.length,
    failed: failed.length,
    writes: 0,
    checks,
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (failed.length) {
    throw new Error(
      "Trusted access contract failed: " +
        failed
          .map(
            (item) =>
              item.name +
              " — " +
              item.error
          )
          .join("; ")
    );
  }

  return result;
}
