console.log("Database");

const Database = {
  version: "2.2.0",
  initialized: false,

  // КЭШИ
  _spreadsheet: null,
  _headerCache: {},      // имя листа → [заголовки]
  _headerMapCache: {},   // имя листа → { поле: индекс }
  _rowIndexCache: {},    // имя листа → { id: номер_строки (0-based? лучше 1-based, но храним 1-based для getRange) }
  _tableIndex: null,

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
  },

  // ----- ИНИЦИАЛИЗАЦИЯ -----
  init() {
    if (this.initialized) return;
    this._buildTableIndex();
    this.initialized = true;
    Logger.log("Database READY v" + this.version);
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

  // ----- ИНДЕКС ТАБЛИЦ -----
  _buildTableIndex() {
    this._tableIndex = {};
    if (typeof EntityMetadata === "undefined") return;
    const entities = EntityMetadata.list ? EntityMetadata.list() : Object.keys(EntityMetadata);
    for (const key of entities) {
      const meta = EntityMetadata[key];
      if (meta && meta.table) {
        this._tableIndex[meta.table] = meta;
      }
    }
  },

  _getMetaByTable(tableName) {
    if (this._tableIndex && this._tableIndex[tableName]) {
      return this._tableIndex[tableName];
    }
    // fallback
    if (typeof EntityMetadata !== "undefined") {
      for (const key in EntityMetadata) {
        const meta = EntityMetadata[key];
        if (meta && meta.table === tableName) return meta;
      }
    }
    return null;
  },

  // ----- ОБНОВЛЕНИЕ ИНДЕКСА СТРОК -----
  _getRowIndex(sheetName) {
    if (!this._rowIndexCache[sheetName]) {
      // Строим индекс при первом обращении
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
          // Сохраняем номер строки (1-based, т.к. getRange использует 1-based)
          index[String(idVal).trim()] = i + 1; // i - это индекс массива, строка в таблице = i+1
        }
      }
      this._rowIndexCache[sheetName] = index;
    }
    return this._rowIndexCache[sheetName];
  },

  _getIdField(sheetName, headers) {
    let idField = SchemaRegistry.getIdField(sheetName);
    if (!idField) {
      const meta = this._getMetaByTable(sheetName);
      if (meta && meta.id) idField = meta.id;
    }
    if (!idField) {
      // Поиск по заголовкам: ищем поле, оканчивающееся на "ID"
      for (const h of headers) {
        if (h.endsWith("ID") && h !== "OrganizationID") {
          idField = h;
          break;
        }
      }
    }
    return idField;
  },

  // ----- ОБНОВЛЕНИЕ ИНДЕКСА ПОСЛЕ ИЗМЕНЕНИЙ -----
  _invalidateRowIndex(sheetName) {
    if (this._rowIndexCache[sheetName]) {
      delete this._rowIndexCache[sheetName];
    }
  },

  // ----- ОЧИСТКА КЭША -----
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

  // ----- ВСТАВКА -----
  insert(sheetName, data) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const idField = this._getIdField(sheetName, headers);
    if (!data[idField]) {
      data[idField] = IdService.generate(sheetName);
    }
    // Заполняем системные поля
    if (headers.includes("CreatedAt") && !data.CreatedAt) {
      data.CreatedAt = new Date();
    }
    if (headers.includes("UpdatedAt")) {
      data.UpdatedAt = new Date();
    }
    if (headers.includes("Deleted") && data.Deleted === undefined) {
      data.Deleted = false;
    }

    // Строим строку по порядку заголовков
    const row = headers.map(h => data[h] ?? "");
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);

    // Обновляем индекс строк (добавляем новую запись)
    const idVal = data[idField];
    if (idVal) {
      const index = this._getRowIndex(sheetName);
      index[String(idVal).trim()] = lastRow + 1;
    }

    this._stats.inserts++;
    Logger.log("INSERT " + sheetName);
    return data;
  },

  // ----- ПОИСК (использует индекс строк) -----
  find(sheetName, id) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);

    const rowIndex = this._getRowIndex(sheetName);
    const rowNum = rowIndex[String(id).trim()];
    if (rowNum) {
      this._stats.rowIndexHits++;
      const row = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j]; });
      return obj;
    } else {
      this._stats.rowIndexMisses++;
      // Если не нашли в индексе – линейный поиск (на случай рассинхрона)
      const values = sheet.getDataRange().getValues();
      const idField = this._getIdField(sheetName, headers);
      const idCol = headerMap[idField];
      if (idCol === undefined) throw new Error(`ID column '${idField}' not found`);
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

  exists(sheetName, id) {
    return !!this.find(sheetName, id);
  },

  // ----- ОПТИМИЗИРОВАННЫЙ QUERY (с headerMap) -----
  query(sheetName, filters = {}) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);
    const values = sheet.getDataRange().getValues();

    const filterKeys = Object.keys(filters);
    // Предварительно получаем индексы колонок для фильтров
    const filterCols = {};
    for (const key of filterKeys) {
      const idx = headerMap[key];
      if (idx === undefined) {
        // Если колонки нет в заголовках, фильтр всегда false
        // но мы можем просто игнорировать такой фильтр
        // Для упрощения – пропускаем
        continue;
      }
      filterCols[key] = idx;
    }

    // Индекс колонки Deleted
    const deletedCol = headerMap["Deleted"];

    const result = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      // Проверка Deleted
      if (deletedCol !== undefined) {
        const del = row[deletedCol];
        if (del === true || del === "true") continue;
      }
      // Проверка фильтров
      let match = true;
      for (const key of filterKeys) {
        const col = filterCols[key];
        if (col === undefined) {
          match = false;
          break;
        }
        if (String(row[col]) !== String(filters[key])) {
          match = false;
          break;
        }
      }
      if (!match) continue;
      // Создаём объект
      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j]; });
      result.push(obj);
    }
    this._stats.queries++;
    return result;
  },

  // ----- ОБНОВЛЕНИЕ (использует индекс строк) -----
  update(sheetName, id, data) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const { headers, headerMap } = this._getHeadersAndMap(sheet);

    const rowIndex = this._getRowIndex(sheetName);
    const rowNum = rowIndex[String(id).trim()];
    if (!rowNum) throw new Error("Record not found " + id);

    // Читаем строку
    const row = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
    // Применяем изменения
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
    if (!changed) {
      // Если ничего не изменилось, всё равно возвращаем текущий объект
      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j]; });
      return obj;
    }
    sheet.getRange(rowNum, 1, 1, headers.length).setValues([row]);

    // Обновляем объект для возврата
    const updatedObj = {};
    headers.forEach((h, j) => { updatedObj[h] = row[j]; });

    // Если изменился ID (редко), нужно обновить индекс
    // Но ID обычно не меняется, поэтому пропускаем для простоты

    this._stats.updates++;
    return updatedObj;
  },

  // ----- МЯГКОЕ УДАЛЕНИЕ -----
  softDelete(sheetName, id) {
    return this.update(sheetName, id, {
      Deleted: true,
      UpdatedAt: new Date()
    });
  },

  // ----- ПАКЕТНЫЕ ОПЕРАЦИИ -----
  insertMany(sheetName, dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    const results = [];
    for (const data of dataArray) {
      results.push(this.insert(sheetName, data));
    }
    return results;
  },

  updateMany(sheetName, ids, data) {
    const results = [];
    for (const id of ids) {
      results.push(this.update(sheetName, id, data));
    }
    return results;
  },

  // ----- ТРАНЗАКЦИЯ (логическая группировка) -----
  transaction(callback) {
    // Простая реализация: выполняем callback и ловим ошибки.
    // В Google Apps Script нет реальных транзакций, поэтому только логическая группировка.
    try {
      const result = callback();
      Logger.log("Transaction completed successfully");
      return result;
    } catch (e) {
      Logger.error("Transaction failed: " + e.message);
      // Здесь можно добавить логику отката, но в текущей реализации мы не можем откатить изменения.
      throw e;
    }
  },

  // ----- СТАТИСТИКА -----
  getStats() {
    return { ...this._stats };
  },

  // ----- HEALTH -----
  health() {
    return HealthContract.create(
      "Database",
      this.initialized ? "OK" : "NOT_READY",
      {
        version: this.version,
        initialized: this.initialized,
        spreadsheetOpened: this._stats.spreadsheetOpened,
        cachedSheets: Object.keys(this._headerCache).length,
        headerCacheHits: this._stats.cacheHits,
        headerCacheMisses: this._stats.cacheMisses,
        rowIndexHits: this._stats.rowIndexHits,
        rowIndexMisses: this._stats.rowIndexMisses,
        inserts: this._stats.inserts,
        updates: this._stats.updates,
        queries: this._stats.queries
      }
    );
  }
};

globalThis.Database = Database;
Logger.log("Database READY v" + Database.version);