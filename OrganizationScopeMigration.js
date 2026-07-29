// ============================================================
// OrganizationScopeMigration v2.0.0
// Controlled legacy OrganizationID migration
//
// Workflow:
// 1. audit (read only)
// 2. prepare a review sheet (no business-row writes)
// 3. fill ProposedOrganizationID and Decision
// 4. validate and type "APPLY <PlanID>" into the Approval cell
// 5. call applyOrganizationScopeMigration() explicitly from the editor
//
// The apply step rechecks identity, DATA_MIGRATE, plan coverage,
// fingerprints, organizations, records, and the approval phrase.
// ============================================================

console.log(
  "OrganizationScopeMigration v2.0.0"
);

const OrganizationScopeMigration = {
  version: "2.0.0",

  _isTrue(value) {
    if (value === true || value === 1) {
      return true;
    }

    return [
      "TRUE",
      "1",
      "YES",
      "Y",
      "ДА",
    ].includes(
      String(value || "")
        .trim()
        .toUpperCase()
    );
  },

  _assertRuntime() {
    if (
      typeof SystemInit !==
        "undefined" &&
      typeof SystemInit.isReady ===
        "function" &&
      SystemInit.isReady() === true
    ) {
      return true;
    }

    if (
      typeof startERP !==
        "function"
    ) {
      throw new Error(
        "ERP startup unavailable"
      );
    }

    const result = startERP();

    if (
      result &&
      typeof result.then === "function"
    ) {
      throw new Error(
        "ERP startup must be synchronous"
      );
    }

    return true;
  },

  _withBypass(source, callback) {
    return SecurityContext
      .runAsSystem(
        {
          organizationId:
            "SYSTEM",
          bypassOrganizationScope:
            true,
          source,
        },
        callback
      );
  },

  _metadata(entity) {
    const metadata =
      EntityMetadata.get(entity);

    if (!metadata) {
      throw new Error(
        entity +
          " metadata unavailable"
      );
    }

    return metadata;
  },

  _idField(entity, metadata) {
    return (
      metadata.idField ||
      metadata.primaryKey ||
      (
        entity === "ORGANIZATION"
          ? "OrganizationID"
          : entity + "ID"
      )
    );
  },

  _canonical(value) {
    if (Array.isArray(value)) {
      return (
        "[" +
        value
          .map((item) =>
            this._canonical(item)
          )
          .join(",") +
        "]"
      );
    }

    if (
      value &&
      typeof value === "object"
    ) {
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map(
            (key) =>
              JSON.stringify(key) +
              ":" +
              this._canonical(
                value[key]
              )
          )
          .join(",") +
        "}"
      );
    }

    return JSON.stringify(
      value === undefined
        ? null
        : value
    );
  },

  _hash(value) {
    const text = String(value || "");

    if (
      typeof Utilities !==
        "undefined" &&
      Utilities.DigestAlgorithm &&
      typeof Utilities
        .computeDigest === "function"
    ) {
      try {
        return Utilities
          .computeDigest(
            Utilities
              .DigestAlgorithm
              .SHA_256,
            text,
            Utilities.Charset
              ? Utilities.Charset.UTF_8
              : undefined
          )
          .map(
            (byte) =>
              (
                "0" +
                (
                  byte < 0
                    ? byte + 256
                    : byte
                ).toString(16)
              ).slice(-2)
          )
          .join("");
      } catch (error) {
        // Deterministic fallback below is sufficient for change detection.
      }
    }

    let hash = 2166136261;

    for (
      let index = 0;
      index < text.length;
      index++
    ) {
      hash ^= text.charCodeAt(
        index
      );
      hash = Math.imul(
        hash,
        16777619
      );
    }

    return (
      "fnv1a-" +
      (hash >>> 0)
        .toString(16)
        .padStart(8, "0")
    );
  },

  _fingerprint(entity, row) {
    return this._hash(
      entity +
        "|" +
        this._canonical(row)
    );
  },

  _label(entity, row, idField) {
    const candidates = [
      "Name",
      "LegalName",
      "Number",
      "OrderNumber",
      "TripNumber",
      "INN",
      "Email",
      "Login",
      idField,
    ];

    for (
      let index = 0;
      index < candidates.length;
      index++
    ) {
      const value =
        row[candidates[index]];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim()
      ) {
        return String(value)
          .trim()
          .slice(0, 160);
      }
    }

    return entity + " legacy row";
  },

  _readAll(entity) {
    const rows =
      Database.findAll(
        entity,
        {
          includeDeleted: true,
          bypassOrganizationScope:
            true,
        }
      );

    if (!Array.isArray(rows)) {
      throw new Error(
        entity +
          " returned invalid rows"
      );
    }

    return rows;
  },

  _migrationId(item) {
    return this._hash(
      [
        item.Entity,
        item.RecordID ||
          "NO_ID",
        item.Fingerprint,
      ].join("|")
    );
  },

  _planId(rows) {
    return this._hash(
      rows
        .map(
          (row) =>
            row.MigrationID +
            ":" +
            row.Fingerprint
        )
        .sort()
        .join("|")
    ).slice(0, 24);
  },

  _snapshot() {
    return this._withBypass(
      "ORGANIZATION_SCOPE_SNAPSHOT",
      () => {
        const result = {
          entities: {},
          missing: [],
          allByEntity: {},
          organizations: {},
          errors: [],
          summary: {
            totalRows: 0,
            missingOrganizationID:
              0,
            failedEntities: 0,
          },
        };

        OrganizationScope
          .requiredEntities
          .forEach((entity) => {
            try {
              const metadata =
                this._metadata(
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
              const idField =
                this._idField(
                  entity,
                  metadata
                );
              const rows =
                this._readAll(
                  entity
                );
              const items =
                rows.map((row) => {
                  const item = {
                    Entity: entity,
                    Table:
                      metadata.table ||
                      "",
                    RecordID:
                      String(
                        row[idField] ||
                        ""
                      ).trim(),
                    Label:
                      this._label(
                        entity,
                        row,
                        idField
                      ),
                    Fingerprint:
                      this._fingerprint(
                        entity,
                        row
                      ),
                    ExpectedUpdatedAt:
                      String(
                        row.UpdatedAt ||
                        ""
                      ),
                    OrganizationID:
                      String(
                        row[key] ||
                        ""
                      ).trim(),
                    row,
                    idField,
                    key,
                    mode,
                  };

                  item.MigrationID =
                    this._migrationId(
                      item
                    );

                  return item;
                });
              const missing =
                mode === "GLOBAL"
                  ? []
                  : items.filter(
                    (item) =>
                      !item
                        .OrganizationID
                  );

              result
                .allByEntity[
                entity
              ] = items;
              result.entities[entity] = {
                status: "PASS",
                mode,
                key,
                idField,
                rows: rows.length,
                missingOrganizationID:
                  missing.length,
              };
              result.missing.push(
                ...missing
              );
              result.summary.totalRows +=
                rows.length;
              result.summary
                .missingOrganizationID +=
                missing.length;
            } catch (error) {
              result.entities[entity] = {
                status: "FAIL",
                error: error.message,
              };
              result.errors.push(
                entity +
                  ": " +
                  error.message
              );
              result.summary
                .failedEntities++;
            }
          });

        (
          result.allByEntity
            .ORGANIZATION || []
        ).forEach((item) => {
          if (
            item.RecordID &&
            !this._isTrue(
              item.row.Deleted
            )
          ) {
            result.organizations[
              item.RecordID
            ] = true;
          }
        });

        return result;
      }
    );
  },

  audit() {
    this._assertRuntime();

    const snapshot =
      this._snapshot();
    const report = {
      version: this.version,
      status:
        snapshot.errors.length ||
        snapshot.missing.length
          ? "REVIEW_REQUIRED"
          : "PASS",
      businessWrites: 0,
      planWrites: 0,
      entities:
        snapshot.entities,
      missing:
        snapshot.missing.map(
          (item) => ({
            MigrationID:
              item.MigrationID,
            Entity: item.Entity,
            RecordID:
              item.RecordID ||
              null,
            Label: item.Label,
          })
        ),
      errors: snapshot.errors,
      summary:
        snapshot.summary,
    };

    Logger.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );

    return report;
  },

  bootstrapAudit() {
    this._assertRuntime();

    const report = this.audit();
    let activeEmail = null;

    try {
      activeEmail =
        Session
          .getActiveUser()
          .getEmail() || null;
    } catch (error) {
      activeEmail = null;
    }

    return {
      version: report.version,
      status: report.status,
      businessWrites: 0,
      planWrites: 0,
      entities: report.entities,
      errors: report.errors,
      summary: report.summary,
      activeEmail,
      bootstrapOnly: true,
      note:
        "Read-only editor diagnostic; no user context was created",
    };
  },

  _prepare(actor) {
    const snapshot =
      this._snapshot();

    if (snapshot.errors.length) {
      throw new Error(
        "Migration snapshot failed: " +
          snapshot.errors.join("; ")
      );
    }

    const existing =
      OrganizationMigrationPlanStore
        .read();
    const preserved = {};

    if (existing) {
      existing.rows.forEach((row) => {
        preserved[
          row.MigrationID +
          "|" +
          row.Fingerprint
        ] = row;
      });
    }

    const rows =
      snapshot.missing
        .map((item) => {
          const previous =
            preserved[
              item.MigrationID +
              "|" +
              item.Fingerprint
            ] || {};
          const hasId =
            !!item.RecordID;

          return {
            MigrationID:
              item.MigrationID,
            Entity: item.Entity,
            Table: item.Table,
            RecordID:
              item.RecordID,
            Label: item.Label,
            Fingerprint:
              item.Fingerprint,
            ExpectedUpdatedAt:
              item
                .ExpectedUpdatedAt,
            ProposedOrganizationID:
              previous
                .ProposedOrganizationID ||
              "",
            Decision:
              previous.Decision ||
              "REVIEW",
            ValidationStatus:
              hasId
                ? "PENDING_REVIEW"
                : "MANUAL_ID_REQUIRED",
            ApplyStatus: "",
            AppliedAt: "",
            AppliedBy: "",
            Notes:
              previous.Notes ||
              (
                hasId
                  ? ""
                  : "RecordID is missing; choose SKIP and repair manually"
              ),
          };
        })
        .sort((left, right) =>
          (
            left.Entity +
            left.RecordID +
            left.MigrationID
          ).localeCompare(
            right.Entity +
            right.RecordID +
            right.MigrationID
          )
        );
    const planId =
      this._planId(rows);
    const plan = {
      planId,
      generatedAt:
        new Date().toISOString(),
      generatedBy:
        actor.Email ||
        actor.UserID,
      approval: "",
      status:
        rows.length
          ? "PREPARED"
          : "NO_LEGACY_ROWS",
      rows,
    };

    const saved =
      OrganizationMigrationPlanStore
        .write(plan);

    return {
      version: this.version,
      status: plan.status,
      planId,
      approvalPhrase:
        OrganizationMigrationPlanStore
          .approvalPhrase(
            planId
          ),
      sheet: saved.sheet,
      rows: rows.length,
      businessWrites: 0,
      planWrites: rows.length,
      next:
        rows.length
          ? "Review every row, set Decision to ASSIGN or SKIP, then validate"
          : "No migration required",
    };
  },

  prepare() {
    return TrustedEntryPoints.run(
      {
        permission:
          "DATA_MIGRATE",
        label:
          "Prepare organization migration",
      },
      (actor) =>
        this._prepare(actor)
    );
  },

  _validate(
    plan,
    options = {}
  ) {
    if (!plan) {
      throw new Error(
        "Migration plan not found"
      );
    }

    const snapshot =
      this._snapshot();
    const errors = [
      ...snapshot.errors,
    ];
    const warnings = [];
    const currentMissing = {};
    const currentByRecord = {};
    const planIds = {};
    let assignments = 0;
    let skipped = 0;
    let alreadyApplied = 0;

    snapshot.missing.forEach(
      (item) => {
        currentMissing[
          item.MigrationID
        ] = item;
      }
    );

    Object.keys(
      snapshot.allByEntity
    ).forEach((entity) => {
      snapshot
        .allByEntity[entity]
        .forEach((item) => {
          if (item.RecordID) {
            currentByRecord[
              entity +
              "|" +
              item.RecordID
            ] = item;
          }
        });
    });

    plan.rows.forEach((row) => {
      const migrationId =
        String(
          row.MigrationID || ""
        ).trim();
      const decision =
        String(
          row.Decision || ""
        )
          .trim()
          .toUpperCase();
      const proposed =
        String(
          row
            .ProposedOrganizationID ||
          ""
        ).trim();
      const current =
        currentMissing[
          migrationId
        ] || null;
      const existing =
        currentByRecord[
          row.Entity +
          "|" +
          row.RecordID
        ] || null;

      if (
        !migrationId ||
        planIds[migrationId]
      ) {
        errors.push(
          "Duplicate or empty MigrationID " +
            migrationId
        );
        row.ValidationStatus =
          "BLOCKED_DUPLICATE";
        return;
      }

      planIds[migrationId] = true;

      if (
        ![
          "ASSIGN",
          "SKIP",
        ].includes(decision)
      ) {
        errors.push(
          migrationId +
            " requires ASSIGN or SKIP"
        );
        row.ValidationStatus =
          "REVIEW_REQUIRED";
        return;
      }

      if (decision === "SKIP") {
        skipped++;
        row.ValidationStatus =
          "SKIPPED_BY_REVIEWER";
        return;
      }

      assignments++;

      if (!row.RecordID) {
        errors.push(
          migrationId +
            " has no RecordID"
        );
        row.ValidationStatus =
          "MANUAL_ID_REQUIRED";
        return;
      }

      if (!proposed) {
        errors.push(
          migrationId +
            " has no ProposedOrganizationID"
        );
        row.ValidationStatus =
          "ORGANIZATION_REQUIRED";
        return;
      }

      if (
        !snapshot
          .organizations[proposed]
      ) {
        errors.push(
          migrationId +
            " references unknown organization " +
            proposed
        );
        row.ValidationStatus =
          "ORGANIZATION_INVALID";
        return;
      }

      if (!current) {
        if (
          existing &&
          existing
            .OrganizationID ===
            proposed
        ) {
          alreadyApplied++;
          row.ValidationStatus =
            "ALREADY_APPLIED";
          row.ApplyStatus =
            row.ApplyStatus ||
            "APPLIED";
          return;
        }

        errors.push(
          migrationId +
            " is stale or record changed"
        );
        row.ValidationStatus =
          "STALE";
        return;
      }

      if (
        current.Fingerprint !==
        row.Fingerprint
      ) {
        errors.push(
          migrationId +
            " fingerprint mismatch"
        );
        row.ValidationStatus =
          "STALE";
        return;
      }

      row.ValidationStatus =
        "READY";
    });

    snapshot.missing.forEach(
      (item) => {
        if (
          !planIds[
            item.MigrationID
          ]
        ) {
          errors.push(
            "Plan does not cover " +
              item.MigrationID
          );
        }
      }
    );

    const expectedPlanId =
      this._planId(plan.rows);

    if (
      plan.planId !==
      expectedPlanId
    ) {
      errors.push(
        "PlanID does not match plan rows"
      );
    }

    const approvalExpected =
      OrganizationMigrationPlanStore
        .approvalPhrase(
          plan.planId
        );
    const approved =
      plan.approval ===
      approvalExpected;
    let status = "BLOCKED";

    if (!errors.length) {
      if (
        assignments ===
        alreadyApplied
      ) {
        status =
          "NOTHING_TO_APPLY";
      } else if (approved) {
        status =
          "READY_TO_APPLY";
      } else {
        status =
          "READY_FOR_APPROVAL";
        warnings.push(
          "Type " +
            approvalExpected +
            " into the Approval cell"
        );
      }
    }

    plan.status = status;

    if (
      options.persist === true
    ) {
      OrganizationMigrationPlanStore
        .write(plan);
    }

    return {
      version: this.version,
      status,
      planId: plan.planId,
      approved,
      approvalExpected,
      assignments,
      alreadyApplied,
      skipped,
      errors,
      warnings,
      businessWrites: 0,
      planWrites:
        options.persist === true
          ? plan.rows.length
          : 0,
      plan,
    };
  },

  validate() {
    return TrustedEntryPoints.run(
      {
        permission:
          "DATA_MIGRATE",
        label:
          "Validate organization migration",
      },
      () =>
        this._validate(
          OrganizationMigrationPlanStore
            .read(),
          {
            persist: true,
          }
        )
    );
  },

  _lock() {
    if (
      typeof LockService ===
        "undefined" ||
      typeof LockService
        .getScriptLock !==
        "function"
    ) {
      return {
        tryLock() {
          return true;
        },
        releaseLock() {},
      };
    }

    return LockService
      .getScriptLock();
  },

  _apply(actor) {
    const lock = this._lock();

    if (!lock.tryLock(30000)) {
      throw new Error(
        "Migration lock unavailable"
      );
    }

    let plan = null;
    let writes = 0;

    try {
      plan =
        OrganizationMigrationPlanStore
          .read();
      const validation =
        this._validate(
          plan,
          {
            persist: false,
          }
        );

      if (
        validation.status !==
        "READY_TO_APPLY"
      ) {
        throw new Error(
          "Migration is not ready: " +
            validation.status +
            (
              validation.errors.length
                ? " — " +
                  validation.errors
                    .join("; ")
                : ""
            )
        );
      }

      plan.status = "APPLYING";
      OrganizationMigrationPlanStore
        .write(plan);

      this._withBypass(
        "ORGANIZATION_SCOPE_APPLY",
        () => {
          plan.rows.forEach((row) => {
            if (
              String(row.Decision)
                .trim()
                .toUpperCase() !==
              "ASSIGN"
            ) {
              row.ApplyStatus =
                "SKIPPED";
              return;
            }

            if (
              row.ApplyStatus ===
                "APPLIED" ||
              row.ValidationStatus ===
                "ALREADY_APPLIED"
            ) {
              return;
            }

            try {
              const current =
                Database.find(
                  row.Entity,
                  row.RecordID,
                  {
                    includeDeleted:
                      true,
                    bypassOrganizationScope:
                      true,
                  }
                );

              if (!current) {
                throw new Error(
                  "Record not found"
                );
              }

              const currentOrganization =
                String(
                  current
                    .OrganizationID ||
                  ""
                ).trim();
              const proposed =
                String(
                  row
                    .ProposedOrganizationID
                ).trim();

              if (
                currentOrganization &&
                currentOrganization !==
                  proposed
              ) {
                throw new Error(
                  "OrganizationID already set to another organization"
                );
              }

              if (
                !currentOrganization &&
                this._fingerprint(
                  row.Entity,
                  current
                ) !==
                  row.Fingerprint
              ) {
                throw new Error(
                  "Record changed after validation"
                );
              }

              if (!currentOrganization) {
                Database.update(
                  row.Entity,
                  row.RecordID,
                  {
                    OrganizationID:
                      proposed,
                  },
                  {
                    bypassOrganizationScope:
                      true,
                  }
                );
                writes++;
              }

              const verified =
                Database.find(
                  row.Entity,
                  row.RecordID,
                  {
                    includeDeleted:
                      true,
                    bypassOrganizationScope:
                      true,
                  }
                );

              if (
                !verified ||
                String(
                  verified
                    .OrganizationID ||
                  ""
                ) !== proposed
              ) {
                throw new Error(
                  "OrganizationID verification failed"
                );
              }

              row.ApplyStatus =
                "APPLIED";
              row.AppliedAt =
                new Date()
                  .toISOString();
              row.AppliedBy =
                actor.Email ||
                actor.UserID;
              row.ValidationStatus =
                "APPLIED";

              OrganizationMigrationPlanStore
                .write(plan);
            } catch (error) {
              row.ApplyStatus =
                "FAILED";
              row.Notes =
                (
                  row.Notes
                    ? row.Notes +
                      " | "
                    : ""
                ) +
                error.message;
              plan.status =
                writes
                  ? "PARTIAL"
                  : "FAILED";
              OrganizationMigrationPlanStore
                .write(plan);
              throw error;
            }
          });
        }
      );

      plan.status = "APPLIED";
      OrganizationMigrationPlanStore
        .write(plan);

      return {
        version: this.version,
        status: "APPLIED",
        planId: plan.planId,
        businessWrites: writes,
        planWrites:
          plan.rows.length,
        applied:
          plan.rows.filter(
            (row) =>
              row.ApplyStatus ===
              "APPLIED"
          ).length,
        skipped:
          plan.rows.filter(
            (row) =>
              row.ApplyStatus ===
              "SKIPPED"
          ).length,
      };
    } finally {
      lock.releaseLock();
    }
  },

  apply() {
    return TrustedEntryPoints.run(
      {
        permission:
          "DATA_MIGRATE",
        label:
          "Apply organization migration",
      },
      (actor) =>
        this._apply(actor)
    );
  },
};

function runOrganizationScopeBootstrapAudit() {
  return OrganizationScopeMigration
    .bootstrapAudit();
}

function runOrganizationScopeAudit() {
  return TrustedEntryPoints.run(
    {
      permission:
        "DATA_MIGRATE",
      label:
        "Organization scope audit",
    },
    () =>
      OrganizationScopeMigration
        .audit()
  );
}

function prepareOrganizationScopeMigration() {
  return OrganizationScopeMigration
    .prepare();
}

function validateOrganizationScopeMigration() {
  return OrganizationScopeMigration
    .validate();
}

function applyOrganizationScopeMigration() {
  return OrganizationScopeMigration
    .apply();
}

globalThis.OrganizationScopeMigration =
  OrganizationScopeMigration;
