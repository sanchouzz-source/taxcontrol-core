console.log("CarrierRepository");


const CarrierRepository = {

  version: "2.0.0",

  entity: "CARRIER",


  /**
   * CREATE
   */
  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  /**
   * FIND BY ID
   */
  findById(id, options = {}) {

    return BaseRepository.findById(
      this.entity,
      id,
      options
    );

  },


  /**
   * FIND ALL
   */
  findAll(filters = {}, options = {}) {

    return BaseRepository.findAll(
      this.entity,
      filters,
      options
    );

  },


  /**
   * UPDATE
   */
  update(id, data = {}) {

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  /**
   * DELETE
   */
  delete(id) {

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  /**
   * RESTORE
   */
  restore(id) {

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  /**
   * EXISTS
   */
  exists(id) {

    return BaseRepository.exists(
      this.entity,
      id
    );

  },


  /**
   * EXISTS BY FIELD
   */
  existsBy(field, value) {

    return BaseRepository.existsBy(
      this.entity,
      field,
      value
    );

  },


  /**
   * SEARCH
   */
  search(filters = {}) {

    return BaseRepository.findAll(
      this.entity,
      filters
    );

  },


  /**
   * COUNT
   */
  count(filters = {}) {

    return BaseRepository.count(
      this.entity,
      filters
    );

  },


  /**
   * HEALTH
   */
  health() {

    return HealthContract.create(

      "CarrierRepository",

      "OK",

      {
        version:this.version,
        entity:this.entity,
        architecture:"BaseRepository v3"
      }

    );

  }

};



globalThis.CarrierRepository =
    CarrierRepository;



Logger.log(
  "CarrierRepository READY v" +
  CarrierRepository.version
);



/**
 * Registration
 */

if (
 typeof RepositoryFactory !== "undefined"
) {

  RepositoryFactory.registerLoaded(
    "CARRIER",
    CarrierRepository
  );

}