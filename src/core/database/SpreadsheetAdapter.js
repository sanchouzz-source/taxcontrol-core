// ============================================================
// SpreadsheetAdapter.gs v4.2.0
// TaxControl ERP Core
//
// Infrastructure Storage Adapter
//
// Architecture:
//
// Repository
//      |
// Database
//      |
// SpreadsheetAdapter
//      |
// Google Sheets
//
// Responsibility:
// - Spreadsheet persistence
// - CRUD
// - Bulk operations
// - Indexing
// - Cache
// - Transactions
// - Auto-headers creation
//
// NOT responsible:
// - Business logic
// - Permissions
// - Validation
// - Audit
// - Events
// ============================================================

console.log("SpreadsheetAdapter v4.2.0");

const SpreadsheetAdapter = {
  version: "4.2.0",
  architecture: "StorageAdapter -> GoogleSheets",
  initialized: false,

  _spreadsheet: null,
  _sheetCache: {},
  _sheetCacheTime: {},
  _headerCache: {},
  _headerCacheTime: {},
  _indexCache: {},
  _cacheTTL: 300000,

  _stats: {
    insert: 0,
    find: 0,
    query: 0,
    update: 0,
    delete: 0,
    bulkInsert: 0,
    appendObject: 0,
    appendObjects: 0,
    cacheHit: 0,
    cacheMiss: 0
  },

  _protectedSheets: [
    "_SchemaVersions",
    "_SchemaHistory",
    "_SchemaFields",
    "_SchemaTables",
    "_SchemaIndexes",
    "_SchemaMigrations",
    "_MigrationLock"
  ],

  // ============================================================
  // INIT
  // ============================================================

  init() {
    if (this.initialized) return;
    this.getSpreadsheet();
    this.initialized = true;
    Logger.log("SpreadsheetAdapter READY v" + this.version);
  },

  _require() {
    if (!this.initialized) this.init();
  },

  // ============================================================
  // CONNECTION
  // ============================================================

  getSpreadsheet() {
    if (this._spreadsheet) return this._spreadsheet;

    try {
      const props = PropertiesService.getScriptProperties();
      const id = props.getProperty("SPREADSHEET_ID");
      if (id) {
        this._spreadsheet = SpreadsheetApp.openById(id);
      } else {
        this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      }
    } catch (e) {
      throw new Error("Spreadsheet connection failed: " + e.message);
    }

    if (!this._spreadsheet) {
      throw new Error("Spreadsheet not configured");
    }
    return this._spreadsheet;
  },

  // ============================================================
  // SHEET MANAGEMENT
  // ============================================================

  getSheet(name) {
    const now = Date.now();
    if (this._sheetCache[name] && now - this._sheetCacheTime[name] < this._cacheTTL) {
      this._stats.cacheHit++;
      return this._sheetCache[name];
    }
    this._stats.cacheMiss++;
    const sheet = this.getSpreadsheet().getSheetByName(name);
    if (sheet) {
      this._sheetCache[name] = sheet;
      this._sheetCacheTime[name] = now;
    }
    return sheet;
  },

  getOrCreateSheet(name, headers = []) {
    let sheet = this.getSheet(name);
    if (!sheet) {
      sheet = this.getSpreadsheet().insertSheet(name);
      if (headers.length) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        // кешируем заголовки
        this._headerCache[name] = headers;
        this._headerCacheTime[name] = Date.now();
      }
      this.cacheSheet(sheet);
    }
    return sheet;
  },

  cacheSheet(sheet) {
    const name = sheet.getName();
    this._sheetCache[name] = sheet;
    this._sheetCacheTime[name] = Date.now();
  },

  exists(name) {
    return !!this.getSheet(name);
  },

  deleteSheet(name) {
    if (this._protectedSheets.includes(name)) {
      throw new Error("Protected sheet cannot be deleted: " + name);
    }
    const sheet = this.getSheet(name);
    if (sheet) {
      this.getSpreadsheet().deleteSheet(sheet);
      delete this._sheetCache[name];
      delete this._sheetCacheTime[name];
      delete this._headerCache[name];
      delete this._headerCacheTime[name];
    }
  },

  // ============================================================
  // HEADERS CACHE
  // ============================================================

  getHeaders(sheet) {
    const name = sheet.getName();
    const now = Date.now();
    if (this._headerCache[name] && now - this._headerCacheTime[name] < this._cacheTTL) {
      return this._headerCache[name];
    }

    const columns = sheet.getLastColumn();
    if (!columns) return [];

    const headers = sheet.getRange(1, 1, 1, columns).getValues()[0];
    this._headerCache[name] = headers;
    this._headerCacheTime[name] = now;
    return headers;
  },

  getHeaderMap(sheet) {
    const headers = this.getHeaders(sheet);
    const map = {};
    headers.forEach((h, i) => { map[h] = i; });
    return map;
  },

  // ============================================================
  // SET HEADERS (внутренний)
  // ============================================================

  _setHeaders(sheet, headers) {
    const name = sheet.getName();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    // обновляем кеш
    this._headerCache[name] = headers;
    this._headerCacheTime[name] = Date.now();
  },

  // ============================================================
  // OBJECT CONVERSION
  // ============================================================

  rowToObject(headers, row) {
    const obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i];
    });
    return obj;
  },

  objectToRow(headers, obj) {
    return headers.map(h => obj[h] ?? "");
  },

  // ============================================================
  // READ
  // ============================================================

  readObjects(sheetName) {
    const sheet = this.getSheet(sheetName);
    if (!sheet) return [];
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    const headers = values[0];
    return values.slice(1).map(row => this.rowToObject(headers, row));
  },

  // ============================================================
  // INSERT (с автоматическим созданием заголовков)
  // ============================================================

  insert(sheetName, data) {
    this._require();

    const sheet = this.getOrCreateSheet(sheetName);
    let headers = this.getHeaders(sheet);

    // Если заголовков нет – создаём из ключей данных
    if (!headers || headers.length === 0) {
      const keys = Object.keys(data);
      if (keys.length === 0) {
        throw new Error("SpreadsheetAdapter.insert: empty data");
      }
      this._setHeaders(sheet, keys);
      headers = keys;
    }

    const row = headers.map(h => data[h] ?? "");
    if (row.length === 0) {
      throw new Error("SpreadsheetAdapter.insert: generated empty row");
    }

    sheet.appendRow(row);
    this.invalidateIndexes(sheetName);
    this._stats.insert++;

    return data;
  },

  // ============================================================
  // DATABASE COMPATIBILITY: appendObject
  // ============================================================

  appendObject(sheetName, data) {
    this._stats.appendObject++;
    return this.insert(sheetName, data);
  },

  // ============================================================
  // BULK INSERT
  // ============================================================

  bulkInsert(sheetName, objects) {
    if (!objects || !objects.length) return [];

    const sheet = this.getOrCreateSheet(sheetName);
    let headers = this.getHeaders(sheet);

    // Если заголовков нет – создаём из ключей первого объекта
    if (!headers || headers.length === 0) {
      const keys = Object.keys(objects[0]);
      if (keys.length === 0) {
        throw new Error("SpreadsheetAdapter.bulkInsert: empty data");
      }
      this._setHeaders(sheet, keys);
      headers = keys;
    }

    const rows = objects.map(obj => this.objectToRow(headers, obj));
    const start = this.getLastDataRow(sheet) + 1;
    sheet.getRange(start, 1, rows.length, headers.length).setValues(rows);

    this.invalidateIndexes(sheetName);
    this._stats.bulkInsert += objects.length;

    return objects;
  },

  // ============================================================
  // DATABASE COMPATIBILITY: appendObjects
  // ============================================================

  appendObjects(sheetName, objects) {
    this._stats.appendObjects++;
    return this.bulkInsert(sheetName, objects);
  },

  // ============================================================
  // FIND
  // ============================================================

  find(sheetName, idField, id) {
    const row = this.findRow(sheetName, idField, id);
    if (!row) return null;
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheet);
    const values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
    this._stats.find++;
    return this.rowToObject(headers, values);
  },

  // ============================================================
  // DATABASE COMPATIBILITY: findById
  // ============================================================

  findById(sheetName, idField, id) {
    return this.find(sheetName, idField, id);
  },

  // ============================================================
  // FIND ROW INDEX
  // ============================================================

  findRow(sheetName, field, value) {
    const index = this.getIndex(sheetName, field);
    return index[String(value)] || null;
  },

  // ============================================================
  // QUERY
  // ============================================================

  query(sheetName, filters = {}) {
    const rows = this.readObjects(sheetName);
    const result = rows.filter(row => {
      return Object.keys(filters).every(key =>
        String(row[key]) === String(filters[key])
      );
    });
    this._stats.query++;
    return result;
  },

  // ============================================================
  // UPDATE
  // ============================================================

  update(sheetName, idField, id, data) {
    const row = this.findRow(sheetName, idField, id);
    if (!row) throw new Error("Record not found: " + id);

    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheet);
    const currentRow = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
    const current = this.rowToObject(headers, currentRow);

    const updated = { ...current, ...data };
    sheet.getRange(row, 1, 1, headers.length).setValues([
      this.objectToRow(headers, updated)
    ]);

    this.invalidateIndexes(sheetName);
    this._stats.update++;
    return updated;
  },

  // ============================================================
  // DATABASE COMPATIBILITY: updateById
  // ============================================================

  updateById(sheetName, idField, id, data) {
    return this.update(sheetName, idField, id, data);
  },

  // ============================================================
  // DELETE
  // ============================================================

  delete(sheetName, idField, id) {
    const row = this.findRow(sheetName, idField, id);
    if (!row) return false;
    this.getSheet(sheetName).deleteRow(row);
    this.invalidateIndexes(sheetName);
    this._stats.delete++;
    return true;
  },

  // ============================================================
  // DATABASE COMPATIBILITY: deleteById
  // ============================================================

  deleteById(sheetName, idField, id) {
    return this.delete(sheetName, idField, id);
  },

  // ============================================================
  // INDEX ENGINE
  // ============================================================

  getIndex(sheetName, field) {
    const key = sheetName + "|" + field;
    if (this._indexCache[key]) return this._indexCache[key];

    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheet);
    const col = headers.indexOf(field);
    if (col === -1) throw new Error("Index field missing: " + field);

    const values = sheet.getDataRange().getValues();
    const index = {};
    for (let i = 1; i < values.length; i++) {
      const value = values[i][col];
      if (value !== "" && value !== null && value !== undefined) {
        index[String(value)] = i + 1;
      }
    }
    this._indexCache[key] = index;
    return index;
  },

  invalidateIndexes(sheetName) {
    Object.keys(this._indexCache).forEach(key => {
      if (key.startsWith(sheetName + "|")) {
        delete this._indexCache[key];
      }
    });
  },

  // ============================================================
  // TRANSACTION
  // ============================================================

  transaction(callback) {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      return callback();
    } finally {
      lock.releaseLock();
    }
  },

  // ============================================================
  // BATCH
  // ============================================================

  beginBatch() {
    this._batchMode = true;
    this._batchQueue = [];
  },

  queue(operation) {
    if (this._batchMode) {
      this._batchQueue.push(operation);
    } else {
      operation();
    }
  },

  commit() {
    this._batchQueue.forEach(operation => operation());
    this._batchQueue = [];
    this._batchMode = false;
  },

  rollback() {
    this._batchQueue = [];
    this._batchMode = false;
  },

  // ============================================================
  // UTILITY
  // ============================================================

  getLastDataRow(sheet) {
    const last = sheet.getLastRow();
    if (last === 0) return 1;
    const values = sheet.getRange(1, 1, last, 1).getValues();
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i][0] !== "") return i + 1;
    }
    return 1;
  },

  // ============================================================
  // CACHE
  // ============================================================

  clearCache() {
    this._spreadsheet = null;
    this._sheetCache = {};
    this._sheetCacheTime = {};
    this._headerCache = {};
    this._headerCacheTime = {};
    this._indexCache = {};
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  health() {
    const data = {
      version: this.version,
      architecture: this.architecture,
      initialized: this.initialized,
      stats: this._stats
    };
    if (typeof HealthContract !== "undefined") {
      return HealthContract.create("SpreadsheetAdapter", "OK", data);
    }
    return {
      module: "SpreadsheetAdapter",
      status: "OK",
      ...data
    };
  },

  diagnostics() {
    return this.health();
  }
};

// ============================================================
// REGISTER
// ============================================================

globalThis.SpreadsheetAdapter = SpreadsheetAdapter;
Logger.log("SpreadsheetAdapter REGISTERED v" + SpreadsheetAdapter.version);