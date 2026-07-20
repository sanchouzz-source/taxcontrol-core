console.log("RepositoryFactory");


const RepositoryFactory = {

  version: "1.3.0",

  repositories: {},

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
          "WAITING REPOSITORY: "
          + entity
        );

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



  get(name){


    const repository =
      this.repositories[name];


    if(!repository){


      throw new Error(
        "Repository not registered: "
        + name
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