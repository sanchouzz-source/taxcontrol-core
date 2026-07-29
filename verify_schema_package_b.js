"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const packageDir = __dirname;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(name) {
  return fs.readFileSync(
    path.join(packageDir, name),
    "utf8"
  );
}

class FakeRange {
  constructor(sheet, row, column, rows, columns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }

  setValues(values) {
    assert(
      Array.isArray(values) &&
        values.length === this.rows,
      "FakeRange row count mismatch"
    );

    values.forEach((row) => {
      assert(
        Array.isArray(row) &&
          row.length === this.columns,
        "FakeRange column count mismatch"
      );
    });

    for (let r = 0; r < this.rows; r += 1) {
      const targetRow = this.row - 1 + r;
      if (!this.sheet.data[targetRow]) {
        this.sheet.data[targetRow] = [];
      }

      for (let c = 0; c < this.columns; c += 1) {
        this.sheet.data[targetRow][
          this.column - 1 + c
        ] = values[r][c];
      }
    }

    return this;
  }

  getValues() {
    const values = [];

    for (let r = 0; r < this.rows; r += 1) {
      const source =
        this.sheet.data[this.row - 1 + r] || [];
      const row = [];

      for (let c = 0; c < this.columns; c += 1) {
        const value =
          source[this.column - 1 + c];
        row.push(value === undefined ? "" : value);
      }

      values.push(row);
    }

    return values;
  }
}

class FakeSheet {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  getName() {
    return this.name;
  }

  getLastColumn() {
    return this.data.reduce(
      (max, row) => Math.max(max, row.length),
      0
    );
  }

  getLastRow() {
    return this.data.length;
  }

  getRange(row, column, rows, columns) {
    return new FakeRange(
      this,
      row,
      column,
      rows,
      columns
    );
  }

  getDataRange() {
    const rows = this.getLastRow();
    const columns = this.getLastColumn();

    return new FakeRange(
      this,
      1,
      1,
      rows,
      columns
    );
  }

  appendRow(row) {
    this.data.push(row.slice());
    return this;
  }

  clear() {
    this.data = [];
    return this;
  }

  clearContents() {
    this.data = [];
    return this;
  }
}

class FakeSpreadsheet {
  constructor() {
    this.sheets = new Map();
  }

  getSheetByName(name) {
    return this.sheets.get(name) || null;
  }

  insertSheet(name) {
    if (this.sheets.has(name)) {
      throw new Error("Sheet already exists " + name);
    }

    const sheet = new FakeSheet(name);
    this.sheets.set(name, sheet);
    return sheet;
  }

  deleteSheet(sheet) {
    this.sheets.delete(sheet.getName());
  }
}

function createContext() {
  const spreadsheet = new FakeSpreadsheet();
  const logs = [];

  const context = {
    console: {
      log: (...items) => logs.push(items.join(" ")),
    },
    Logger: {
      log: (message) => logs.push(String(message)),
      debug: (message) => logs.push(String(message)),
      warn: (message) => logs.push(String(message)),
      error: (message) => logs.push(String(message)),
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return null;
          },
        };
      },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      },
      openById() {
        return spreadsheet;
      },
    },
    LockService: {
      getScriptLock() {
        return {
          waitLock() {},
          releaseLock() {},
        };
      },
    },
    HealthContract: {
      create(module, status, details) {
        return {
          module,
          status,
          details,
        };
      },
    },
  };

  context.globalThis = context;
  vm.createContext(context);

  vm.runInContext(
    read("SpreadsheetAdapter.js"),
    context,
    {
      filename: "SpreadsheetAdapter.js",
    }
  );
  vm.runInContext(
    read("SchemaStorage.js"),
    context,
    {
      filename: "SchemaStorage.js",
    }
  );

  return {
    context,
    spreadsheet,
    logs,
  };
}

function staticChecks() {
  const adapter = read("SpreadsheetAdapter.js");
  const storage = read("SchemaStorage.js");

  assert(
    /version:\s*"4\.4\.0"/.test(adapter),
    "SpreadsheetAdapter version mismatch"
  );
  assert(
    /version:\s*"2\.2\.0"/.test(storage),
    "SchemaStorage version mismatch"
  );
  assert(
    /replace\(sheetName,rows=\[\],headers=\[\]\)/.test(
      adapter
    ),
    "Explicit adapter replace API missing"
  );
  assert(
    !/SpreadsheetAdapter\.write\s*\(\s*sheet,\s*rows/.test(
      storage
    ) &&
      !/adapter\.write\s*\(\s*sheet,\s*rows/.test(
        storage
      ),
    "SchemaStorage still sends an array to write"
  );
  assert(
    /typeof adapter\.writeRows==="function"/.test(
      storage
    ),
    "v4.3 writeRows fallback missing"
  );

  return {
    status: "PASS",
    checks: 5,
  };
}

function runtimeChecks() {
  const { context, spreadsheet } = createContext();
  const adapter = context.SpreadsheetAdapter;
  const storage = context.SchemaStorage;
  let checks = 0;

  assert(adapter.init() === true, "Adapter init failed");
  checks += 1;

  const headers = ["entity", "table", "enabled"];
  const rows = [
    {
      entity: "CLIENT",
      table: "Clients",
      enabled: true,
    },
    {
      entity: "TRIP",
      table: "Trips",
      enabled: false,
    },
  ];

  adapter.replace("Contract", rows, headers);
  let values = spreadsheet
    .getSheetByName("Contract")
    .getDataRange()
    .getValues();

  assert(
    JSON.stringify(values) ===
      JSON.stringify([
        headers,
        ["CLIENT", "Clients", true],
        ["TRIP", "Trips", false],
      ]),
    "Object rows were not written in header order"
  );
  checks += 1;

  adapter.replace(
    "Contract",
    [
      {
        entity: "ORDER",
        table: "Orders",
        enabled: true,
      },
    ],
    headers
  );
  values = spreadsheet
    .getSheetByName("Contract")
    .getDataRange()
    .getValues();

  assert(
    values.length === 2 &&
      values[1][0] === "ORDER",
    "Replace did not remove old rows"
  );
  checks += 1;

  adapter.replace("Contract", [], headers);
  values = spreadsheet
    .getSheetByName("Contract")
    .getDataRange()
    .getValues();

  assert(
    values.length === 1 &&
      JSON.stringify(values[0]) ===
        JSON.stringify(headers),
    "Empty replace did not preserve headers"
  );
  checks += 1;

  adapter.writeRows(
    "Contract",
    [["CARGO", "Cargo", true]],
    headers
  );
  assert(
    adapter.findAll("Contract").length === 1,
    "writeRows compatibility failed"
  );
  checks += 1;

  adapter.replace("Contract", [], headers);
  adapter.write("Contract", {
    entity: "VEHICLE",
    table: "Vehicles",
    enabled: true,
  });
  assert(
    adapter.findAll("Contract").length === 1,
    "write single insert compatibility failed"
  );
  checks += 1;

  assert(
    adapter.hasSheet("Contract") &&
      adapter.exists("Contract"),
    "One-argument sheet exists contract failed"
  );
  checks += 1;

  assert(
    adapter.exists(
      "Contract",
      "entity",
      "VEHICLE"
    ),
    "Three-argument record exists contract failed"
  );
  checks += 1;

  const beforeInvalid = JSON.stringify(
    spreadsheet.getSheetByName("Contract").data
  );
  let rejected = false;

  try {
    adapter.replace(
      "Contract",
      [["ONLY_ONE_VALUE"]],
      headers
    );
  } catch (error) {
    rejected = /width mismatch/.test(error.message);
  }

  assert(
    rejected &&
      JSON.stringify(
        spreadsheet.getSheetByName("Contract").data
      ) === beforeInvalid,
    "Invalid replacement changed existing data"
  );
  checks += 1;

  let duplicateHeadersRejected = false;
  try {
    adapter.replace(
      "Contract",
      [
        {
          entity: "DUPLICATE",
        },
      ],
      ["entity", "entity"]
    );
  } catch (error) {
    duplicateHeadersRejected =
      /duplicate headers/.test(error.message);
  }

  assert(
    duplicateHeadersRejected &&
      JSON.stringify(
        spreadsheet.getSheetByName("Contract").data
      ) === beforeInvalid,
    "Duplicate headers changed existing data"
  );
  checks += 1;

  let mixedRowsRejected = false;
  try {
    adapter.replace(
      "Contract",
      [
        {
          entity: "OBJECT",
          table: "Objects",
          enabled: true,
        },
        ["ARRAY", "Arrays", true],
      ],
      headers
    );
  } catch (error) {
    mixedRowsRejected =
      /one format/.test(error.message);
  }

  assert(
    mixedRowsRejected &&
      JSON.stringify(
        spreadsheet.getSheetByName("Contract").data
      ) === beforeInvalid,
    "Mixed row formats changed existing data"
  );
  checks += 1;

  const expectedProtected = [
    "_SystemSchemaTables",
    "_SystemSchemaFields",
    "_SchemaHistory",
    "_SchemaVersions",
    "_SchemaIndexes",
    "_SchemaMigrations",
    "_MigrationLock",
    "_SchemaUIDMap",
    "_SchemaSnapshots",
  ];

  assert(
    expectedProtected.every((name) =>
      adapter.protectedSheets.includes(name)
    ),
    "System sheet protection is incomplete"
  );
  checks += 1;

  const schema = {
    CLIENT: {
      table: "Clients",
      idField: "ClientID",
      softDelete: true,
      timestamps: true,
      audit: true,
      fields: [
        {
          name: "ClientID",
          type: "STRING",
          required: true,
          nullable: false,
        },
        {
          name: "Name",
          type: "STRING",
          required: true,
          nullable: false,
        },
      ],
    },
    TRIP: {
      table: "Trips",
      idField: "TripID",
      softDelete: true,
      timestamps: true,
      audit: false,
      fields: [
        {
          name: "TripID",
          type: "STRING",
          required: true,
          nullable: false,
        },
      ],
    },
  };

  storage.save(schema);
  const loaded = storage.load();

  assert(
    loaded.CLIENT.idField === "ClientID" &&
      loaded.CLIENT.fields.length === 2 &&
      loaded.TRIP.table === "Trips",
    "SchemaStorage save/load round trip failed"
  );
  checks += 1;

  storage.save({
    CLIENT: schema.CLIENT,
  });
  const reduced = storage.load();

  assert(
    Object.keys(reduced).length === 1 &&
      Boolean(reduced.CLIENT) &&
      !reduced.TRIP,
    "SchemaStorage replacement left stale entities"
  );
  checks += 1;

  storage.clear();
  assert(
    storage.load &&
      adapter.findAll(
        "_SystemSchemaTables"
      ).length === 0 &&
      adapter.getHeaders(
        spreadsheet.getSheetByName(
          "_SystemSchemaTables"
        )
      ).length === 6,
    "SchemaStorage clear contract failed"
  );
  checks += 1;

  let protectedDeleteRejected = false;
  try {
    adapter.deleteSheet("_SystemSchemaTables");
  } catch (error) {
    protectedDeleteRejected =
      /Protected sheet/.test(error.message);
  }
  assert(
    protectedDeleteRejected,
    "Current system schema sheet can be deleted"
  );
  checks += 1;

  storage.saveVersion(1, "hash-1", "test");
  storage.saveVersion(2, "hash-2", "test");
  assert(
    storage.getVersion() === 2 &&
      storage.getCurrentHash() === "hash-2",
    "Schema version storage failed"
  );
  checks += 1;

  const originalReplace = adapter.replace;
  const originalWriteRows = adapter.writeRows;
  const originalWrite = adapter.write;
  let fallback = null;

  try {
    adapter.replace = null;
    adapter.write = function () {
      throw new Error("Unsafe write(array) call");
    };
    adapter.writeRows = function (
      sheet,
      fallbackRows,
      fallbackHeaders
    ) {
      fallback = {
        sheet,
        rows: fallbackRows,
        headers: fallbackHeaders,
      };
      return fallbackRows;
    };

    storage._write(
      "_Fallback",
      [
        {
          entity: "CLIENT",
          enabled: false,
        },
      ],
      ["entity", "enabled"]
    );
  } finally {
    adapter.replace = originalReplace;
    adapter.writeRows = originalWriteRows;
    adapter.write = originalWrite;
  }

  assert(
    fallback &&
      JSON.stringify(fallback.rows) ===
        JSON.stringify([["CLIENT", false]]),
    "v4.3 writeRows fallback failed"
  );
  checks += 1;

  assert(
    adapter.metrics().stats.replace >= 5,
    "Replace metrics were not updated"
  );
  checks += 1;

  vm.runInContext(
    read("TestSchemaStorageAdapterContract.js"),
    context,
    {
      filename:
        "TestSchemaStorageAdapterContract.js",
    }
  );

  const gasContract = vm.runInContext(
    "runSchemaStorageAdapterContractTest()",
    context
  );

  assert(
    gasContract.status === "PASS" &&
      gasContract.count === 14,
    "Packaged GAS contract test did not pass"
  );
  checks += 1;

  const coldRuntime = createContext();
  assert(
    coldRuntime.context.SpreadsheetAdapter
      .initialized === false,
    "Cold runtime adapter unexpectedly initialized"
  );

  coldRuntime.context.SchemaStorage.save({
    CLIENT: {
      table: "Clients",
      idField: "ClientID",
      fields: [
        {
          name: "ClientID",
          type: "STRING",
          required: true,
          nullable: false,
        },
      ],
    },
  });

  assert(
    coldRuntime.context.SpreadsheetAdapter
      .initialized === true &&
      coldRuntime.spreadsheet.getSheetByName(
        "_SystemSchemaTables"
      ) !== null,
    "SchemaStorage could not lazy-init the adapter"
  );
  checks += 1;

  return {
    status: "PASS",
    checks,
  };
}

const result = {
  package: "TaxControl Schema Package B",
  static: staticChecks(),
  runtime: runtimeChecks(),
  status: "PASS",
};

console.log(JSON.stringify(result, null, 2));
