console.log("ClientRepository");

const ClientRepository = {

  version: "2.0.0",
  entity: "CLIENT",

  // ---------- CREATE ----------
  create(data) {
    return BaseRepository.create(this.entity, data);
  },

  // ---------- FIND BY ID (с опцией includeDeleted) ----------
  findById(id, options = { includeDeleted: false }) {
    return BaseRepository.findById(this.entity, id, options);
  },

  // Алиас для findById (для удобства)
  get(id, options = { includeDeleted: false }) {
    return this.findById(id, options);
  },

  // ---------- FIND ALL (с фильтрацией и опцией includeDeleted) ----------
  findAll(filters = {}, options = { includeDeleted: false }) {
    return BaseRepository.findAll(this.entity, filters, options);
  },

  // ---------- UPDATE ----------
  update(id, data) {
    return BaseRepository.update(this.entity, id, data);
  },

  // ---------- DELETE ----------
  delete(id) {
    return BaseRepository.delete(this.entity, id);
  },

  // ---------- RESTORE ----------
  restore(id) {
    return BaseRepository.restore(this.entity, id);
  },

  // ---------- EXISTS (с опцией includeDeleted) ----------
  exists(id, options = { includeDeleted: false }) {
    return BaseRepository.exists(this.entity, id, options);
  },

  // ---------- COUNT (с опцией includeDeleted) ----------
  count(filters = {}, options = { includeDeleted: false }) {
    return BaseRepository.count(this.entity, filters, options);
  },

  // ---------- EXISTS BY (с опцией includeDeleted) ----------
  existsBy(field, value, options = { includeDeleted: false }) {
    return BaseRepository.existsBy(this.entity, field, value, options);
  },

  // ---------- HEALTH ----------
  health() {
    return HealthContract.create(
      "ClientRepository",
      "OK",
      {
        version: this.version,
        entity: this.entity,
        table: EntityRegistry.CLIENT?.table || "Clients"
      }
    );
  }
};

globalThis.ClientRepository = ClientRepository;

Logger.log("ClientRepository READY v" + ClientRepository.version);