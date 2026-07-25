// ============================================================
// SchemaUID.gs – управление UID (переименования)
// ============================================================
const SchemaUID = {
  _sheetName: '_SchemaUIDMap',

  getMap() {
    const rows = SpreadsheetAdapter.readRows(this._sheetName);
    const map = {};
    for (const row of rows) {
      map[row[0]] = {
        oldName: row[1],
        currentName: row[2],
        updatedAt: row[3]
      };
    }
    return map;
  },

  update(uid, newName) {
    const sheet = SpreadsheetAdapter.getOrCreateSheet(this._sheetName, ['uid', 'oldName', 'currentName', 'updatedAt']);
    const data = SpreadsheetAdapter.readRows(this._sheetName);
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === uid) {
        // обновить существующую запись (строка i+2)
        const rowIndex = i + 2;
        sheet.getRange(rowIndex, 3).setValue(newName);
        sheet.getRange(rowIndex, 4).setValue(new Date().toISOString());
        found = true;
        break;
      }
    }
    if (!found) {
      SpreadsheetAdapter.appendRow(this._sheetName, [uid, newName, newName, new Date().toISOString()]);
    }
  },

  resolve(uid) {
    const map = this.getMap();
    return map[uid] ? map[uid].currentName : null;
  }
};