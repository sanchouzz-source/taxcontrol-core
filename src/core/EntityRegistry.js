console.log("EntityRegistry");

const EntityRegistry = {

    version: "2.0.0",

    ready: false,

    /*
    ====================================================
    CORE
    ====================================================
    */

    CLIENT: {

        entity: "CLIENT",

        module: "core",

        table: "Clients",

        idField: "ClientID",

        idPrefix: "CLI",

        metadata: "CLIENT",

        repository: "ClientRepository",

        validator: "ClientValidator",

        audit: true,

        versioning: true,

        softDelete: true,

        timestamps: true,

        permissions: {

            create: PERMISSION_CLIENT_CREATE,
            read: PERMISSION_CLIENT_READ,
            update: PERMISSION_CLIENT_UPDATE,
            delete: PERMISSION_CLIENT_DELETE,
            restore: PERMISSION_CLIENT_RESTORE

        },

        events: {

            created: "CLIENT_CREATED",
            updated: "CLIENT_UPDATED",
            deleted: "CLIENT_DELETED",
            restored: "CLIENT_RESTORED"

        }

    },

    TRIP: {

        entity: "TRIP",

        module: "core",

        table: "Trips",

        idField: "TripID",

        idPrefix: "TRP",

        metadata: "TRIP",

        repository: "TripRepository",

        validator: "TripValidator",

        audit: true,

        versioning: true,

        softDelete: true,

        timestamps: true,

        permissions: {

            create: PERMISSION_TRIP_CREATE,
            read: PERMISSION_TRIP_READ,
            update: PERMISSION_TRIP_UPDATE,
            delete: PERMISSION_TRIP_DELETE,
            restore: PERMISSION_TRIP_RESTORE

        },

        events: {

            created: "TRIP_CREATED",
            updated: "TRIP_UPDATED",
            deleted: "TRIP_DELETED",
            restored: "TRIP_RESTORED"

        }

    },

    /*
    ====================================================
    FINANCE
    ====================================================
    */

    CLIENT_FINANCE_PROFILE: {

        entity: "CLIENT_FINANCE_PROFILE",

        module: "finance",

        table: "ClientFinanceProfiles",

        idField: "FinanceProfileID",

        idPrefix: "FP",

        metadata: "CLIENT_FINANCE_PROFILE",

        repository: "ClientFinanceProfileRepository",

        audit: true,

        versioning: true,

        softDelete: true,

        timestamps: true,

        permissions: {

            create: PERMISSION_CLIENT_CREATE,
            read: PERMISSION_CLIENT_READ,
            update: PERMISSION_CLIENT_UPDATE,
            delete: PERMISSION_CLIENT_DELETE,
            restore: PERMISSION_CLIENT_RESTORE

        },

        events: {

            created: "CLIENT_FINANCE_PROFILE_CREATED",
            updated: "CLIENT_FINANCE_PROFILE_UPDATED",
            deleted: "CLIENT_FINANCE_PROFILE_DELETED",
            restored: "CLIENT_FINANCE_PROFILE_RESTORED"

        }

    },

    FINANCIAL_TRANSACTION: {

        entity: "FINANCIAL_TRANSACTION",

        module: "finance",

        table: "FinancialTransactions",

        idField: "TransactionID",

        idPrefix: "FIN",

        metadata: "FINANCIAL_TRANSACTION",

        repository: "FinancialTransactionRepository",

        audit: false,

        versioning: false,

        softDelete: false,

        timestamps: true,

        permissions: {},

        events: {}

    },

    /*
    ====================================================
    AUDIT
    ====================================================
    */

    AUDIT: {

        entity: "AUDIT",

        module: "system",

        table: "AuditLog",

        idField: "AuditID",

        idPrefix: "AUD",

        metadata: "AUDIT",

        repository: "AuditRepository",

        audit: false,

        versioning: false,

        softDelete: false,

        timestamps: true,

        permissions: {},

        events: {}

    },

    /*
    ====================================================
    VERSION
    ====================================================
    */

    VERSION: {

        entity: "VERSION",

        module: "system",

        table: "Versions",

        idField: "VersionID",

        idPrefix: "VER",

        metadata: "VERSION",

        repository: "VersionRepository",

        audit: false,

        versioning: false,

        softDelete: false,

        timestamps: true,

        permissions: {},

        events: {}

    },

    /*
    ====================================================
    KPI
    ====================================================
    */

    KPI: {

        entity: "KPI",

        module: "analytics",

        table: "KPI",

        idField: "KPIID",

        idPrefix: "KPI",

        metadata: "KPI",

        repository: "KPIRepository",

        audit: false,

        versioning: false,

        softDelete: false,

        timestamps: true,

        permissions: {},

        events: {}

    }

};
EntityRegistry.get = function(entity) {

    const meta = this[entity];

    if (!meta || !meta.entity) {

        throw new Error(
            "Entity not registered: " + entity
        );

    }

    return meta;

};

EntityRegistry.has = function(entity) {

    return !!(
        this[entity] &&
        this[entity].entity
    );

};

EntityRegistry.list = function() {

    return Object.keys(this).filter(key => {

        const item = this[key];

        return (
            item &&
            typeof item === "object" &&
            item.entity
        );

    });

};

EntityRegistry.getTable = function(entity) {

    return this.get(entity).table;

};

EntityRegistry.getIdField = function(entity) {

    return this.get(entity).idField;

};

EntityRegistry.getIdPrefix = function(entity) {

    return this.get(entity).idPrefix;

};

EntityRegistry.getRepository = function(entity) {

    return this.get(entity).repository;

};

EntityRegistry.getValidator = function(entity) {

    return this.get(entity).validator;

};

EntityRegistry.getEvents = function(entity) {

    return this.get(entity).events;

};

EntityRegistry.getPermissions = function(entity) {

    return this.get(entity).permissions;

};

EntityRegistry.isAudited = function(entity) {

    return !!this.get(entity).audit;

};

EntityRegistry.isVersioned = function(entity) {

    return !!this.get(entity).versioning;

};

EntityRegistry.supportSoftDelete = function(entity) {

    return !!this.get(entity).softDelete;

};

EntityRegistry.supportTimestamps = function(entity) {

    return !!this.get(entity).timestamps;

};

EntityRegistry.register = function(name, config) {

    if (this.has(name)) {

        throw new Error(
            "Entity already registered: " + name
        );

    }

    this[name] = config;

    Logger.log(
        "ENTITY REGISTERED " + name
    );

};

EntityRegistry.health = function() {

    return HealthContract.create(

        "EntityRegistry",

        this.ready ? "OK" : "WARNING",

        {

            version: this.version,

            entities: this.list(),

            count: this.list().length

        }

    );

};
EntityRegistry.ready = true;

globalThis.EntityRegistry = EntityRegistry;

Logger.log(
    "EntityRegistry READY v" +
    EntityRegistry.version
);