// RouteRepository.js

console.log("RouteRepository");


const RouteRepository = {

  version: "1.1.0",

  entity: "ROUTE",


  // =================================
  // CREATE
  // =================================

  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  // =================================
  // READ
  // =================================

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


  // =================================
  // UPDATE
  // =================================

  update(id, data = {}) {

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  // =================================
  // DELETE
  // =================================

  delete(id) {

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // =================================
  // RESTORE
  // =================================

  restore(id) {

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // =================================
  // HEALTH
  // =================================

  health() {

    return HealthContract.create(

      "RouteRepository",

      "OK",

      {

        version: this.version,

        entity: this.entity,

        architecture:
          "BaseRepository 4.x",

        features: [

          "CRUD",

          "SoftDelete",

          "Restore",

          "Validation",

          "Permissions",

          "Audit",

          "Versioning",

          "EventBus"

        ]

      }

    );

  }

};



// =================================
// GLOBAL
// =================================

globalThis.RouteRepository =
  RouteRepository;



// =================================
// RepositoryFactory registration
// =================================

if (
  typeof RepositoryFactory !== "undefined"
) {

  RepositoryFactory.registerLoaded(
    "ROUTE",
    RouteRepository
  );

}



// =================================
// READY
// =================================

Logger.log(
  "RouteRepository READY v" +
  RouteRepository.version
);