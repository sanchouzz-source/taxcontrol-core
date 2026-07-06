const HistoryService = {

    get(entity, entityId) {

        const sheet = SpreadsheetApp.getActive()
            .getSheetByName("Versions");

        if (!sheet) return [];

        const data = sheet.getDataRange().getValues();

        return data
            .filter(r => r[3] === entity && r[4] === entityId)
            .map(r => ({
                id: r[0],
                timestamp: r[1],
                snapshot: JSON.parse(r[5])
            }));
    }
};