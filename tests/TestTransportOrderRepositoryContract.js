// ============================================================
// TestTransportOrderRepositoryContract v1.0.0
// Regression test for TransportOrderRepository v3.0.0
// TaxControl ERP Core
//
// Checks:
// 1. Repository architecture and bound BaseRepository
// 2. create -> find -> update -> delete -> restore
// 3. Business queries and assignment methods
// 4. RepositoryFactory and RepositoryRegistry registration
// 5. Repository health and BaseRepository version
//
// The test uses an in-memory adapter.
// Google Sheets data is not created or modified.
// Real EventBus handlers are not called.
// ============================================================

console.log(
  "TestTransportOrderRepositoryContract v1.0.0"
);

const TestTransportOrderRepositoryContract = {
  version: "1.0.0",

  requiredRepositoryVersion:
    "3.0.0",

  requiredBaseVersion:
    "6.3.1",

  entity:
    "TRANSPORT_ORDER",

  // ============================================================
  // RUN
  // ============================================================

  run() {
    Logger.log(
      "========== TRANSPORT ORDER REPOSITORY CONTRACT TEST START =========="
    );

    try {
      this.checkDependencies();

      Logger.log(
        "DEPENDENCIES PASS: " +
          "TransportOrderRepository v" +
          TransportOrderRepository.version +
          ", BaseRepository v" +
          BaseRepository.version +
          ", EntityRegistry v" +
          EntityRegistry.version
      );
    } catch (error) {
      Logger.error(
        "DEPENDENCIES FAIL: " +
          error.message
      );

      throw error;
    }

    const result = {
      module:
        "TestTransportOrderRepositoryContract",
      version:
        this.version,
      repositoryVersion:
        TransportOrderRepository.version,
      baseRepositoryVersion:
        BaseRepository.version,
      timestamp:
        new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
      status:
        "RUNNING",
    };

    this.runCase(
      result,
      "ARCHITECTURE",
      () => this.testArchitecture()
    );

    this.runCase(
      result,
      "CRUD_LIFECYCLE",
      () => this.testCrudLifecycle()
    );

    this.runCase(
      result,
      "BUSINESS_METHODS",
      () => this.testBusinessMethods()
    );

    this.runCase(
      result,
      "REGISTRATION_HEALTH",
      () => this.testRegistrationHealth()
    );

    result.summary.total =
      result.tests.length;

    result.summary.passed =
      result.tests.filter(
        (test) =>
          test.status === "PASS"
      ).length;

    result.summary.failed =
      result.tests.filter(
        (test) =>
          test.status === "FAIL"
      ).length;

    result.status =
      result.summary.failed === 0
        ? "PASS"
        : "FAIL";

    Logger.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    if (result.status !== "PASS") {
      const failed =
        result.tests
          .filter(
            (test) =>
              test.status === "FAIL"
          )
          .map(
            (test) => test.name
          )
          .join(", ");

      throw new Error(
        "TransportOrderRepository contract failed: " +
          failed
      );
    }

    Logger.log(
      "========== TRANSPORT ORDER REPOSITORY CONTRACT TEST PASS =========="
    );

    return result;
  },

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  checkDependencies() {
    if (
      typeof BaseRepository ===
      "undefined"
    ) {
      throw new Error(
        "BaseRepository unavailable"
      );
    }

    if (
      BaseRepository.version !==
      this.requiredBaseVersion
    ) {
      throw new Error(
        "Expected BaseRepository v" +
          this.requiredBaseVersion +
          ", loaded v" +
          BaseRepository.version
      );
    }

    if (
      typeof TransportOrderRepository ===
      "undefined"
    ) {
      throw new Error(
        "TransportOrderRepository unavailable"
      );
    }

    if (
      TransportOrderRepository.version !==
      this.requiredRepositoryVersion
    ) {
      throw new Error(
        "Expected TransportOrderRepository v" +
          this.requiredRepositoryVersion +
          ", loaded v" +
          TransportOrderRepository.version
      );
    }

    if (
      typeof EntityRegistry ===
      "undefined"
    ) {
      throw new Error(
        "EntityRegistry unavailable"
      );
    }

    if (
      EntityRegistry.initialized !== true
    ) {
      if (
        typeof EntityRegistry.init !==
        "function"
      ) {
        throw new Error(
          "EntityRegistry.init unavailable"
        );
      }

      EntityRegistry.init();
    }

    const meta =
      EntityRegistry.get(
        this.entity
      );

    if (!meta) {
      throw new Error(
        "Metadata missing for " +
          this.entity
      );
    }

    if (
      meta.idField !==
      "TransportOrderID"
    ) {
      throw new Error(
        "Unexpected idField " +
          meta.idField
      );
    }

    return true;
  },

  // ============================================================
  // CASE EXECUTOR
  // ============================================================

  runCase(
    result,
    name,
    callback
  ) {
    const startedAt =
      Date.now();

    try {
      const details =
        callback();

      result.tests.push({
        name,
        status: "PASS",
        durationMs:
          Date.now() -
          startedAt,
        details,
      });

      Logger.log(
        name + " PASS"
      );
    } catch (error) {
      result.tests.push({
        name,
        status: "FAIL",
        durationMs:
          Date.now() -
          startedAt,
        error:
          error.message,
      });

      Logger.error(
        name +
          " FAIL: " +
          error.message
      );
    }
  },

  // ============================================================
  // ARCHITECTURE
  // ============================================================

  testArchitecture() {
    return this.withIsolatedRepository(
      (context) => {
        const repository =
          context.repository;

        this.assertEqual(
          repository.version,
          this.requiredRepositoryVersion,
          "Repository version mismatch"
        );

        this.assert(
          repository.initialized === true,
          "Repository is not initialized"
        );

        this.assert(
          !!repository.base,
          "Bound base is missing"
        );

        this.assertEqual(
          repository.base.entity,
          this.entity,
          "BaseRepository bound to wrong entity"
        );

        this.assert(
          repository.base.ready(),
          "Bound BaseRepository is not ready"
        );

        const requiredMethods = [
          "create",
          "findById",
          "findAll",
          "findWhere",
          "findOne",
          "update",
          "delete",
          "restore",
          "count",
          "exists",
          "existsBy",
          "paginate",
          "bulkCreate",
          "bulkUpdate",
          "assignCarrier",
          "assignVehicle",
          "assignDriver",
          "assignTrip",
          "changeStatus",
          "health",
          "diagnostics",
        ];

        const missingMethods =
          requiredMethods.filter(
            (method) => {
              return typeof repository[
                method
              ] !== "function";
            }
          );

        this.assertEqual(
          missingMethods.length,
          0,
          "Repository methods missing"
        );

        return {
          entity:
            repository.base.entity,
          baseReady:
            repository.base.ready(),
          checkedMethods:
            requiredMethods.length,
        };
      }
    );
  },

  // ============================================================
  // CRUD LIFECYCLE
  // ============================================================

  testCrudLifecycle() {
    return this.withIsolatedRepository(
      (context) => {
        const repository =
          context.repository;

        const adapter =
          context.adapter;

        const events =
          context.events;

        const id =
          this.uniqueId("CRUD");

        const created =
          repository.create(
            this.orderData(
              id,
              "CLIENT-CRUD"
            )
          );

        this.assertEqual(
          created.TransportOrderID,
          id,
          "Create returned wrong ID"
        );

        this.assert(
          !!repository.findById(id),
          "Created order not found"
        );

        const updated =
          repository.update(
            id,
            {
              Status:
                "CONFIRMED",
            }
          );

        this.assertEqual(
          updated.Status,
          "CONFIRMED",
          "Update did not change Status"
        );

        this.assertEqual(
          adapter.calls.update[0].id,
          id,
          "Update passed wrong record ID"
        );

        const deleted =
          repository.delete(id);

        this.assert(
          repository
            .getBase()
            .isDeleted(deleted),
          "Delete did not set Deleted"
        );

        this.assertEqual(
          repository.findById(id),
          null,
          "Deleted order is visible"
        );

        this.assert(
          !!repository.findById(
            id,
            {
              includeDeleted: true,
            }
          ),
          "Deleted order is unavailable with includeDeleted"
        );

        const restored =
          repository.restore(id);

        this.assert(
          !repository
            .getBase()
            .isDeleted(restored),
          "Restore did not clear Deleted"
        );

        this.assert(
          !!repository.findById(id),
          "Restored order is not visible"
        );

        const expectedEvents = [
          "TRANSPORT_ORDER_CREATED",
          "TRANSPORT_ORDER_UPDATED",
          "TRANSPORT_ORDER_DELETED",
          "TRANSPORT_ORDER_RESTORED",
        ];

        this.assertEqual(
          JSON.stringify(events),
          JSON.stringify(
            expectedEvents
          ),
          "Lifecycle events mismatch"
        );

        return {
          id,
          create:
            "OK",
          find:
            "OK",
          update:
            "OK",
          delete:
            "OK",
          restore:
            "OK",
          events,
          adapterUpdateIds:
            adapter.calls.update.map(
              (call) => call.id
            ),
        };
      }
    );
  },

  // ============================================================
  // BUSINESS METHODS
  // ============================================================

  testBusinessMethods() {
    return this.withIsolatedRepository(
      (context) => {
        const repository =
          context.repository;

        const firstId =
          this.uniqueId("BUS1");

        const secondId =
          this.uniqueId("BUS2");

        repository.create(
          this.orderData(
            firstId,
            "CLIENT-A",
            {
              Status: "NEW",
            }
          )
        );

        repository.create(
          this.orderData(
            secondId,
            "CLIENT-B",
            {
              Status:
                "COMPLETED",
              OrganizationID:
                "ORG-B",
            }
          )
        );

        repository.assignCarrier(
          firstId,
          "CARRIER-1"
        );

        repository.assignVehicle(
          firstId,
          "VEHICLE-1"
        );

        repository.assignDriver(
          firstId,
          "DRIVER-1"
        );

        repository.assignTrip(
          firstId,
          "TRIP-1"
        );

        repository.changeStatus(
          firstId,
          "IN_TRANSIT"
        );

        const first =
          repository.findById(
            firstId
          );

        this.assertEqual(
          first.CarrierID,
          "CARRIER-1",
          "Carrier assignment failed"
        );

        this.assertEqual(
          first.VehicleID,
          "VEHICLE-1",
          "Vehicle assignment failed"
        );

        this.assertEqual(
          first.DriverID,
          "DRIVER-1",
          "Driver assignment failed"
        );

        this.assertEqual(
          first.TripID,
          "TRIP-1",
          "Trip assignment failed"
        );

        this.assertEqual(
          first.Status,
          "IN_TRANSIT",
          "Status change failed"
        );

        this.assertEqual(
          repository.findByClient(
            "CLIENT-A"
          ).length,
          1,
          "findByClient failed"
        );

        this.assertEqual(
          repository.findByTrip(
            "TRIP-1"
          ).length,
          1,
          "findByTrip failed"
        );

        this.assertEqual(
          repository.findByStatus(
            "COMPLETED"
          ).length,
          1,
          "findByStatus failed"
        );

        this.assertEqual(
          repository.findByCarrier(
            "CARRIER-1"
          ).length,
          1,
          "findByCarrier failed"
        );

        this.assertEqual(
          repository.findByOrganization(
            "TEST-ORG"
          ).length,
          1,
          "findByOrganization failed"
        );

        this.assertEqual(
          repository.findActive()
            .length,
          1,
          "findActive failed"
        );

        const page =
          repository.paginate(
            1,
            1
          );

        this.assertEqual(
          page.total,
          2,
          "Pagination total mismatch"
        );

        this.assertEqual(
          page.data.length,
          1,
          "Pagination page size mismatch"
        );

        return {
          created:
            2,
          assignments:
            4,
          status:
            first.Status,
          active:
            repository.findActive()
              .length,
          total:
            repository.count(),
          pagination:
            {
              page:
                page.page,
              limit:
                page.limit,
              total:
                page.total,
            },
        };
      }
    );
  },

  // ============================================================
  // REGISTRATION AND HEALTH
  // ============================================================

  testRegistrationHealth() {
    const repository =
      TransportOrderRepository;

    this.assert(
      typeof RepositoryFactory !==
        "undefined",
      "RepositoryFactory unavailable"
    );

    this.assert(
      RepositoryFactory.has(
        this.entity
      ),
      "RepositoryFactory registration missing"
    );

    this.assert(
      RepositoryFactory.get(
        this.entity
      ) === repository,
      "RepositoryFactory contains another repository"
    );

    let registryStatus =
      "UNAVAILABLE";

    if (
      typeof RepositoryRegistry !==
        "undefined" &&
      typeof RepositoryRegistry.has ===
        "function"
    ) {
      this.assert(
        RepositoryRegistry.has(
          this.entity
        ),
        "RepositoryRegistry registration missing"
      );

      this.assert(
        RepositoryRegistry.get(
          this.entity
        ) === repository,
        "RepositoryRegistry contains another repository"
      );

      registryStatus =
        "REGISTERED";
    }

    const health =
      repository.health();

    this.assert(
      !!health,
      "Health result missing"
    );

    const diagnostics =
      repository.diagnostics();

    this.assertEqual(
      diagnostics
        .baseRepository.version,
      this.requiredBaseVersion,
      "Health reports wrong BaseRepository version"
    );

    this.assert(
      diagnostics
        .repositoryFactory
        .registered,
      "Diagnostics reports Factory as unregistered"
    );

    return {
      factory:
        "REGISTERED",
      registry:
        registryStatus,
      baseVersion:
        diagnostics
          .baseRepository.version,
      repositoryVersion:
        diagnostics.version,
    };
  },

  // ============================================================
  // ISOLATED REPOSITORY
  // ============================================================

  withIsolatedRepository(
    callback
  ) {
    const repository =
      TransportOrderRepository;

    const originalBase =
      repository.base;

    const originalInitialized =
      repository.initialized;

    const originalEmit =
      repository.emit;

    const organizationContextAvailable =
      typeof OrganizationContext !==
        "undefined" &&
      typeof OrganizationContext.get ===
        "function";

    const originalOrganizationGet =
      organizationContextAvailable
        ? OrganizationContext.get
        : null;

    const adapter =
      this.createMemoryAdapter();

    const events = [];

    const bound =
      Object.create(
        BaseRepository
      );

    bound.entity =
      this.entity;

    bound._adapter =
      adapter;

    bound._initialized =
      true;

    bound.emit =
      function () {};

    bound.audit =
      function () {};

    repository.base =
      bound;

    repository.initialized =
      true;

    repository.emit =
      function (
        event
      ) {
        events.push(event);
        return true;
      };

    /*
     * BaseRepository applies the current organization during updates.
     * The test replaces only the getter and restores it in finally,
     * so no script properties are read and no organization state changes.
     */
    if (
      organizationContextAvailable
    ) {
      OrganizationContext.get =
        function () {
          return "TEST-ORG";
        };
    }

    try {
      return callback({
        repository,
        adapter,
        events,
      });
    } finally {
      repository.base =
        originalBase;

      repository.initialized =
        originalInitialized;

      repository.emit =
        originalEmit;

      if (
        organizationContextAvailable
      ) {
        OrganizationContext.get =
          originalOrganizationGet;
      }
    }
  },

  // ============================================================
  // MEMORY ADAPTER
  // ============================================================

  createMemoryAdapter() {
    const storage = {};

    const clone = (value) => {
      if (
        value === null ||
        value === undefined
      ) {
        return value;
      }

      return JSON.parse(
        JSON.stringify(value)
      );
    };

    const getBucket = (
      entity
    ) => {
      storage[entity] =
        storage[entity] || {};

      return storage[entity];
    };

    const getIdField = (
      entity
    ) => {
      const meta =
        EntityRegistry.get(
          entity
        );

      return meta.idField ||
        "ID";
    };

    return {
      calls: {
        insert: [],
        find: [],
        query: [],
        update: [],
        delete: [],
      },

      insert(entity, data) {
        const idField =
          getIdField(entity);

        const id =
          data[idField];

        if (!id) {
          throw new Error(
            "MemoryAdapter insert ID missing"
          );
        }

        const bucket =
          getBucket(entity);

        if (bucket[id]) {
          throw new Error(
            "MemoryAdapter duplicate ID " +
              id
          );
        }

        bucket[id] =
          clone(data);

        this.calls.insert.push({
          entity,
          data:
            clone(data),
        });

        return clone(
          bucket[id]
        );
      },

      find(entity, id) {
        const bucket =
          getBucket(entity);

        this.calls.find.push({
          entity,
          id,
        });

        return bucket[id]
          ? clone(bucket[id])
          : null;
      },

      query(
        entity,
        filters = {}
      ) {
        const bucket =
          getBucket(entity);

        this.calls.query.push({
          entity,
          filters:
            clone(filters),
        });

        return Object.keys(
          bucket
        )
          .map(
            (id) =>
              clone(bucket[id])
          )
          .filter(
            (row) => {
              return Object.keys(
                filters
              ).every(
                (key) => {
                  return String(
                    row[key]
                  ) === String(
                    filters[key]
                  );
                }
              );
            }
          );
      },

      count(
        entity,
        filters = {}
      ) {
        return this.query(
          entity,
          filters
        ).length;
      },

      update(
        entity,
        id,
        data
      ) {
        const bucket =
          getBucket(entity);

        if (!bucket[id]) {
          throw new Error(
            "MemoryAdapter row not found " +
              id
          );
        }

        bucket[id] = {
          ...bucket[id],
          ...clone(data),
        };

        this.calls.update.push({
          entity,
          id,
          data:
            clone(data),
        });

        return clone(
          bucket[id]
        );
      },

      delete(entity, id) {
        const bucket =
          getBucket(entity);

        if (!bucket[id]) {
          return false;
        }

        delete bucket[id];

        this.calls.delete.push({
          entity,
          id,
        });

        return true;
      },

      transaction(callback) {
        return callback();
      },
    };
  },

  // ============================================================
  // TEST DATA
  // ============================================================

  orderData(
    id,
    clientId,
    overrides = {}
  ) {
    return {
      TransportOrderID:
        id,
      OrganizationID:
        "TEST-ORG",
      ClientID:
        clientId,
      TripID:
        "",
      Status:
        "NEW",
      Price:
        25000,
      Deleted:
        false,
      ...overrides,
    };
  },

  uniqueId(prefix) {
    return (
      "TSTTO" +
      prefix +
      Date.now()
        .toString(36)
        .toUpperCase() +
      Math.floor(
        Math.random() *
          100000
      )
        .toString()
        .padStart(5, "0")
    );
  },

  // ============================================================
  // ASSERTIONS
  // ============================================================

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertEqual(
    actual,
    expected,
    message
  ) {
    if (actual !== expected) {
      throw new Error(
        message +
          ": expected=" +
          JSON.stringify(
            expected
          ) +
          ", actual=" +
          JSON.stringify(
            actual
          )
      );
    }
  },
};

// ============================================================
// GLOBAL EXPORT
// ============================================================

globalThis.TestTransportOrderRepositoryContract =
  TestTransportOrderRepositoryContract;

// ============================================================
// MANUAL TEST RUNNER
// This function appears in the Google Apps Script function list.
// ============================================================

function runTransportOrderRepositoryContractTest() {
  Logger.log(
    "========== MANUAL TRANSPORT ORDER REPOSITORY TEST RUN =========="
  );

  const result =
    TestTransportOrderRepositoryContract.run();

  Logger.log(
    "MANUAL TEST RESULT: " +
      result.status +
      ", passed=" +
      result.summary.passed +
      ", failed=" +
      result.summary.failed
  );

  return result;
}

Logger.log(
  "TestTransportOrderRepositoryContract READY v" +
    TestTransportOrderRepositoryContract.version
);