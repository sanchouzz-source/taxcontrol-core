console.log("ModuleLoader");



const ModuleLoader = {


version:"0.6.0",


loaded:[],


coreLoaded:[],


initialized:false,





loadCore(){



Logger.log(
"CORE LOADER START"
);




const core=[

"Logger",
"EntityConstants",

"EntityEvents",

"EntityMetadata",

"EntityRegistry",

"Database",

"SchemaManager",

"EventBus",

"SecurityGuard"

];





core.forEach(name=>{


const component =
globalThis[name];



if(component){


CoreRegistry.register(
name,
component
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




const modules=[


"TripEventHandler",

"FinanceEngine",

"KPIEngine",

"DashboardEngine",

"ClientEventHandler",

"AuditEventHandler"


];





modules.forEach(name=>{


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

"LOADED "
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



if(this.initialized)
return;



CoreRegistry.initAll();


ModuleRegistry.initAll();



this.initialized=true;



Logger.log(

"MODULE LOADER READY v"
+
this.version

);



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


core:
this.coreLoaded,


modules:
this.loaded


}


);


}



};





globalThis.ModuleLoader =
ModuleLoader;