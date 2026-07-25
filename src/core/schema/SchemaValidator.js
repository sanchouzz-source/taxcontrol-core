// ============================================================
// SchemaValidator.gs – валидация схемы
// ============================================================
const SchemaValidator = {
  check(schema) {
    const tableCount = Object.keys(schema).length;
    if (tableCount > SchemaConstants.LIMITS.MAX_TABLES) {
      throw new Error('Too many tables: ' + tableCount + ' (max ' + SchemaConstants.LIMITS.MAX_TABLES + ')');
    }
    let totalFields = 0;
    for (const [table, meta] of Object.entries(schema)) {
      const fieldCount = meta.fields ? meta.fields.length : 0;
      if (fieldCount > SchemaConstants.LIMITS.MAX_FIELDS_PER_TABLE) {
        throw new Error('Table ' + table + ' has too many fields: ' + fieldCount + ' (max ' + SchemaConstants.LIMITS.MAX_FIELDS_PER_TABLE + ')');
      }
      totalFields += fieldCount;
    }
    if (totalFields > SchemaConstants.LIMITS.MAX_TOTAL_FIELDS) {
      throw new Error('Too many total fields: ' + totalFields + ' (max ' + SchemaConstants.LIMITS.MAX_TOTAL_FIELDS + ')');
    }

    // Проверка primary key
    for (const [table, meta] of Object.entries(schema)) {
      if (meta.requireId !== false) {
        let pk = meta.primaryKey;
        if (!pk) {
          const activeFields = meta.fields.filter(f => f.active !== false);
          const possible = activeFields.find(f => f.name.toLowerCase() === 'id' || f.name.endsWith('ID'));
          if (possible) pk = possible.name;
        }
        if (!pk) {
          throw new Error('Table ' + table + ' missing primary key');
        }
      }
    }
    return true;
  }
};