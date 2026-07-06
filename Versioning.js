const Versioning = {

    save(entity, id, data) {

        const sheet = SpreadsheetApp.getActive()
            .getSheetByName("Versions")
            || SpreadsheetApp.getActive().insertSheet("Versions");

        const version = {
            id: Utilities.getUuid(),
            timestamp: new Date(),
            organizationId: PropertiesService.getScriptProperties().getProperty("CURRENT_ORG"),
            entity: entity,
            entityId: id,
            snapshot: JSON.stringify(data)
        };

        sheet.appendRow([
            version.id,
            version.timestamp,
            version.organizationId,
            version.entity,
            version.entityId,
            version.snapshot
        ]);

        return version;
    }
};