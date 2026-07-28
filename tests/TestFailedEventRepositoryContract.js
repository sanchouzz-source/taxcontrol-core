// ============================================================
// TestFailedEventRepositoryContract v1.0.0
// Regression test for FailedEventRepository v3.0.0
// TaxControl ERP Core
//
// Checks:
// 1. FAILED_EVENT metadata and bound-repository architecture
// 2. lowercase/canonical create and save normalization
// 3. retry attempts and status lifecycle
// 4. protected mutation contract
// 5. RepositoryFactory/RepositoryRegistry synchronization
//
// The test uses an isolated in-memory adapter.
// It does not create or modify rows in Google Sheets.
// It does not invoke real EventBus or AuditLog handlers.
// ============================================================

console.log(
  "TestFailedEventRepositoryContract v1.0.0"
);

const TestFailedEventRepositoryContract = {
  version: "1.0.0",

  required: {
    EntityMetadata: "3.3.0",
    BaseRepository: "6.3.1",
    RepositoryFactory: "3.1.1",
    FailedEventRepository: "3.0.0",
  },

  // ============================================================
  // RUN
  // ============================================================

  run() {
    Logger.log(
      "========== FAILED EVENT REPOSITORY CONTRACT TEST START =========="
    );

    this.checkDependencies();

    Logger.log(
      "DEPENDENCIES PASS: " +
        "EntityMetadata v" +
        EntityMetadata.version +
        ", BaseRepository v" +
        BaseRepository.version +
        ", RepositoryFactory v" +
        RepositoryFactory.version +
        ", FailedEventRepository v" +
        FailedEventRepository.version
    );

    const result = {
      module:
        "TestFailedEventRepositoryContract",
      version: this.version,
      timestamp:
        new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
      status: "RUNNING",
    };

    const state =
      this.captureRepositoryState();

    try {
      this.runCase(
        result,
        "ARCHITECTURE_METADATA",
        () => this.testArchitectureMetadata()
      );

      this.runCase(
        result,
        "CREATE_SAVE_NORMALIZATION",
        () => this.testCreateSaveNormalization()
      );

      this.runCase(
        result,
        "RETRY_LIFECYCLE",
        () => this.testRetryLifecycle()
      );

      this.runCase(
        result,
        "MUTATION_GUARDS",
        () => this.testMutationGuards()
      );

      this.runCase(
        result,
        "REGISTRY_FACTORY_HEALTH",
        () => this.testRegistryFactoryHealth()
      );
    } finally {
      this.restoreRepositoryState(
        state
      );
    }

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
      JSON.stringify(result, null, 2)
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
        "Failed-event repository contract failed: " +
          failed
      );
    }

    Logger.log(
      "========== FAILED EVENT REPOSITORY CONTRACT TEST PASS =========="
    );

    return result;
  },

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  checkDependencies() {
    this.requireGlobal(
      "EntityMetadata",
      EntityMetadata
    );
    this.requireGlobal(
      "EntityRegistry",
      EntityRegistry
    );
    this.requireGlobal(
      "BaseRepository",
      BaseRepository
    );
    this.requireGlobal(
      "RepositoryFactory",
      RepositoryFactory
    );
    this.requireGlobal(
      "RepositoryRegistry",
      RepositoryRegistry
    );
    this.requireGlobal(
      "FailedEventRepository",
      FailedEventRepository
    );

    this.assertEqual(
      EntityMetadata.version,
      this.required.EntityMetadata,
      "Wrong EntityMetadata version"
    );

    this.assertEqual(
      BaseRepository.version,
      this.required.BaseRepository,
      "Wrong BaseRepository version"
    );

    this.assertEqual(
      RepositoryFactory.version,
      this.required.RepositoryFactory,
      "Wrong RepositoryFactory version"
    );

    this.assertEqual(
      FailedEventRepository.version,
      this.required.FailedEventRepository,
      "Wrong FailedEventRepository version"
    );

    if (
      EntityRegistry.initialized !== true
    ) {
      EntityRegistry.init();
    } else {
      EntityRegistry.sync();
    }

    if (
      typeof RepositoryRegistry.init ===
        "function" &&
      RepositoryRegistry.ready !== true
    ) {
      RepositoryRegistry.init();
    }

    if (
      typeof RepositoryRegistry.refresh ===
        "function"
    ) {
      RepositoryRegistry.refresh();
    }

    if (
      typeof RepositoryFactory.init ===
        "function" &&
      RepositoryFactory.initialized !== true
    ) {
      RepositoryFactory.init();
    }

    if (
      typeof RepositoryFactory.syncRegistry ===
        "function"
    ) {
      RepositoryFactory.syncRegistry();
    }

    FailedEventRepository.init();
  },

  requireGlobal(name, value) {
    if (
      value === undefined ||
      value === null
    ) {
      throw new Error(
        name + " unavailable"
      );
    }
  },

  // ============================================================
  // CASE EXECUTOR
  // ============================================================

  runCase(result, name, callback) {
    const startedAt = Date.now();

    try {
      const details = callback();

      result.tests.push({
        name,
        status: "PASS",
        durationMs:
          Date.now() - startedAt,
        details,
      });

      Logger.log(name + " PASS");
    } catch (error) {
      result.tests.push({
        name,
        status: "FAIL",
        durationMs:
          Date.now() - startedAt,
        error: error.message,
      });

      Logger.error(
        name + " FAIL: " +
          error.message
      );
    }
  },

  // ============================================================
  // ARCHITECTURE / METADATA
  // ============================================================

  testArchitectureMetadata() {
    const meta =
      EntityRegistry.get(
        "FAILED_EVENT"
      );

    this.assert(
      !!meta,
      "FAILED_EVENT metadata missing"
    );

    this.assertEqual(
      meta.table,
      "FailedEvents",
      "FAILED_EVENT table mismatch"
    );

    this.assertEqual(
      meta.idField,
      "ID",
      "FAILED_EVENT idField mismatch"
    );

    this.assertEqual(
      meta.idPrefix,
      "FEV",
      "FAILED_EVENT idPrefix mismatch"
    );

    const fields =
      this.fieldNames(meta);

    [
      "ID",
      "OrganizationID",
      "EventID",
      "Entity",
      "Type",
      "Payload",
      "Error",
      "Attempts",
      "Status",
      "LastAttemptAt",
      "NextRetryAt",
      "Processor",
      "CreatedAt",
      "UpdatedAt",
    ].forEach((field) => {
      this.assert(
        fields.includes(field),
        "FAILED_EVENT metadata field missing " +
          field
      );
    });

    this.assertEqual(
      EntityRegistry.resolve(
        "FailedEvents"
      ),
      "FAILED_EVENT",
      "Table alias does not resolve"
    );

    this.assertEqual(
      FailedEventRepository.entity,
      "FAILED_EVENT",
      "Repository entity mismatch"
    );

    this.assert(
      typeof FailedEventRepository.createBaseRepository ===
        "function",
      "Bound-base factory missing"
    );

    return {
      metadataVersion:
        EntityMetadata.version,
      fields: fields.length,
      table: meta.table,
      idField: meta.idField,
      idPrefix: meta.idPrefix,
    };
  },

  // ============================================================
  // CREATE / SAVE
  // ============================================================

  testCreateSaveNormalization() {
    const adapter =
      this.createMemoryAdapter();

    FailedEventRepository.useAdapterForTest(
      adapter
    );

    const firstId =
      this.uniqueId("FEV1");

    const secondId =
      this.uniqueId("FEV2");

    const first =
      FailedEventRepository.create({
        id: firstId,
        organizationId:
          "ORG_TEST",
        eventId:
          "EVT_CREATE_1",
        entity:
          "TRANSPORT_ORDER",
        type:
          "CREATED",
        payload: {
          TransportOrderID:
            "TO_TEST_1",
        },
        error:
          "Handler failed",
        attempts: 0,
        status:
          "pending",
        processor:
          "BusinessEventProcessor",
        timestamp:
          "2026-07-28T20:00:00.000Z",
      });

    const second =
      FailedEventRepository.save(
        {
          id: "EVT_SAVE_2",
          entity: "TRIP",
          type: "UPDATED",
          payload: {
            TripID: "TRP_TEST_2",
          },
        },
        new Error("Retry failed"),
        {
          id: secondId,
          organizationId:
            "ORG_TEST",
          processor:
            "EventRetryQueue",
        }
      );

    this.assertEqual(
      first.ID,
      firstId,
      "First failed-event ID mismatch"
    );

    this.assertEqual(
      first.Status,
      "PENDING",
      "Lowercase status was not normalized"
    );

    this.assertEqual(
      first.Attempts,
      0,
      "Attempts normalization mismatch"
    );

    this.assertEqual(
      typeof first.Payload,
      "string",
      "Payload was not serialized"
    );

    this.assertEqual(
      JSON.parse(first.Payload)
        .TransportOrderID,
      "TO_TEST_1",
      "Serialized payload mismatch"
    );

    this.assertEqual(
      second.ID,
      secondId,
      "Saved failed-event ID mismatch"
    );

    this.assertEqual(
      second.EventID,
      "EVT_SAVE_2",
      "save() event ID mismatch"
    );

    this.assertEqual(
      second.Error,
      "Retry failed",
      "save() error mismatch"
    );

    this.assertEqual(
      adapter.calls.insert.length,
      2,
      "Wrong insert count"
    );

    adapter.calls.insert
      .forEach((call) => {
        this.assertEqual(
          call.entity,
          "FAILED_EVENT",
          "Insert used table instead of entity"
        );
      });

    this.assertEqual(
      FailedEventRepository.findByEventId(
        "EVT_SAVE_2"
      ).length,
      1,
      "findByEventId returned wrong count"
    );

    return {
      created: 2,
      insertedEntity:
        adapter.calls.insert[0].entity,
      firstStatus:
        first.Status,
      secondStatus:
        second.Status,
      payloadSerialized: true,
    };
  },

  // ============================================================
  // RETRY LIFECYCLE
  // ============================================================

  testRetryLifecycle() {
    const adapter =
      this.createMemoryAdapter();

    FailedEventRepository.useAdapterForTest(
      adapter
    );

    const id =
      this.uniqueId("RETRY");

    const exhaustedId =
      this.uniqueId("LIMIT");

    FailedEventRepository.create({
      ID: id,
      OrganizationID:
        "ORG_TEST",
      EventID:
        "EVT_RETRY",
      Entity:
        "TRIP",
      Type:
        "UPDATED",
      Payload: {
        TripID:
          "TRP_RETRY",
      },
      Error:
        "Initial error",
      Attempts: 0,
      Status:
        "FAILED",
    });

    FailedEventRepository.create({
      ID: exhaustedId,
      OrganizationID:
        "ORG_TEST",
      EventID:
        "EVT_LIMIT",
      Entity:
        "TRIP",
      Type:
        "UPDATED",
      Payload: {},
      Error:
        "Retry limit",
      Attempts: 5,
      Status:
        "FAILED",
    });

    const firstRetry =
      FailedEventRepository
        .increaseAttempts(id);

    const secondRetry =
      FailedEventRepository
        .increaseAttempts(id);

    this.assertEqual(
      firstRetry.Attempts,
      1,
      "First retry attempt mismatch"
    );

    this.assertEqual(
      secondRetry.Attempts,
      2,
      "Second retry attempt mismatch"
    );

    this.assertEqual(
      secondRetry.Status,
      "RETRY",
      "Retry status mismatch"
    );

    this.assertEqual(
      typeof secondRetry.Attempts,
      "number",
      "Attempts stored as non-number"
    );

    const retryable =
      FailedEventRepository
        .findRetryable(5);

    this.assertEqual(
      retryable.length,
      1,
      "Retry limit filtering mismatch"
    );

    this.assertEqual(
      retryable[0].ID,
      id,
      "Wrong retryable row"
    );

    const failed =
      FailedEventRepository.markFailed(
        id,
        new Error(
          "Second handler failure"
        )
      );

    this.assertEqual(
      failed.Status,
      "FAILED",
      "markFailed status mismatch"
    );

    this.assertEqual(
      failed.Error,
      "Second handler failure",
      "markFailed error mismatch"
    );

    const completed =
      FailedEventRepository
        .markCompleted(id);

    this.assertEqual(
      completed.Status,
      "DONE",
      "markCompleted status mismatch"
    );

    this.assert(
      !FailedEventRepository
        .getPending()
        .some(
          (row) => row.ID === id
        ),
      "Completed row remains pending"
    );

    adapter.calls.update
      .forEach((call) => {
        this.assertEqual(
          call.entity,
          "FAILED_EVENT",
          "Update used table instead of entity"
        );

        if (
          call.data.Attempts !==
          undefined
        ) {
          this.assertEqual(
            typeof call.data.Attempts,
            "number",
            "Attempts update is not numeric"
          );
        }
      });

    return {
      attempts:
        secondRetry.Attempts,
      retryable:
        retryable.length,
      finalStatus:
        completed.Status,
      updateCalls:
        adapter.calls.update.length,
    };
  },

  // ============================================================
  // MUTATION GUARDS
  // ============================================================

  testMutationGuards() {
    const checks = [
      [
        "update",
        () =>
          FailedEventRepository.update(),
      ],
      [
        "delete",
        () =>
          FailedEventRepository.delete(),
      ],
      [
        "restore",
        () =>
          FailedEventRepository.restore(),
      ],
      [
        "bulkUpdate",
        () =>
          FailedEventRepository.bulkUpdate(),
      ],
      [
        "forbidden status field",
        () =>
          FailedEventRepository.updateStatus(
            "FEV_TEST",
            {
              Entity: "CLIENT",
            }
          ),
      ],
    ];

    checks.forEach(
      ([name, callback]) => {
        this.assertThrows(
          callback,
          name +
            " did not reject mutation"
        );
      }
    );

    return {
      rejectedMutations:
        checks.length,
      deleteAllowed: false,
      statusOnlyUpdates: true,
    };
  },

  // ============================================================
  // REGISTRY / FACTORY / HEALTH
  // ============================================================

  testRegistryFactoryHealth() {
    FailedEventRepository.register();

    if (
      typeof RepositoryFactory.syncRegistry ===
        "function"
    ) {
      RepositoryFactory.syncRegistry();
    }

    this.assert(
      RepositoryFactory.has(
        "FAILED_EVENT"
      ),
      "FAILED_EVENT missing in RepositoryFactory"
    );

    this.assert(
      RepositoryRegistry.has(
        "FAILED_EVENT"
      ),
      "FAILED_EVENT missing in RepositoryRegistry"
    );

    this.assertEqual(
      RepositoryFactory.get(
        "FAILED_EVENT"
      ),
      FailedEventRepository,
      "Factory returned wrong repository"
    );

    this.assertEqual(
      RepositoryRegistry.get(
        "FAILED_EVENT"
      ),
      FailedEventRepository,
      "Registry returned wrong repository"
    );

    this.assert(
      !RepositoryFactory.has("BASE"),
      "BASE registered in RepositoryFactory"
    );

    this.assert(
      !RepositoryRegistry.has("BASE"),
      "BASE registered in RepositoryRegistry"
    );

    const health =
      FailedEventRepository.health();

    this.assertEqual(
      health.status,
      "OK",
      "FailedEventRepository health is not OK"
    );

    return {
      factory: "REGISTERED",
      registry: "REGISTERED",
      health: health.status,
      metadata:
        FailedEventRepository
          .diagnostics()
          .metadata,
      baseRegistered: false,
    };
  },

  // ============================================================
  // STATE ISOLATION
  // ============================================================

  captureRepositoryState() {
    return {
      base:
        FailedEventRepository._base,
      initialized:
        FailedEventRepository.initialized,
      registered:
        FailedEventRepository.registered,
    };
  },

  restoreRepositoryState(state) {
    FailedEventRepository._base =
      state.base;

    FailedEventRepository.initialized =
      state.initialized;

    FailedEventRepository.registered =
      state.registered;
  },

  // ============================================================
  // IN-MEMORY ADAPTER
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

    const getBucket = (entity) => {
      storage[entity] =
        storage[entity] || {};

      return storage[entity];
    };

    const getIdField = (entity) => {
      const meta =
        EntityRegistry.get(entity);

      return meta.idField || "ID";
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

        const id = data[idField];

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

        bucket[id] = clone(data);

        this.calls.insert.push({
          entity,
          data: clone(data),
        });

        return clone(bucket[id]);
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

      query(entity, filters = {}) {
        const bucket =
          getBucket(entity);

        this.calls.query.push({
          entity,
          filters: clone(filters),
        });

        return Object.keys(bucket)
          .map(
            (id) => clone(bucket[id])
          )
          .filter((row) => {
            return Object.keys(filters)
              .every((key) => {
                return (
                  String(row[key]) ===
                  String(filters[key])
                );
              });
          });
      },

      count(entity, filters = {}) {
        return this.query(
          entity,
          filters
        ).length;
      },

      update(entity, id, data) {
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
          data: clone(data),
        });

        return clone(bucket[id]);
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
  // ASSERTIONS
  // ============================================================

  fieldNames(meta) {
    if (!meta || !meta.fields) {
      return [];
    }

    if (Array.isArray(meta.fields)) {
      return meta.fields.map(
        (field) =>
          typeof field === "string"
            ? field
            : field.name
      );
    }

    return Object.keys(meta.fields);
  },

  uniqueId(prefix) {
    return (
      "TST" +
      prefix +
      Date.now()
        .toString(36)
        .toUpperCase() +
      Math.floor(
        Math.random() * 100000
      )
        .toString()
        .padStart(5, "0")
    );
  },

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
          JSON.stringify(expected) +
          ", actual=" +
          JSON.stringify(actual)
      );
    }
  },

  assertThrows(callback, message) {
    let thrown = false;

    try {
      callback();
    } catch (error) {
      thrown = true;
    }

    if (!thrown) {
      throw new Error(message);
    }
  },
};

globalThis.TestFailedEventRepositoryContract =
  TestFailedEventRepositoryContract;

// ============================================================
// MANUAL TEST RUNNER
// This function is visible in the Google Apps Script function list.
// ============================================================

function runFailedEventRepositoryContractTest() {
  Logger.log(
    "========== MANUAL FAILED EVENT REPOSITORY TEST RUN =========="
  );

  const result =
    TestFailedEventRepositoryContract.run();

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
  "TestFailedEventRepositoryContract READY v" +
    TestFailedEventRepositoryContract.version
);
