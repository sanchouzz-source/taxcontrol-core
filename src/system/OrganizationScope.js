// ============================================================
// OrganizationScope v1.0.0
// Mandatory tenant isolation for TaxControl ERP entities
//
// Scope modes:
// - FIELD: row.OrganizationID must equal the active organization
// - ENTITY: Organization.OrganizationID itself is the scope key
// - GLOBAL: explicitly unscoped technical test metadata only
// ============================================================

console.log("OrganizationScope v1.0.0");

const OrganizationScope = {
  version: "1.0.0",
  initialized: false,

  requiredEntities: [
    "ORGANIZATION",
    "USER",
    "CLIENT",
    "TRIP",
    "VEHICLE",
    "DRIVER",
    "CARRIER",
    "ROUTE",
    "CARGO",
    "TRANSPORT_ORDER",
    "CLIENT_FINANCE_PROFILE",
    "FINANCIAL_TRANSACTION",
    "KPI",
    "AUDIT",
    "VERSION",
    "FAILED_EVENT",
  ],

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof SecurityContext ===
        "undefined"
    ) {
      throw new Error(
        "OrganizationScope requires SecurityContext"
      );
    }

    if (
      typeof EntityMetadata ===
        "undefined" ||
      typeof EntityMetadata.get !==
        "function"
    ) {
      throw new Error(
        "OrganizationScope requires EntityMetadata"
      );
    }

    const errors = this.validate();

    if (errors.length) {
      throw new Error(
        "OrganizationScope metadata invalid: " +
          errors.join("; ")
      );
    }

    this.initialized = true;

    Logger.log(
      "OrganizationScope READY v" +
        this.version
    );

    return true;
  },

  resolveEntity(entity) {
    if (
      typeof EntityRegistry !==
        "undefined" &&
      typeof EntityRegistry.resolve ===
        "function"
    ) {
      try {
        return EntityRegistry.resolve(
          entity
        );
      } catch (error) {
        // Fall back to normalized input below.
      }
    }

    return String(entity || "")
      .trim()
      .toUpperCase();
  },

  getMeta(entity, provided = null) {
    if (provided) {
      return provided;
    }

    const name =
      this.resolveEntity(entity);

    if (
      typeof EntityMetadata !==
        "undefined" &&
      typeof EntityMetadata.get ===
        "function"
    ) {
      try {
        const metadata =
          EntityMetadata.get(name);

        if (metadata) {
          return metadata;
        }
      } catch (error) {
        // Continue to normalized registries.
      }
    }

    if (
      typeof EntityRegistry !==
        "undefined" &&
      typeof EntityRegistry.get ===
        "function"
    ) {
      try {
        return EntityRegistry.get(name);
      } catch (error) {
        return null;
      }
    }

    return null;
  },

  fieldNames(metadata) {
    if (
      !metadata ||
      !metadata.fields
    ) {
      return [];
    }

    if (Array.isArray(metadata.fields)) {
      return metadata.fields
        .map((field) =>
          typeof field === "string"
            ? field
            : field.name
        )
        .filter(Boolean);
    }

    return Object.keys(
      metadata.fields
    );
  },

  mode(entity, metadata = null) {
    const name =
      this.resolveEntity(entity);
    const meta =
      this.getMeta(
        name,
        metadata
      );

    if (
      meta &&
      (
        meta.organizationScope ===
          false ||
        meta.organizationScope ===
          "GLOBAL" ||
        meta.organization === false
      )
    ) {
      return "GLOBAL";
    }

    if (name === "ORGANIZATION") {
      return "ENTITY";
    }

    const fields =
      this.fieldNames(meta);

    if (
      (
        meta &&
        (
          meta.organizationScope ===
            true ||
          meta.organizationScope ===
            "FIELD" ||
          meta.organization === true
        )
      ) ||
      fields.includes(
        "OrganizationID"
      )
    ) {
      return "FIELD";
    }

    return "GLOBAL";
  },

  key(entity, metadata = null) {
    const mode =
      this.mode(entity, metadata);

    if (mode === "ENTITY") {
      const meta =
        this.getMeta(
          entity,
          metadata
        );

      return (
        meta &&
        (
          meta.idField ||
          meta.primaryKey
        )
      ) || "OrganizationID";
    }

    return mode === "FIELD"
      ? "OrganizationID"
      : null;
  },

  isScoped(entity, metadata = null) {
    return (
      this.mode(
        entity,
        metadata
      ) !== "GLOBAL"
    );
  },

  _canBypass(options = {}) {
    const context =
      SecurityContext.get();

    return !!(
      options
        .bypassOrganizationScope ===
        true &&
      context &&
      context.System === true &&
      context.Role === "SYSTEM" &&
      context
        .BypassOrganizationScope ===
        true
    );
  },

  _organization(options = {}) {
    if (this._canBypass(options)) {
      return null;
    }

    return SecurityContext
      .getOrganizationId();
  },

  _same(left, right) {
    return (
      String(left || "") ===
      String(right || "")
    );
  },

  prepareCreate(
    entity,
    data,
    options = {}
  ) {
    const metadata =
      options.metadata ||
      this.getMeta(entity);
    const mode =
      this.mode(
        entity,
        metadata
      );
    const payload = {
      ...(data || {}),
    };

    if (
      mode === "GLOBAL" ||
      this._canBypass(options)
    ) {
      return payload;
    }

    const organizationId =
      this._organization(options);
    const key =
      this.key(entity, metadata);

    if (mode === "ENTITY") {
      if (!payload[key]) {
        throw new Error(
          "ORGANIZATION provisioning requires explicit system context"
        );
      }

      if (
        !this._same(
          payload[key],
          organizationId
        )
      ) {
        throw new Error(
          "CROSS_ORGANIZATION_ACCESS_DENIED"
        );
      }

      return payload;
    }

    if (!payload[key]) {
      payload[key] =
        organizationId;
    }

    if (
      !this._same(
        payload[key],
        organizationId
      )
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    return payload;
  },

  scopeCriteria(
    entity,
    criteria = {},
    options = {}
  ) {
    const metadata =
      options.metadata ||
      this.getMeta(entity);
    const mode =
      this.mode(
        entity,
        metadata
      );
    const scoped = {
      ...(criteria || {}),
    };

    if (
      mode === "GLOBAL" ||
      this._canBypass(options)
    ) {
      return scoped;
    }

    const key =
      this.key(entity, metadata);
    const organizationId =
      this._organization(options);

    if (
      scoped[key] !== undefined &&
      !this._same(
        scoped[key],
        organizationId
      )
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    scoped[key] = organizationId;

    return scoped;
  },

  canReadRecord(
    entity,
    record,
    options = {}
  ) {
    if (!record) {
      return false;
    }

    const metadata =
      options.metadata ||
      this.getMeta(entity);
    const mode =
      this.mode(
        entity,
        metadata
      );

    if (
      mode === "GLOBAL" ||
      this._canBypass(options)
    ) {
      return true;
    }

    const key =
      this.key(entity, metadata);
    const organizationId =
      this._organization(options);

    return this._same(
      record[key],
      organizationId
    );
  },

  filterRecord(
    entity,
    record,
    options = {}
  ) {
    return this.canReadRecord(
      entity,
      record,
      options
    )
      ? record
      : null;
  },

  filterRows(
    entity,
    rows,
    options = {}
  ) {
    const source =
      Array.isArray(rows)
        ? rows
        : [];

    return source.filter((record) =>
      this.canReadRecord(
        entity,
        record,
        options
      )
    );
  },

  prepareUpdate(
    entity,
    existing,
    changes,
    options = {}
  ) {
    const metadata =
      options.metadata ||
      this.getMeta(entity);
    const mode =
      this.mode(
        entity,
        metadata
      );
    const payload = {
      ...(changes || {}),
    };

    if (
      mode === "GLOBAL" ||
      this._canBypass(options)
    ) {
      return payload;
    }

    if (
      !this.canReadRecord(
        entity,
        existing,
        {
          ...options,
          metadata,
        }
      )
    ) {
      throw new Error(
        String(entity) +
          " not found"
      );
    }

    const key =
      this.key(entity, metadata);

    if (
      payload[key] !== undefined &&
      !this._same(
        payload[key],
        existing[key]
      )
    ) {
      throw new Error(
        "ORGANIZATION_SCOPE_IMMUTABLE"
      );
    }

    if (mode === "FIELD") {
      payload[key] = existing[key];
    }

    return payload;
  },

  validate() {
    const errors = [];

    this.requiredEntities
      .forEach((entity) => {
        const metadata =
          EntityMetadata.get(entity);

        if (!metadata) {
          errors.push(
            entity + " metadata missing"
          );
          return;
        }

        if (
          this.mode(
            entity,
            metadata
          ) === "GLOBAL"
        ) {
          errors.push(
            entity +
              " has no organization scope"
          );
        }
      });

    return errors;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    const errors =
      typeof EntityMetadata !==
        "undefined"
        ? this.validate()
        : [
            "EntityMetadata unavailable",
          ];
    const details = {
      version: this.version,
      initialized: this.initialized,
      required:
        this.requiredEntities.length,
      errors,
    };
    const status =
      this.initialized &&
      errors.length === 0
        ? "OK"
        : "WARNING";

    if (
      typeof HealthContract !==
        "undefined" &&
      typeof HealthContract.create ===
        "function"
    ) {
      return HealthContract.create(
        "OrganizationScope",
        status,
        details
      );
    }

    return {
      module: "OrganizationScope",
      status,
      ...details,
    };
  },
};

globalThis.OrganizationScope =
  OrganizationScope;
