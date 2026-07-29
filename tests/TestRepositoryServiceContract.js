// ============================================================
// TestRepositoryServiceContract v1.2.0
// Non-destructive GAS contract for Package F
//
// No spreadsheet row is created, updated or deleted.
// The test uses an in-memory adapter for read-contract checks.
// ============================================================

const TestRepositoryServiceContract = {
  version: "1.2.0",

  requiredRepositories: [
    "USER",
    "CLIENT",
    "TRIP",
    "VEHICLE",
    "DRIVER",
    "CARRIER",
    "ROUTE",
    "CARGO",
    "TRANSPORT_ORDER",
    "CLIENT_FINANCE_PROFILE",
    "FINANCIAL_TRANSACTION",
    "KPI",
    "AUDIT",
    "VERSION",
    "FAILED_EVENT",
  ],

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertSync(result, label) {
    this.assert(
      !result ||
      typeof result.then !== "function",
      label + " returned Promise"
    );
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

    const initialReset = resetERP();
    this.assertSync(
      initialReset,
      "resetERP"
    );

    const start = startERP();
    this.assertSync(start, "startERP");

    check("ERP_READY", () => {
      this.assert(
        start.status === "READY",
        "ERP did not reach READY"
      );
      this.assert(
        SystemInit.isReady() === true,
        "SystemInit is not ready"
      );
    });

    check("CURRENT_PLATFORM_VERSIONS", () => {
      this.assert(
        SpreadsheetAdapter.version ===
          "4.5.0",
        "Unexpected SpreadsheetAdapter version"
      );
      this.assert(
        Database.version === "5.4.0",
        "Unexpected Database version"
      );
      this.assert(
        BaseRepository.version ===
          "6.6.0",
        "Unexpected BaseRepository version"
      );
      this.assert(
        RepositoryFactory.version ===
          "3.2.0",
        "Unexpected RepositoryFactory version"
      );
      this.assert(
        RepositoryRegistry.version ===
          "3.1.0",
        "Unexpected RepositoryRegistry version"
      );
      this.assert(
        EntityService.version ===
          "5.5.0",
        "Unexpected EntityService version"
      );
      this.assert(
        ServiceRegistry.version ===
          "1.4.0",
        "Unexpected ServiceRegistry version"
      );
      this.assert(
        AuditLog.version === "2.2.0",
        "Unexpected AuditLog version"
      );
      this.assert(
        SystemInit.version === "4.0.0",
        "Unexpected SystemInit version"
      );
    });

    check("REPOSITORY_REGISTRY_READY", () => {
      this.assert(
        RepositoryRegistry.isReady() ===
          true,
        "RepositoryRegistry is not ready"
      );

      this.requiredRepositories
        .forEach((entity) => {
          this.assert(
            RepositoryRegistry.has(entity),
            entity +
              " missing from RepositoryRegistry"
          );
          this.assert(
            RepositoryFactory.has(entity),
            entity +
              " missing from RepositoryFactory"
          );
          this.assert(
            RepositoryRegistry
              .repositoryStatus[entity]
              ?.status === "READY",
            entity +
              " lifecycle is not READY"
          );
        });
    });

    check("FACTORY_REGISTRY_CONSISTENT", () => {
      const consistency =
        RepositoryFactory.consistency();

      this.assert(
        consistency.missingInFactory
          .length === 0,
        "Repositories missing in Factory"
      );
      this.assert(
        consistency.missingInRegistry
          .length === 0,
        "Repositories missing in Registry"
      );
      this.assert(
        consistency.baseRegistered ===
          false,
        "Technical BASE repository registered"
      );
    });

    check("REQUIRED_SERVICES_READY", () => {
      const validation =
        ServiceRegistry.validate([
          "UserMembershipService",
          "ClientService",
          "TransportOrderService",
        ]);

      this.assertSync(
        validation,
        "ServiceRegistry.validate"
      );
      this.assert(
        Array.isArray(validation) &&
        validation.length === 0,
        "Service validation failed: " +
          validation.join("; ")
      );
      this.assert(
        UserMembershipService
          .initialized === true,
        "UserMembershipService is not initialized"
      );
      this.assert(
        ClientService.initialized ===
          true,
        "ClientService is not initialized"
      );
      this.assert(
        TransportOrderService
          .initialized === true,
        "TransportOrderService is not initialized"
      );
    });

    check("CLIENT_DUPLICATE_API_AVAILABLE", () => {
      const repository =
        RepositoryFactory.get("CLIENT");

      this.assert(
        typeof ClientService
          .findDuplicate === "function",
        "ClientService.findDuplicate missing"
      );
      this.assert(
        typeof repository.findByINN ===
          "function" ||
        typeof repository.findBy ===
          "function" ||
        typeof repository.findOne ===
          "function" ||
        typeof repository.findWhere ===
          "function",
        "CLIENT repository has no duplicate lookup API"
      );
    });

    check("INCLUDE_DELETED_READ_CONTRACT", () => {
      let receivedOptions = null;

      const repository =
        Object.create(BaseRepository);

      repository.entity =
        "PACKAGE_F_TEST";
      repository._initialized = true;
      repository._adapter = {
        query(
          entity,
          filters,
          options
        ) {
          receivedOptions = options;

          return [
            {
              ID: "1",
              Deleted: false,
            },
            {
              ID: "2",
              Deleted: true,
            },
          ];
        },
      };
      repository.getEntityMeta =
        function () {
          return {
            entity:
              "PACKAGE_F_TEST",
            idField: "ID",
            softDelete: true,
          };
        };
      repository.getMeta =
        function () {
          return this.getEntityMeta(
            this.entity
          );
        };

      const active =
        repository.findAll();

      this.assert(
        active.length === 1 &&
        active[0].ID === "1",
        "Default read returned deleted row"
      );

      const all =
        repository.findAll(
          {},
          {
            includeDeleted: true,
          }
        );

      this.assert(
        all.length === 2,
        "includeDeleted did not return all rows"
      );
      this.assert(
        receivedOptions
          ?.includeDeleted === true,
        "includeDeleted did not reach adapter"
      );
    });

    check("AUDIT_REPOSITORY_ROUTE", () => {
      this.assert(
        AuditLog.ready === true,
        "AuditLog is not ready"
      );
      this.assert(
        AuditLog.getRepository() ===
          AuditRepository,
        "AuditLog does not use AuditRepository"
      );
    });

    const secondReset = resetERP();
    this.assertSync(
      secondReset,
      "second resetERP"
    );

    const secondStart = startERP();
    this.assertSync(
      secondStart,
      "second startERP"
    );

    check("RESET_RESTART_READY", () => {
      this.assert(
        secondStart.status === "READY",
        "Second startup failed"
      );
      this.assert(
        RepositoryRegistry.isReady() ===
          true,
        "RepositoryRegistry not ready after restart"
      );
      this.assert(
        new Set(
          RepositoryRegistry.startupOrder
        ).size ===
          RepositoryRegistry
            .startupOrder.length,
        "Repository startup order contains duplicates"
      );
    });

    const failed =
      checks.filter(
        (item) =>
          item.status === "FAIL"
      );

    const result = {
      test:
        "TestRepositoryServiceContract",
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
      repositories:
        RepositoryRegistry.list(),
      services:
        ServiceRegistry.list(),
      timestamp:
        new Date().toISOString(),
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

globalThis.TestRepositoryServiceContract =
  TestRepositoryServiceContract;

function runRepositoryServiceContractTest() {
  return TestRepositoryServiceContract.run();
}
