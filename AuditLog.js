const AuditLog = {

    write(action, entity, before, after) {

        const props = PropertiesService.getScriptProperties();

        const user = {
            userId: props.getProperty("CURRENT_USER") || "SYSTEM",
            role: props.getProperty("CURRENT_ROLE") || "SYSTEM"
        };

        const org = props.getProperty("CURRENT_ORG") || "UNKNOWN";

        const log = {
            id: Utilities.getUuid(),
            timestamp: new Date(),
            organizationId: org,
            userId: user.userId,
            role: user.role,
            action: action,
            entity: entity,
            before: before || null,
            after: after || null
        };

        const sheet = SpreadsheetApp.getActive()
            .getSheetByName("AuditLog") 
            || SpreadsheetApp.getActive().insertSheet("AuditLog");

        sheet.appendRow([
            log.id,
            log.timestamp,
            log.organizationId,
            log.userId,
            log.role,
            log.action,
            log.entity,
            JSON.stringify(log.before),
            JSON.stringify(log.after)
        ]);

        return log;
    }
};
