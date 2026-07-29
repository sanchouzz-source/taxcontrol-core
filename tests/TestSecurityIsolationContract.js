// ============================================================
// TestSecurityIsolationContract v1.1.0
// Non-destructive GAS contract for Package G
//
// No spreadsheet row is created, updated or deleted. CRUD scenarios use an
// in-memory adapter and disable event/audit side effects on that test object.
// ============================================================

const TestSecurityIsolationContract = {
  version: "1.1.0",

  manager: {
    UserID: "SEC_MANAGER",
    Name: "Security Manager",
    Role: "MANAGER",
    OrganizationID: "ORG_SECURITY_A",
    AllowedOrganizationIDs: [
      "ORG_SECURITY_A",
      "ORG_SECURITY_B",
    ],
  },

  accountant: {
    UserID: "SEC_ACCOUNTANT",
    Name: "Security Accountant",
    Role: "ACCOUNTANT",
    OrganizationID: "ORG_SECURITY_A",
  },

  admin: {
    UserID: "SEC_ADMIN",
    Name: "Security Admin",
    Role: "ADMIN",
    OrganizationID: "ORG_SECURITY_A",
    AllowedOrganizationIDs: [
      "ORG_SECURITY_A",
      "ORG_SECURITY_B",
    ],
  },

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertSync(result, label) {
    this.assert(
      !result ||
      typeof result.then !==
        "function",
      label + " returned Promise"
    );
  },

  assertThrows(callback, pattern) {
    let error = null;

    try {
      callback();
    } catch (caught) {
      error = caught;
    }

    this.assert(
      !!error,
      "Expected error was not thrown"
    );

    if (pattern) {
      this.assert(
        pattern.test(error.message),
        "Unexpected error: " +
          error.message
      );
    }

    return error;
  },

  makeRepository() {
    let sequence = 0;
    let rows = [
      {
        ClientID: "SEC_A_1",
        OrganizationID:
          "ORG_SECURITY_A",
        Name: "Organization A",
        Deleted: false,
      },
      {
        ClientID: "SEC_B_1",
        OrganizationID:
          "ORG_SECURITY_B",
        Name: "Organization B",
        Deleted: false,
      },
    ];

    const adapter = {
      insert(entity, data) {
        void entity;
        const row = { ...data };
        rows.push(row);
        return { ...row };
      },

      find(entity, id) {
        void entity;
        const row = rows.find(
          (item) =>
            item.ClientID === id
        );

        return row
          ? { ...row }
          : null;
      },

      /*
       * Deliberately ignores filters. BaseRepository must still enforce the
       * final organization filter itself.
       */
      query() {
        return rows.map(
          (row) => ({ ...row })
        );
      },

      update(entity, id, data) {
        void entity;
        const index = rows.findIndex(
          (item) =>
            item.ClientID === id
        );

        if (index < 0) {
          return null;
        }

        rows[index] = {
          ...rows[index],
          ...data,
        };

        return {
          ...rows[index],
        };
      },

      delete(entity, id) {
        void entity;
        const index = rows.findIndex(
          (item) =>
            item.ClientID === id
        );

        if (index < 0) {
          return false;
        }

        rows.splice(index, 1);
        return true;
      },

      bulkInsert(entity, items) {
        void entity;
        const result = items.map(
          (item) => ({ ...item })
        );
        rows = rows.concat(result);
        return result;
      },
    };

    const repository =
      Object.create(BaseRepository);

    repository.entity = "CLIENT";
    repository._initialized = true;
    repository._adapter = adapter;
    repository.audit =
      function () {};
    repository.emit =
      function () {};

    const originalIdService =
      globalThis.IdService;

    globalThis.IdService = {
      generate() {
        sequence++;
        return (
          "SEC_NEW_" + sequence
        );
      },
    };

    return {
      repository,
      rows() {
        return rows.map(
          (row) => ({ ...row })
        );
      },
      restoreIdService() {
        globalThis.IdService =
          originalIdService;
      },
    };
  },

  run() {
    const checks = [];
    const check = (name, callback) => {
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

    const reset = resetERP();
    this.assertSync(
      reset,
      "resetERP"
    );

    const start = startERP();
    this.assertSync(
      start,
      "startERP"
    );

    check("ERP_AND_SECURITY_READY", () => {
      this.assert(
        start.status === "READY",
        "ERP did not reach READY"
      );
      this.assert(
        SystemInit.version ===
          "3.8.0",
        "Unexpected SystemInit version"
      );
      this.assert(
        SecurityContext
          .initialized === true,
        "SecurityContext not initialized"
      );
      this.assert(
        SecurityGuard
          .initialized === true,
        "SecurityGuard not initialized"
      );
      this.assert(
        OrganizationScope
          .initialized === true,
        "OrganizationScope not initialized"
      );
    });

    check("NO_IMPLICIT_IDENTITY", () => {
      this.assert(
        Auth.getCurrentUser() ===
          null,
        "Startup created an implicit user"
      );
      this.assert(
        SecurityGuard.check(
          "CLIENT_READ"
        ) === false,
        "Anonymous permission was allowed"
      );
      this.assertThrows(
        () =>
          SecurityGuard.require(
            "CLIENT_READ"
          ),
        /AUTHENTICATION REQUIRED/
      );
    });

    check("ROLE_PERMISSIONS_ARE_REAL", () => {
      SecurityContext.runAs(
        this.manager,
        () => {
          this.assert(
            SecurityGuard.check(
              "CLIENT_CREATE"
            ) === true,
            "Manager CLIENT_CREATE denied"
          );
          this.assert(
            SecurityGuard.check(
              "FINANCE_EDIT"
            ) === false,
            "Manager FINANCE_EDIT allowed"
          );
        }
      );

      SecurityContext.runAs(
        this.accountant,
        () => {
          this.assert(
            SecurityGuard.check(
              "FINANCE_EDIT"
            ) === true,
            "Accountant FINANCE_EDIT denied"
          );
          this.assert(
            SecurityGuard.check(
              "CLIENT_CREATE"
            ) === false,
            "Accountant CLIENT_CREATE allowed"
          );
        }
      );
    });

    check("UNKNOWN_PERMISSION_DENIED", () => {
      SecurityContext.runAs(
        this.admin,
        () => {
          this.assert(
            SecurityGuard.check(
              "NOT_A_PERMISSION"
            ) === false,
            "Unknown permission allowed"
          );
          this.assertThrows(
            () =>
              SecurityGuard.require(
                "NOT_A_PERMISSION"
              ),
            /UNKNOWN PERMISSION/
          );
        }
      );
    });

    const memory =
      this.makeRepository();

    try {
      check("CREATE_IS_TAGGED_AND_FOREIGN_CREATE_BLOCKED", () => {
        SecurityContext.runAs(
          this.admin,
          () => {
            const created =
              memory.repository.create({
                Name: "Created A",
              });

            this.assert(
              created.OrganizationID ===
                "ORG_SECURITY_A",
              "Create did not apply active OrganizationID"
            );

            this.assertThrows(
              () =>
                memory.repository.create({
                  Name: "Foreign",
                  OrganizationID:
                    "ORG_SECURITY_B",
                }),
              /CROSS_ORGANIZATION/
            );
          }
        );
      });

      check("READS_ARE_ORGANIZATION_SCOPED", () => {
        SecurityContext.runAs(
          this.manager,
          () => {
            const rows =
              memory.repository
                .findAll();

            this.assert(
              rows.length === 2,
              "Unexpected scoped row count " +
                rows.length
            );
            this.assert(
              rows.every(
                (row) =>
                  row.OrganizationID ===
                  "ORG_SECURITY_A"
              ),
              "Foreign row leaked from findAll"
            );
            this.assert(
              memory.repository
                .findById(
                  "SEC_B_1"
                ) === null,
              "Foreign row leaked from findById"
            );
            this.assert(
              memory.repository
                .count() === 2,
              "Scoped count leaked rows"
            );
          }
        );
      });

      check("FOREIGN_MUTATIONS_ARE_BLOCKED", () => {
        SecurityContext.runAs(
          this.admin,
          () => {
            [
              () =>
                memory.repository.update(
                  "SEC_B_1",
                  { Name: "Changed" }
                ),
              () =>
                memory.repository.delete(
                  "SEC_B_1"
                ),
              () =>
                memory.repository.restore(
                  "SEC_B_1"
                ),
            ].forEach((operation) => {
              this.assertThrows(
                operation,
                /not found/
              );
            });
          }
        );

        this.assert(
          memory.rows()
            .find(
              (row) =>
                row.ClientID ===
                "SEC_B_1"
            ).Name ===
            "Organization B",
          "Foreign row changed"
        );
      });

      check("ADMIN_DOES_NOT_BYPASS_SCOPE", () => {
        SecurityContext.runAs(
          this.admin,
          () => {
            this.assert(
              SecurityGuard.check(
                "CLIENT_READ"
              ) === true,
              "Admin permission denied"
            );
            this.assert(
              memory.repository
                .findById(
                  "SEC_B_1"
                ) === null,
              "Admin bypassed active organization"
            );
          }
        );
      });

      check("EXPLICIT_ORGANIZATION_SWITCH_RESTORES_CONTEXT", () => {
        SecurityContext.runAs(
          this.manager,
          () => {
            const before =
              OrganizationContext.get();
            const inside =
              OrganizationContext.run(
                "ORG_SECURITY_B",
                () => {
                  const row =
                    memory.repository
                      .findById(
                        "SEC_B_1"
                      );

                  return {
                    organization:
                      OrganizationContext
                        .get(),
                    row,
                  };
                }
              );

            this.assert(
              inside.organization ===
                "ORG_SECURITY_B",
              "Organization switch failed"
            );
            this.assert(
              inside.row &&
              inside.row.ClientID ===
                "SEC_B_1",
              "Switched organization row missing"
            );
            this.assert(
              OrganizationContext.get() ===
                before,
              "Organization context was not restored"
            );
          }
        );
      });

      check("SYSTEM_BYPASS_IS_EXPLICIT", () => {
        this.assertThrows(
          () =>
            SecurityContext.set({
              UserID: "SYSTEM",
              Role: "SYSTEM",
              OrganizationID:
                "SYSTEM",
              System: true,
            }),
          /runAsSystem/
        );

        const all =
          SecurityContext.runAsSystem(
            {
              organizationId:
                "SYSTEM",
              bypassOrganizationScope:
                true,
            },
            () =>
              memory.repository.findAll(
                {},
                {
                  includeDeleted: true,
                  bypassOrganizationScope:
                    true,
                }
              )
          );

        this.assert(
          all.length ===
            memory.rows().length,
          "Explicit system bypass did not return all rows"
        );
      });
    } finally {
      memory.restoreIdService();
      SecurityContext.clear();
    }

    check("SECURITY_METADATA_COMPLETE", () => {
      const errors =
        OrganizationScope.validate();

      this.assert(
        errors.length === 0,
        errors.join("; ")
      );

      [
        "ROUTE",
        "CARGO",
        "CLIENT_FINANCE_PROFILE",
      ].forEach((entity) => {
        this.assert(
          !!EntityMetadata
            .get(entity)
            .fields
            .OrganizationID,
          entity +
            " OrganizationID missing"
        );
      });
    });

    check("RESET_CLEARS_CONTEXT", () => {
      SecurityContext.set(
        this.manager
      );

      const resetResult =
        resetERP();
      this.assertSync(
        resetResult,
        "second resetERP"
      );

      this.assert(
        SecurityContext.get() === null,
        "resetERP retained user context"
      );

      const restart = startERP();
      this.assertSync(
        restart,
        "second startERP"
      );
      this.assert(
        restart.status === "READY",
        "ERP restart failed"
      );
      this.assert(
        Auth.getCurrentUser() ===
          null,
        "Restart created user context"
      );
    });

    const failed = checks.filter(
      (item) =>
        item.status === "FAIL"
    );
    const result = {
      test:
        "TestSecurityIsolationContract",
      version: this.version,
      status:
        failed.length
          ? "FAIL"
          : "PASS",
      total: checks.length,
      passed:
        checks.length -
        failed.length,
      failed: failed.length,
      checks,
      writes: 0,
    };

    Logger.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    return result;
  },
};

function runSecurityIsolationContractTest() {
  return TestSecurityIsolationContract
    .run();
}

globalThis.TestSecurityIsolationContract =
  TestSecurityIsolationContract;
