// VehicleRepository.js
console.log("VehicleRepository");

const VehicleRepository = {
  version: "1.0.0",

  create(data) {
    return BaseRepository.create("VEHICLE", data);
  },

  findById(id) {
    return BaseRepository.findById("VEHICLE", id);
  },

  findAll(filters = {}) {
    return BaseRepository.findAll("VEHICLE", filters);
  },

  update(id, data) {
    return BaseRepository.update("VEHICLE", id, data);
  },

  delete(id) {
    return BaseRepository.delete("VEHICLE", id);
  },

  restore(id) {
    return BaseRepository.restore("VEHICLE", id);
  },

  exists(id) {
    return BaseRepository.exists("VEHICLE", id);
  },

  health() {
    return HealthContract.create(
      "VehicleRepository",
      "OK",
      {
        version: this.version,
        entity: "VEHICLE"
      }
    );
  }
};

globalThis.VehicleRepository = VehicleRepository;
Logger.log("VehicleRepository READY v" + VehicleRepository.version);