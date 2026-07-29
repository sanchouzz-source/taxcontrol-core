// ============================================================
// OrganizationMigrationPlanStore v1.0.0
// Human-reviewed migration plan stored in a dedicated system sheet
//
// The sheet contains no authority by itself. Organization IDs, decisions,
// fingerprints, the active user, and DATA_MIGRATE are revalidated at apply.
// ============================================================

console.log(
  "OrganizationMigrationPlanStore v1.0.0"
);

const OrganizationMigrationPlanStore = {
  version: "1.0.0",
  sheetName:
    "_OrganizationScopeMigration",
  headerRow: 7,

  headers: [
    "MigrationID",
    "Entity",
    "Table",
    "RecordID",
    "Label",
    "Fingerprint",
    "ExpectedUpdatedAt",
    "ProposedOrganizationID",
    "Decision",
    "ValidationStatus",
    "ApplyStatus",
    "AppliedAt",
    "AppliedBy",
    "Notes",
  ],

  _spreadsheet() {
    if (
      typeof SpreadsheetApp ===
        "undefined" ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !==
        "function"
    ) {
      throw new Error(
        "SpreadsheetApp unavailable"
      );
    }

    const spreadsheet =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (!spreadsheet) {
      throw new Error(
        "Active spreadsheet unavailable"
      );
    }

    return spreadsheet;
  },

  _sheet(createIfMissing) {
    const spreadsheet =
      this._spreadsheet();
    let sheet =
      spreadsheet.getSheetByName(
        this.sheetName
      );

    if (
      !sheet &&
      createIfMissing === true
    ) {
      sheet =
        spreadsheet.insertSheet(
          this.sheetName
        );
    }

    return sheet;
  },

  exists() {
    return !!this._sheet(false);
  },

  approvalPhrase(planId) {
    return (
      "APPLY " +
      String(planId || "")
    );
  },

  _string(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    if (
      value instanceof Date
    ) {
      return value.toISOString();
    }

    return String(value);
  },

  _rowToValues(row) {
    return this.headers.map(
      (header) =>
        this._string(row[header])
    );
  },

  _valuesToRow(values) {
    const row = {};

    this.headers.forEach(
      (header, index) => {
        row[header] =
          this._string(
            values[index]
          );
      }
    );

    return row;
  },

  write(plan) {
    if (
      !plan ||
      !Array.isArray(plan.rows)
    ) {
      throw new Error(
        "Migration plan invalid"
      );
    }

    const sheet =
      this._sheet(true);

    sheet.clearContents();

    const metadata = [
      [
        "TaxControl Organization Scope Migration",
        "",
      ],
      ["PlanID", plan.planId || ""],
      [
        "GeneratedAt",
        plan.generatedAt || "",
      ],
      [
        "Approval",
        plan.approval || "",
      ],
      ["Status", plan.status || ""],
    ];

    sheet
      .getRange(
        1,
        1,
        metadata.length,
        2
      )
      .setValues(metadata);

    sheet
      .getRange(
        this.headerRow,
        1,
        1,
        this.headers.length
      )
      .setValues([
        this.headers,
      ]);

    if (plan.rows.length) {
      sheet
        .getRange(
          this.headerRow + 1,
          1,
          plan.rows.length,
          this.headers.length
        )
        .setValues(
          plan.rows.map((row) =>
            this._rowToValues(row)
          )
        );
    }

    if (
      typeof sheet.setFrozenRows ===
        "function"
    ) {
      sheet.setFrozenRows(
        this.headerRow
      );
    }

    if (
      typeof SpreadsheetApp
        .newDataValidation ===
        "function" &&
      plan.rows.length
    ) {
      const decisionColumn =
        this.headers.indexOf(
          "Decision"
        ) + 1;
      const rule =
        SpreadsheetApp
          .newDataValidation()
          .requireValueInList(
            [
              "REVIEW",
              "ASSIGN",
              "SKIP",
            ],
            true
          )
          .setAllowInvalid(false)
          .build();

      sheet
        .getRange(
          this.headerRow + 1,
          decisionColumn,
          plan.rows.length,
          1
        )
        .setDataValidation(rule);
    }

    return {
      status: "SAVED",
      sheet:
        this.sheetName,
      planId: plan.planId,
      rows: plan.rows.length,
    };
  },

  read() {
    const sheet =
      this._sheet(false);

    if (!sheet) {
      return null;
    }

    const metadata =
      sheet
        .getRange(1, 1, 5, 2)
        .getValues();
    const planId =
      this._string(
        metadata[1][1]
      ).trim();

    if (!planId) {
      return null;
    }

    const lastRow =
      sheet.getLastRow();
    const count =
      Math.max(
        0,
        lastRow -
          this.headerRow
      );
    const rows =
      count
        ? sheet
          .getRange(
            this.headerRow + 1,
            1,
            count,
            this.headers.length
          )
          .getValues()
          .map((values) =>
            this._valuesToRow(
              values
            )
          )
          .filter(
            (row) =>
              row.MigrationID
          )
        : [];

    return {
      planId,
      generatedAt:
        this._string(
          metadata[2][1]
        ),
      approval:
        this._string(
          metadata[3][1]
        ).trim(),
      status:
        this._string(
          metadata[4][1]
        ).trim(),
      rows,
    };
  },
};

globalThis
  .OrganizationMigrationPlanStore =
  OrganizationMigrationPlanStore;

