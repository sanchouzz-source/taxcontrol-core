console.log("Database");

const Database = {
  version: "2.0.0",
  initialized: false,

  init() {
    if (this.initialized) {
      return;
    }
    SchemaManager.init();
    this.initialized = true;
    Logger.log("Database READY v" + this.version);
  },

  sheet(name) {
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  },

  getSheetOrThrow(name) {
    const sheet = this.sheet(name);
    if (!sheet) {
      throw new Error("Sheet not found: " + name);
    }
    return sheet;
  },

  headers(sheet) {
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  },

  insert(sheetName, data) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const headers = this.headers(sheet);
    const idField = SchemaRegistry.getIdField(sheetName);

    if (!data[idField]) {
      data[idField] = IdService.generate(sheetName);
    }

    if (headers.includes("CreatedAt") && !data.CreatedAt) {
      data.CreatedAt = new Date();
    }

    if (headers.includes("UpdatedAt")) {
      data.UpdatedAt = new Date();
    }

    if (headers.includes("Deleted") && data.Deleted === undefined) {
      data.Deleted = false;
    }

    const row = headers.map(h => data[h] ?? "");
    sheet.appendRow(row);

    Logger.log("INSERT " + sheetName);
    return data;
  },

  // ---------- УСИЛЕННЫЙ find (trim + проверка индекса) ----------
  find(sheetName, id) {
    this.init();

    const sheet = this.getSheetOrThrow(sheetName);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idField = SchemaRegistry.getIdField(sheetName);

    Logger.log(
      "FIND TABLE=" + sheetName +
      " IDFIELD=" + idField +
      " HEADERS=" + JSON.stringify(headers)
    );

    const index = headers.indexOf(idField);
    if (index === -1) {
      throw new Error("ID field '" + idField + "' not found in sheet " + sheetName);
    }

    for (let i = 1; i < values.length; i++) {
      // ----- УСИЛЕННОЕ СРАВНЕНИЕ С trim() -----
      if (String(values[i][index]).trim() === String(id).trim()) {
        let obj = {};
        headers.forEach((h, j) => {
          obj[h] = values[i][j];
        });
        return obj;
      }
    }

    return null;
  },

  exists(sheetName, id) {
    return !!this.find(sheetName, id);
  },

  query(sheetName, filters = {}) {
    this.init();
    const sheet = this.getSheetOrThrow(sheetName);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    return values
      .slice(1)
      .map(row => {
        let obj = {};
        headers.forEach((h, i) => (obj[h] = row[i]));
        return obj;
      })
      .filter(obj => {
        if (obj.Deleted === true || obj.Deleted === "true") {
          return false;
        }
        return Object.keys(filters).every(
          k => String(obj[k]) === String(filters[k])
        );
      });
  },

  update(sheetName, id, data) {
    const sheet = this.getSheetOrThrow(sheetName);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idField = SchemaRegistry.getIdField(sheetName);
    const idIndex = headers.indexOf(idField);

    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idIndex]).trim() === String(id).trim()) {
        let row = values[i];
        headers.forEach((h, j) => {
          if (data[h] !== undefined) {
            row[j] = data[h];
          }
        });
        if (headers.includes("UpdatedAt")) {
          row[headers.indexOf("UpdatedAt")] = new Date();
        }
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
        return this.find(sheetName, id);
      }
    }

    throw new Error("Record not found " + id);
  },

  softDelete(sheetName, id) {
    return this.update(sheetName, id, {
      Deleted: true,
      UpdatedAt: new Date()
    });
  },

  count(sheetName, filters = {}) {
    return this.query(sheetName, filters).length;
  },

  health() {
    return HealthContract.create(
      "Database",
      this.initialized ? "OK" : "NOT_READY",
      {
        version: this.version
      }
    );
  }
};

globalThis.Database = Database;
Logger.log("Database READY v2.0.0");