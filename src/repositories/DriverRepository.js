console.log("DriverRepository");


const DriverRepository = {

  version: "2.0.0",

  entity: "DRIVER",


  // ===============================
  // CREATE
  // ===============================

  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  // ===============================
  // FIND BY ID
  // ===============================

  findById(id, options = {}) {

    return BaseRepository.findById(
      this.entity,
      id,
      options
    );

  },


  // ===============================
  // FIND ALL
  // ===============================

  findAll(filters = {}, options = {}) {

    return BaseRepository.findAll(
      this.entity,
      filters,
      options
    );

  },


  // ===============================
  // COUNT
  // ===============================

  count(filters = {}, options = {}) {

    return BaseRepository.count(
      this.entity,
      filters,
      options
    );

  },


  // ===============================
  // EXISTS
  // ===============================

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


  // ===============================
  // UPDATE
  // ===============================

  update(id, data = {}) {

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  // ===============================
  // DELETE
  // ===============================

  delete(id) {

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // ===============================
  // RESTORE
  // ===============================

  restore(id) {

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // ===============================
  // HEALTH
  // ===============================

  health() {

    return HealthContract.create(

      "DriverRepository",

      "OK",

      {

        version: this.version,

        entity: this.entity,

        baseRepository:
          BaseRepository.version

      }

    );

  }

};


// =================================
// GLOBAL
// =================================

globalThis.DriverRepository =
    DriverRepository;



Logger.log(
  "DriverRepository READY v" +
  DriverRepository.version
);



// =================================
// RepositoryFactory registration
// =================================

if (
  typeof RepositoryFactory !== "undefined"
) {

  RepositoryFactory.registerLoaded(
    "DRIVER",
    DriverRepository
  );

}