console.log("CarrierRepository");


const CarrierRepository = {

  version: "1.0.0",

  entity: "CARRIER",


  create(data) {

    const record = {
      CarrierID: IdService.generate("CAR"),
      OrganizationID: data.OrganizationID || "ORG000001",

      Name: data.Name || "",
      INN: data.INN || "",

      Phone: data.Phone || "",
      Email: data.Email || "",

      ContactPerson: data.ContactPerson || "",

      Status: data.Status || "ACTIVE",

      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),

      Deleted: false,
      DeletedAt: null,
      DeletedBy: null
    };


    Database.insert(
      this.entity,
      record
    );


    EventBus.emit(
      "CARRIER_CREATED",
      record
    );


    return record;
  },


  findById(id) {

    return Database.findById(
      this.entity,
      id,
      {
        includeDeleted:false
      }
    );

  },


  findAll(options={}) {

    return Database.findAll(
      this.entity,
      options
    );

  },


  update(id, data) {


    const current = this.findById(id);

    if(!current){
      throw new Error(
        "Carrier not found: " + id
      );
    }


    const updated = {

      ...current,

      ...data,

      CarrierID:id,

      UpdatedAt:
        new Date().toISOString()

    };


    Database.update(
      this.entity,
      id,
      updated
    );


    EventBus.emit(
      "CARRIER_UPDATED",
      updated
    );


    return updated;

  },


  delete(id, user="SYSTEM") {


    const carrier = this.findById(id);


    if(!carrier){
      throw new Error(
        "Carrier not found: " + id
      );
    }


    Database.update(
      this.entity,
      id,
      {

        Deleted:true,

        DeletedAt:
          new Date().toISOString(),

        DeletedBy:user,

        UpdatedAt:
          new Date().toISOString()

      }
    );


    EventBus.emit(
      "CARRIER_DELETED",
      carrier
    );


    return true;

  },


  restore(id) {


    const carrier =
      Database.findById(
        this.entity,
        id,
        {
          includeDeleted:true
        }
      );


    if(!carrier){
      throw new Error(
        "Carrier not found: "+id
      );
    }


    Database.update(
      this.entity,
      id,
      {

        Deleted:false,

        DeletedAt:null,

        DeletedBy:null,

        UpdatedAt:
          new Date().toISOString()

      }
    );


    EventBus.emit(
      "CARRIER_RESTORED",
      carrier
    );


    return this.findById(id);

  },


  exists(id){

    return !!this.findById(id);

  },


  health(){

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



globalThis.CarrierRepository =
    CarrierRepository;


Logger.debug(
 "CarrierRepository READY v1.0.0"
);


if (
    typeof RepositoryFactory !== "undefined"
) {

    RepositoryFactory.registerLoaded(
        "CARRIER",
        CarrierRepository
    );

}