// ============================================================
// SchemaManager.gs – основной оркестратор
// ============================================================
const SchemaManager = {
  version: '4.0.0',
  initialized: false,
  schema: {},

  init(options = {}) {
    if (this.initialized) {
      Logger.debug('SchemaManager ALREADY READY');
      return;
    }

    const syncMode = options.syncMode || 'SAFE';
    const environment = options.environment || 'DEV';

    return SchemaLock.withLock(() => {
      Logger.log('SCHEMA INIT START v' + this.version);

      // 1. Построить схему из метаданных
      const built = SchemaBuilder.build();

      // 2. Проверить лимиты
      SchemaValidator.check(built);

      // 3. Загрузить существующую схему из хранилища
      const stored = SchemaStorage.load();

      // 4. Сравнить и объединить
      const merged = SchemaDiff.merge(stored, built);

      // 5. Сохранить в хранилище
      SchemaStorage.save(merged);

      // 6. Создать снапшот
      const newHash = this._computeHash(merged);
      const currentHash = SchemaStorage.getCurrentHash();
      if (newHash !== currentHash) {
        const currentVersion = SchemaStorage.getVersion();
        const newVersion = currentVersion + 1;
        SchemaStorage.saveVersion(newVersion, newHash, 'system');
        SchemaSnapshot.save(newVersion, newHash, merged);
        Logger.log('Schema version bumped to ' + newVersion);
      }

      // 7. Обновить UID map
      for (const [table, meta] of Object.entries(merged)) {
        if (meta.uid) {
          SchemaUID.update(meta.uid, table);
        }
      }

      // 8. Сохранить в память
      this.schema = merged;
      this.initialized = true;

      Logger.log(
        'SchemaManager READY v' + this.version +
        ' TABLES=' + Object.keys(this.schema).length
      );

      SchemaEvents.emit('SCHEMA_READY', {
        tables: Object.keys(this.schema).length,
        version: this.version
      });
    });
  },

  _computeHash(schema) {
    const json = this._canonicalStringify(schema);
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.newBlob(json).getBytes()
    );
    return bytes.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
  },

  _canonicalStringify(obj) {
    const sortKeys = (o) => {
      if (Array.isArray(o)) return o.map(sortKeys);
      if (o !== null && typeof o === 'object') {
        const keys = Object.keys(o).sort();
        const result = {};
        for (const k of keys) {
          result[k] = sortKeys(o[k]);
        }
        return result;
      }
      return o;
    };
    return JSON.stringify(sortKeys(obj));
  },

  getSchema() {
    return JSON.parse(JSON.stringify(this.schema));
  },

  getTables() {
    return Object.keys(this.schema);
  },

  getTableSchema(table) {
    return this.schema[table] ? JSON.parse(JSON.stringify(this.schema[table])) : null;
  },

  getSchemaVersion() {
    return SchemaStorage.getVersion();
  },

  health() {
    return {
      module: 'SchemaManager',
      status: this.initialized ? 'OK' : 'WARNING',
      version: this.version,
      schemaVersion: this.getSchemaVersion(),
      tables: this.getTables().length,
      initialized: this.initialized
    };
  }
};

globalThis.SchemaManager = SchemaManager;