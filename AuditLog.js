// ============================================================
// AuditLog v2.2.0
// TaxControl ERP Core
//
// Package F contract:
// - AUDIT is an entity, never a physical table name at Database API level
// - AuditRepository is the single persistence route
// - query methods use repository criteria, not identifier lookup
// - SystemInit owns init/reset
// - actor and organization come only from SecurityContext
// - no DEFAULT/SYSTEM fallback is used for an unauthenticated request
// - terminal audit persistence runs as a trusted internal operation
// ============================================================

console.log("AuditLog v2.2.0");

const AuditLog = {
  version: "2.2.0",
  entity: "AUDIT",
  ready: false,

  init() {
    if (this.ready) {
      return true;
    }

    if (
      typeof EntityRegistry ===
        "undefined" ||
      typeof EntityRegistry.has !==
        "function" ||
      !EntityRegistry.has(this.entity)
    ) {
      throw new Error(
        "AuditLog entity not registered: " +
          this.entity
      );
    }

    const repository =
      this.getRepository();

    [
      "create",
      "findAll",
    ].forEach((method) => {
      if (
        typeof repository[method] !==
        "function"
      ) {
        throw new Error(
          "AuditLog repository API missing " +
            method
        );
      }
    });

    this.ready = true;

    Logger.log(
      "AuditLog READY v" +
        this.version
    );

    return true;
  },

  reset() {
    this.ready = false;
    return true;
  },

  requireReady() {
    if (!this.ready) {
      throw new Error(
        "AuditLog is not initialized; call startERP()"
      );
    }
  },

  getRepository() {
    if (
      typeof AuditRepository !==
        "undefined"
    ) {
      return AuditRepository;
    }

    if (
      typeof RepositoryFactory !==
        "undefined" &&
      typeof RepositoryFactory.get ===
        "function"
    ) {
      return RepositoryFactory.get(
        this.entity
      );
    }

    throw new Error(
      "AuditLog repository unavailable"
    );
  },

  write(data) {
    this.requireReady();

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "Audit data missing"
      );
    }

    const record = {
      AuditID:
        data.AuditID ||
        IdService.generate(
          this.entity
        ),
      OrganizationID:
        this.getOrganizationID(),
      Entity:
        data.entity ||
        data.Entity ||
        "",
      EntityID:
        data.entityId ||
        data.EntityID ||
        "",
      Action:
        data.action ||
        data.Action ||
        "SYSTEM",
      UserID:
        this.getUserID(),
      EventID:
        data.eventId ||
        data.EventID ||
        "",
      Before:
        this.serialize(
          data.before ??
          data.Before
        ),
      After:
        this.serialize(
          data.after ??
          data.After
        ),
      Source:
        data.source ||
        data.Source ||
        "ERP",
      Version:
        Number(
          data.version ||
          data.Version ||
          1
        ),
      EntityVersion:
        Number(
          data.entityVersion ||
          data.EntityVersion ||
          1
        ),
      CreatedAt:
        data.CreatedAt ||
        new Date().toISOString(),
    };

    this.insert(record);

    return record;
  },

  insert(record) {
    this.requireReady();

    const write = () =>
      this.getRepository().create(
        record
      );
    const result =
      typeof SecurityGuard !==
        "undefined" &&
      typeof SecurityGuard
        .runInternal === "function"
        ? SecurityGuard
          .runInternal(write)
        : write();

    Logger.log(
      "AUDIT " +
        record.Action +
        " " +
        record.Entity +
        " " +
        record.EntityID
    );

    return result;
  },

  findByEntity(entity, id) {
    this.requireReady();

    const repository =
      this.getRepository();

    if (
      typeof repository.findByEntity ===
      "function"
    ) {
      return repository.findByEntity(
        entity,
        id
      );
    }

    return repository.findWhere({
      Entity: entity,
      EntityID: id,
    });
  },

  findByEvent(eventId) {
    this.requireReady();

    const repository =
      this.getRepository();

    if (
      typeof repository.findByEvent ===
      "function"
    ) {
      return repository.findByEvent(
        eventId
      );
    }

    return repository.findWhere({
      EventID: eventId,
    });
  },

  serialize(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value);
  },

  getOrganizationID() {
    if (
      typeof SecurityContext !==
        "undefined" &&
      typeof SecurityContext
        .getOrganizationId ===
        "function"
    ) {
      return SecurityContext
        .getOrganizationId();
    }

    throw new Error(
      "AuditLog security context unavailable"
    );
  },

  getUserID() {
    if (
      typeof SecurityContext !==
        "undefined" &&
      typeof SecurityContext
        .getUserId === "function"
    ) {
      return SecurityContext
        .getUserId();
    }

    throw new Error(
      "AuditLog user context unavailable"
    );
  },

  health() {
    let repositoryReady = false;
    let error = null;

    try {
      const repository =
        this.getRepository();

      repositoryReady =
        typeof repository.create ===
          "function" &&
        typeof repository.findAll ===
          "function";
    } catch (healthError) {
      error = healthError.message;
    }

    const details = {
      version: this.version,
      entity: this.entity,
      ready: this.ready,
      repositoryReady,
      error,
    };

    const status =
      this.ready &&
      repositoryReady
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "AuditLog",
        status,
        details
      );
    }

    return {
      module: "AuditLog",
      status,
      ...details,
    };
  },
};

globalThis.AuditLog =
  AuditLog;

Logger.log(
  "AuditLog GLOBAL READY v" +
    AuditLog.version
);
