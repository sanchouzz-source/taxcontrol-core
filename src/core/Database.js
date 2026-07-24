console.log("Database");

const Database = {
  version: "2.8.0",
  status: "REGISTERED",
  initialized: false,
  lastError: null,

  // КЭШИ (оставляем свои, они не дублируют SchemaRegistry)
  _spreadsheet: null,
  _headerCache: {},      // имя листа → [заголовки]
  _headerMapCache: {},   // имя листа → { поле: индекс }
  _rowIndexCache: {},    // имя листа → { id: номер_строки (1-based) }
  _tableIndex: null,     // кеш для resolveTable, используем SchemaRegistry

  // СТАТИСТИКА
  _stats: {
    cacheHits: 0,
    cacheMisses: 0,
    spreadsheetOpened: 0,
    queries: 0,
    inserts: 0,
    updates: 0,
    rowIndexHits: 0,
    rowIndexMisses: 0,
    queryTime: 0,
    insertTime: 0,
    updateTime: 0,
  },

  // ----- ИНИЦИАЛИЗАЦИЯ (используем SchemaRegistry) -----
  init() {
    if (this.initialized) return;

    try {
      this.status = "INITIALIZING";
      // Заставляем SchemaRegistry инициализироваться (если ещё нет)
      if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.init) {
        SchemaRegistry.init();
      }
      // Строим свой индекс таблиц (можно использовать SchemaRegistry, но оставляем для скорости)
      this._buildTableIndex();
      this.initialized = true;
      this.status = "READY";
      Logger.log("Database READY v" + this.version);

      // Проверяем, что SchemaRegistry готов
      if (typeof SchemaRegistry !== "undefined") {
        if (SchemaRegistry.status === "WAITING_METADATA") {
          Logger.warn("Database: SchemaRegistry is waiting for EntityMetadata, some features may be limited");
        } else if (SchemaRegistry.status !== "READY") {
          Logger.warn("Database: SchemaRegistry not ready, status=" + SchemaRegistry.status);
        }
      } else {
        Logger.warn("Database: SchemaRegistry not found, using internal metadata only");
      }

      if (globalThis.EventBus && typeof EventBus.emit === "function") {
        EventBus.emit("DATABASE_READY", {
          version: this.version,
          status: this.status
        });
      }
    } catch (e) {
      this.status = "FAILED";
      this.lastError = e.message;
      Logger.error("Database INIT FAILED " + e.message);
      throw e;
    }
  },

  // ----- КЭШ SPREADSHEET -----
  spreadsheet() {
    if (!this._spreadsheet) {
      this._spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      this._stats.spreadsheetOpened++;
    }
    return this._spreadsheet;
  },

  sheet(name) {
    return this.spreadsheet().getSheetByName(name);
  },

  getSheetOrThrow(name) {
    const sheet = this.sheet(name);
    if (!sheet) throw new Error("Sheet not found: " + name);
    return sheet;
  },

  // ----- КЭШ ЗАГОЛОВКОВ И МАППИНГ -----
  _getHeadersAndMap(sheet) {
    const name = sheet.getName();
    if (this._headerCache[name]) {
      this._stats.cacheHits++;
      return {
        headers: this._headerCache[name],
        headerMap: this._headerMapCache[name]
      };
    }
    this._stats.cacheMisses++;
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headerMap = {};
    headers.forEach((h, i) => { headerMap[h] = i; });
    this._headerCache[name] = headers;
    this._headerMapCache[name] = headerMap;
    return { headers, headerMap };
  },

  // ----- ИНДЕКС ТАБЛИЦ (с использованием SchemaRegistry) -----
  _buildTableIndex() {
    this._tableIndex = {};
    // Пытаемся получить данные из SchemaRegistry
    if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.initialized) {
      // Можно получить все таблицы из SchemaRegistry
      const tables = SchemaRegistry.tableIndex || {};
      for (const [table, entity] of Object.entries(tables)) {
        const meta = SchemaRegistry.getByTable(table);
        if (meta) {
          this._tableIndex[table] = meta;
          this._tableIndex[entity] = meta;
        }
      }
    } else if (typeof EntityMetadata !== "undefined") {
      // fallback на EntityMetadata
      const entities = EntityMetadata.list
        ? EntityMetadata.list()
        : Object.keys(EntityMetadata).filter(k => EntityMetadata[k]?.table);
      for (const key of entities) {
        const meta = EntityMetadata.get
          ? EntityMetadata.get(key)
          : EntityMetadata[key];
        if (meta && meta.table) {
          this._tableIndex[meta.table] = meta;
          this._tableIndex[key] = meta;
        }
      }
    }
  },

  _getMetaByTable(tableName) {
    if (this._tableIndex && this._tableIndex[tableName]) {
      return this._tableIndex[tableName];
    }
    // fallback: SchemaRegistry
    if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.getByTable) {
      return SchemaRegistry.getByTable(tableName);
    }
    return null;
  },

  // ----- RESOLVE TABLE (использует SchemaRegistry) -----
  resolveTable(name) {
    if (this._tableIndex && this._tableIndex[name]) {
      const meta = this._tableIndex[name];
      if (meta.table) return meta.table;
    }
    // пробуем через SchemaRegistry
    if (typeof SchemaRegistry !== "undefined") {
      const meta = SchemaRegistry.getByTable(name) || SchemaRegistry.get(name);
      if (meta && meta.table) return meta.table;
    }
    return name;
  },

  getTable(entity) {
    const meta = this._getMetaByTable(entity) || (typeof SchemaRegistry?.get === "function" ? SchemaRegistry.get(entity) : null);
    if (!meta) throw new Error("Metadata missing for " + entity);
    return meta.table;
  },

  // ----- ОБНОВЛЕНИЕ ИНДЕКСА СТРОК -----
  _getRowIndex(sheetName) {
    if (!this._rowIndexCache[sheetName]) {
      const sheet = this.getSheetOrThrow(sheetName);
      const { headers, headerMap } = this._getHeadersAndMap(sheet);
      const idField = this._getIdField(sheetName, headers);
      if (!idField) throw new Error("ID field not found for " + sheetName);
      const idCol = headerMap[idField];
      if (idCol === undefined) throw new Error(`ID column '${idField}' not found in sheet ${sheetName}`);
      const values = sheet.getDataRange().getValues();
      const index = {};
      for (let i = 1; i < values.length; i++) {
        const idVal = values[i][idCol];
        if (idVal !== undefined && idVal !== null && idVal !== "") {
          index[String(idVal).trim()] = i + 1;
        }
      }
      this._rowIndexCache[sheetName] = index;
    }
    return this._rowIndexCache[sheetName];
  },

  refreshIndex(sheetName) {
    if (this._rowIndexCache[sheetName]) {
      delete this._rowIndexCache[sheetName];
      this._getRowIndex(sheetName);
    }
    return this._rowIndexCache[sheetName];
  },

  _getIdField(sheetName, headers) {
    // Сначала пробуем SchemaRegistry
    if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.getIdField) {
      try {
        return SchemaRegistry.getIdField(sheetName);
      } catch (e) {
        // не найдено
      }
    }
    let idField = null;
    if (globalThis.SchemaRegistry && typeof SchemaRegistry.getIdField === "function") {
      idField = SchemaRegistry.getIdField(sheetName);
    }
    if (!idField) {
      const meta = this._getMetaByTable(sheetName);
      if (meta && meta.id) idField = meta.id;
    }
    if (!idField) {
      for (const h of headers) {
        if (h.endsWith("ID") && h !== "OrganizationID") {
          idField = h;
          break;
        }
      }
    }
    return idField;
  },

  _invalidateRowIndex(sheetName) {
    if (this._rowIndexCache[sheetName]) {
      delete this._rowIndexCache[sheetName];
    }
  },

  _findRaw(sheetName, id) {
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);

    const rowIndex = this._getRowIndex(sheetName);
    const rowNum = rowIndex[String(id).trim()];
    if (rowNum) {
      const row = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j]; });
      return obj;
    } else {
      const values = sheet.getDataRange().getValues();
      const idField = this._getIdField(sheetName, headers);
      const idCol = headerMap[idField];
      if (idCol === undefined) return null;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idCol]).trim() === String(id).trim()) {
          const obj = {};
          headers.forEach((h, j) => { obj[h] = values[i][j]; });
          return obj;
        }
      }
      return null;
    }
  },

  clearCache(sheetName) {
    if (sheetName) {
      delete this._headerCache[sheetName];
      delete this._headerMapCache[sheetName];
      delete this._rowIndexCache[sheetName];
    } else {
      this._headerCache = {};
      this._headerMapCache = {};
      this._rowIndexCache = {};
    }
    Logger.log("Cache cleared" + (sheetName ? " for " + sheetName : ""));
  },

  invalidate(sheetName) {
    this.clearCache(sheetName);
  },

  refresh() {
    this.clearCache();
    this._buildTableIndex();
    Logger.log("Database refreshed");
  },

  // ============================================================
  // HELPER: ВЫЗОВ ХУКОВ ЧЕРЕЗ SchemaRegistry
  // ============================================================
  _runHooks(entity, hookName, context) {
    if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.runHooks) {
      try {
        SchemaRegistry.runHooks(entity, hookName, context);
      } catch (e) {
        Logger.error(`Hook ${hookName} for ${entity} failed: ${e.message}`);
        throw e;
      }
    }
  },

  // ============================================================
  // INSERT (с валидацией, уникальностью, связями, хуками)
  // ============================================================
  insert(sheetName, data) {
    this.init();
    const start = Date.now();
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const idField = this._getIdField(sheetName, headers);
    if (!idField) throw new Error("ID field undefined for " + sheetName);

    // ---- ВАЛИДАЦИЯ через SchemaRegistry ----
    if (typeof SchemaRegistry !== "undefined") {
      SchemaRegistry.validate(sheetName, data);
      // Уникальность
      const fields = SchemaRegistry.getFields(sheetName) || [];
      for (const field of fields) {
        if (field.unique && data[field.name] !== undefined && data[field.name] !== null) {
          SchemaRegistry.checkUnique(sheetName, field.name, data[field.name]);
        }
      }
      // Связи
      SchemaRegistry.validateRelations(sheetName, data);
      // Применить defaults
      data = SchemaRegistry.applyDefaults(sheetName, data);
    } else {
      // fallback-валидация (минимальная)
      if (!data[idField]) data[idField] = IdService.generate(sheetName);
      if (headers.includes("CreatedAt") && !data.CreatedAt) data.CreatedAt = new Date();
      if (headers.includes("UpdatedAt")) data.UpdatedAt = new Date();
      if (headers.includes("Deleted") && data.Deleted === undefined) data.Deleted = false;
    }

    // Заполняем системные поля (если не заполнены)
    if (!data[idField]) data[idField] = IdService.generate(sheetName);
    if (headers.includes("CreatedAt") && !data.CreatedAt) data.CreatedAt = new Date();
    if (headers.includes("UpdatedAt")) data.UpdatedAt = new Date();
    if (headers.includes("Deleted") && data.Deleted === undefined) data.Deleted = false;
    if (headers.includes("Version") && data.Version === undefined) data.Version = 1;

    // ---- BEFORE CREATE HOOK ----
    const entityName = SchemaRegistry.getEntityByTable ? SchemaRegistry.getEntityByTable(sheetName) : sheetName;
    this._runHooks(entityName, "beforeCreate", { data: data, sheet: sheetName });

    const row = headers.map(h => data[h] ?? "");
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);

    // Обновляем индекс
    const index = this._rowIndexCache[sheetName];
    if (index) {
      index[String(data[idField]).trim()] = lastRow + 1;
    }

    this._stats.inserts++;
    this._stats.insertTime += Date.now() - start;
    Logger.log("INSERT " + sheetName);

    // Аудит и событие
    this._writeAudit("INSERT", sheetName, data[idField], null, data);
    const eventName = (sheetName + "_CREATED").toUpperCase();
    this._emitEvent(eventName, data);

    // ---- AFTER CREATE HOOK ----
    this._runHooks(entityName, "afterCreate", { data: data, sheet: sheetName });

    return data;
  },

  // ----- BATCH INSERT (один setValues) -----
  insertMany(sheetName, dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    this.init();
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const idField = this._getIdField(sheetName, headers);
    if (!idField) throw new Error("ID field undefined for " + sheetName);

    // Валидация всех объектов
    for (const d of dataArray) {
      if (typeof SchemaRegistry !== "undefined") {
        SchemaRegistry.validate(sheetName, d);
        const fields = SchemaRegistry.getFields(sheetName) || [];
        for (const field of fields) {
          if (field.unique && d[field.name] !== undefined && d[field.name] !== null) {
            SchemaRegistry.checkUnique(sheetName, field.name, d[field.name]);
          }
        }
        SchemaRegistry.validateRelations(sheetName, d);
        d = SchemaRegistry.applyDefaults(sheetName, d);
      } else {
        if (!d[idField]) d[idField] = IdService.generate(sheetName);
        if (headers.includes("CreatedAt") && !d.CreatedAt) d.CreatedAt = new Date();
        if (headers.includes("UpdatedAt")) d.UpdatedAt = new Date();
        if (headers.includes("Deleted") && d.Deleted === undefined) d.Deleted = false;
      }
    }

    const rows = [];
    for (const data of dataArray) {
      if (!data[idField]) data[idField] = IdService.generate(sheetName);
      if (headers.includes("CreatedAt") && !data.CreatedAt) data.CreatedAt = new Date();
      if (headers.includes("UpdatedAt")) data.UpdatedAt = new Date();
      if (headers.includes("Deleted") && data.Deleted === undefined) data.Deleted = false;
      if (headers.includes("Version") && data.Version === undefined) data.Version = 1;
      const row = headers.map(h => data[h] ?? "");
      rows.push(row);
    }

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

    // Инвалидируем индекс
    this._invalidateRowIndex(sheetName);

    // Аудит и события
    dataArray.forEach((data, i) => {
      this._writeAudit("INSERT", sheetName, data[idField], null, data);
      const eventName = (sheetName + "_CREATED").toUpperCase();
      this._emitEvent(eventName, data);
    });

    this._stats.inserts += dataArray.length;
    Logger.log("BATCH INSERT " + sheetName + " rows=" + dataArray.length);
    return dataArray;
  },

  // ============================================================
  // FIND (без учёта Deleted)
  // ============================================================
  find(sheetName, id) {
    this.init();
    sheetName = this.resolveTable(sheetName);
    const obj = this._findRaw(sheetName, id);
    if (!obj) return null;
    if (obj.Deleted === true || obj.Deleted === "true") {
      return null;
    }
    return obj;
  },

  exists(sheetName, id) {
    return !!this.find(sheetName, id);
  },

  // ============================================================
  // QUERY (возвращает { data, total }, с сортировкой, offset, limit)
  // ============================================================
  query(sheetName, filters = {}, options = {}) {
    this.init();
    const start = Date.now();
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const values = sheet.getDataRange().getValues();

    const filterKeys = Object.keys(filters);
    const filterCols = {};
    const filterPredicates = {};
    for (const key of filterKeys) {
      const idx = headerMap[key];
      if (idx === undefined) continue;
      filterCols[key] = idx;
      const val = filters[key];
      if (val && typeof val === "object" && val.operator) {
        filterPredicates[key] = val;
      } else {
        filterPredicates[key] = { operator: "eq", value: val };
      }
    }
    const deletedCol = headerMap["Deleted"];

    const orderBy = options.orderBy || null;
    const direction = options.direction || "ASC";
    const limit = options.limit || 0;
    const offset = options.offset || 0;
    const includeDeleted = options.includeDeleted === true;

    const result = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!includeDeleted && deletedCol !== undefined) {
        const del = row[deletedCol];
        if (del === true || del === "true") continue;
      }
      let match = true;
      for (const key of filterKeys) {
        const col = filterCols[key];
        if (col === undefined) { match = false; break; }
        const pred = filterPredicates[key];
        const cell = row[col];
        if (pred.operator === "eq") {
          if (String(cell) !== String(pred.value)) { match = false; break; }
        } else if (pred.operator === "contains") {
          if (!String(cell).toLowerCase().includes(String(pred.value).toLowerCase())) { match = false; break; }
        } else if (pred.operator === "startsWith") {
          if (!String(cell).toLowerCase().startsWith(String(pred.value).toLowerCase())) { match = false; break; }
        } else if (pred.operator === "gt") {
          if (Number(cell) <= Number(pred.value)) { match = false; break; }
        } else if (pred.operator === "lt") {
          if (Number(cell) >= Number(pred.value)) { match = false; break; }
        } else {
          if (String(cell) !== String(pred.value)) { match = false; break; }
        }
      }
      if (!match) continue;

      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j]; });
      result.push(obj);
    }

    // Сортировка
    if (orderBy && headerMap[orderBy] !== undefined) {
      const idx = headerMap[orderBy];
      const dirFactor = direction === "DESC" ? -1 : 1;
      result.sort((a, b) => {
        const va = a[orderBy] !== undefined ? a[orderBy] : "";
        const vb = b[orderBy] !== undefined ? b[orderBy] : "";
        if (va < vb) return -dirFactor;
        if (va > vb) return dirFactor;
        return 0;
      });
    }

    const total = result.length;
    const sliced = result.slice(offset, limit ? offset + limit : undefined);

    this._stats.queries++;
    this._stats.queryTime += Date.now() - start;
    return {
      data: sliced,
      total: total
    };
  },

  // ----- queryPage -----
  queryPage(sheetName, filters = {}, page = 1, size = 50, options = {}) {
    const offset = (page - 1) * size;
    const result = this.query(sheetName, filters, { ...options, offset, limit: size });
    return {
      data: result.data,
      page: page,
      size: size,
      total: result.total,
      pages: Math.ceil(result.total / size)
    };
  },

  count(sheetName, filters = {}) {
    const result = this.query(sheetName, filters, { limit: 0 });
    return result.total;
  },

  // ============================================================
  // UPDATE (с частичной валидацией, уникальностью, связями, хуками)
  // ============================================================
  update(sheetName, id, data) {
    this.init();
    const start = Date.now();
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const idField = this._getIdField(sheetName, headers);
    if (!idField) throw new Error("ID field undefined for " + sheetName);

    // Запрет изменения ID
    if (data[idField] !== undefined && String(data[idField]) !== String(id)) {
      throw new Error("ID modification forbidden");
    }
    delete data[idField];

    // ---- ВАЛИДАЦИЯ через SchemaRegistry (partial) ----
    let entityName = sheetName;
    if (typeof SchemaRegistry !== "undefined") {
      SchemaRegistry.validate(sheetName, data, { partial: true });
      // Уникальность с исключением текущего id
      const fields = SchemaRegistry.getFields(sheetName) || [];
      for (const field of fields) {
        if (field.unique && data[field.name] !== undefined && data[field.name] !== null) {
          SchemaRegistry.checkUnique(sheetName, field.name, data[field.name], id);
        }
      }
      SchemaRegistry.validateRelations(sheetName, data);
      entityName = SchemaRegistry.getEntityByTable ? SchemaRegistry.getEntityByTable(sheetName) : sheetName;
    }

    const rowIndex = this._getRowIndex(sheetName);
    const rowNum = rowIndex[String(id).trim()];
    if (!rowNum) throw new Error("Record not found " + id);

    // Читаем старые данные
    const oldRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
    const oldData = {};
    headers.forEach((h, j) => { oldData[h] = oldRow[j]; });

    // ---- BEFORE UPDATE HOOK ----
    this._runHooks(entityName, "beforeUpdate", { oldData: oldData, newData: data, sheet: sheetName });

    // Применяем изменения
    const row = oldRow.slice();
    let changed = false;
    headers.forEach((h, j) => {
      if (data[h] !== undefined) {
        row[j] = data[h];
        changed = true;
      }
    });
    if (headers.includes("UpdatedAt")) {
      row[headerMap["UpdatedAt"]] = new Date();
      changed = true;
    }
    if (headers.includes("Version") && changed) {
      const oldVersion = oldData.Version || 0;
      row[headerMap["Version"]] = oldVersion + 1;
    }
    if (!changed) {
      return oldData;
    }
    sheet.getRange(rowNum, 1, 1, headers.length).setValues([row]);

    const updatedObj = {};
    headers.forEach((h, j) => { updatedObj[h] = row[j]; });
    this._stats.updates++;
    this._stats.updateTime += Date.now() - start;

    // Аудит и событие
    this._writeAudit("UPDATE", sheetName, id, oldData, updatedObj);
    const eventName = (sheetName + "_UPDATED").toUpperCase();
    this._emitEvent(eventName, updatedObj);

    // ---- AFTER UPDATE HOOK ----
    this._runHooks(entityName, "afterUpdate", { oldData: oldData, newData: updatedObj, sheet: sheetName });

    return updatedObj;
  },

  // ============================================================
  // SOFT DELETE (с хуками)
  // ============================================================
  softDelete(sheetName, id) {
    sheetName = this.resolveTable(sheetName);
    const record = this.find(sheetName, id);
    if (!record) throw new Error("Record not found for delete " + id);

    const entityName = SchemaRegistry.getEntityByTable ? SchemaRegistry.getEntityByTable(sheetName) : sheetName;
    // ---- BEFORE DELETE HOOK ----
    this._runHooks(entityName, "beforeDelete", { data: record, sheet: sheetName });

    // Проверка каскадных зависимостей (если есть в SchemaRegistry)
    if (typeof SchemaRegistry !== "undefined") {
      const relations = SchemaRegistry.getRelations(sheetName);
      if (relations) {
        for (const [field, config] of Object.entries(relations)) {
          if (config.cascade === true) {
            // Каскадное удаление – здесь можно реализовать
            // Например, найти все дочерние записи и удалить их
          }
        }
      }
    }

    const result = this.update(sheetName, id, {
      Deleted: true,
      UpdatedAt: new Date()
    });
    const eventName = (sheetName + "_DELETED").toUpperCase();
    this._emitEvent(eventName, result);

    // ---- AFTER DELETE HOOK ----
    this._runHooks(entityName, "afterDelete", { data: result, sheet: sheetName });

    return result;
  },

  // ============================================================
  // RESTORE (с хуками)
  // ============================================================
  restore(sheetName, id) {
    sheetName = this.resolveTable(sheetName);
    const record = this._findRaw(sheetName, id);
    if (!record) throw new Error("Cannot restore missing record " + id);
    if (record.Deleted === undefined || record.Deleted === false || record.Deleted === "false") {
      return record;
    }

    const entityName = SchemaRegistry.getEntityByTable ? SchemaRegistry.getEntityByTable(sheetName) : sheetName;
    // ---- BEFORE RESTORE HOOK ----
    this._runHooks(entityName, "beforeRestore", { data: record, sheet: sheetName });

    const result = this.update(sheetName, id, {
      Deleted: false,
      UpdatedAt: new Date()
    });
    const eventName = (sheetName + "_RESTORED").toUpperCase();
    this._emitEvent(eventName, result);

    // ---- AFTER RESTORE HOOK ----
    this._runHooks(entityName, "afterRestore", { data: result, sheet: sheetName });

    return result;
  },

  // ============================================================
  // HARD DELETE (с хуками)
  // ============================================================
  hardDelete(sheetName, id) {
    if (globalThis.SecurityGuard && typeof SecurityGuard.isAdmin === "function") {
      if (!SecurityGuard.isAdmin()) {
        throw new Error("Hard delete forbidden: admin only");
      }
    }
    sheetName = this.resolveTable(sheetName);
    const sheet = this.getSheetOrThrow(sheetName);
    const rowIndex = this._getRowIndex(sheetName);
    const rowNum = rowIndex[String(id).trim()];
    if (!rowNum) throw new Error("Record not found " + id);

    const entityName = SchemaRegistry.getEntityByTable ? SchemaRegistry.getEntityByTable(sheetName) : sheetName;
    this._runHooks(entityName, "beforeHardDelete", { id: id, sheet: sheetName });

    // Аудит
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const row = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
    const oldData = {};
    headers.forEach((h, j) => { oldData[h] = row[j]; });
    this._writeAudit("HARD_DELETE", sheetName, id, oldData, null);

    sheet.deleteRow(rowNum);
    this._invalidateRowIndex(sheetName);
    this._stats.updates++;
    Logger.warn("HARD DELETE " + sheetName + " " + id);

    this._runHooks(entityName, "afterHardDelete", { id: id, sheet: sheetName });
    return true;
  },

  // ============================================================
  // TRANSACTION (блокировка)
  // ============================================================
  transaction(callback) {
    let lock = null;
    try {
      if (typeof LockService !== "undefined") {
        lock = LockService.getDocumentLock();
        if (lock && typeof lock.waitLock === "function") {
          lock.waitLock(5000);
        }
      }
      const result = callback();
      Logger.log("Transaction completed successfully");
      return result;
    } catch (e) {
      Logger.error("Transaction failed: " + e.message);
      throw e;
    } finally {
      if (lock && typeof lock.releaseLock === "function") {
        lock.releaseLock();
      }
    }
  },

  // ============================================================
  // REPOSITORY CONTRACT COMPATIBILITY
  // ============================================================
  create(sheet, data) {
    return this.insert(sheet, data);
  },

  findById(sheet, id) {
    return this.find(sheet, id);
  },

  findAll(sheet, filters = {}) {
    const result = this.query(sheet, filters);
    return result.data;
  },

  delete(sheet, id) {
    return this.softDelete(sheet, id);
  },

  // restore уже есть

  // ----- ПАКЕТНЫЕ ОПЕРАЦИИ -----
  updateMany(sheetName, ids, data) {
    return ids.map(id => this.update(sheetName, id, data));
  },

  // ============================================================
  // CRUD EVENTS & AUDIT
  // ============================================================
  _emitEvent(eventName, data) {
    if (globalThis.EventBus && typeof EventBus.emit === "function") {
      EventBus.emit(eventName, data);
    }
  },

  _writeAudit(action, sheetName, id, oldData, newData) {
    if (globalThis.AuditLog && typeof AuditLog.write === "function") {
      try {
        AuditLog.write({
          action: action,
          entity: sheetName,
          entityId: id,
          before: oldData,
          after: newData,
          timestamp: new Date()
        });
      } catch (e) {
        Logger.warn("Audit write failed: " + e.message);
      }
    }
  },

  // ============================================================
  // СТАТИСТИКА
  // ============================================================
  getStats() {
    return { ...this._stats };
  },

  // ============================================================
  // ДИАГНОСТИКА
  // ============================================================
  diagnostics() {
    return {
      version: this.version,
      status: this.status,
      initialized: this.initialized,
      tables: this._tableIndex ? Object.keys(this._tableIndex).filter(k => this._tableIndex[k]?.table) : [],
      cache: {
        headers: Object.keys(this._headerCache).length,
        rowIndexes: Object.keys(this._rowIndexCache).length
      },
      stats: this.getStats(),
      error: this.lastError || null
    };
  },

  // ============================================================
  // МИГРАЦИИ (задел)
  // ============================================================
  getSchemaVersion() {
    if (typeof SchemaRegistry !== "undefined" && SchemaRegistry.getSchemaVersion) {
      // можно получить версию для конкретной сущности, но вернём общую
      return 1;
    }
    return 0;
  },

  // ============================================================
  // HEALTH
  // ============================================================
  health() {
    const status = this.status === "READY" ? "OK" : "WARNING";
    if (globalThis.HealthContract) {
      return HealthContract.create(
        "Database",
        status,
        {
          version: this.version,
          status: this.status,
          initialized: this.initialized,
          tables: this._tableIndex ? Object.keys(this._tableIndex).filter(k => this._tableIndex[k]?.table).length : 0,
          stats: this.getStats(),
          schemaRegistry: typeof SchemaRegistry !== "undefined" ? SchemaRegistry.status : "MISSING"
        }
      );
    }
    return {
      module: "Database",
      status: status,
      version: this.version,
      initialized: this.initialized,
      schemaRegistry: typeof SchemaRegistry !== "undefined" ? SchemaRegistry.status : "MISSING"
    };
  }
};

globalThis.Database = Database;
Logger.log("Database REGISTERED v" + Database.version);