// ============================================================
// TestUserMembershipContract v1.0.0
// Non-destructive GAS contract for Package I
// ============================================================

function runUserMembershipContractTest() {
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

  const expectError = (
    callback,
    pattern,
    message
  ) => {
    let error = null;

    try {
      callback();
    } catch (caught) {
      error = caught;
    }

    assert(
      !!error,
      message +
        ": expected error"
    );
    assert(
      pattern.test(error.message),
      message +
        ": unexpected error " +
        error.message
    );
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
    "USER_MANAGEMENT_COMPONENTS_AVAILABLE",
    () => {
      assert(
        typeof UserRepository ===
          "object",
        "UserRepository unavailable"
      );
      assert(
        typeof UserMembershipService ===
          "object",
        "UserMembershipService unavailable"
      );
    }
  );

  check(
    "USER_REPOSITORY_CONTRACT",
    () => {
      [
        "init",
        "reset",
        "create",
        "findById",
        "findAll",
        "update",
        "delete",
        "restore",
        "health",
      ].forEach((method) => {
        assert(
          typeof UserRepository[
            method
          ] === "function",
          "Repository method missing " +
            method
        );
      });
    }
  );

  check(
    "USER_SERVICE_CONTRACT",
    () => {
      [
        "init",
        "reset",
        "listMemberships",
        "getMembership",
        "createMembership",
        "updateMembership",
        "changeRole",
        "deactivateMembership",
        "reactivateMembership",
        "health",
      ].forEach((method) => {
        assert(
          typeof UserMembershipService[
            method
          ] === "function",
          "Service method missing " +
            method
        );
      });
    }
  );

  check(
    "USER_METADATA_IS_MANAGED",
    () => {
      const metadata =
        EntityRegistry.get("USER");

      assert(
        metadata &&
        metadata.options &&
        metadata.options
          .managedMutationService ===
          "UserMembershipService",
        "Managed USER metadata missing"
      );
      assert(
        metadata.events.created ===
          "USER_CREATED",
        "USER_CREATED event missing"
      );
      assert(
        metadata.events.restored ===
          "USER_RESTORED",
        "USER_RESTORED event missing"
      );
    }
  );

  check(
    "USER_REPOSITORY_REGISTERED",
    () => {
      assert(
        RepositoryRegistry.has(
          "USER"
        ),
        "USER missing from RepositoryRegistry"
      );
      assert(
        RepositoryFactory.get(
          "USER"
        ) === UserRepository,
        "Factory is not bound to UserRepository"
      );
    }
  );

  check(
    "USER_SERVICE_REGISTERED",
    () => {
      assert(
        ServiceRegistry.has(
          "UserMembershipService"
        ),
        "UserMembershipService missing from ServiceRegistry"
      );
      assert(
        ServiceRegistry.get(
          "UserMembershipService"
        ) ===
          UserMembershipService,
        "ServiceRegistry binding invalid"
      );
    }
  );

  check(
    "USER_LIFECYCLE_ORDER",
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
        "RepositoryRegistry",
        "UserMembershipService"
      );
      before(
        "AuditLog",
        "UserMembershipService"
      );
      before(
        "UserMembershipService",
        "ServiceRegistry"
      );
      before(
        "UserMembershipService",
        "TrustedEntryPoints"
      );
    }
  );

  check(
    "DIRECT_REPOSITORY_MUTATION_BLOCKED",
    () => {
      expectError(
        () =>
          UserRepository.create(
            {}
          ),
        /MANAGED_USER_MUTATION_REQUIRED/,
        "Direct USER create was accepted"
      );
      expectError(
        () =>
          UserRepository.delete(
            "NON_EXISTENT_CONTRACT_ID",
            {
              managedBy:
                "UserMembershipService",
            }
          ),
        /USER_HARD_DELETE_DISABLED/,
        "USER hard delete was accepted"
      );
    }
  );

  check(
    "SYSTEM_ROLE_BLOCKED",
    () => {
      expectError(
        () =>
          UserMembershipService
            ._normalizeRole(
              "SYSTEM"
            ),
        /USER_ROLE_INVALID/,
        "SYSTEM role was accepted"
      );
    }
  );

  check(
    "FOREIGN_ORGANIZATION_BLOCKED",
    () => {
      expectError(
        () =>
          UserMembershipService
            ._organizationFrom(
              {
                OrganizationID:
                  "ORG_FOREIGN",
              },
              {
                OrganizationID:
                  "ORG_CURRENT",
              }
            ),
        /CROSS_ORGANIZATION/,
        "Foreign organization was accepted"
      );
    }
  );

  check(
    "CUSTOM_GRANTS_BLOCKED",
    () => {
      expectError(
        () =>
          UserMembershipService
            ._assertAllowedKeys(
              {
                Permissions: "*",
              },
              [
                "Email",
                "Name",
                "Role",
              ],
              "Membership"
            ),
        /forbidden fields/,
        "Custom permissions were accepted"
      );
    }
  );

  check(
    "SELF_DEACTIVATION_BLOCKED",
    () => {
      expectError(
        () =>
          UserMembershipService
            ._protectSelf(
              {
                UserID: "USR_1",
              },
              {
                UserID: "USR_1",
              },
              "DEACTIVATION"
            ),
        /SELF_DEACTIVATION_DENIED/,
        "Self deactivation was accepted"
      );
    }
  );

  check(
    "LAST_PRIVILEGED_MEMBERSHIP_PROTECTED",
    () => {
      const row = {
        UserID: "USR_ADMIN",
        Role: "ADMIN",
        Active: true,
        Deleted: false,
      };

      expectError(
        () =>
          UserMembershipService
            ._protectLastPrivileged(
              [row],
              row,
              "VIEWER",
              true
            ),
        /LAST_PRIVILEGED/,
        "Last privileged membership was removable"
      );
    }
  );

  check(
    "TRUSTED_MENU_ACTIONS_REGISTERED",
    () => {
      [
        "USER_MEMBERSHIP_LIST",
        "USER_MEMBERSHIP_CREATE",
        "USER_MEMBERSHIP_ROLE",
        "USER_MEMBERSHIP_DEACTIVATE",
        "USER_MEMBERSHIP_REACTIVATE",
      ].forEach((action) => {
        assert(
          !!TrustedEntryPoints
            .menuActions[action],
          "Menu action missing " +
            action
        );
      });
    }
  );

  check(
    "USER_MANAGEMENT_HEALTH_OK",
    () => {
      const repositoryHealth =
        UserRepository.health();
      const serviceHealth =
        UserMembershipService
          .health();

      assert(
        repositoryHealth.status ===
          "OK",
        "UserRepository not ready"
      );
      assert(
        serviceHealth.status ===
          "OK",
        "UserMembershipService not ready"
      );
      assert(
        serviceHealth
          .organizationFromRequest ===
          false,
        "Organization request trust enabled"
      );
      assert(
        serviceHealth
          .hardDeleteExposed ===
          false,
        "Hard delete is exposed"
      );
    }
  );

  const failed =
    checks.filter(
      (item) =>
        item.status === "FAIL"
    );
  const result = {
    package: "I.1",
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
      "User membership contract failed: " +
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
