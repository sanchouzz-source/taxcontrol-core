// ============================================================
// RepositoryFactory v2.3.1
// Enterprise Repository Dependency Container
// ERP Core
// ============================================================

console.log("RepositoryFactory v2.3.1");


const RepositoryFactory = {

  version: "2.3.1",
  apiVersion: "2.1",

  repositories: {},
  pending: {},
  metadata: {},

  initialized: false,


  // ============================================================
  // INIT
  // ============================================================

  init(){

    if(this.initialized){
      Logger.debug(
        "RepositoryFactory already initialized"
      );
      return;
    }


    Logger.log(
      "RepositoryFactory INIT"
    );


    this.loadFromRegistry();


    this.autoRegister();


    this.syncRegistry();


    this.checkPending();


    this.initialized = true;


    Logger.log(
      "RepositoryFactory READY v" +
      this.version +
      " count=" +
      this.count()
    );

  },





  // ============================================================
  // LOAD FROM REGISTRY
  // ============================================================

  loadFromRegistry(){

    if(typeof RepositoryRegistry === "undefined"){
      Logger.warn(
        "RepositoryRegistry unavailable"
      );
      return;
    }


    try{

      RepositoryRegistry.list()
      .forEach(entity=>{

        const repo =
          RepositoryRegistry.get(entity);

        if(repo){
          this.register(
            entity,
            repo
          );
        }

      });


    }catch(e){

      Logger.warn(
        "RepositoryRegistry load failed "
        + e.message
      );

    }

  },





  // ============================================================
  // AUTO REGISTER
  // ============================================================

  autoRegister(){


    if(typeof EntityRegistry === "undefined"){
      throw new Error(
        "EntityRegistry unavailable"
      );
    }


    EntityRegistry.list()
    .forEach(entity=>{


      const meta =
        EntityRegistry.get(entity);


      const repoName =
        meta.repository ||
        "BaseRepository";



      // -----------------------------
      // SYSTEM ENTITIES
      // -----------------------------

      if(meta.system){


        if(
          typeof BaseRepository !== "undefined"
        ){

          this.register(
            entity,
            BaseRepository
          );


          Logger.log(
            "System repository registered "
            + entity
          );

        }
        else{


          this.pending[entity]={
            repository:"BaseRepository",
            system:true,
            created:new Date()
          };


        }


        return;

      }




      // -----------------------------
      // BUSINESS ENTITIES
      // -----------------------------


      const repo =
        globalThis[repoName];


      if(repo){

        this.register(
          entity,
          repo
        );

      }
      else{


        this.pending[entity]={

          repository:repoName,
          system:false,
          created:new Date()

        };


        Logger.debug(

          "Repository pending "
          + entity
          +" -> "
          +repoName

        );


      }



    });


  },





  // ============================================================
  // REGISTER
  // ============================================================


  register(
    entity,
    repository
  ){


    if(!entity)
      throw new Error(
        "Repository entity required"
      );


    if(!repository)
      throw new Error(
        "Repository missing "
        + entity
      );



    // защита от повторной регистрации

    if(this.repositories[entity]){

      Logger.debug(
        "Repository already exists "
        + entity
      );

      return false;

    }



    const contract =
      this.validate(
        entity,
        repository
      );



    this.repositories[entity]=repository;



    this.metadata[entity]={

      version:
        repository.version ||
        "unknown",

      contract,

      registeredAt:
        new Date()

    };



    Logger.log(
      "RepositoryFactory REGISTER "
      + entity
    );


    return true;

  },





  // ============================================================
  // BACKWARD COMPATIBILITY
  // ============================================================

  registerLoaded(
    entity,
    repository
  ){

    delete this.pending[entity];


    return this.register(
      entity,
      repository
    );

  },





  // ============================================================
  // VALIDATION
  // ============================================================

  validate(
    entity,
    repository
  ){


    const required=[

      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists"

    ];



    const missing=[];



    required.forEach(method=>{

      if(
        typeof repository[method]
        !== "function"
      ){

        missing.push(method);

      }

    });




    if(
      missing.length &&
      typeof BaseRepository !== "undefined"
    ){

      this.attachBaseAdapter(
        entity,
        repository,
        missing
      );


      return {

        status:"ADAPTED",

        methods:Object.keys(repository),

        warnings:[
          "BaseRepository adapter applied"
        ]

      };

    }





    if(missing.length){

      throw new Error(

        "Repository contract failed "
        +entity
        +" missing "
        +missing.join(",")

      );

    }



    return {

      status:"OK",

      methods:required,

      warnings:[]

    };


  },





  // ============================================================
  // BASE ADAPTER
  // ============================================================


  attachBaseAdapter(
    entity,
    repository,
    methods
  ){


    methods.forEach(method=>{


      if(
        typeof repository[method]
        !== "function"
      ){


        repository[method]=function(...args){


          return BaseRepository[method](

            entity,

            ...args

          );


        };


      }


    });


  },





  // ============================================================
  // PENDING
  // ============================================================

  checkPending(){


    let loaded=0;


    Object.entries(this.pending)
    .forEach(([entity,item])=>{


      const repo =
        globalThis[item.repository];


      if(repo){


        this.registerLoaded(
          entity,
          repo
        );


        loaded++;

      }


    });


    return loaded;


  },





  // ============================================================
  // REGISTRY SYNC
  // ============================================================


  syncRegistry(){


    if(
      typeof RepositoryRegistry==="undefined"
    )
      return;



    if(
      typeof RepositoryRegistry.register
      !=="function"
    )
      return;



    Object.entries(this.repositories)
    .forEach(([entity,repo])=>{


      RepositoryRegistry.register(
        entity,
        repo
      );


    });


  },





  // ============================================================
  // ACCESS
  // ============================================================


  get(entity){


    const repo =
      this.repositories[entity];


    if(!repo){

      throw new Error(

        "Repository not found "
        +entity

      );

    }


    return repo;

  },



  getByEntity(entity){

    return this.get(entity);

  },



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





  // ============================================================
  // LAZY
  // ============================================================


  registerLazy(
    entity,
    getter
  ){


    Object.defineProperty(
      this.repositories,
      entity,
      {

        configurable:true,


        get(){

          const repo =
            getter();


          if(!repo){

            throw new Error(
              "Lazy repository unavailable "
              +entity
            );

          }


          return repo;

        }

      }

    );

  },





  // ============================================================
  // RESET DEV
  // ============================================================


  reset(){


    this.repositories={};

    this.pending={};

    this.metadata={};

    this.initialized=false;


    Logger.log(
      "RepositoryFactory RESET"
    );


  },





  // ============================================================
  // DIAGNOSTICS
  // ============================================================


  diagnostics(){


    return {


      version:this.version,

      repositories:this.metadata,

      pending:this.pending,

      count:this.count()


    };


  },





  // ============================================================
  // HEALTH
  // ============================================================


  health(){


    return HealthContract.create(

      "RepositoryFactory",

      this.initialized
      ?"OK"
      :"WARNING",

      {

        version:this.version,

        repositories:this.list(),

        count:this.count(),

        pending:Object.keys(
          this.pending
        )

      }

    );

  }



};




globalThis.RepositoryFactory =
  RepositoryFactory;



Logger.log(
  "RepositoryFactory GLOBAL READY v"
  +RepositoryFactory.version
);