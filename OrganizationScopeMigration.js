// ============================================================
// OrganizationScopeMigration v1.0.0
// Non-destructive migration audit for Package G
//
// This utility reads rows only. It never assigns OrganizationID and never
// updates a spreadsheet. Backfill must be reviewed as a separate migration.
// ============================================================

const OrganizationScopeMigration = {
  version: "1.0.0",

  run() {
    if (
      typeof SystemInit !==
        "undefined" &&
      typeof SystemInit.isReady ===
        "function" &&
      SystemInit.isReady() !== true
    ) {
      startERP();
    }

    return SecurityContext
      .runAsSystem(
        {
          organizationId:
            "SYSTEM",
          bypassOrganizationScope:
            true,
          source:
            "ORGANIZATION_SCOPE_AUDIT",
        },
        () => {
          const entities =
            OrganizationScope
              .requiredEntities;
          const report = {
            version: this.version,
            status: "PASS",
            writes: 0,
            entities: {},
            summary: {
              totalRows: 0,
              missingOrganizationID:
                0,
              failedEntities: 0,
            },
          };

          entities.forEach((entity) => {
            try {
              const metadata =
                EntityMetadata.get(
                  entity
                );
              const mode =
                OrganizationScope.mode(
                  entity,
                  metadata
                );
              const key =
                OrganizationScope.key(
                  entity,
                  metadata
                );
              const rows =
                Database.findAll(
                  entity,
                  {
                    includeDeleted:
                      true,
                    bypassOrganizationScope:
                      true,
                  }
                );
              const missing =
                mode === "GLOBAL"
                  ? 0
                  : rows.filter(
                    (row) =>
                      !row[key]
                  ).length;
              const organizations =
                [
                  ...new Set(
                    rows
                      .map(
                        (row) =>
                          row[key]
                      )
                      .filter(Boolean)
                      .map(String)
                  ),
                ];

              report.entities[entity] = {
                status: "PASS",
                mode,
                key,
                rows: rows.length,
                missingOrganizationID:
                  missing,
                organizations,
              };
              report.summary.totalRows +=
                rows.length;
              report.summary
                .missingOrganizationID +=
                missing;
            } catch (error) {
              report.entities[entity] = {
                status: "FAIL",
                error: error.message,
              };
              report.summary
                .failedEntities++;
            }
          });

          if (
            report.summary
              .missingOrganizationID >
              0 ||
            report.summary
              .failedEntities > 0
          ) {
            report.status =
              "REVIEW_REQUIRED";
          }

          Logger.log(
            JSON.stringify(
              report,
              null,
              2
            )
          );

          return report;
        }
      );
  },
};

function runOrganizationScopeAudit() {
  return OrganizationScopeMigration
    .run();
}

globalThis.OrganizationScopeMigration =
  OrganizationScopeMigration;
