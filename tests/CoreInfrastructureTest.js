// ============================================================
// CoreInfrastructureTest.gs v2.0.1
//
// TaxControl ERP Core
//
// Infrastructure validation
//
// Chain:
//
// SchemaRegistry
//        ↓
// Database
//        ↓
// SpreadsheetAdapter
//        ↓
// BaseRepository
//
// ============================================================

console.log("CoreInfrastructureTest v2.0.1");

const CoreInfrastructureTest = {
  version: "2.0.1",

  TEST_ENTITY: "__TEST_DATABASE",
  TEST_SHEET: "__TEST_DATABASE",

  // ============================================================
  // RUN ALL
  // ============================================================

  run() {
    this.cleanupSafe();

    Logger.log("========== CORE TEST START ==========");

    const result = {};

    try {
      result.schema = this.testSchemaRegistry();
      result.adapter = this.testAdapter();
      result.database = this.testDatabase();
      result.repository = this.testRepository();
      result.chain = this.testChain();
      result.status = "PASSED";
    } catch (e) {
      result.status = "FAILED";
      result.error = e.message;
      Logger.error("CORE TEST FAILED " + e.message);
    } finally {
      this.cleanupSafe();
    }

    Logger.log(JSON.stringify(result, null, 2));
    return result;
  },

  // ============================================================
  // CLEANUP
  // ============================================================

  cleanupSafe() {
    try {
      if (typeof SpreadsheetAdapter !== "undefined") {
        const sheet = SpreadsheetAdapter.getSheet(this.TEST_SHEET);
        if (sheet) {
          SpreadsheetAdapter.getSpreadsheet().deleteSheet(sheet);
        }
        SpreadsheetAdapter.clearCache?.();
      }
      Logger.log("Cleanup completed");
    } catch (e) {
      Logger.warn("Cleanup failed " + e.message);
    }
  },

  // ============================================================
  // TEST SCHEMA REGISTRY
  // ============================================================

  testSchemaRegistry() {
    Logger.log("===== TEST SCHEMA REGISTRY =====");

    if (typeof SchemaRegistry === "undefined") {
      throw new Error("SchemaRegistry missing");
    }

    const schema = SchemaRegistry.get(this.TEST_ENTITY);
    if (!schema) {
      throw new Error("Schema missing: " + this.TEST_ENTITY);
    }

    if (schema.system !== true) {
      throw new Error("Test schema is not system schema");
    }

    return {
      status: "OK",
      entity: schema.entity,
      table: schema.table,
      fields: schema.fields.length
    };
  },

  // ============================================================
  // TEST ADAPTER (исправлен: добавлены заголовки)
  // ============================================================

  testAdapter() {
    Logger.log("===== TEST ADAPTER =====");

    const health = SpreadsheetAdapter.health();

    // Исправлено: передаём заголовки при создании листа
    const sheet = SpreadsheetAdapter.getOrCreateSheet(
      this.TEST_SHEET,
      ["id", "createdAt", "value"]
    );

    if (!sheet) {
      throw new Error("Adapter create sheet failed");
    }

    SpreadsheetAdapter.insert(
      this.TEST_SHEET,
      {
        id: "A001",
        value: "adapter",
        createdAt: new Date()
      }
    );

    const found = SpreadsheetAdapter.find(
      this.TEST_SHEET,
      "id",
      "A001"
    );
    if (!found) {
      throw new Error("Adapter find failed");
    }

    SpreadsheetAdapter.update(
      this.TEST_SHEET,
      "id",
      "A001",
      { value: "updated" }
    );

    const updated = SpreadsheetAdapter.find(
      this.TEST_SHEET,
      "id",
      "A001"
    );
    if (updated.value !== "updated") {
      throw new Error("Adapter update failed");
    }

    return {
      status: "OK",
      health: health,
      record: updated
    };
  },

  // ============================================================
  // TEST DATABASE
  // ============================================================

  testDatabase() {
    Logger.log("===== TEST DATABASE =====");

    if (typeof Database === "undefined") {
      throw new Error("Database missing");
    }

    const created = Database.insert(
      this.TEST_ENTITY,
      {
        id: "DB001",
        value: "database",
        createdAt: new Date()
      }
    );

    if (!created) {
      throw new Error("Database insert failed");
    }

    const found = Database.find(this.TEST_ENTITY, "DB001");
    if (!found) {
      throw new Error("Database find failed");
    }

    const updated = Database.update(
      this.TEST_ENTITY,
      "DB001",
      { value: "db-updated" }
    );
    if (updated.value !== "db-updated") {
      throw new Error("Database update failed");
    }

    return {
      status: "OK",
      created: created,
      updated: updated
    };
  },

  // ============================================================
  // TEST REPOSITORY
  // ============================================================

  testRepository() {
    Logger.log("===== TEST REPOSITORY =====");

    if (typeof BaseRepository === "undefined") {
      throw new Error("BaseRepository missing");
    }

    const repo = Object.create(BaseRepository);
    repo.entity = this.TEST_ENTITY;

    repo.create(
      this.TEST_ENTITY,
      {
        id: "REP001",
        value: "repository",
        createdAt: new Date()
      }
    );

    const found = repo.findById(this.TEST_ENTITY, "REP001");
    if (!found) {
      throw new Error("Repository find failed");
    }

    repo.update(
      this.TEST_ENTITY,
      "REP001",
      { value: "repo-updated" }
    );

    const updated = repo.findById(this.TEST_ENTITY, "REP001");
    if (updated.value !== "repo-updated") {
      throw new Error("Repository update failed");
    }

    return {
      status: "OK",
      record: updated
    };
  },

  // ============================================================
  // TEST FULL CHAIN
  // ============================================================

  testChain() {
    Logger.log("===== TEST CHAIN =====");

    const record = Database.find(this.TEST_ENTITY, "REP001");
    if (!record) {
      throw new Error("Chain data missing");
    }

    const adapterRecord = SpreadsheetAdapter.find(
      this.TEST_SHEET,
      "id",
      "REP001"
    );
    if (!adapterRecord) {
      throw new Error("Chain Adapter persistence failed");
    }

    return {
      status: "OK",
      message: "SchemaRegistry → Database → SpreadsheetAdapter → Repository verified"
    };
  }
};

// ============================================================
// GLOBAL COMMANDS
// ============================================================

function runCoreInfrastructureTest() {
  return CoreInfrastructureTest.run();
}

function cleanupCoreTest() {
  return CoreInfrastructureTest.cleanupSafe();
}

globalThis.CoreInfrastructureTest = CoreInfrastructureTest;

Logger.log("CoreInfrastructureTest READY v" + CoreInfrastructureTest.version);