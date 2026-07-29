// ============================================================
// ClientService v1.1.0
// TaxControl ERP
//
// Package F contract:
// - initialized only by SystemInit
// - supports ClientRepository and generic BaseRepository APIs
// - duplicate search always returns one client or null
// - repository owns CRUD event and audit publication
// ============================================================

console.log("ClientService v1.1.0");

const ClientService = {
  version: "1.1.0",
  entity: "CLIENT",
  initialized: false,

  init() {
    if (this.initialized) {
      return true;
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
          "ClientService repository API missing " +
            method
        );
      }
    });

    this.initialized = true;

    Logger.log(
      "ClientService READY v" +
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
        "ClientService is not initialized; call startERP()"
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
        "ClientService: RepositoryFactory unavailable"
      );
    }

    const repository =
      RepositoryFactory.get(
        this.entity
      );

    if (!repository) {
      throw new Error(
        "ClientService: CLIENT repository unavailable"
      );
    }

    return repository;
  },

  create(data) {
    this.requireReady();
    this.validate(data);

    const duplicate =
      this.findDuplicate(data);

    if (duplicate) {
      throw new Error(
        "Client duplicate found " +
          (
            duplicate.ClientID ||
            duplicate.ID ||
            duplicate.INN ||
            "unknown"
          )
      );
    }

    /*
     * BaseRepository is the only CRUD publisher and audit writer.
     * ClientService therefore delegates exactly one create call.
     */
    return this.getRepository().create(
      data
    );
  },

  findDuplicate(data = {}) {
    this.requireReady();

    const inn =
      String(data.INN || "").trim();

    if (!inn) {
      return null;
    }

    const repository =
      this.getRepository();
    let result = null;

    if (
      typeof repository.findByINN ===
      "function"
    ) {
      result =
        repository.findByINN(inn);
    } else if (
      typeof repository.findBy ===
      "function"
    ) {
      result =
        repository.findBy(
          "INN",
          inn
        );
    } else if (
      typeof repository.findOne ===
      "function"
    ) {
      result =
        repository.findOne({
          INN: inn,
        });
    } else if (
      typeof repository.findWhere ===
      "function"
    ) {
      result =
        repository.findWhere({
          INN: inn,
        });
    } else {
      result =
        repository.findAll({
          INN: inn,
        });
    }

    if (Array.isArray(result)) {
      return result.length
        ? result[0]
        : null;
    }

    return result || null;
  },

  validate(data) {
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      throw new Error(
        "Client data required"
      );
    }

    if (!data.OrganizationID) {
      throw new Error(
        "OrganizationID required"
      );
    }

    if (!data.Name) {
      throw new Error(
        "Client Name required"
      );
    }

    return true;
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
        (
          typeof repository.findByINN ===
            "function" ||
          typeof repository.findBy ===
            "function" ||
          typeof repository.findOne ===
            "function" ||
          typeof repository.findWhere ===
            "function"
        );
    } catch (healthError) {
      error = healthError.message;
    }

    return {
      module: "ClientService",
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

globalThis.ClientService =
  ClientService;

Logger.log(
  "ClientService GLOBAL READY v" +
    ClientService.version
);
