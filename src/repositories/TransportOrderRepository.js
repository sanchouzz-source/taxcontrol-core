// TransportOrderRepository.js

console.log("TransportOrderRepository");


const TransportOrderRepository = {

  version: "2.0.0",

  entity: "TRANSPORT_ORDER",


  // =====================================
  // CREATE
  // =====================================

  create(data = {}) {

    return BaseRepository.create(
      this.entity,
      data
    );

  },


  // =====================================
  // READ
  // =====================================

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


  // =====================================
  // UPDATE
  // =====================================

  update(id, data = {}) {

    return BaseRepository.update(
      this.entity,
      id,
      data
    );

  },


  // =====================================
  // DELETE
  // =====================================

  delete(id) {

    return BaseRepository.delete(
      this.entity,
      id
    );

  },


  // =====================================
  // RESTORE
  // =====================================

  restore(id) {

    return BaseRepository.restore(
      this.entity,
      id
    );

  },


  // =====================================
  // BUSINESS METHODS
  // (заготовки для логистики)
  // =====================================


  assignCarrier(orderId, carrierId) {

    return this.update(
      orderId,
      {
        CarrierID: carrierId
      }
    );

  },


  assignVehicle(orderId, vehicleId) {

    return this.update(
      orderId,
      {
        VehicleID: vehicleId
      }
    );

  },


  assignDriver(orderId, driverId) {

    return this.update(
      orderId,
      {
        DriverID: driverId
      }
    );

  },


  changeStatus(orderId, status) {

    return this.update(
      orderId,
      {
        Status: status
      }
    );

  },


  // =====================================
  // HEALTH
  // =====================================

  health() {

    return HealthContract.create(

      "TransportOrderRepository",

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

          "EventBus",

          "LogisticsWorkflow"

        ]

      }

    );

  }

};



// =====================================
// GLOBAL
// =====================================

globalThis.TransportOrderRepository =
  TransportOrderRepository;



// =====================================
// RepositoryFactory registration
// =====================================

if (
  typeof RepositoryFactory !== "undefined"
) {

  RepositoryFactory.registerLoaded(
    "TRANSPORT_ORDER",
    TransportOrderRepository
  );

}



// =====================================
// READY
// =====================================

Logger.log(
  "TransportOrderRepository READY v" +
  TransportOrderRepository.version
);