// ============================================================
// SchemaStorage.gs – хранение и загрузка схемы
// ============================================================
const SchemaStorage = {
  _tablesSheet: '_SystemSchemaTables',
  _fieldsSheet: '_SystemSchemaFields',
  _versionsSheet: '_SchemaVersions',
  _migrationsSheet: '_SchemaMigrations',

  // --- Таблицы ---
  loadTables() {
    const rows = SpreadsheetAdapter.readRows(this._tablesSheet);
    const result = {};
    for (const row of rows) {
      const [table, primaryKey, softDelete, timestamps, requireId] = row;
      result[table] = {
        table,
        primaryKey: primaryKey || null,
        softDelete: softDelete !== 'FALSE',
        timestamps: timestamps !== 'FALSE',
        requireId: requireId !== 'FALSE',
        fields: [],
        relations: {},
        indexes: [],
        uid: table
      };
    }
    return result;
  },

  saveTables(schema) {
    const rows = Object.entries(schema).map(([table, meta]) => [
      table,
      meta.primaryKey || '',
      meta.softDelete !== false ? 'TRUE' : 'FALSE',
      meta.timestamps !== false ? 'TRUE' : 'FALSE',
      meta.requireId !== false ? 'TRUE' : 'FALSE'
    ]);
    SpreadsheetAdapter.writeRows(
      this._tablesSheet,
      rows,
      ['table', 'primaryKey', 'softDelete', 'timestamps', 'requireId']
    );
  },

  // --- Поля ---
  loadFields() {
    const rows = SpreadsheetAdapter.readRows(this._fieldsSheet);
    const result = {};
    for (const row of rows) {
      const [table, field, type, required, defaultValue, unique, index, relation, nullable, active] = row;
      if (!result[table]) result[table] = [];
      result[table].push({
        name: field,
        type: type || 'STRING',
        required: required === 'TRUE',
        default: defaultValue || undefined,
        unique: unique === 'TRUE',
        index: index === 'TRUE',
        relation: relation || '',
        nullable: nullable === 'TRUE',
        active: active !== 'FALSE'
      });
    }
    return result;
  },

  saveFields(schema) {
    const rows = [];
    for (const [table, meta] of Object.entries(schema)) {
      if (!meta.fields) continue;
      for (const field of meta.fields) {
        rows.push([
          table,
          field.name,
          field.type || 'STRING',
          field.required ? 'TRUE' : 'FALSE',
          field.default !== undefined ? String(field.default) : '',
          field.unique ? 'TRUE' : 'FALSE',
          field.index ? 'TRUE' : 'FALSE',
          field.relation || '',
          field.nullable !== undefined ? (field.nullable ? 'TRUE' : 'FALSE') : (field.required ? 'FALSE' : 'TRUE'),
          field.active !== undefined ? (field.active ? 'TRUE' : 'FALSE') : 'TRUE'
        ]);
      }
    }
    SpreadsheetAdapter.writeRows(
      this._fieldsSheet,
      rows,
      ['table', 'field', 'type', 'required', 'default', 'unique', 'index', 'relation', 'nullable', 'active']
    );
  },

  // --- Версии ---
  getVersion() {
    const rows = SpreadsheetAdapter.readRows(this._versionsSheet);
    if (!rows.length) return 0;
    const versions = rows.map(r => ({ version: parseInt(r[0], 10), hash: r[2] }));
    versions.sort((a, b) => b.version - a.version);
    return versions.length ? versions[0].version : 0;
  },

  getCurrentHash() {
    const rows = SpreadsheetAdapter.readRows(this._versionsSheet);
    if (!rows.length) return null;
    const sorted = rows.map(r => ({ version: parseInt(r[0], 10), hash: r[2] }))
      .sort((a, b) => b.version - a.version);
    return sorted.length ? sorted[0].hash : null;
  },

  saveVersion(version, hash, author) {
    SpreadsheetAdapter.appendRow(this._versionsSheet, [
      version,
      new Date().toISOString(),
      hash,
      author || 'system'
    ]);
  },

  // --- Миграции ---
  getMigrations() {
    const rows = SpreadsheetAdapter.readRows(this._migrationsSheet);
    return rows.map(r => ({
      id: r[0],
      version: r[1],
      action: r[2],
      status: r[3],
      date: r[4],
      rollback: r[5] || ''
    }));
  },

  saveMigration(id, version, action, status, rollback) {
    SpreadsheetAdapter.appendRow(this._migrationsSheet, [
      id,
      version,
      action,
      status,
      new Date().toISOString(),
      rollback || ''
    ]);
  },

  // --- Полная загрузка/сохранение ---
  load() {
    const tables = this.loadTables();
    const fields = this.loadFields();
    for (const [table, fieldList] of Object.entries(fields)) {
      if (tables[table]) {
        tables[table].fields = fieldList;
      }
    }
    return tables;
  },

  save(schema) {
    this.saveTables(schema);
    this.saveFields(schema);
  }
};