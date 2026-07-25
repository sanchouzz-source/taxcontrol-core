// ============================================================
// SchemaSnapshot.gs – снапшоты схемы
// ============================================================
const SchemaSnapshot = {
  _sheetName: '_SchemaSnapshots',

  save(version, hash, schema) {
    const schemaJSON = JSON.stringify(schema);
    SpreadsheetAdapter.appendRow(this._sheetName, [version, hash, schemaJSON, new Date().toISOString()]);
  },

  getSnapshots() {
    const rows = SpreadsheetAdapter.readRows(this._sheetName);
    return rows.map(r => ({
      version: parseInt(r[0], 10),
      hash: r[1],
      schema: r[2] ? JSON.parse(r[2]) : null,
      createdAt: r[3]
    }));
  },

  getSnapshot(version) {
    const snapshots = this.getSnapshots();
    return snapshots.find(s => s.version === version) || null;
  }
};