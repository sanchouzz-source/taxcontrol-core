console.log("AuditEventHandler v3.0");

const AuditEventHandler = {
  version: "3.0.0",
  ready: false,
  processing: false, // Защита от реентерабельности

  // ---------- ИНИЦИАЛИЗАЦИЯ ----------
  init() {
    if (this.ready) {
      Logger.log("AuditEventHandler ALREADY READY");
      return;
    }

    if (typeof EventBus === "undefined") {
      throw new Error("AuditEventHandler: EventBus unavailable");
    }

    // Подписываемся на ВСЕ события через "*"
    EventBus.subscribe("*", this.onAnyEvent.bind(this), {
      name: "AuditEventHandler_Global"
    });

    this.ready = true;
    Logger.log("AuditEventHandler READY v" + this.version);
  },

  // ---------- ФИЛЬТР СИСТЕМНЫХ СУЩНОСТЕЙ ----------
  shouldAudit(entityName) {
    const ignored = ["AUDIT", "VERSION"];
    return !ignored.includes(entityName);
  },

  // ---------- ОБРАБОТЧИК ВСЕХ СОБЫТИЙ ----------
  onAnyEvent(envelope) {
    // Защита от повторного входа (циклов)
    if (this.processing) {
      Logger.debug("AUDIT SKIP REENTRY");
      return;
    }

    this.processing = true;

    try {
      // Извлекаем имя события и сущность
      const eventName = envelope.event;
      const entity = envelope.entity || envelope.Entity;

      // Если нет сущности или она системная – пропускаем
      if (!entity) {
        Logger.debug("AUDIT SKIP: no entity in event " + eventName);
        return;
      }

      if (!this.shouldAudit(entity)) {
        Logger.debug("AUDIT SKIP: system entity " + entity);
        return;
      }

      // Создаём запись аудита
      this.createAudit(envelope);
    } catch (error) {
      Logger.error("AUDIT EVENT ERROR " + error.message);
    } finally {
      this.processing = false;
    }
  },

  // ---------- СОЗДАНИЕ ЗАПИСИ АУДИТА ----------
  createAudit(envelope) {
    const auditData = {
      entity: envelope.entity || "UNKNOWN",
      entityId: envelope.entityId || "",
      action: this.resolveAction(envelope.event),
      organizationId: envelope.metadata?.organizationId || envelope.OrganizationID || "DEFAULT",
      userId: envelope.metadata?.userId || "SYSTEM",
      event: envelope.event,
      source: envelope.metadata?.source || "ERP",
      before: envelope.before || null,
      after: envelope.after || null,
      version: envelope.version || 1,
      timestamp: envelope.timestamp || new Date().toISOString()
    };

    // Используем AuditLog для записи (если доступен)
    if (typeof AuditLog !== "undefined" && AuditLog.write) {
      AuditLog.write(auditData);
    } else {
      Logger.warn("AuditLog.write not available, skipping audit for " + envelope.event);
    }
  },

  // ---------- ОПРЕДЕЛЕНИЕ ДЕЙСТВИЯ ПО ИМЕНИ СОБЫТИЯ ----------
  resolveAction(eventName) {
    if (eventName.includes("CREATED")) return "CREATE";
    if (eventName.includes("UPDATED")) return "UPDATE";
    if (eventName.includes("DELETED")) return "DELETE";
    if (eventName.includes("RESTORED")) return "RESTORE";
    return "SYSTEM";
  },

  // ---------- HEALTH ----------
  health() {
    return HealthContract.create(
      "AuditEventHandler",
      this.ready ? "OK" : "NOT_READY",
      {
        version: this.version,
        subscriptions: 1, // подписка на "*"
        processing: this.processing
      }
    );
  }
};

globalThis.AuditEventHandler = AuditEventHandler;
Logger.log("AuditEventHandler LOADED v3.1.0");