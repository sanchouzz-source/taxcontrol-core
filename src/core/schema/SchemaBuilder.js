// ============================================================
// SchemaBuilder.gs – построение схемы из метаданных
// ============================================================
const SchemaBuilder = {
  build() {
    const schema = {};
    const registry = typeof SchemaRegistry !== 'undefined' && SchemaRegistry.list
      ? SchemaRegistry
      : null;

    const entities = registry
      ? (registry.list() || [])
      : (typeof EntityMetadata !== 'undefined' ? (EntityMetadata.list() || []) : []);

    for (const item of entities) {
      let meta;
      try {
        if (typeof item === 'string') {
          meta = registry ? registry.get(item) : EntityMetadata.get(item);
        } else {
          meta = { ...item };
        }
      } catch (e) {
        Logger.warn('Failed to get metadata for ' + JSON.stringify(item));
        continue;
      }
      if (!meta || !meta.table) continue;
      const table = meta.table;
      const fields = this.extractFields(meta);
      if (!fields.length) {
        throw new Error('Entity ' + (meta.entity || meta.name || 'unknown') + ' has no fields');
      }
      schema[table] = {
        table,
        primaryKey: meta.primaryKey || meta.idField || null,
        fields,
        softDelete: meta.softDelete !== false,
        timestamps: meta.timestamps !== false,
        requireId: meta.requireId !== false,
        relations: meta.relations || {},
        indexes: meta.indexes || [],
        uid: meta.uid || table
      };
    }
    return schema;
  },

  extractFields(meta) {
    if (!meta) return [];
    let raw = Array.isArray(meta.fields) ? meta.fields : (Array.isArray(meta.columns) ? meta.columns : []);
    return raw.map(f => {
      if (typeof f === 'string') {
        return { name: f, type: 'STRING', required: false, active: true };
      }
      const name = f.name || f.key || f.field || f.column;
      if (!name) return null;
      return {
        name,
        type: f.type || 'STRING',
        required: f.required === true,
        default: f.default,
        unique: f.unique === true,
        format: f.format || null,
        maxLength: f.maxLength || null,
        generated: f.generated === true,
        onDelete: f.onDelete || null,
        precision: f.precision || null,
        scale: f.scale || null,
        values: f.values || null,
        index: f.index === true,
        relation: f.relation || null,
        nullable: f.nullable !== undefined ? f.nullable : !f.required,
        active: f.active !== undefined ? f.active : true
      };
    }).filter(Boolean);
  }
};