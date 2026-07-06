const EventStore = {

    log(eventType, payload) {

        const sheet = SpreadsheetApp
            .getActiveSpreadsheet()
            .getSheetByName("EventLog");

        const event = {
            EventID: IdService.generate("EVT"),
            EventType: eventType,
            Payload: JSON.stringify(payload || {}),
            CreatedAt: new Date(),
            OrganizationID:
                PropertiesService.getScriptProperties().getProperty("CURRENT_ORG")
        };

        const row = [
            event.EventID,
            event.EventType,
            event.Payload,
            event.CreatedAt,
            event.OrganizationID
        ];

        sheet.appendRow(row);

        return event;
    }
};

const EventReplay = {

    replay() {

        const sheet = SpreadsheetApp
            .getActiveSpreadsheet()
            .getSheetByName("EventLog");

        const values = sheet.getDataRange().getValues();
        const headers = values[0];

        for (let i = 1; i < values.length; i++) {

            const row = {};

            headers.forEach((h, idx) => {
                row[h] = values[i][idx];
            });

            const payload = JSON.parse(row.Payload || "{}");

            const handlers = EventBus.handlers[row.EventType];

            if (!handlers) continue;

            handlers.forEach(fn => {
                try {
                    fn(payload);
                } catch (e) {
                    Logger.log("Replay error: " + e.message);
                }
            });
        }
    }
};