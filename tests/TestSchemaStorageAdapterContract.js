// ============================================================
// TestSchemaStorageAdapterContract v1.0.0
// TaxControl ERP — Package B
//
// Safe contract test:
// - uses one temporary sheet for real adapter checks;
// - never overwrites real system schema sheets;
// - restores all temporarily replaced adapter methods.
// ============================================================

console.log("TestSchemaStorageAdapterContract v1.0.0");

const TestSchemaStorageAdapterContract = {
  version: "1.0.0",

  assert(condition, name, checks) {
    if (!condition) {
      throw new Error("PACKAGE B CONTRACT FAILED: " + name);
    }

    checks.push(name);
  },

  equalRow(actual, expected) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      actual.every((value, index) => value === expected[index])
    );
  },

  run() {
    const checks = [];
    const sheetName =
      "_TC_PACKAGE_B_" +
      Date.now().toString(36).toUpperCase();

    if (
      typeof SpreadsheetAdapter === "undefined" ||
      typeof SchemaStorage === "undefined"
    ) {
      throw new Error(
        "SpreadsheetAdapter and SchemaStorage must be loaded"
      );
    }

    SpreadsheetAdapter.init();

    try {
      const headers = ["entity", "table", "enabled"];
      const firstRows = [
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

      SpreadsheetAdapter.replace(
        sheetName,
        firstRows,
        headers
      );

      let sheet = SpreadsheetAdapter.getSheet(sheetName);
      let values = sheet.getDataRange().getValues();

      this.assert(
        values.length === 3,
        "OBJECT_REPLACE_ROW_COUNT",
        checks
      );
      this.assert(
        this.equalRow(values[0], headers),
        "OBJECT_REPLACE_HEADERS",
        checks
      );
      this.assert(
        this.equalRow(values[1], [
          "CLIENT",
          "Clients",
          true,
        ]),
        "OBJECT_REPLACE_ORDER",
        checks
      );

      SpreadsheetAdapter.replace(
        sheetName,
        [
          {
            entity: "VEHICLE",
            table: "Vehicles",
            enabled: true,
          },
        ],
        headers
      );

      values = sheet.getDataRange().getValues();
      this.assert(
        values.length === 2 &&
          values[1][0] === "VEHICLE",
        "REPLACE_REMOVES_OLD_ROWS",
        checks
      );

      SpreadsheetAdapter.replace(
        sheetName,
        [],
        headers
      );

      values = sheet.getDataRange().getValues();
      this.assert(
        values.length === 1 &&
          this.equalRow(values[0], headers),
        "EMPTY_REPLACE_PRESERVES_HEADERS",
        checks
      );

      SpreadsheetAdapter.writeRows(
        sheetName,
        [["ORDER", "Orders", true]],
        headers
      );

      values = sheet.getDataRange().getValues();
      this.assert(
        values.length === 2 &&
          this.equalRow(values[1], [
            "ORDER",
            "Orders",
            true,
          ]),
        "WRITE_ROWS_COMPATIBILITY",
        checks
      );

      SpreadsheetAdapter.replace(
        sheetName,
        [],
        headers
      );
      SpreadsheetAdapter.write(sheetName, {
        entity: "CARGO",
        table: "Cargo",
        enabled: true,
      });

      this.assert(
        SpreadsheetAdapter.findAll(sheetName).length ===
          1,
        "WRITE_REMAINS_SINGLE_INSERT",
        checks
      );
      this.assert(
        SpreadsheetAdapter.hasSheet(sheetName) === true &&
          SpreadsheetAdapter.exists(sheetName) === true,
        "SHEET_EXISTS_OVERLOAD",
        checks
      );
      this.assert(
        SpreadsheetAdapter.exists(
          sheetName,
          "entity",
          "CARGO"
        ) === true,
        "RECORD_EXISTS_OVERLOAD",
        checks
      );
    } finally {
      try {
        if (SpreadsheetAdapter.hasSheet(sheetName)) {
          SpreadsheetAdapter.deleteSheet(sheetName);
        }
      } catch (cleanupError) {
        Logger.warn(
          "Package B test cleanup failed: " +
            cleanupError.message
        );
      }
    }

    const requiredProtectedSheets = [
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

    this.assert(
      requiredProtectedSheets.every((name) =>
        SpreadsheetAdapter.protectedSheets.includes(name)
      ),
      "SYSTEM_SHEETS_PROTECTED",
      checks
    );

    const originalReplace =
      SpreadsheetAdapter.replace;
    const originalWriteRows =
      SpreadsheetAdapter.writeRows;
    const originalWrite = SpreadsheetAdapter.write;
    const captured = [];

    try {
      SpreadsheetAdapter.replace = function (
        sheet,
        rows,
        headers
      ) {
        captured.push({
          sheet,
          rows,
          headers,
        });
        return rows;
      };

      SchemaStorage.save({
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
          ],
        },
      });

      this.assert(
        captured.length === 2,
        "SCHEMA_SAVE_TWO_REPLACES",
        checks
      );
      this.assert(
        captured[0].sheet ===
          "_SystemSchemaTables" &&
          captured[1].sheet ===
            "_SystemSchemaFields",
        "SCHEMA_SAVE_SYSTEM_SHEETS",
        checks
      );
      this.assert(
        captured[0].rows[0].idField ===
          "ClientID" &&
          captured[1].rows[0].field ===
            "ClientID",
        "SCHEMA_SAVE_OBJECT_ROWS",
        checks
      );

      SpreadsheetAdapter.replace = null;
      SpreadsheetAdapter.write = function () {
        throw new Error(
          "SchemaStorage must not call write(array)"
        );
      };

      let fallback = null;
      SpreadsheetAdapter.writeRows = function (
        sheet,
        rows,
        headers
      ) {
        fallback = {
          sheet,
          rows,
          headers,
        };
        return rows;
      };

      SchemaStorage._write(
        "_Fallback",
        [
          {
            entity: "CLIENT",
            enabled: false,
          },
        ],
        ["entity", "enabled"]
      );

      this.assert(
        fallback &&
          this.equalRow(fallback.rows[0], [
            "CLIENT",
            false,
          ]),
        "V43_WRITE_ROWS_FALLBACK",
        checks
      );
    } finally {
      SpreadsheetAdapter.replace =
        originalReplace;
      SpreadsheetAdapter.writeRows =
        originalWriteRows;
      SpreadsheetAdapter.write = originalWrite;
    }

    const report = {
      package: "TaxControl Schema Package B",
      version: this.version,
      status: "PASS",
      checks: checks,
      count: checks.length,
    };

    Logger.log(
      "PACKAGE B CONTRACT PASS checks=" +
        checks.length
    );

    return report;
  },
};

function runSchemaStorageAdapterContractTest() {
  return TestSchemaStorageAdapterContract.run();
}

globalThis.TestSchemaStorageAdapterContract =
  TestSchemaStorageAdapterContract;

