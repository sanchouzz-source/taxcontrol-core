// ============================================================
// SchemaManager v3.0.1
// ERP Schema Synchronization Engine
// Compatible:
// EntityRegistry v2.x
// EntityMetadata v0.9+
// SchemaRegistry v3.x
// Database v3.x
// ============================================================

console.log("SchemaManager v3.0.1");

const SchemaManager = {
  version: "3.0.1",
  initialized: false,
  schema: {},

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) {
      Logger.debug("SchemaManager ALREADY READY");
      return;
    }

    try {
      Logger.log("SCHEMA INIT START");
      this.schema = this.buildSchema();
      this.createSheets(this.schema);
      this.syncSheets(this.schema);
      this.initialized = true;
      Logger.log(
        "SchemaManager READY v" +
          this.version +
          " TABLES=" +
          Object.keys(this.schema).length
      );
    } catch (e) {
      Logger.error("SchemaManager FAILED " + e.message);
      throw e;
    }
  },

  // ============================================================
  // SYNC (вызывается после регистрации новых сущностей)
  // ============================================================

  sync(schema) {
    try {
      if (!schema) {
        schema = this.getSchema();
      }
      this.syncSheets(schema);
      Logger.log("SchemaManager SYNC COMPLETE");
    } catch (e) {
      Logger.error("Schema sync failed " + e.message);
      throw e;
    }
  },

  // ============================================================
  // BUILD SCHEMA
  // PRIMARY SOURCE SchemaRegistry
  // FALLBACK EntityMetadata
  // ============================================================

  buildSchema() {
    const schema = {};

    // 1. SchemaRegistry
    if (
      typeof SchemaRegistry !== "undefined" &&
      typeof SchemaRegistry.list === "function"
    ) {
      const entities = SchemaRegistry.list();

      entities.forEach(entity => {
        let meta;
        try {
          meta = SchemaRegistry.get(entity);
        } catch (e) {
          Logger.warn("SchemaRegistry GET FAILED " + entity);
          return;
        }

        if (!meta) {
          Logger.warn("Schema missing metadata " + entity);
          return;
        }
        if (!meta.table) {
          Logger.warn("No table for entity " + entity);
          return;
        }

        const fields = this.extractFields(meta);
        if (fields.length) {
          schema[meta.table] = fields;
          Logger.log("SCHEMA " + entity + " -> " + meta.table);
        }
      });
    }

    // 2. fallback EntityMetadata
    if (
      Object.keys(schema).length === 0 &&
      typeof EntityMetadata !== "undefined"
    ) {
      Logger.warn("SchemaRegistry empty. Using EntityMetadata fallback");

      const entities = EntityMetadata.list();

      entities.forEach(entity => {
        // ----- ИСПРАВЛЕННАЯ ПРОВЕРКА -----
        const meta = EntityMetadata.get(entity);

        if (!meta || !meta.table || !meta.fields) {
          Logger.warn("Schema skip invalid metadata " + entity);
          return;
        }

        const fields = this.extractFields(meta);
        schema[meta.table] = fields;
      });
    }

    return schema;
  },

  // ============================================================
  // EXTRACT FIELDS
  // ============================================================

  extractFields(meta) {
    if (!meta) return [];

    if (Array.isArray(meta.fields)) {
      return meta.fields
        .map(f => (typeof f === "string" ? f : f.name))
        .filter(Boolean);
    }

    if (Array.isArray(meta.columns)) {
      return meta.columns;
    }

    return [];
  },

  // ============================================================
  // CREATE SHEETS
  // ============================================================

  createSheets(schema) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    Object.keys(schema).forEach(sheetName => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        const columns = schema[sheetName];
        sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
        Logger.log("CREATED SHEET " + sheetName);
      }
    });
  },

  // ============================================================
  // SYNC HEADERS
  // ============================================================

  syncSheets(schema) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    Object.entries(schema).forEach(([sheetName, columns]) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;

      let last = sheet.getLastColumn();
      let headers = [];

      if (last > 0) {
        headers = sheet.getRange(1, 1, 1, last).getValues()[0];
      }

      columns.forEach(column => {
        if (headers.indexOf(column) === -1) {
          last++;
          sheet.getRange(1, last).setValue(column);
          Logger.log("ADDED COLUMN " + column + " TO " + sheetName);
        }
      });
    });
  },

  // ============================================================
  // GET SCHEMA
  // ============================================================

  getSchema() {
    return this.schema;
  },

  getTables() {
    return Object.keys(this.schema);
  },

  // ============================================================
  // VALIDATE
  // ============================================================

  validate() {
    const errors = [];
    Object.entries(this.schema).forEach(([table, fields]) => {
      if (!fields.length) {
        errors.push("No fields " + table);
      }
    });
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    this.initialized = false;
    this.schema = {};
    Logger.log("SchemaManager RESET");
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    return HealthContract.create(
      "SchemaManager",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        initialized: this.initialized,
        tables: this.getTables(),
        count: this.getTables().length
      }
    );
  }
};

globalThis.SchemaManager = SchemaManager;
Logger.log("SchemaManager REGISTERED v" + SchemaManager.version);