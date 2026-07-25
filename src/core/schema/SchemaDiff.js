// ============================================================
// SchemaDiff.gs – сравнение и слияние схем
// ============================================================
const SchemaDiff = {
  merge(oldSchema, newSchema, strategy = 'KEEP_HISTORY') {
    const result = JSON.parse(JSON.stringify(oldSchema));

    for (const [table, incomingMeta] of Object.entries(newSchema)) {
      if (!result[table]) {
        result[table] = JSON.parse(JSON.stringify(incomingMeta));
        continue;
      }
      const existingMap = new Map();
      result[table].fields.forEach(f => existingMap.set(f.name, f));

      for (const field of incomingMeta.fields) {
        if (existingMap.has(field.name)) {
          if (strategy === 'STRICT') {
            const idx = result[table].fields.findIndex(f => f.name === field.name);
            if (idx !== -1) result[table].fields[idx] = JSON.parse(JSON.stringify(field));
          }
          if (strategy === 'KEEP_HISTORY') {
            const existing = existingMap.get(field.name);
            if (existing.active === false) existing.active = true;
          }
        } else {
          result[table].fields.push(JSON.parse(JSON.stringify(field)));
        }
      }

      if (strategy === 'STRICT') {
        const incomingNames = new Set(incomingMeta.fields.map(f => f.name));
        result[table].fields = result[table].fields.filter(f => incomingNames.has(f.name));
      }

      // Обновляем свойства
      const defaults = {
        primaryKey: null,
        softDelete: true,
        timestamps: true,
        requireId: true,
        relations: {},
        indexes: [],
        uid: table
      };
      for (const key of ['primaryKey', 'softDelete', 'timestamps', 'requireId', 'relations', 'indexes', 'uid']) {
        if (result[table][key] === undefined && incomingMeta[key] !== undefined) {
          result[table][key] = JSON.parse(JSON.stringify(incomingMeta[key]));
        }
      }
    }
    return result;
  },

  compare(oldSchema, newSchema) {
    // Анализ изменений (для отчёта)
    const added = [];
    const removed = [];
    const changed = [];
    const tables = new Set([...Object.keys(oldSchema), ...Object.keys(newSchema)]);
    for (const table of tables) {
      const a = oldSchema[table];
      const b = newSchema[table];
      if (!a) {
        added.push(table);
        continue;
      }
      if (!b) {
        removed.push(table);
        continue;
      }
      // Сравниваем поля
      const fieldsA = a.fields.filter(f => f.active !== false).map(f => f.name);
      const fieldsB = b.fields.filter(f => f.active !== false).map(f => f.name);
      const all = new Set([...fieldsA, ...fieldsB]);
      const addedFields = [];
      const removedFields = [];
      const changedFields = [];
      for (const field of all) {
        const fA = a.fields.find(f => f.name === field);
        const fB = b.fields.find(f => f.name === field);
        if (!fA) removedFields.push(field);
        else if (!fB) addedFields.push(field);
        else if (fA.type !== fB.type || fA.required !== fB.required) {
          changedFields.push({ field, from: { type: fB.type, required: fB.required }, to: { type: fA.type, required: fA.required } });
        }
      }
      if (addedFields.length || removedFields.length || changedFields.length) {
        changed.push({ table, addedFields, removedFields, changedFields });
      }
    }
    return { added, removed, changed };
  }
};