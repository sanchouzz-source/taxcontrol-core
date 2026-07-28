// ============================================================
// SchemaManager.gs
// ERP TexControl Core
//
// Version:
// SchemaManager v4.3.1
//
// Compatible:
// EntityMetadata v3.1+
// SchemaBuilder v4.1+
// EntityValidator v1.1+
// SchemaRegistry v4.0.6+
// EntityRegistry v2.6+
//
// Fixes:
// - Safe checks for SchemaBuilder, SchemaDiff, SchemaStorage
// - Added state tracking
// - Enhanced diagnostics and health with dependencies
// ============================================================

console.log("SchemaManager v4.3.1");

const SchemaManager = {
  version: "4.3.1",

  state: "CREATED",
  initialized: false,
  initializing: false,
  schema: {},
  lastError: null,
  startedAt: null,
  duration: 0,

  // ============================================================
  // INIT
  // ============================================================

  init(options = {}) {
    if (this.initialized) {
      Logger.debug("SchemaManager ALREADY READY");
      return this.schema;
    }

    if (this.initializing) {
      throw new Error("SchemaManager initialization already running");
    }

    this.initializing = true;
    this.state = "INITIALIZING";
    const start = Date.now();
    this.startedAt = new Date().toISOString();

    try {
      Logger.log("SCHEMA INIT START v" + this.version);

      // ====================================================
      // BUILD – безопасный вызов SchemaBuilder
      // ====================================================

      if (
        typeof SchemaBuilder === "undefined" ||
        typeof SchemaBuilder.build !== "function"
      ) {
        throw new Error("SchemaBuilder unavailable");
      }

      const built = SchemaBuilder.build();
      Logger.log("SCHEMA BUILT TABLES=" + Object.keys(built || {}).length);

      // ====================================================
      // NORMALIZE
      // ====================================================

      const normalized = this.normalizeSchema(built);
      Logger.log("SCHEMA NORMALIZED TABLES=" + Object.keys(normalized).length);

      // ====================================================
      // VALIDATE
      // ====================================================

      try {
        if (typeof SchemaValidator !== "undefined" && SchemaValidator.check) {
          SchemaValidator.check(normalized);
        }
      } catch (e) {
        Logger.warn("SchemaValidator WARNING " + e.message);
      }

      // ====================================================
      // LOAD STORAGE
      // ====================================================

      let stored = {};
      try {
        stored = SchemaStorage.load() || {};
      } catch (e) {
        Logger.warn("SchemaStorage LOAD skipped " + e.message);
      }

      // ====================================================
      // MERGE – безопасный вызов SchemaDiff
      // ====================================================

      let merged;
      if (
        typeof SchemaDiff !== "undefined" &&
        typeof SchemaDiff.merge === "function"
      ) {
        merged = SchemaDiff.merge(stored, normalized);
      } else {
        Logger.warn("SchemaDiff unavailable, using normalized schema");
        merged = normalized;
      }

      // ====================================================
      // FINAL VALIDATION
      // ====================================================

      this.validateEntities(merged);

      // ====================================================
      // SAVE – безопасный вызов SchemaStorage
      // ====================================================

      if (
        typeof SchemaStorage !== "undefined" &&
        typeof SchemaStorage.save === "function"
      ) {
        SchemaStorage.save(merged);
      } else {
        Logger.warn("SchemaStorage.save unavailable, skipping save");
      }

      // ====================================================
      // VERSION CONTROL
      // ====================================================

      const hash = this._computeHash(merged);
      const oldHash = SchemaStorage.getCurrentHash?.();

      if (hash !== oldHash) {
        const version = (SchemaStorage.getVersion?.() || 0) + 1;
        if (
          typeof SchemaStorage !== "undefined" &&
          typeof SchemaStorage.saveVersion === "function"
        ) {
          SchemaStorage.saveVersion(version, hash, "system");
        }

        if (typeof SchemaSnapshot !== "undefined" && SchemaSnapshot.save) {
          SchemaSnapshot.save(version, hash, merged);
        }

        Logger.log("SCHEMA VERSION " + version);
      }

      // ====================================================
      // CACHE
      // ====================================================

      this.schema = JSON.parse(JSON.stringify(merged));

      this.initialized = true;
      this.duration = Date.now() - start;
      this.lastError = null;
      this.state = "READY";

      Logger.log(
        "SchemaManager READY v" +
          this.version +
          " TABLES=" +
          this.getTables().length +
          " (" +
          this.duration +
          "ms)"
      );

      if (typeof SchemaEvents !== "undefined" && SchemaEvents.emit) {
        SchemaEvents.emit("SCHEMA_READY", {
          tables: this.getTables().length,
          version: this.version,
          duration: this.duration,
        });
      }

      return this.schema;
    } catch (e) {
      this.lastError = e.message;
      this.initialized = false;
      this.state = "FAILED";
      Logger.error("SchemaManager FAILED: " + e.message);
      throw e;
    } finally {
      this.initializing = false;
    }
  },

  // ============================================================
  // NORMALIZE SCHEMA
  // ============================================================

  normalizeSchema(schema) {
    const result = {};

    Object.keys(schema || {}).forEach((key) => {
      let meta = schema[key];
      if (!meta) return;

      // SAFE CLONE
      meta = JSON.parse(JSON.stringify(meta));

      // ENTITY
      if (typeof meta.entity === "object") {
        meta.entity = key;
      }
      meta.entity = meta.entity || key;

      // TABLE NORMALIZATION
      meta.table = this.normalizeTable(meta.table, key);

      // FIELDS
      let fields = meta.fields || meta.columns || [];

      // object fields
      if (!Array.isArray(fields) && typeof fields === "object") {
        fields = Object.keys(fields).map((name) => {
          return {
            name: name,
            ...(fields[name] || {}),
          };
        });
      }

      // fallback metadata
      if (
        fields.length === 0 &&
        typeof EntityMetadata !== "undefined" &&
        EntityMetadata.get
      ) {
        try {
          const source = EntityMetadata.get(key);
          if (source) {
            fields = source.fields || source.columns || [];
          }
        } catch (e) {}
      }

      meta.fields = this.normalizeFields(fields);

      // PRIMARY KEY
      meta.idField = this.normalizePrimaryKey(meta);

      // FLAGS
      meta.softDelete = meta.softDelete !== false;
      meta.timestamps = meta.timestamps !== false;
      meta.audit = meta.audit === true;

      result[key] = meta;
    });

    return result;
  },

  // ============================================================
  // NORMALIZE TABLE
  // ============================================================

  normalizeTable(table, key) {
    if (typeof table === "string" && table.length > 0) {
      return table;
    }

    // защита от вложенного объекта
    if (table && typeof table === "object") {
      if (typeof table.table === "string") return table.table;
      if (typeof table.name === "string") return table.name;
    }

    return key;
  },

  // ============================================================
  // NORMALIZE FIELDS
  // ============================================================

  normalizeFields(fields) {
    if (!fields) return [];
    if (!Array.isArray(fields)) return [];

    return fields
      .map((field) => {
        if (typeof field === "string") {
          return {
            name: field,
            type: "STRING",
            required: false,
            nullable: true,
          };
        }

        return {
          name: field.name || field.key || field.field || null,
          type: field.type || "STRING",
          required: field.required === true,
          nullable: field.nullable !== false,
          default: field.default,
          unique: field.unique === true,
          index: field.index === true,
        };
      })
      .filter((f) => f.name);
  },

  // ============================================================
  // NORMALIZE PRIMARY KEY
  // ============================================================

  normalizePrimaryKey(meta) {
    // новый формат
    if (meta.idField) {
      return meta.idField;
    }

    // primaryKey object
    if (meta.primaryKey && typeof meta.primaryKey === "object") {
      return meta.primaryKey.name || meta.primaryKey.field || "ID";
    }

    // primaryKey string
    if (typeof meta.primaryKey === "string") {
      return meta.primaryKey;
    }

    return "ID";
  },

  // ============================================================
  // VALIDATE
  // ============================================================

  validateEntities(schema) {
    Object.keys(schema || {}).forEach((name) => {
      const entity = schema[name];

      if (!entity.table) {
        throw new Error("Entity " + name + " missing table");
      }

      if (!entity.fields || entity.fields.length === 0) {
        throw new Error("Entity " + name + " has empty fields");
      }

      if (!entity.idField) {
        entity.idField = "ID";
      }
    });

    return true;
  },

  // ============================================================
  // HASH
  // ============================================================

  _computeHash(schema) {
    const json = this._canonicalStringify(schema);
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.newBlob(json).getBytes()
    );
    return bytes
      .map((b) => ("0" + ((b + 256) % 256).toString(16)).slice(-2))
      .join("");
  },

  _canonicalStringify(obj) {
    const sort = (value) => {
      if (Array.isArray(value)) {
        return value.map(sort);
      }
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

  // ============================================================
  // API
  // ============================================================

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

  // ============================================================
  // GET
  // ============================================================

  get(entity) {
    return this.getTableSchema(entity);
  },

  // ============================================================
  // HAS
  // ============================================================

  has(entity) {
    return !!this.schema[entity];
  },

  // ============================================================
  // RESET
  // ============================================================

  reset() {
    Logger.warn("SchemaManager RESET");
    this.initialized = false;
    this.initializing = false;
    this.schema = {};
    this.lastError = null;
    this.startedAt = null;
    this.duration = 0;
    this.state = "CREATED";
    return true;
  },

  // ============================================================
  // HEALTH
  // ============================================================

  health() {
    const status = this.initialized
      ? "OK"
      : this.lastError
      ? "FAILED"
      : "WARNING";

    const data = {
      version: this.version,
      state: this.state,
      initialized: this.initialized,
      tables: this.getTables().length,
      schemaVersion: this.getSchemaVersion(),
      duration: this.duration,
      lastError: this.lastError,
      dependencies: {
        SchemaBuilder: typeof SchemaBuilder !== "undefined",
        SchemaStorage: typeof SchemaStorage !== "undefined",
        SchemaDiff: typeof SchemaDiff !== "undefined",
        SchemaRegistry: typeof SchemaRegistry !== "undefined",
        EntityMetadata: typeof EntityMetadata !== "undefined",
      },
    };

    if (typeof HealthContract !== "undefined" && HealthContract.create) {
      return HealthContract.create("SchemaManager", status, data);
    }

    return {
      module: "SchemaManager",
      status: status,
      ...data,
    };
  },

  // ============================================================
  // DIAGNOSTICS
  // ============================================================

  diagnostics() {
    return {
      module: "SchemaManager",
      version: this.version,
      state: this.state,
      initialized: this.initialized,
      initializing: this.initializing,
      tables: this.getTables(),
      count: this.getTables().length,
      schemaVersion: this.getSchemaVersion(),
      startedAt: this.startedAt,
      duration: this.duration,
      lastError: this.lastError,
      dependencies: {
        SchemaBuilder: typeof SchemaBuilder !== "undefined",
        SchemaStorage: typeof SchemaStorage !== "undefined",
        SchemaDiff: typeof SchemaDiff !== "undefined",
        SchemaRegistry: typeof SchemaRegistry !== "undefined",
        EntityMetadata: typeof EntityMetadata !== "undefined",
      },
    };
  },
};

globalThis.SchemaManager = SchemaManager;

Logger.log("SchemaManager GLOBAL READY v" + SchemaManager.version);