console.log("ModuleLoader");


if(!globalThis.ModuleLoader){



const ModuleLoader={



version:"0.2.1",


loaded:[],


loadCore(){



Logger.log(
"MODULE LOADER START"
);



const modules=[


"TripEventHandler",
"FinanceEngine",
"KPIEngine",
"DashboardEngine"


];





modules.forEach(name=>{


let module=
globalThis[name];



if(module){



ModuleRegistry.register(
name,
module
);



this.loaded.push(name);



Logger.log(
"LOADED "
+name
);



}
else{


Logger.warn(
"NOT FOUND "
+name
);



}



});





Logger.log(
"MODULE LOADER COMPLETE"
);



},






init(){


ModuleRegistry.initAll();



},







health(){


return HealthContract.create(


"ModuleLoader",


"OK",


{


version:this.version,


loaded:this.loaded



}


);



}



};




globalThis.ModuleLoader=
ModuleLoader;


}