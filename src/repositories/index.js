// RepositoryRegistry.js

console.log("RepositoryRegistry");


const RepositoryRegistry = {

  version: "1.1.0",

  ready: false,

  repositories: {},


  // =====================================
  // INIT
  // =====================================

  init() {


    const repoMap = {


      // ==========================
      // CORE
      // ==========================

      CLIENT:
        typeof ClientRepository !== "undefined"
          ? ClientRepository
          : null,


      TRIP:
        typeof TripRepository !== "undefined"
          ? TripRepository
          : null,


      ORGANIZATION:
        typeof OrganizationRepository !== "undefined"
          ? OrganizationRepository
          : null,


      USER:
        typeof UserRepository !== "undefined"
          ? UserRepository
          : null,


      ROLE:
        typeof RoleRepository !== "undefined"
          ? RoleRepository
          : null,


      PERMISSION:
        typeof PermissionRepository !== "undefined"
          ? PermissionRepository
          : null,



      // ==========================
      // FINANCE
      // ==========================

      CLIENT_FINANCE_PROFILE:
        typeof ClientFinanceProfileRepository !== "undefined"
          ? ClientFinanceProfileRepository
          : null,


      FINANCIAL_TRANSACTION:
        typeof FinancialTransactionRepository !== "undefined"
          ? FinancialTransactionRepository
          : null,



      // ==========================
      // ANALYTICS
      // ==========================

      KPI:
        typeof KPIRepository !== "undefined"
          ? KPIRepository
          : null,



      // ==========================
      // LOGISTICS
      // ==========================

      TRANSPORT_ORDER:
        typeof TransportOrderRepository !== "undefined"
          ? TransportOrderRepository
          : null,


      CARRIER:
        typeof CarrierRepository !== "undefined"
          ? CarrierRepository
          : null,


      DRIVER:
        typeof DriverRepository !== "undefined"
          ? DriverRepository
          : null,


      VEHICLE:
        typeof VehicleRepository !== "undefined"
          ? VehicleRepository
          : null,


      ROUTE:
        typeof RouteRepository !== "undefined"
          ? RouteRepository
          : null,


      CARGO:
        typeof CargoRepository !== "undefined"
          ? CargoRepository
          : null,



      // ==========================
      // SYSTEM
      // ==========================

      AUDIT:
        typeof AuditRepository !== "undefined"
          ? AuditRepository
          : null,


      VERSION:
        typeof VersionRepository !== "undefined"
          ? VersionRepository
          : null,


      EVENT_EXECUTION_LOG:
        typeof EventExecutionLogRepository !== "undefined"
          ? EventExecutionLogRepository
          : null,


      FAILED_EVENT:
        typeof FailedEventRepository !== "undefined"
          ? FailedEventRepository
          : null

    };



    Object.entries(repoMap)
      .forEach(([entity, repository]) => {


        if(repository){

          this.register(
            entity,
            repository
          );

        }
        else {

          Logger.warn(
            "Repository skipped: "
            + entity
          );

        }

      });



    CoreRegistry.register(
      "Repositories",
      this.repositories
    );



    this.ready = true;



    Logger.log(
      "RepositoryRegistry READY v" +
      this.version +
      " (" +
      this.list().length +
      " repositories)"
    );


    return this;

  },



  // =====================================
  // REGISTER
  // =====================================

  register(entity, repository){


    if(!entity){

      throw new Error(
        "Repository entity required"
      );

    }


    if(!repository){

      throw new Error(
        "Repository instance required: "
        + entity
      );

    }



    this.repositories[entity] =
      repository;


    Logger.debug(
      "Repository registered: "
      + entity
    );


  },



  // =====================================
  // GET
  // =====================================

  get(entity){


    const repository =
      this.repositories[entity];



    if(!repository){

      throw new Error(
        "Repository not found: "
        + entity
      );

    }


    return repository;

  },


  // alias

  getRepository(entity){

    return this.get(entity);

  },



  // =====================================
  // CHECK
  // =====================================

  has(entity){

    return !!this.repositories[entity];

  },



  list(){

    return Object.keys(
      this.repositories
    );

  },



  count(){

    return this.list().length;

  },



  // =====================================
  // HEALTH
  // =====================================

  health(){


    return HealthContract.create(

      "RepositoryRegistry",

      this.ready
        ? "OK"
        : "WARNING",


      {

        version:this.version,

        count:this.count(),

        repositories:this.list()

      }

    );


  },


  // =====================================
  // DIAGNOSTIC
  // =====================================

  getHealthReport(){


    return this.list()
      .map(entity => {


        const repo =
          this.repositories[entity];


        return {

          entity,

          version:
            repo.version || "unknown",


          health:
            typeof repo.health === "function"
              ? repo.health()
              : null

        };


      });


  }


};



// =====================================
// GLOBAL
// =====================================

globalThis.RepositoryRegistry =
RepositoryRegistry;



Logger.log(
  "RepositoryRegistry READY v"
  +
  RepositoryRegistry.version
);