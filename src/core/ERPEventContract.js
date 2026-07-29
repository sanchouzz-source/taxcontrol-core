// ============================================================
// ERPEventContract v2.0.0
// Canonical TaxControl ERP Event Envelope
//
// Package E contract:
// - one envelope for entity, domain, module and system events
// - stable top-level compatibility aliases
// - synchronous Google Apps Script lifecycle
// - entity lifecycle events require entity and entityId
// ============================================================

console.log("ERPEventContract v2.0.0");

const ERPEventContract = {
  version: "2.0.0",
  contractVersion: "2.0",
  initialized: false,
  sequence: 0,

  init() {
    if (this.initialized) {
      return true;
    }

    this.initialized = true;
    this._log(
      "log",
      "ERPEventContract READY v" + this.version
    );
    return true;
  },

  reset() {
    this.sequence = 0;
    this.initialized = false;
    return true;
  },

  _log(level, message) {
    const logger = globalThis.Logger;

    if (
      logger &&
      typeof logger[level] === "function"
    ) {
      logger[level](message);
      return;
    }

    const target =
      typeof console[level] === "function"
        ? console[level]
        : console.log;

    target.call(console, message);
  },

  generateId() {
    this.sequence++;

    const time = Date.now().toString(36);
    const counter = this.sequence
      .toString(36)
      .padStart(6, "0");

    return "EVT" + time + counter;
  },

  generateCorrelationId() {
    const random = Math.random()
      .toString(36)
      .slice(2, 10);

    return (
      "COR" +
      Date.now().toString(36) +
      random
    );
  },

  normalizeName(value) {
    return String(value || "")
      .trim()
      .replace(/[\s.-]+/g, "_")
      .replace(/_+/g, "_")
      .toUpperCase();
  },

  entityFromName(name) {
    const normalized = this.normalizeName(name);
    const lifecycle =
      /_(CREATED|UPDATED|DELETED|RESTORED)$/;

    if (!lifecycle.test(normalized)) {
      return "";
    }

    return normalized.replace(lifecycle, "");
  },

  typeFromName(name) {
    const normalized = this.normalizeName(name);
    const parts = normalized.split("_");
    return parts[parts.length - 1] || "UNKNOWN";
  },

  actionFromType(type) {
    const map = {
      CREATED: "CREATE",
      UPDATED: "UPDATE",
      DELETED: "DELETE",
      RESTORED: "RESTORE",
    };

    return map[type] || type || "UNKNOWN";
  },

  kindFrom(name, entity, metadata) {
    if (metadata && metadata.kind) {
      return String(metadata.kind).toUpperCase();
    }

    if (entity) {
      return "ENTITY";
    }

    const normalized = this.normalizeName(name);

    if (normalized.indexOf("MODULE_") === 0) {
      return "MODULE";
    }

    if (normalized.indexOf("SCHEMA_") === 0) {
      return "SCHEMA";
    }

    if (normalized.indexOf("ERP_") === 0) {
      return "SYSTEM";
    }

    return "DOMAIN";
  },

  _pascalEntity(entity) {
    return String(entity || "")
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1)
      )
      .join("");
  },

  _candidateObjects(params, payload) {
    return [
      params.after,
      params.before,
      payload,
      params.data,
    ].filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
    );
  },

  findEntityId(entity, params, payload) {
    if (
      params.entityId !== undefined &&
      params.entityId !== null &&
      params.entityId !== ""
    ) {
      return params.entityId;
    }

    const expected =
      this._pascalEntity(entity) + "ID";
    const candidates =
      this._candidateObjects(params, payload);

    for (const item of candidates) {
      const direct = [
        item[expected],
        item.entityId,
        item.EntityID,
        item.id,
        item.ID,
      ].find(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== ""
      );

      if (direct !== undefined) {
        return direct;
      }

      const key = Object.keys(item).find(
        (field) =>
          /id$/i.test(field) &&
          !/^organizationid$/i.test(field) &&
          item[field] !== undefined &&
          item[field] !== null &&
          item[field] !== ""
      );

      if (key) {
        return item[key];
      }
    }

    return "";
  },

  findOrganizationId(params, payload) {
    const metadata = params.metadata || {};

    if (metadata.organizationId) {
      return metadata.organizationId;
    }

    if (metadata.tenantId) {
      return metadata.tenantId;
    }

    const candidates =
      this._candidateObjects(params, payload);

    for (const item of candidates) {
      if (item.OrganizationID) {
        return item.OrganizationID;
      }

      if (item.organizationId) {
        return item.organizationId;
      }
    }

    return null;
  },

  _payload(params) {
    if (
      Object.prototype.hasOwnProperty.call(
        params,
        "payload"
      )
    ) {
      return params.payload;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        params,
        "data"
      )
    ) {
      return params.data;
    }

    if (params.after !== undefined) {
      return params.after;
    }

    if (params.before !== undefined) {
      return params.before;
    }

    return null;
  },

  normalize(params) {
    if (
      !params ||
      typeof params !== "object" ||
      Array.isArray(params)
    ) {
      throw new Error(
        "ERPEventContract: params must be an object"
      );
    }

    const metadata = {
      ...(params.metadata || {}),
    };

    let name = this.normalizeName(
      params.name || params.event
    );

    let entity = this.normalizeName(
      params.entity || ""
    );

    let type = this.normalizeName(
      params.type || ""
    );

    if (!name && entity && type) {
      name = entity + "_" + type;
    }

    if (!type && name) {
      type = this.typeFromName(name);
    }

    if (!entity && name) {
      entity = this.entityFromName(name);
    }

    const payload = this._payload(params);
    const source =
      params.source ||
      metadata.source ||
      "ERP";
    const timestamp =
      params.timestamp ||
      metadata.timestamp ||
      new Date().toISOString();
    const version =
      params.version ||
      metadata.version ||
      "1.0";
    const organizationId =
      this.findOrganizationId(params, payload);
    const kind = this.kindFrom(
      name,
      entity,
      metadata
    );

    const event = {
      id: params.id || this.generateId(),
      eventId:
        params.eventId ||
        params.id ||
        null,
      correlationId:
        params.correlationId ||
        metadata.correlationId ||
        this.generateCorrelationId(),
      causationId:
        params.causationId ||
        metadata.causationId ||
        null,

      name,
      event: name,
      type: type || "UNKNOWN",
      action:
        this.normalizeName(
          params.action || ""
        ) ||
        this.actionFromType(type),
      kind,

      entity: entity || null,
      entityId: this.findEntityId(
        entity,
        params,
        payload
      ) || null,

      payload,
      data: payload,
      before:
        params.before !== undefined
          ? params.before
          : null,
      after:
        params.after !== undefined
          ? params.after
          : null,

      source,
      user:
        params.user ||
        metadata.user ||
        metadata.userId ||
        null,
      organizationId,
      timestamp,
      version,

      metadata: {
        ...metadata,
        source,
        userId:
          metadata.userId ||
          params.userId ||
          null,
        tenantId:
          metadata.tenantId ||
          params.tenantId ||
          organizationId ||
          null,
        organizationId,
        timestamp,
        version,
        retryCount:
          Number(metadata.retryCount || 0),
        kind,
        contractVersion:
          this.contractVersion,
      },
    };

    event.eventId = event.eventId || event.id;
    return event;
  },

  create(params) {
    if (!this.initialized) {
      this.init();
    }

    const event = this.normalize(params);
    const validation = this.validate(event);

    if (!validation.valid) {
      throw new Error(
        "INVALID ERP EVENT: " +
        validation.errors.join("; ")
      );
    }

    return event;
  },

  validate(event) {
    const errors = [];

    if (
      !event ||
      typeof event !== "object" ||
      Array.isArray(event)
    ) {
      return {
        valid: false,
        error: "Event must be an object",
        errors: ["Event must be an object"],
      };
    }

    [
      "id",
      "name",
      "type",
      "source",
      "timestamp",
    ].forEach((field) => {
      if (!event[field]) {
        errors.push("Missing " + field);
      }
    });

    if (
      !event.metadata ||
      typeof event.metadata !== "object"
    ) {
      errors.push("Missing metadata");
    }

    if (event.kind === "ENTITY") {
      if (!event.entity) {
        errors.push("Missing entity");
      }

      if (!event.entityId) {
        errors.push("Missing entityId");
      }
    }

    if (
      event.timestamp &&
      Number.isNaN(
        new Date(event.timestamp).getTime()
      )
    ) {
      errors.push("Invalid timestamp");
    }

    return {
      valid: errors.length === 0,
      error: errors[0] || null,
      errors,
    };
  },

  isCanonical(event) {
    return !!(
      event &&
      event.metadata &&
      event.metadata.contractVersion ===
        this.contractVersion &&
      this.validate(event).valid
    );
  },

  payloadOf(event) {
    if (!event) {
      return null;
    }

    return (
      event.after ??
      event.payload ??
      event.data ??
      event.before ??
      null
    );
  },

  health() {
    const details = {
      version: this.version,
      contractVersion: this.contractVersion,
      initialized: this.initialized,
      sequence: this.sequence,
    };

    if (
      typeof HealthContract !== "undefined" &&
      typeof HealthContract.create === "function"
    ) {
      return HealthContract.create(
        "ERPEventContract",
        this.initialized ? "OK" : "WARNING",
        details
      );
    }

    return {
      module: "ERPEventContract",
      status:
        this.initialized ? "OK" : "WARNING",
      ...details,
    };
  },
};

globalThis.ERPEventContract = ERPEventContract;
