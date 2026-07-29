// ============================================================
// EventStore v2.0.0
// Organization-scoped legacy event log
// ============================================================

console.log("EventStore v2.0.0");

const EventStore = {
  version: "2.0.0",
  initialized: false,

  init() {
    this.initialized = true;
    return true;
  },

  getSheet() {
    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          "EventLog"
        );

    if (!sheet) {
      throw new Error(
        "EventLog sheet missing"
      );
    }

    return sheet;
  },

  log(eventType, payload) {
    const context =
      SecurityContext.require();
    const event = {
      EventID:
        IdService.generate("EVT"),
      EventType: eventType,
      Payload: JSON.stringify(
        payload || {}
      ),
      CreatedAt: new Date(),
      OrganizationID:
        context.OrganizationID,
    };

    this.getSheet().appendRow([
      event.EventID,
      event.EventType,
      event.Payload,
      event.CreatedAt,
      event.OrganizationID,
    ]);

    return event;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module: "EventStore",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized: this.initialized,
    };
  },
};

const EventReplay = {
  version: "2.0.0",

  replay() {
    SecurityGuard.require(
      "EVENT_REPLAY"
    );

    const organizationId =
      OrganizationContext.get();
    const values =
      EventStore.getSheet()
        .getDataRange()
        .getValues();

    if (!values.length) {
      return {
        replayed: 0,
        skipped: 0,
      };
    }

    const headers = values[0];
    let replayed = 0;
    let skipped = 0;

    values.slice(1)
      .forEach((valuesRow) => {
        const row = {};

        headers.forEach(
          (header, index) => {
            row[header] =
              valuesRow[index];
          }
        );

        if (
          String(
            row.OrganizationID ||
              ""
          ) !==
          String(organizationId)
        ) {
          skipped++;
          return;
        }

        const payload =
          JSON.parse(
            row.Payload || "{}"
          );

        EventBus.emit(
          row.EventType,
          payload,
          {
            source:
              "EventReplay",
            organizationId,
          }
        );

        replayed++;
      });

    return {
      replayed,
      skipped,
      organizationId,
    };
  },
};

globalThis.EventStore =
  EventStore;
globalThis.EventReplay =
  EventReplay;
