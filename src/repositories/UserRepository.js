// ============================================================
// UserRepository v1.0.0
// Managed repository for USER membership rows
//
// Package I contract:
// - one USER row represents one organization membership
// - reads remain available through the normal repository API
// - every mutation requires UserMembershipService ownership
// - BaseRepository remains the only CRUD event and audit publisher
// - lifecycle is owned by RepositoryRegistry
// ============================================================

console.log("UserRepository v1.0.0");

const UserRepository = {
  version: "1.0.0",
  entity: "USER",
  table: "Users",
  managedBy:
    "UserMembershipService",
  initialized: false,
  base: null,

  init() {
    if (this.initialized) {
      return true;
    }

    if (
      typeof BaseRepository ===
        "undefined" ||
      typeof BaseRepository
        .createRepository !==
        "function"
    ) {
      throw new Error(
        "UserRepository requires BaseRepository"
      );
    }

    this.base =
      BaseRepository.createRepository(
        this.entity
      );
    this.initialized = true;

    Logger.log(
      "UserRepository READY v" +
        this.version
    );

    return true;
  },

  reset() {
    this.base = null;
    this.initialized = false;
    return true;
  },

  getBase() {
    if (!this.initialized) {
      this.init();
    }

    return this.base;
  },

  _requireId(id, method) {
    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ""
    ) {
      throw new Error(
        "UserRepository." +
          method +
          ": UserID required"
      );
    }

    return String(id).trim();
  },

  _requireManaged(
    options,
    method
  ) {
    const source =
      options &&
      String(
        options.managedBy || ""
      ).trim();

    if (source !== this.managedBy) {
      throw new Error(
        "MANAGED_USER_MUTATION_REQUIRED: " +
          method +
          " must use " +
          this.managedBy
      );
    }

    return {
      ...(options || {}),
      managedBy: this.managedBy,
    };
  },

  create(data = {}, options = {}) {
    const managed =
      this._requireManaged(
        options,
        "create"
      );

    return this.getBase().create(
      data,
      managed
    );
  },

  findById(id, options = {}) {
    return this.getBase().findById(
      this._requireId(
        id,
        "findById"
      ),
      options
    );
  },

  get(id, options = {}) {
    return this.findById(
      id,
      options
    );
  },

  getById(id, options = {}) {
    return this.findById(
      id,
      options
    );
  },

  findAll(
    filters = {},
    options = {}
  ) {
    return this.getBase().findAll(
      filters,
      options
    );
  },

  findWhere(
    criteria = {},
    options = {}
  ) {
    return this.getBase().findWhere(
      criteria,
      options
    );
  },

  findOne(
    criteria = {},
    options = {}
  ) {
    return this.getBase().findOne(
      criteria,
      options
    );
  },

  findByEmail(
    email,
    options = {}
  ) {
    const normalized =
      String(email || "")
        .trim()
        .toLowerCase();

    if (!normalized) {
      return [];
    }

    return this.findAll(
      {},
      options
    ).filter((row) => {
      const rowEmail =
        String(
          row.Email ||
          row.Login ||
          ""
        )
          .trim()
          .toLowerCase();

      return rowEmail === normalized;
    });
  },

  update(
    id,
    data = {},
    options = {}
  ) {
    const managed =
      this._requireManaged(
        options,
        "update"
      );

    return this.getBase().update(
      this._requireId(
        id,
        "update"
      ),
      data,
      managed
    );
  },

  delete(id, options = {}) {
    this._requireId(
      id,
      "delete"
    );

    throw new Error(
      "USER_HARD_DELETE_DISABLED: use UserMembershipService.deactivateMembership"
    );
  },

  restore(id, options = {}) {
    const managed =
      this._requireManaged(
        options,
        "restore"
      );

    return this.getBase().restore(
      this._requireId(
        id,
        "restore"
      ),
      managed
    );
  },

  exists(id, options = {}) {
    return !!this.findById(
      id,
      options
    );
  },

  count(
    filters = {},
    options = {}
  ) {
    return this.findAll(
      filters,
      options
    ).length;
  },

  health() {
    const ready =
      this.initialized &&
      !!this.base;

    return {
      module: "UserRepository",
      version: this.version,
      entity: this.entity,
      managedBy:
        this.managedBy,
      initialized:
        this.initialized,
      status:
        ready
          ? "OK"
          : "WARNING",
    };
  },
};

globalThis.UserRepository =
  UserRepository;
