console.log("CarrierRepository");


const CarrierRepository = {

  version: "1.0.0",

  entity: "CARRIER",


  init() {

    Logger.debug(
      "CarrierRepository READY v" + this.version
    );

  },


  create(data) {

    data = Object.assign({}, data);

    if (!data.CarrierID) {
      data.CarrierID = IdService.generate("CAR");
    }


    data.CreatedAt =
      data.CreatedAt ||
      new Date().toISOString();


    data.UpdatedAt =
      new Date().toISOString();


    data.Deleted = false;


    return BaseRepository.create(
      this.entity,
      data
    );

  },



  findById(id, options = {}) {

    return BaseRepository.findById(
      this.entity,
      id,
      options
    );

  },



  findAll(options = {}) {

    return BaseRepository.findAll(
      this.entity,
      options
    );

  },



  update(id, data) {


    data = Object.assign({}, data);


    data.UpdatedAt =
      new Date().toISOString();



    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },



  delete(id, userId = null) {


    return BaseRepository.delete(
      this.entity,
      id,
      {
        DeletedBy: userId,
        DeletedAt:
          new Date().toISOString()
      }
    );

  },



  restore(id) {


    return BaseRepository.restore(
      this.entity,
      id
    );

  },



  exists(id) {


    return BaseRepository.exists(
      this.entity,
      id
    );

  },



  count(options = {}) {


    const list =
      this.findAll(options);


    return list.length;

  },



  search(query) {


    const items =
      this.findAll();


    query =
      String(query)
      .toLowerCase();



    return items.filter(item => {


      return (

        String(item.Name || "")
          .toLowerCase()
          .includes(query)

        ||

        String(item.INN || "")
          .toLowerCase()
          .includes(query)

        ||

        String(item.Phone || "")
          .toLowerCase()
          .includes(query)

      );


    });

  },


  health() {


    return HealthContract.create(

      "CarrierRepository",

      "OK",

      {

        version:this.version,

        entity:this.entity

      }

    );


  }


};


if (
  globalThis.RepositoryFactory &&
  typeof RepositoryFactory.register === "function"
) {

  RepositoryFactory.register(
    "CARRIER",
    CarrierRepository
  );

  Logger.debug(
    "CarrierRepository AUTO REGISTERED"
  );

}