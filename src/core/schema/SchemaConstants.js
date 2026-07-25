// ============================================================
// SchemaConstants.gs
// ============================================================
const SchemaConstants = {
  SYSTEM_TABLES: [
    '_SystemSchemaTables',
    '_SystemSchemaFields',
    '_SchemaHistory',
    '_SchemaVersions',
    '_SchemaIndexes',
    '_SchemaMigrations',
    '_MigrationLock',
    '_SchemaUIDMap',
    '_SchemaSnapshots'
  ],

  PROTECTED_FIELDS: [
    'id',
    'tenantId',
    'organizationId',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'isDeleted',
    'createdBy',
    'updatedBy'
  ],

  LIMITS: {
    MAX_TABLES: 500,
    MAX_FIELDS_PER_TABLE: 200,
    MAX_TOTAL_FIELDS: 10000
  },

  SYSTEM_SHEETS: [
    '_SystemSchemaTables',
    '_SystemSchemaFields',
    '_SchemaHistory',
    '_SchemaVersions',
    '_SchemaIndexes',
    '_SchemaMigrations',
    '_MigrationLock',
    '_SchemaUIDMap',
    '_SchemaSnapshots'
  ]
};