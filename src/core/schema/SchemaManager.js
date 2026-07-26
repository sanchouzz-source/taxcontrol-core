// ============================================================
// SchemaManager.gs
// ERP TexControl Core
// Schema orchestration layer
// ============================================================

console.log("SchemaManager");

const SchemaManager = {
  version: "4.1.1",
  initialized: false,
  schema: {},

  // Минимальные поля для автогенерации
  MINIMAL_FIELDS: [
    { name: "id", type: "STRING", required: true },
    { name: "createdAt", type: "DATE" },
    { name: "updatedAt", type: "DATE" }
  ],

  init(options = {}) {
    if (this.initialized) {
      Logger.debug("SchemaManager ALREADY READY");
      return this.schema;
    }

    const syncMode = options.syncMode || "SAFE";
    const environment = options.environment || "DEV";

    return SchemaLock.withLock(() => {
      Logger.log("SCHEMA INIT START v" + this.version);

      try {
        // ====================================================
        // 1. BUILD SCHEMA FROM REGISTRY
        // ====================================================
        const built = SchemaBuilder.build();
        Logger.log("SCHEMA BUILT TABLES=" + Object.keys(built).length);

        // ====================================================
        // 2. VALIDATE (с защитой от падения)
        // ====================================================
        try {
          SchemaValidator.check(built);
        } catch (e) {
          Logger.warn(
            "SchemaValidator WARNING (continuing): " + e.message
          );
        }

        // ====================================================
        // 3. LOAD STORED SCHEMA
        // ====================================================
        let stored = {};
        try {
          stored = SchemaStorage.load() || {};
        } catch (e) {
          Logger.warn("SchemaStorage LOAD skipped: " + e.message);
        }

        // ====================================================
        // 4. MERGE
        // ====================================================
        const merged = SchemaDiff.merge(stored, built);

        // ====================================================
        // 5. АВТОДОПОЛНЕНИЕ ПОЛЕЙ (НОВОЕ)
        // ====================================================
        let tablesWithMissingFields = 0;
        for (const [table, meta] of Object.entries(merged)) {
          if (!meta.fields || meta.fields.length === 0) {
            // Генерируем минимальные поля
            meta.fields = this.MINIMAL_FIELDS.map(f => ({ ...f }));
            if (!meta.idField) meta.idField = "id";
            Logger.warn(
              `AUTO-GENERATED fields for table "${table}" (was empty)`
            );
            tablesWithMissingFields++;
          }
        }
        if (tablesWithMissingFields > 0) {
          Logger.log(
            `Auto-generated fields for ${tablesWithMissingFields} tables`
          );
        }

        // ====================================================
        // 6. SAVE
        // ====================================================
        SchemaStorage.save(merged);

        // ====================================================
        // 7. VERSION CONTROL
        // ====================================================
        const hash = this._computeHash(merged);
        const oldHash = SchemaStorage.getCurrentHash?.();

        if (hash !== oldHash) {
          const version = (SchemaStorage.getVersion?.() || 0) + 1;
          SchemaStorage.saveVersion(version, hash, "system");
          SchemaSnapshot.save(version, hash, merged);
          Logger.log("Schema version bumped " + version);
        }

        // ====================================================
        // 8. UID UPDATE
        // ====================================================
        Object.entries(merged).forEach(([table, meta]) => {
          if (meta.uid) {
            SchemaUID.update(meta.uid, table);
          }
        });

        // ====================================================
        // 9. MEMORY CACHE
        // ====================================================
        this.schema = JSON.parse(JSON.stringify(merged));
        this.initialized = true;

        Logger.log(
          `SchemaManager READY v${this.version} TABLES=${Object.keys(this.schema).length}`
        );

        SchemaEvents.emit("SCHEMA_READY", {
          tables: Object.keys(this.schema).length,
          version: this.version
        });

        return this.schema;
      } catch (e) {
        Logger.error("SchemaManager FAILED: " + e.message);
        throw e;
      }
    });
  },

  // ==========================================================
  // HASH
  // ==========================================================
  _computeHash(schema) {
    const json = this._canonicalStringify(schema);
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.newBlob(json).getBytes()
    );
    return bytes
      .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2))
      .join("");
  },

  _canonicalStringify(obj) {
    const sort = value => {
      if (Array.isArray(value)) return value.map(sort);
      if (value && typeof value === "object") {
        return Object.keys(value)
          .sort()
          .reduce((r, k) => {
            r[k] = sort(value[k]);
            return r;
          }, {});
      }
      return value;
    };
    return JSON.stringify(sort(obj));
  },

  // ==========================================================
  // API
  // ==========================================================
  getSchema() {
    return JSON.parse(JSON.stringify(this.schema));
  },

  getTables() {
    return Object.keys(this.schema);
  },

  getTableSchema(table) {
    return this.schema[table]
      ? JSON.parse(JSON.stringify(this.schema[table]))
      : null;
  },

  getSchemaVersion() {
    return SchemaStorage.getVersion?.() || 0;
  },

  health() {
    return {
      module: "SchemaManager",
      status: this.initialized ? "OK" : "WARNING",
      version: this.version,
      schemaVersion: this.getSchemaVersion(),
      tables: this.getTables().length,
      initialized: this.initialized
    };
  }
};

globalThis.SchemaManager = SchemaManager;
Logger.log("SchemaManager READY v" + SchemaManager.version);