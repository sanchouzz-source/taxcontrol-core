console.log("RepositoryFactory");

const RepositoryFactory = {
  version: "1.4.0",

  repositories: {},

  pending: {},

  initialized: false,


  init() {

    if (this.initialized) {

      Logger.debug(
        "RepositoryFactory ALREADY READY"
      );

      return;
    }


    Logger.debug(
      "RepositoryFactory INIT"
    );


    this.autoRegister();


    this.initialized = true;


    Logger.debug(
      "RepositoryFactory READY v" 
      + this.version
    );

  },


  autoRegister() {


    const entities = EntityRegistry.list();


    entities.forEach(entity => {


      const meta = EntityRegistry.get(entity);


      if (!meta.repository) {
        return;
      }


      const repository =
        globalThis[meta.repository];


if (repository) {

    this.register(
        entity,
        repository
    );

} else {

    Logger.debug(
        "WAITING REPOSITORY: " + entity
    );


    this.pending[entity] =
        meta.repository;
}


    });


  },


  register(name, repository) {


    if (!repository) {

      throw new Error(
        "Repository missing: " + name
      );

    }



    const required = [

      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists"

    ];



    required.forEach(method => {


      if (
        typeof repository[method] !== "function"
      ) {


        throw new Error(
          "Repository "
          + name
          + " missing method "
          + method
        );


      }


    });



    this.repositories[name] = repository;



    Logger.debug(
      "REGISTERED REPOSITORY: "
      + name
    );


  },



  registerLazy(name, getter){


    Object.defineProperty(
      this.repositories,
      name,
      {

        configurable:true,

        get(){

          const repo = getter();


          if(!repo){

            throw new Error(
              "Lazy repository unavailable: "
              + name
            );

          }


          return repo;

        }

      }

    );


    Logger.debug(
      "LAZY REGISTERED: "
      + name
    );


  },


  registerLoaded(name, repository) {

    if (!repository) {
      throw new Error(
        "Cannot register empty repository: " + name
      );
    }

    this.register(name, repository);
    delete this.pending[name];

    Logger.debug(
      "LOADED REPOSITORY REGISTERED: " + name
    );
  },


get(name) {

    const repository =
        this.repositories[name];


    if (!repository) {

        Logger.error(
            "Repository missing: " + name +
            " Pending: " +
            JSON.stringify(this.pending)
        );


        throw new Error(
            "Repository not registered: " + name
        );
    }


    return repository;
},



  has(name){

    return !!this.repositories[name];

  },



  list(){

    return Object.keys(
      this.repositories
    );

  },


  health(){

    return HealthContract.create(

      "RepositoryFactory",

      this.initialized
      ? "OK"
      : "WARNING",

      {

        version:this.version,

        repositories:this.list()

      }

    );

  }

};



globalThis.RepositoryFactory =
RepositoryFactory;



Logger.log(
 "RepositoryFactory GLOBAL REGISTERED v"
 + RepositoryFactory.version
);