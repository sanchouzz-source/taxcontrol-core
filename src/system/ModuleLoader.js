console.log("ModuleLoader");


const ModuleLoader = {


version:"0.7.0",


loaded:[],


coreLoaded:[],


initialized:false,



coreOrder:[


"Logger",


"AuditConstants",

"PermissionConstants",

"RoleConstants",



"Database",

"SchemaManager",



"EntityConstants",

"EntityEvents",

"EntityMetadata",

"EntityRegistry",



"ClientValidator",

"TripValidator",



"EventBus",



"SecurityGuard",



"AuditLog",

"AuditEventHandler",



"BaseRepository",

"ClientRepository",

"TripRepository"


],





moduleOrder:[


"ClientEventHandler",

"TripEventHandler",


"FinanceEngine",

"KPIEngine",

"DashboardEngine"


],






loadCore(){



Logger.log(
"CORE LOADER START"
);




this.coreOrder.forEach(name=>{


if(
this.coreLoaded.includes(name)
){

return;

}



const component =
globalThis[name];




if(component){



const priorities={


Logger:0,

AuditConstants:1,

PermissionConstants:2,

RoleConstants:3,


Database:10,

SchemaManager:11,
ClientValidator:24,

TripValidator:25,

EntityConstants:20,

EntityEvents:21,

EntityMetadata:22,

EntityRegistry:23,


EventBus:30,


SecurityGuard:40,

AuditLog:41,

AuditEventHandler:42,


BaseRepository:50,

ClientRepository:51,

TripRepository:52


};



CoreRegistry.register(

name,

component,

priorities[name] || 100

);



this.coreLoaded.push(

name

);



}


else{


Logger.warn(

"CORE NOT FOUND "
+
name

);


}



});




Logger.log(

"CORE LOADER COMPLETE"

);



},







loadModules(){



Logger.log(

"MODULE LOADER START"

);




this.moduleOrder.forEach(name=>{


if(
this.loaded.includes(name)
){

return;

}




const module =
globalThis[name];




if(module){



ModuleRegistry.register(

name,

module

);



this.loaded.push(

name

);



Logger.log(

"MODULE LOADED "
+
name

);



}


else{


Logger.warn(

"MODULE NOT FOUND "
+
name

);



}



});





Logger.log(

"MODULE LOADER COMPLETE"

);



},







initAll(){



if(this.initialized){


Logger.log(

"MODULE LOADER ALREADY READY"

);


return;


}





Logger.log(

"SYSTEM COMPONENT INITIALIZATION START"

);




this.loadCore();



CoreRegistry.initAll();




this.loadModules();



ModuleRegistry.initAll();




this.initialized=true;




Logger.log(

"MODULE LOADER READY v"
+
this.version

);



},







getStatus(){



return {


version:this.version,


initialized:this.initialized,


coreLoaded:this.coreLoaded,


modulesLoaded:this.loaded


};



},







health(){



return HealthContract.create(

"ModuleLoader",

this.initialized

?

"OK"

:

"WARNING",


{


version:this.version,


core:this.coreLoaded,


modules:this.loaded,


initialized:this.initialized


}



);



}



};





globalThis.ModuleLoader =
ModuleLoader;