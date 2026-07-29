// ============================================================
// TransportOrderService v1.1.0
// TaxControl ERP
//
// Package F contract:
// - initialized only by SystemInit
// - repository owns CRUD lifecycle events and CRUD audit
// - service publishes only distinct business actions
// ============================================================

console.log(
  "TransportOrderService v1.1.0"
);

const TransportOrderService = {
  version: "1.1.0",
  entity: "TRANSPORT_ORDER",
  initialized: false,

  init() {
    if (this.initialized) {
      return true;
    }

    const repository =
      this.getRepository();

    [
      "create",
      "update",
      "findById",
    ].forEach((method) => {
      if (
        typeof repository[method] !==
        "function"
      ) {
        throw new Error(
          "TransportOrderService repository API missing " +
            method
        );
      }
    });

    this.initialized = true;

    Logger.log(
      "TransportOrderService READY v" +
        this.version
    );

    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  requireReady() {
    if (!this.initialized) {
      throw new Error(
        "TransportOrderService is not initialized; call startERP()"
      );
    }
  },

  getRepository() {
    if (
      typeof RepositoryFactory ===
        "undefined" ||
      typeof RepositoryFactory.get !==
        "function"
    ) {
      throw new Error(
        "TransportOrderService: RepositoryFactory unavailable"
      );
    }

    const repository =
      RepositoryFactory.get(
        this.entity
      );

    if (!repository) {
      throw new Error(
        "TransportOrderService: repository unavailable"
      );
    }

    return repository;
  },

  create(data) {
    this.requireReady();
    this.validateCreate(data);

    /*
     * BaseRepository creates the TRANSPORT_ORDER_CREATED event and
     * the CREATE audit record. The service delegates exactly once.
     */
    return this.getRepository().create(
      data
    );
  },

  assignVehicle(
    orderId,
    vehicleId,
    driverId
  ) {
    this.requireReady();
    this.requireId(
      orderId,
      "orderId"
    );
    this.requireId(
      vehicleId,
      "vehicleId"
    );

    const order =
      this.getRepository().update(
        orderId,
        {
          VehicleID: vehicleId,
          DriverID: driverId || "",
          Status: "ASSIGNED",
        }
      );

    this.publishBusinessEvent(
      "TRANSPORT_ORDER_ASSIGNED",
      order,
      "ASSIGN"
    );

    this.writeBusinessAudit(
      "ASSIGN",
      order
    );

    return order;
  },

  complete(orderId, finance = {}) {
    this.requireReady();
    this.requireId(
      orderId,
      "orderId"
    );

    const revenue =
      Number(finance.revenue || 0);
    const cost =
      Number(finance.cost || 0);

    const order =
      this.getRepository().update(
        orderId,
        {
          Status: "COMPLETED",
          Revenue: revenue,
          Cost: cost,
          Margin: revenue - cost,
        }
      );

    this.publishBusinessEvent(
      "TRANSPORT_ORDER_COMPLETED",
      order,
      "COMPLETE"
    );

    this.writeBusinessAudit(
      "COMPLETE",
      order
    );

    return order;
  },

  validateCreate(data) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "TransportOrder data required"
      );
    }

    [
      "OrganizationID",
      "ClientID",
    ].forEach((field) => {
      if (!data[field]) {
        throw new Error(
          "TransportOrder required field: " +
            field
        );
      }
    });

    return true;
  },

  requireId(value, name) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      throw new Error(
        "TransportOrderService " +
          name +
          " required"
      );
    }
  },

  entityId(order) {
    return (
      order?.TransportOrderID ||
      order?.ID ||
      null
    );
  },

  publishBusinessEvent(
    eventName,
    order,
    action
  ) {
    if (
      typeof EventBus ===
        "undefined" ||
      typeof EventBus.publish !==
        "function"
    ) {
      return false;
    }

    return EventBus.publish(
      eventName,
      {
        entity: this.entity,
        entityId:
          this.entityId(order),
        action,
        before: null,
        after: order,
        payload: order,
        source:
          "TransportOrderService",
        metadata: {
          kind: "BUSINESS_ACTION",
        },
      },
      {
        source:
          "TransportOrderService",
      }
    );
  },

  writeBusinessAudit(action, order) {
    if (
      typeof AuditLog ===
        "undefined" ||
      typeof AuditLog.write !==
        "function"
    ) {
      return false;
    }

    AuditLog.write({
      action,
      entity: this.entity,
      entityId:
        this.entityId(order),
      before: null,
      after: order,
      source:
        "TransportOrderService",
    });

    return true;
  },

  health() {
    let repositoryReady = false;
    let error = null;

    try {
      const repository =
        this.getRepository();

      repositoryReady = [
        "create",
        "update",
        "findById",
      ].every(
        (method) =>
          typeof repository[method] ===
          "function"
      );
    } catch (healthError) {
      error = healthError.message;
    }

    return {
      module:
        "TransportOrderService",
      version: this.version,
      initialized:
        this.initialized,
      repositoryReady,
      status:
        this.initialized &&
        repositoryReady
          ? "OK"
          : "NOT_READY",
      error,
    };
  },
};

globalThis.TransportOrderService =
  TransportOrderService;

Logger.log(
  "TransportOrderService GLOBAL READY v" +
    TransportOrderService.version
);
