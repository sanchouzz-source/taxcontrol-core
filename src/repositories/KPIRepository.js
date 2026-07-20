console.log("KPIRepository");

const KPIRepository = {
  version: "1.0.0",
  table: "KPIMetrics",
  entity: "KPI",
  
  create(data) {
    return BaseRepository.create(
      this.table,
      data,
      this.entity,
      this.permission
    );
  },

  findById(id) {
    return BaseRepository.findById(
      this.table,
      id,
      this.entity,
      this.permission
    );
  },

  get(id) {
    return this.findById(id);
  },

  exists(id) {
    return BaseRepository.exists(
      this.table,
      id
    );
  },

  findAll(filters = {}) {
    return BaseRepository.findAll(
      this.table,
      filters,
      this.entity,
      this.permission
    );
  },

  update(id, data) {
    return BaseRepository.update(
      this.table,
      id,
      data,
      this.entity,
      this.permission
    );
  },

  delete(id) {
    return BaseRepository.delete(
      this.table,
      id,
      this.entity,
      this.permission
    );
  },

  restore(id) {
    return BaseRepository.restore(
      this.table,
      id,
      this.entity,
      this.permission
    );
  },

  health() {
    return HealthContract.create(
      "KPIRepository",
      "OK",
      {
        version: this.version,
        table: this.table,
        entity: this.entity
      }
    );
  }
};

globalThis.KPIRepository = KPIRepository;