// RouteRepository.js
console.log("RouteRepository");

const RouteRepository = {
  version: "1.0.0",

  create(data) {
    return BaseRepository.create("ROUTE", data);
  },

  findById(id) {
    return BaseRepository.findById("ROUTE", id);
  },

  findAll(filters = {}) {
    return BaseRepository.findAll("ROUTE", filters);
  },

  update(id, data) {
    return BaseRepository.update("ROUTE", id, data);
  },

  delete(id) {
    return BaseRepository.delete("ROUTE", id);
  },

  restore(id) {
    return BaseRepository.restore("ROUTE", id);
  },

  exists(id) {
    return BaseRepository.exists("ROUTE", id);
  },

  health() {
    return HealthContract.create(
      "RouteRepository",
      "OK",
      {
        version: this.version,
        entity: "ROUTE"
      }
    );
  }
};

globalThis.RouteRepository = RouteRepository;
Logger.log("RouteRepository READY v" + RouteRepository.version);