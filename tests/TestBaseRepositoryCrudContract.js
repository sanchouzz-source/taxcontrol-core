// ============================================================
// TestBaseRepositoryCrudContract v1.0.0
// Regression test for BaseRepository v6.3.1
// TaxControl ERP Core
//
// Checks:
// 1. Repository created through createRepository(entity)
// 2. Bound API: create -> find -> update -> delete -> restore
// 3. Direct API: BaseRepository method form with explicit entity
// 4. bulkCreate() fallback when adapter.bulkInsert is unavailable
// 5. The technical BASE key is not registered
//
// The test uses an in-memory adapter.
// Google Sheets data is not created or modified.
// ============================================================

console.log(
  "TestBaseRepositoryCrudContract v1.0.0"
);

const TestBaseRepositoryCrudContract = {
  version: "1.0.0",
  requiredBaseVersion: "6.3.1",
  entity: "CLIENT",

  // ============================================================
  // RUN
  // ============================================================

  run() {
    Logger.log(
      "========== BASE REPOSITORY CRUD CONTRACT TEST START =========="
    );

    this._checkDependencies();

    const result = {
      module: "TestBaseRepositoryCrudContract",
      version: this.version,
      baseRepositoryVersion:
        BaseRepository.version,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
      status: "RUNNING",
    };

    this._runCase(
      result,
      "BOUND_CRUD",
      () => this._testBoundCrud()
    );

    this._runCase(
      result,
      "DIRECT_CRUD",
      () => this._testDirectCrud()
    );

    this._runCase(
      result,
      "BOUND_BULK_FALLBACK",
      () => this._testBoundBulkFallback()
    );

    this._runCase(
      result,
      "NO_BASE_REGISTRATION",
      () => this._testNoBaseRegistration()
    );

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
      const failedNames = result.tests
        .filter(
          (test) => test.status === "FAIL"
        )
        .map((test) => test.name)
        .join(", ");

      throw new Error(
        "BaseRepository CRUD contract failed: " +
          failedNames
      );
    }

    Logger.log(
      "========== BASE REPOSITORY CRUD CONTRACT TEST PASS =========="
    );

    return result;
  },

  // ============================================================
  // DEPENDENCIES
  // ============================================================

  _checkDependencies() {
    if (typeof BaseRepository === "undefined") {
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

    if (typeof EntityRegistry === "undefined") {
      throw new Error(
        "EntityRegistry unavailable"
      );
    }

    if (
      typeof EntityRegistry.get !== "function"
    ) {
      throw new Error(
        "EntityRegistry.get unavailable"
      );
    }

    const meta =
      EntityRegistry.get(this.entity);

    if (!meta) {
      throw new Error(
        "Metadata missing for " +
          this.entity
      );
    }
  },

  // ============================================================
  // CASE EXECUTOR
  // ============================================================

  _runCase(result, name, callback) {
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
        name + " FAIL: " + error.message
      );
    }
  },

  // ============================================================
  // BOUND CRUD
  // ============================================================

  _testBoundCrud() {
    const adapter =
      this._createMemoryAdapter();

    const repository =
      this._createBoundRepository(
        this.entity,
        adapter
      );

    const id =
      this._uniqueId("BOUND");

    const created = repository.create(
      this._clientData(
        id,
        "Bound Contract Client"
      )
    );

    this._assertEqual(
      created.ClientID,
      id,
      "Bound create returned wrong ID"
    );

    const found =
      repository.findById(id);

    this._assert(
      !!found,
      "Bound findById returned null"
    );

    const updated = repository.update(
      id,
      {
        Status: "UPDATED",
      }
    );

    this._assertEqual(
      updated.Status,
      "UPDATED",
      "Bound update did not change Status"
    );

    /*
     * This assertion detects the v6.3.0 defect directly.
     * The adapter must receive the record ID, not "CLIENT".
     */
    this._assertEqual(
      adapter.calls.update[0].id,
      id,
      "Bound update passed entity as ID"
    );

    const deleted =
      repository.delete(id);

    this._assert(
      repository.isDeleted(deleted),
      "Bound delete did not set Deleted"
    );

    this._assertEqual(
      repository.findById(id),
      null,
      "Deleted row is visible without includeDeleted"
    );

    const deletedRow =
      repository.findById(
        id,
        { includeDeleted: true }
      );

    this._assert(
      !!deletedRow,
      "Deleted row is missing with includeDeleted"
    );

    const restored =
      repository.restore(id);

    this._assert(
      !repository.isDeleted(restored),
      "Bound restore did not clear Deleted"
    );

    this._assert(
      !!repository.findById(id),
      "Restored row is not visible"
    );

    return {
      id,
      create: "OK",
      find: "OK",
      update: "OK",
      delete: "OK",
      restore: "OK",
      adapterUpdateIds:
        adapter.calls.update.map(
          (call) => call.id
        ),
    };
  },

  // ============================================================
  // DIRECT CRUD
  // ============================================================

  _testDirectCrud() {
    const adapter =
      this._createMemoryAdapter();

    const repository =
      this._createDirectRepository(
        adapter
      );

    const id =
      this._uniqueId("DIRECT");

    const created = repository.create(
      this.entity,
      this._clientData(
        id,
        "Direct Contract Client"
      )
    );

    this._assertEqual(
      created.ClientID,
      id,
      "Direct create returned wrong ID"
    );

    const found = repository.findById(
      this.entity,
      id
    );

    this._assert(
      !!found,
      "Direct findById returned null"
    );

    const updated = repository.update(
      this.entity,
      id,
      {
        Status: "UPDATED",
      }
    );

    this._assertEqual(
      updated.Status,
      "UPDATED",
      "Direct update did not change Status"
    );

    const deleted = repository.delete(
      this.entity,
      id
    );

    this._assert(
      repository.isDeleted(deleted),
      "Direct delete did not set Deleted"
    );

    const restored = repository.restore(
      this.entity,
      id
    );

    this._assert(
      !repository.isDeleted(restored),
      "Direct restore did not clear Deleted"
    );

    const finalRow =
      repository.findById(
        this.entity,
        id
      );

    this._assert(
      !!finalRow,
      "Direct restored row is not visible"
    );

    return {
      id,
      create: "OK",
      find: "OK",
      update: "OK",
      delete: "OK",
      restore: "OK",
    };
  },

  // ============================================================
  // BULK FALLBACK
  // ============================================================

  _testBoundBulkFallback() {
    /*
     * _createMemoryAdapter() intentionally has no bulkInsert().
     * BaseRepository must therefore use the fallback create(item)
     * form for a bound repository.
     */
    const adapter =
      this._createMemoryAdapter();

    const repository =
      this._createBoundRepository(
        this.entity,
        adapter
      );

    const firstId =
      this._uniqueId("BULK1");

    const secondId =
      this._uniqueId("BULK2");

    const created =
      repository.bulkCreate([
        this._clientData(
          firstId,
          "Bulk Client One"
        ),
        this._clientData(
          secondId,
          "Bulk Client Two"
        ),
      ]);

    this._assertEqual(
      created.length,
      2,
      "bulkCreate returned wrong row count"
    );

    this._assert(
      !!repository.findById(firstId),
      "First bulk row not found"
    );

    this._assert(
      !!repository.findById(secondId),
      "Second bulk row not found"
    );

    this._assertEqual(
      adapter.calls.insert[0].entity,
      this.entity,
      "Bulk fallback used wrong entity"
    );

    this._assertEqual(
      adapter.calls.insert[0]
        .data.ClientID,
      firstId,
      "Bulk fallback treated entity as data"
    );

    return {
      created: created.length,
      ids: [firstId, secondId],
      fallback: "OK",
    };
  },

  // ============================================================
  // BASE REGISTRATION
  // ============================================================

  _testNoBaseRegistration() {
    if (
      typeof RepositoryFactory ===
        "undefined" ||
      typeof RepositoryFactory.list !==
        "function"
    ) {
      return {
        status: "SKIPPED",
        reason:
          "RepositoryFactory unavailable",
      };
    }

    const repositories =
      RepositoryFactory.list();

    this._assert(
      !repositories.includes("BASE"),
      "Technical BASE key is registered in RepositoryFactory"
    );

    return {
      baseRegistered: false,
      repositoryCount:
        repositories.length,
    };
  },

  // ============================================================
  // REPOSITORY BUILDERS
  // ============================================================

  _createBoundRepository(
    entity,
    adapter
  ) {
    const repository =
      BaseRepository.createRepository(
        entity
      );

    /*
     * The repository is created by the real factory method,
     * then redirected to isolated in-memory storage.
     */
    repository._adapter = adapter;
    repository._initialized = true;

    /*
     * This unit test verifies the CRUD argument contract.
     * Business events and persistent audit are covered by
     * integration tests and are intentionally disabled here.
     */
    repository.emit = function () {};
    repository.audit = function () {};

    return repository;
  },

  _createDirectRepository(adapter) {
    const repository =
      Object.create(BaseRepository);

    repository.entity = null;
    repository._adapter = adapter;
    repository._initialized = true;
    repository.emit = function () {};
    repository.audit = function () {};

    return repository;
  },

  // ============================================================
  // IN-MEMORY DATABASE ADAPTER
  // ============================================================

  _createMemoryAdapter() {
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
          .map((id) => clone(bucket[id]))
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
  // TEST DATA
  // ============================================================

  _clientData(id, name) {
    return {
      ClientID: id,
      OrganizationID: "SYSTEM",
      Name: name,
      INN: "0000000000",
      Status: "ACTIVE",
      Deleted: false,
    };
  },

  _uniqueId(prefix) {
    return (
      "TST" +
      prefix +
      Date.now().toString(36).toUpperCase() +
      Math.floor(
        Math.random() * 100000
      )
        .toString()
        .padStart(5, "0")
    );
  },

  // ============================================================
  // ASSERTIONS
  // ============================================================

  _assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  _assertEqual(
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
};

// ============================================================
// GLOBAL EXPORTS
// ============================================================

globalThis.TestBaseRepositoryCrudContract =
  TestBaseRepositoryCrudContract;

globalThis.testBaseRepositoryCrudContract =
  function () {
    return TestBaseRepositoryCrudContract.run();
  };

Logger.log(
  "TestBaseRepositoryCrudContract READY v" +
    TestBaseRepositoryCrudContract.version
);