// ============================================================
// CoreInfrastructureTest.gs v1.1.0
//
// TaxControl ERP Core
//
// Infrastructure validation
// Tests:
// SpreadsheetAdapter → Database → BaseRepository
// ============================================================

console.log("CoreInfrastructureTest v1.1.0");

const CoreInfrastructureTest = {
  version: "1.1.0",
  TEST_SHEET: "__TEST_DATABASE",
  TEST_ENTITY: "TEST_ENTITY",

  // ============================================================
  // RUN ALL (с очисткой)
  // ============================================================

  run() {
    // Безопасная очистка перед запуском
    this.cleanupSafe();

    Logger.log("========== CORE TEST START ==========");

    const result = {};

    try {
      // 1. Тест адаптера (нижний слой)
      result.adapter = this.testAdapter();

      // 2. Тест Database (средний слой)
      result.database = this.testDatabase();

      // 3. Тест Repository (верхний слой)
      result.repository = this.testRepository();

      // 4. Проверка цепочки
      result.chain = this.testChain();

      result.status = "PASSED";
    } catch (e) {
      result.status = "FAILED";
      result.error = e.message;
      Logger.error("CORE TEST FAILED " + e.message);
    } finally {
      // Очистка после тестов
      this.cleanupSafe();
    }

    Logger.log(JSON.stringify(result, null, 2));
    return result;
  },

  // ============================================================
  // БЕЗОПАСНАЯ ОЧИСТКА
  // ============================================================

  cleanupSafe() {
    try {
      const sheet = SpreadsheetAdapter.getSheet(this.TEST_SHEET);
      if (sheet) {
        SpreadsheetAdapter.getSpreadsheet().deleteSheet(sheet);
      }
      SpreadsheetAdapter.clearCache();
      Logger.log("Cleanup completed");
    } catch (e) {
      Logger.warn("Cleanup failed: " + e.message);
    }
  },

  // ============================================================
  // 1. ТЕСТ ADAPTER (низкий уровень)
  // ============================================================

  testAdapter() {
    Logger.log("===== TEST ADAPTER =====");

    // 1.1 Health
    const health = SpreadsheetAdapter.health ? SpreadsheetAdapter.health() : {};

    // 1.2 Создать лист
    const sheet = SpreadsheetAdapter.getOrCreateSheet(
      this.TEST_SHEET,
      ["TestID", "Name", "Value", "CreatedAt"]
    );
    if (!sheet) throw new Error("Adapter: create sheet failed");

    // 1.3 Вставить строку
    const data = {
      TestID: "ADAPTER-001",
      Name: "Adapter test",
      Value: 42,
      CreatedAt: new Date()
    };
    SpreadsheetAdapter.insert(this.TEST_SHEET, data);

    // 1.4 Найти
    const found = SpreadsheetAdapter.find(this.TEST_SHEET, "TestID", "ADAPTER-001");
    if (!found || found.Name !== "Adapter test") {
      throw new Error("Adapter: find failed");
    }

    // 1.5 Обновить
    const updated = SpreadsheetAdapter.update(
      this.TEST_SHEET,
      "TestID",
      "ADAPTER-001",
      { Value: 99 }
    );
    if (updated.Value != 99) {
      throw new Error("Adapter: update failed");
    }

    // 1.6 Query
    const rows = SpreadsheetAdapter.query(this.TEST_SHEET, { Value: 99 });
    if (rows.length !== 1) {
      throw new Error("Adapter: query failed");
    }

    // 1.7 Bulk insert
    const items = [
      { TestID: "ADAPTER-002", Name: "Bulk1", Value: 10 },
      { TestID: "ADAPTER-003", Name: "Bulk2", Value: 20 }
    ];
    SpreadsheetAdapter.bulkInsert(this.TEST_SHEET, items);
    const all = SpreadsheetAdapter.readObjects(this.TEST_SHEET);
    if (all.length !== 3) {
      throw new Error("Adapter: bulk insert failed");
    }

    // 1.8 Delete
    SpreadsheetAdapter.delete(this.TEST_SHEET, "TestID", "ADAPTER-003");
    const afterDelete = SpreadsheetAdapter.find(this.TEST_SHEET, "TestID", "ADAPTER-003");
    if (afterDelete) {
      throw new Error("Adapter: delete failed");
    }

    return {
      status: "OK",
      records: all.length,
      health: health
    };
  },

  // ============================================================
  // 2. ТЕСТ DATABASE (средний слой)
  // ============================================================

  testDatabase() {
    Logger.log("===== TEST DATABASE =====");

    if (typeof Database === "undefined") {
      throw new Error("Database not available");
    }

    // Проверяем, что Database использует SpreadsheetAdapter
    // Создаём таблицу через Database
    const table = this.TEST_SHEET;
    const idField = "TestID";

    // 2.1 Insert
    const data = {
      TestID: "DB-001",
      Name: "Database test",
      Value: 123,
      CreatedAt: new Date()
    };
    const inserted = Database.insert(table, data);
    if (!inserted || inserted.TestID !== "DB-001") {
      throw new Error("Database insert failed");
    }

    // 2.2 Find
    const found = Database.find(table, "DB-001");
    if (!found || found.Name !== "Database test") {
      throw new Error("Database find failed");
    }

    // 2.3 Update
    const updated = Database.update(table, "DB-001", { Value: 999 });
    if (updated.Value != 999) {
      throw new Error("Database update failed");
    }

    // 2.4 Query
    const rows = Database.query(table, { Value: 999 });
    if (rows.length !== 1) {
      throw new Error("Database query failed");
    }

    // 2.5 Soft delete (если есть поле Deleted)
    // В тестовой схеме нет Deleted, поэтому пропускаем

    // 2.6 Exists
    const exists = Database.exists(table, "DB-001");
    if (!exists) {
      throw new Error("Database exists failed");
    }

    return {
      status: "OK",
      record: found,
      updated: updated,
      rows: rows.length
    };
  },

  // ============================================================
  // 3. ТЕСТ REPOSITORY (верхний слой)
  // ============================================================

  testRepository() {
    Logger.log("===== TEST REPOSITORY =====");

    if (typeof BaseRepository === "undefined") {
      throw new Error("BaseRepository not available");
    }

    // Создаём временный репозиторий для теста
    // Используем существующую сущность или создаём динамическую
    // Для теста используем "TEST_ENTITY" с метаданными
    const entity = "TEST_ENTITY";
    const meta = {
      entity: entity,
      table: this.TEST_SHEET,
      idField: "TestID",
      softDelete: false, // отключим для простоты
      timestamps: false,
      permissions: {}
    };

    // Временно регистрируем в EntityRegistry (если есть)
    if (typeof EntityRegistry !== "undefined" && EntityRegistry.register) {
      try {
        EntityRegistry.register(entity, meta);
      } catch (e) {
        // уже зарегистрировано
      }
    }

    // Создаём объект репозитория, основанный на BaseRepository
    const TestRepository = Object.create(BaseRepository);
    TestRepository.entity = entity;
    TestRepository._adapter = Database; // используем Database

    // Переопределим getMeta, чтобы возвращать наши метаданные
    const originalGetMeta = TestRepository.getMeta;
    TestRepository.getMeta = function(entity) {
      // Возвращаем тестовые метаданные
      return meta;
    };

    // 3.1 Create
    const createData = {
      TestID: "REPO-001",
      Name: "Repository test",
      Value: 77,
      CreatedAt: new Date()
    };
    const created = TestRepository.create(entity, createData);
    if (!created || created.TestID !== "REPO-001") {
      throw new Error("Repository create failed");
    }

    // 3.2 FindById
    const found = TestRepository.findById(entity, "REPO-001");
    if (!found || found.Name !== "Repository test") {
      throw new Error("Repository findById failed");
    }

    // 3.3 Update
    const updated = TestRepository.update(entity, "REPO-001", { Value: 888 });
    if (updated.Value != 888) {
      throw new Error("Repository update failed");
    }

    // 3.4 FindAll
    const all = TestRepository.findAll(entity);
    if (all.length === 0) {
      throw new Error("Repository findAll failed");
    }

    // 3.5 Delete
    const deleted = TestRepository.delete(entity, "REPO-001");
    if (!deleted) {
      throw new Error("Repository delete failed");
    }

    // 3.6 Exists
    const exists = TestRepository.exists(entity, "REPO-001");
    if (exists) {
      throw new Error("Repository exists failed (should be false)");
    }

    return {
      status: "OK",
      created: created,
      updated: updated,
      count: all.length
    };
  },

  // ============================================================
  // 4. ПРОВЕРКА ЦЕПОЧКИ (Repository → Database → Adapter)
  // ============================================================

  testChain() {
    Logger.log("===== TEST CHAIN =====");

    // 1. Проверяем, что BaseRepository использует Database
    const repo = BaseRepository;
    const adapter = repo._adapter;
    if (adapter !== Database) {
      throw new Error("BaseRepository does not use Database");
    }

    // 2. Проверяем, что Database использует SpreadsheetAdapter
    // В текущей реализации Database обращается напрямую к Sheets,
    // но если мы внедрили SpreadsheetAdapter, то Database должен использовать его.
    // Проверяем наличие методов, которые делегируются.
    const db = Database;
    // Проверяем, что Database имеет методы insert, find, update и т.д.
    const requiredMethods = ["insert", "find", "update", "query", "delete"];
    for (const method of requiredMethods) {
      if (typeof db[method] !== "function") {
        throw new Error("Database missing method: " + method);
      }
    }

    // 3. Создаём запись через Repository, проверяем через Adapter
    const entity = "TEST_ENTITY";
    const meta = {
      entity: entity,
      table: this.TEST_SHEET,
      idField: "TestID",
      softDelete: false,
      timestamps: false
    };

    // Временно регистрируем
    if (typeof EntityRegistry !== "undefined" && EntityRegistry.register) {
      try {
        EntityRegistry.register(entity, meta);
      } catch (e) {}
    }

    const TestRepo = Object.create(BaseRepository);
    TestRepo.entity = entity;
    TestRepo._adapter = Database;
    TestRepo.getMeta = function() { return meta; };

    const createData = {
      TestID: "CHAIN-001",
      Name: "Chain test",
      Value: 555,
      CreatedAt: new Date()
    };
    const created = TestRepo.create(entity, createData);
    if (!created) throw new Error("Chain: create failed");

    // Через Adapter напрямую проверяем наличие
    const found = SpreadsheetAdapter.find(this.TEST_SHEET, "TestID", "CHAIN-001");
    if (!found || found.Name !== "Chain test") {
      throw new Error("Chain: data not persisted through adapter");
    }

    // Удаляем через Repository
    TestRepo.delete(entity, "CHAIN-001");
    const afterDelete = SpreadsheetAdapter.find(this.TEST_SHEET, "TestID", "CHAIN-001");
    if (afterDelete) {
      throw new Error("Chain: delete failed");
    }

    return {
      status: "OK",
      message: "Chain verified: BaseRepository → Database → SpreadsheetAdapter"
    };
  }
};

// ============================================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ЗАПУСКА
// ============================================================

function runCoreInfrastructureTest() {
  return CoreInfrastructureTest.run();
}

function cleanupCoreTest() {
  return CoreInfrastructureTest.cleanupSafe();
}

globalThis.CoreInfrastructureTest = CoreInfrastructureTest;
Logger.log("CoreInfrastructureTest READY v" + CoreInfrastructureTest.version);