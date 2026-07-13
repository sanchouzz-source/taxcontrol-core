console.log("ModuleLoader");



const ModuleLoader={


version:"0.3.0",


loaded:false,
loadedModules:[],




load(){

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


const module=
globalThis[name];



if(module){


ModuleRegistry.register(
name,
module
);



Logger.log(
"LOADED "
+name
);



}

else{


Logger.log(
"NOT FOUND "
+name
);


}



});



this.loaded=true;

this.loadedModules=
Object.keys(
ModuleRegistry.modules
);


Logger.log(
"MODULE LOADER COMPLETE"
);



},





init(){


ModuleRegistry.initAll();


},





health(){


return {


status:
this.loaded
?
"OK"
:
"NOT_READY",


module:"ModuleLoader",


version:this.version,


loaded:this.loadedModules || []


};


}



};



globalThis.ModuleLoader=
ModuleLoader;