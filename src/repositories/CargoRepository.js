// CargoRepository.js
console.log("CargoRepository");

const CargoRepository = {
  version: "1.0.0",

  create(data) {
    return BaseRepository.create("CARGO", data);
  },

  findById(id) {
    return BaseRepository.findById("CARGO", id);
  },

  findAll(filters = {}) {
    return BaseRepository.findAll("CARGO", filters);
  },

  update(id, data) {
    return BaseRepository.update("CARGO", id, data);
  },

  delete(id) {
    return BaseRepository.delete("CARGO", id);
  },

  restore(id) {
    return BaseRepository.restore("CARGO", id);
  },

  exists(id) {
    return BaseRepository.exists("CARGO", id);
  },

  health() {
    return HealthContract.create(
      "CargoRepository",
      "OK",
      {
        version: this.version,
        entity: "CARGO"
      }
    );
  }
};

globalThis.CargoRepository = CargoRepository;
Logger.log("CargoRepository READY v" + CargoRepository.version);