// ============================================================
// TestSystemRepositoriesContract v1.0.0
// Regression test for:
// - EntityMetadata v3.2.0
// - RepositoryFactory v3.1.1
// - AuditRepository v2.0.0
// - VersionRepository v2.0.0
// - BaseRepository v6.3.1
//
// Checks:
// 1. System metadata and bound-repository architecture
// 2. AUDIT append-only create/read/search/paginate contract
// 3. VERSION append-only history/latest/hash contract
// 4. Immutability of AUDIT and VERSION records
// 5. RepositoryFactory/RepositoryRegistry synchronization
//
// The test uses isolated in-memory adapters.
// It does not create or modify rows in Google Sheets.
// ============================================================

console.log(
  "TestSystemRepositoriesContract v1.0.0"
);

const TestSystemRepositoriesContract = {
  version: "1.0.0",

  required: {
    EntityMetadata: "3.2.0",
    BaseRepository: "6.3.1",
    RepositoryFactory: "3.1.1",
    AuditRepository: "2.0.0",
    VersionRepository: "2.0.0",
  },

  // ============================================================
  // RUN
  // ============================================================

  run() {
    Logger.log(
      "========== SYSTEM REPOSITORIES CONTRACT TEST START =========="
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
        ", AuditRepository v" +
        AuditRepository.version +
        ", VersionRepository v" +
        VersionRepository.version
    );

    const result = {
      module:
        "TestSystemRepositoriesContract",
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
        "AUDIT_APPEND_ONLY",
        () => this.testAuditAppendOnly()
      );

      this.runCase(
        result,
        "VERSION_APPEND_ONLY",
        () => this.testVersionAppendOnly()
      );

      this.runCase(
        result,
        "IMMUTABILITY",
        () => this.testImmutability()
      );

      this.runCase(
        result,
        "REGISTRY_FACTORY_SYNC",
        () => this.testRegistryFactorySync()
      );
    } finally {
      this.restoreRepositoryState(state);
    }

    result.summary.total =
      result.tests.length;

    result.summary.passed =
      result.tests.filter(
        (test) => test.status === "PASS"
      ).length;

    result.summary.failed =
      result.tests.filter(
        (test) => test.status === "FAIL"
      ).length;

    result.status =
      result.summary.failed === 0
        ? "PASS"
        : "FAIL";

    Logger.log(
      JSON.stringify(result, null, 2)
    );

    if (result.status !== "PASS") {
      const failed = result.tests
        .filter(
          (test) =>
            test.status === "FAIL"
        )
        .map((test) => test.name)
        .join(", ");

      throw new Error(
        "System repositories contract failed: " +
          failed
      );
    }

    Logger.log(
      "========== SYSTEM REPOSITORIES CONTRACT TEST PASS =========="
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
      "AuditRepository",
      AuditRepository
    );
    this.requireGlobal(
      "VersionRepository",
      VersionRepository
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
      AuditRepository.version,
      this.required.AuditRepository,
      "Wrong AuditRepository version"
    );

    this.assertEqual(
      VersionRepository.version,
      this.required.VersionRepository,
      "Wrong VersionRepository version"
    );

    if (
      EntityRegistry.initialized !== true
    ) {
      EntityRegistry.init();
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

    RepositoryFactory.syncRegistry();

    AuditRepository.init();
    VersionRepository.init();
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
    const auditMeta =
      EntityRegistry.get("AUDIT");

    const versionMeta =
      EntityRegistry.get("VERSION");

    this.assert(
      !!auditMeta,
      "AUDIT metadata missing"
    );

    this.assert(
      !!versionMeta,
      "VERSION metadata missing"
    );

    const auditFields =
      this.fieldNames(auditMeta);

    const versionFields =
      this.fieldNames(versionMeta);

    [
      "AuditID",
      "OrganizationID",
      "Entity",
      "EntityID",
      "Action",
      "UserID",
      "EventID",
      "Before",
      "After",
      "Source",
      "Version",
      "EntityVersion",
      "CreatedAt",
      "UpdatedAt",
    ].forEach((field) => {
      this.assert(
        auditFields.includes(field),
        "AUDIT metadata field missing " +
          field
      );
    });

    [
      "VersionID",
      "OrganizationID",
      "Entity",
      "EntityID",
      "VersionNumber",
      "Hash",
      "Snapshot",
      "Source",
      "CreatedAt",
      "UpdatedAt",
    ].forEach((field) => {
      this.assert(
        versionFields.includes(field),
        "VERSION metadata field missing " +
          field
      );
    });

    this.assertEqual(
      AuditRepository.entity,
      "AUDIT",
      "AuditRepository entity mismatch"
    );

    this.assertEqual(
      VersionRepository.entity,
      "VERSION",
      "VersionRepository entity mismatch"
    );

    this.assert(
      typeof AuditRepository.createBaseRepository ===
        "function",
      "AuditRepository bound-base factory missing"
    );

    this.assert(
      typeof VersionRepository.createBaseRepository ===
        "function",
      "VersionRepository bound-base factory missing"
    );

    return {
      metadataVersion:
        EntityMetadata.version,
      auditFields:
        auditFields.length,
      versionFields:
        versionFields.length,
      baseVersion:
        BaseRepository.version,
    };
  },

  // ============================================================
  // AUDIT APPEND-ONLY
  // ============================================================

  testAuditAppendOnly() {
    const adapter =
      this.createMemoryAdapter();

    AuditRepository.useAdapterForTest(
      adapter
    );

    const firstId =
      this.uniqueId("AUD1");

    const secondId =
      this.uniqueId("AUD2");

    const first =
      AuditRepository.create({
        AuditID: firstId,
        organizationId:
          "ORG_TEST",
        entity: "CLIENT",
        entityId: "CLI_TEST_1",
        action: "CREATE",
        userId: "USR_TEST",
        eventId: "EVT_TEST_1",
        before: null,
        after: {
          Name: "Test Client",
        },
        source: "CONTRACT_TEST",
      });

    const second =
      AuditRepository.create({
        AuditID: secondId,
        OrganizationID:
          "ORG_TEST",
        Entity: "CLIENT",
        EntityID: "CLI_TEST_2",
        Action: "UPDATE",
        UserID: "USR_TEST",
        EventID: "EVT_TEST_2",
        Before: {
          Status: "NEW",
        },
        After: {
          Status: "ACTIVE",
        },
        Source: "CONTRACT_TEST",
      });

    this.assertEqual(
      first.AuditID,
      firstId,
      "First audit ID mismatch"
    );

    this.assertEqual(
      second.AuditID,
      secondId,
      "Second audit ID mismatch"
    );

    this.assertEqual(
      adapter.calls.insert[0].entity,
      "AUDIT",
      "Audit insert used table instead of entity"
    );

    this.assertEqual(
      AuditRepository.findByEntity(
        "CLIENT",
        "CLI_TEST_1"
      ).length,
      1,
      "findByEntity returned wrong count"
    );

    this.assertEqual(
      AuditRepository.findByUser(
        "USR_TEST"
      ).length,
      2,
      "findByUser returned wrong count"
    );

    this.assertEqual(
      AuditRepository.findByAction(
        "UPDATE"
      ).length,
      1,
      "findByAction returned wrong count"
    );

    this.assertEqual(
      AuditRepository.findByEvent(
        "EVT_TEST_2"
      ).length,
      1,
      "findByEvent returned wrong count"
    );

    this.assertEqual(
      AuditRepository.count({
        Entity: "CLIENT",
      }),
      2,
      "Audit count returned wrong result"
    );

    const page =
      AuditRepository.paginate(
        1,
        1,
        { Entity: "CLIENT" }
      );

    this.assertEqual(
      page.total,
      2,
      "Audit pagination total mismatch"
    );

    this.assertEqual(
      page.data.length,
      1,
      "Audit pagination limit mismatch"
    );

    return {
      created: 2,
      insertedEntity:
        adapter.calls.insert[0].entity,
      searches: 4,
      count:
        AuditRepository.count(),
      pagination: {
        page: page.page,
        limit: page.limit,
        total: page.total,
      },
    };
  },

  // ============================================================
  // VERSION APPEND-ONLY
  // ============================================================

  testVersionAppendOnly() {
    const adapter =
      this.createMemoryAdapter();

    VersionRepository.useAdapterForTest(
      adapter
    );

    const firstId =
      this.uniqueId("VER1");

    const secondId =
      this.uniqueId("VER2");

    const otherId =
      this.uniqueId("VER3");

    VersionRepository.create({
      VersionID: firstId,
      organizationId:
        "ORG_TEST",
      entity: "CLIENT",
      entityId: "CLI_VERSIONED",
      versionNumber: 1,
      snapshot: {
        Status: "NEW",
      },
      hash: "HASH_1",
      timestamp:
        "2026-07-28T20:00:00.000Z",
    });

    VersionRepository.create({
      VersionID: secondId,
      OrganizationID:
        "ORG_TEST",
      Entity: "CLIENT",
      EntityID: "CLI_VERSIONED",
      VersionNumber: 2,
      Snapshot: {
        Status: "ACTIVE",
      },
      Hash: "HASH_2",
      CreatedAt:
        "2026-07-28T20:01:00.000Z",
    });

    VersionRepository.create({
      VersionID: otherId,
      OrganizationID:
        "ORG_TEST",
      Entity: "TRIP",
      EntityID: "TRP_OTHER",
      VersionNumber: 1,
      Snapshot: {
        Status: "PLANNED",
      },
      Hash: "HASH_3",
    });

    this.assertEqual(
      adapter.calls.insert[0].entity,
      "VERSION",
      "Version insert used table instead of entity"
    );

    const history =
      VersionRepository.findByEntity(
        "CLIENT",
        "CLI_VERSIONED"
      );

    this.assertEqual(
      history.length,
      2,
      "Version history count mismatch"
    );

    const latest =
      VersionRepository.findLatest(
        "CLIENT",
        "CLI_VERSIONED"
      );

    this.assertEqual(
      latest.VersionID,
      secondId,
      "findLatest returned wrong row"
    );

    this.assertEqual(
      latest.VersionNumber,
      2,
      "findLatest used wrong version field"
    );

    this.assertEqual(
      VersionRepository.findByHash(
        "HASH_2"
      ).length,
      1,
      "findByHash returned wrong count"
    );

    this.assertEqual(
      VersionRepository.nextVersionNumber(
        "CLIENT",
        "CLI_VERSIONED"
      ),
      3,
      "nextVersionNumber returned wrong value"
    );

    const page =
      VersionRepository.paginate(
        1,
        2,
        {}
      );

    this.assertEqual(
      page.total,
      3,
      "Version pagination total mismatch"
    );

    this.assertEqual(
      page.data.length,
      2,
      "Version pagination limit mismatch"
    );

    return {
      created: 3,
      history: history.length,
      latest:
        latest.VersionNumber,
      nextVersion: 3,
      hashes: 1,
      insertedEntity:
        adapter.calls.insert[0].entity,
    };
  },

  // ============================================================
  // IMMUTABILITY
  // ============================================================

  testImmutability() {
    const checks = [
      [
        "AuditRepository.update",
        () => AuditRepository.update(),
      ],
      [
        "AuditRepository.delete",
        () => AuditRepository.delete(),
      ],
      [
        "AuditRepository.restore",
        () => AuditRepository.restore(),
      ],
      [
        "AuditRepository.bulkUpdate",
        () => AuditRepository.bulkUpdate(),
      ],
      [
        "VersionRepository.update",
        () => VersionRepository.update(),
      ],
      [
        "VersionRepository.delete",
        () => VersionRepository.delete(),
      ],
      [
        "VersionRepository.restore",
        () => VersionRepository.restore(),
      ],
      [
        "VersionRepository.bulkUpdate",
        () => VersionRepository.bulkUpdate(),
      ],
    ];

    checks.forEach(([name, callback]) => {
      this.assertThrows(
        callback,
        name + " did not reject mutation"
      );
    });

    return {
      rejectedMutations:
        checks.length,
      auditImmutable: true,
      versionImmutable: true,
    };
  },

  // ============================================================
  // REGISTRY / FACTORY
  // ============================================================

  testRegistryFactorySync() {
    RepositoryFactory.syncRegistry();

    this.assert(
      RepositoryFactory.has("AUDIT"),
      "AUDIT missing in RepositoryFactory"
    );

    this.assert(
      RepositoryFactory.has("VERSION"),
      "VERSION missing in RepositoryFactory"
    );

    this.assert(
      RepositoryRegistry.has("AUDIT"),
      "AUDIT missing in RepositoryRegistry"
    );

    this.assert(
      RepositoryRegistry.has("VERSION"),
      "VERSION missing in RepositoryRegistry"
    );

    this.assertEqual(
      RepositoryFactory.get("AUDIT"),
      AuditRepository,
      "Factory returned generic AUDIT repository"
    );

    this.assertEqual(
      RepositoryFactory.get("VERSION"),
      VersionRepository,
      "Factory returned generic VERSION repository"
    );

    this.assert(
      !RepositoryFactory.has("BASE"),
      "BASE registered in RepositoryFactory"
    );

    this.assert(
      !RepositoryRegistry.has("BASE"),
      "BASE registered in RepositoryRegistry"
    );

    const consistency =
      RepositoryFactory.consistency();

    this.assert(
      !consistency.missingInFactory.includes(
        "AUDIT"
      ),
      "AUDIT missing from Factory consistency"
    );

    this.assert(
      !consistency.missingInFactory.includes(
        "VERSION"
      ),
      "VERSION missing from Factory consistency"
    );

    return {
      auditFactory: "REGISTERED",
      auditRegistry: "REGISTERED",
      versionFactory: "REGISTERED",
      versionRegistry: "REGISTERED",
      baseRegistered: false,
      factoryCount:
        RepositoryFactory.list().length,
      registryCount:
        RepositoryRegistry.list().length,
    };
  },

  // ============================================================
  // STATE ISOLATION
  // ============================================================

  captureRepositoryState() {
    return {
      auditBase:
        AuditRepository._base,
      auditInitialized:
        AuditRepository.initialized,
      auditRegistered:
        AuditRepository.registered,
      versionBase:
        VersionRepository._base,
      versionInitialized:
        VersionRepository.initialized,
      versionRegistered:
        VersionRepository.registered,
    };
  },

  restoreRepositoryState(state) {
    AuditRepository._base =
      state.auditBase;

    AuditRepository.initialized =
      state.auditInitialized;

    AuditRepository.registered =
      state.auditRegistered;

    VersionRepository._base =
      state.versionBase;

    VersionRepository.initialized =
      state.versionInitialized;

    VersionRepository.registered =
      state.versionRegistered;
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

globalThis.TestSystemRepositoriesContract =
  TestSystemRepositoriesContract;

// ============================================================
// MANUAL TEST RUNNER
// This function is visible in the Google Apps Script function list.
// ============================================================

function runSystemRepositoriesContractTest() {
  Logger.log(
    "========== MANUAL SYSTEM REPOSITORIES TEST RUN =========="
  );

  const result =
    TestSystemRepositoriesContract.run();

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
  "TestSystemRepositoriesContract READY v" +
    TestSystemRepositoriesContract.version
);