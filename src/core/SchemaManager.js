console.log("SchemaManager");

const SchemaManager = {
  version: "0.5.0",
  initialized: false,

  init() {
    if (this.initialized) {
      Logger.log("SchemaManager ALREADY READY");
      return;
    }

    try {
      Logger.log("SCHEMA INIT START");

      const schema = this.getSchema();
      this.createSheets(schema);
      this.syncSheets(schema);

      Logger.log("METADATA SCHEMA BUILT: " + Object.keys(schema).length + " tables");

      this.initialized = true;
      Logger.log("SchemaManager READY v" + this.version);
    } catch (error) {
      Logger.log("SchemaManager ERROR: " + error.message);
      throw error;
    }
  },

  getColumns(definition) {
    if (Array.isArray(definition)) {
      return definition;
    }
    if (definition && Array.isArray(definition.columns)) {
      return definition.columns;
    }
    throw new Error("Invalid schema definition");
  },

  // ----- ИЗМЕНЕНО: getSchema теперь использует buildFromMetadata -----
  getSchema() {
    return this.buildFromMetadata();
  },

  // ----- ПОСТРОЕНИЕ СХЕМЫ ИЗ EntityMetadata -----
  buildFromMetadata() {
    const schema = {};
    if (typeof EntityMetadata === "undefined") {
      Logger.warn("EntityMetadata not available, cannot build schema from metadata");
      return schema;
    }

    const entities = EntityMetadata.list();
    entities.forEach(entity => {
      const meta = EntityMetadata.get(entity);
      if (!meta.table || !meta.fields) {
        return;
      }
      // Извлекаем имена полей
      const fieldNames = meta.fields.map(field => field.name);
      schema[meta.table] = fieldNames;
      Logger.log("SCHEMA FROM METADATA: " + entity + " -> " + meta.table);
    });

    return schema;
  },

  createSheets(schema) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(schema).forEach(sheetName => {
      const columns = this.getColumns(schema[sheetName]);
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
        Logger.log("CREATED SHEET " + sheetName);
      }
    });
  },

  syncSheets(schema) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(schema).forEach(sheetName => {
      const columns = this.getColumns(schema[sheetName]);
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      let lastColumn = sheet.getLastColumn();
      let headers = [];
      if (lastColumn > 0) {
        headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      }
      columns.forEach(column => {
        if (headers.indexOf(column) === -1) {
          lastColumn++;
          sheet.getRange(1, lastColumn).setValue(column);
          Logger.log("ADDED COLUMN " + column + " TO " + sheetName);
        }
      });
      sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setNumberFormat("@");
    });
  },

  health() {
    return HealthContract.create(
      "SchemaManager",
      this.initialized ? "OK" : "WARNING",
      {
        version: this.version,
        initialized: this.initialized,
        tables: Object.keys(this.getSchema())
      }
    );
  },

  reset() {
    this.initialized = false;
    Logger.log("SchemaManager RESET");
  }
};

globalThis.SchemaManager = SchemaManager;