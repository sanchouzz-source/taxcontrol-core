// VehicleRepository.js
console.log("VehicleRepository");


const VehicleRepository = {

  version: "1.1.0",

  entity: "VEHICLE",


  // ==============================
  // CREATE
  // ==============================

  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  // ==============================
  // READ
  // ==============================

  findById(id, options = {}) {

    return BaseRepository.findById(
      this.entity,
      id,
      options
    );

  },


  findAll(filters = {}, options = {}) {

    return BaseRepository.findAll(
      this.entity,
      filters,
      options
    );

  },


  count(filters = {}, options = {}) {

    return BaseRepository.count(
      this.entity,
      filters,
      options
    );

  },


  exists(id, options = {}) {

    return BaseRepository.exists(
      this.entity,
      id,
      options
    );

  },


  existsBy(field, value, options = {}) {

    return BaseRepository.existsBy(
      this.entity,
      field,
      value,
      options
    );

  },


  // ==============================
  // UPDATE
  // ==============================

  update(id, data = {}) {

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  // ==============================
  // DELETE
  // ==============================

  delete(id) {

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // ==============================
  // RESTORE
  // ==============================

  restore(id) {

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // ==============================
  // HEALTH
  // ==============================

  health() {

    return HealthContract.create(

      "VehicleRepository",

      "OK",

      {

        version: this.version,

        entity: this.entity,

        architecture:
          "BaseRepository 3.x",

        features: [

          "CRUD",

          "SoftDelete",

          "Restore",

          "Audit",

          "Versioning",

          "Events"

        ]

      }

    );

  }

};


// ==============================
// GLOBAL
// ==============================

globalThis.VehicleRepository =
  VehicleRepository;



// ==============================
// REPOSITORY FACTORY
// ==============================

if (
  typeof RepositoryFactory !== "undefined"
) {

  RepositoryFactory.registerLoaded(
    "VEHICLE",
    VehicleRepository
  );

}



// ==============================
// LOG
// ==============================

Logger.log(
  "VehicleRepository READY v" +
  VehicleRepository.version
);