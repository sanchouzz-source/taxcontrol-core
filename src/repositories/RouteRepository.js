// ============================================================
// RouteRepository v3.0.0
// Enterprise Repository
// TaxControl ERP Core
//
// Entity:
// ROUTE
//
// Architecture:
//
// EntityService
//      |
// RepositoryFactory
//      |
// RouteRepository
//      |
// BaseRepository
//      |
// Database
//
// Compatible:
// EntityRegistry v2.5+
// BaseRepository v5.7+
// RepositoryFactory v3+
// ============================================================


console.log("RouteRepository v3.0.0");



// ============================================================
// CREATE REPOSITORY INSTANCE
// ============================================================


const RouteRepository =
    BaseRepository.createRepository(
        "ROUTE"
    );



RouteRepository.version =
    "3.0.0";



RouteRepository.entity =
    "ROUTE";



// ============================================================
// CUSTOM METHODS
// ============================================================


// поиск маршрута по номеру/коду

RouteRepository.findByCode = function(code){


    return this.findWhere({

        Code: code

    });


};




// активные маршруты

RouteRepository.findActive = function(){


    return this.findWhere({

        Active:true

    });


};




// ============================================================
// REGISTER GLOBAL
// ============================================================


globalThis.RouteRepository =
    RouteRepository;



Logger.log(
    "RouteRepository READY v"+
    RouteRepository.version
);