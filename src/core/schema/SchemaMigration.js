// ============================================================
// SchemaMigration.gs – управление миграциями
// ============================================================
const SchemaMigration = {
  _sheetName: '_SchemaMigrations',

  getAll() {
    return SchemaStorage.getMigrations();
  },

  isApplied(id) {
    const all = this.getAll();
    return all.some(m => m.id === id && m.status === 'DONE');
  },

  record(id, version, action, status, rollback) {
    SchemaStorage.saveMigration(id, version, action, status, rollback);
  },

  rollback(id) {
    const migrations = this.getAll();
    const migration = migrations.find(m => m.id === id);
    if (!migration) throw new Error('Migration not found: ' + id);
    if (!migration.rollback) throw new Error('No rollback script for migration ' + id);
    // Выполняем rollback (eval – осторожно, но в GAS допустимо)
    const fn = eval('(' + migration.rollback + ')');
    if (typeof fn === 'function') {
      fn();
      // Обновляем статус
      const sheet = SpreadsheetAdapter.getSheet(this._sheetName);
      const data = SpreadsheetAdapter.readRows(this._sheetName);
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
          const rowIndex = i + 2;
          sheet.getRange(rowIndex, 4).setValue('ROLLED_BACK');
          break;
        }
      }
    } else {
      throw new Error('Rollback script is not a function');
    }
  }
};