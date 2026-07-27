// ============================================================
// Config v2.0.0
// Enterprise ERP Configuration Service
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.5+
// HealthService v2+
// ERPDiagnostics v5+
// ============================================================


console.log("Config v2.0.0");



const Config = {


version:"2.0.0",


initialized:false,


readonly:false,


settings:{},





// ============================================================
// INIT
// ============================================================


init(options={}){


if(this.initialized){

Logger.debug(
"Config ALREADY READY"
);

return true;

}




this.settings={



// ------------------------------------------------
// SYSTEM
// ------------------------------------------------


system:{


name:"ERP TexControl",


product:
"TaxControl ERP",


environment:
options.environment || "development",


version:
"1.0.0",


locale:
"ru-RU"


},






// ------------------------------------------------
// DATABASE
// ------------------------------------------------


database:{


provider:
"GoogleSheets",


adapter:
"SpreadsheetAdapter",


autoMigration:true,


backup:true


},







// ------------------------------------------------
// EVENTS
// ------------------------------------------------


events:{


enabled:true,


audit:true,


retry:true,


queue:true


},







// ------------------------------------------------
// MODULES
// ------------------------------------------------


modules:{


autoLoad:true,


safeMode:false,


allowDynamicLoad:true


},







// ------------------------------------------------
// SECURITY
// ------------------------------------------------


security:{


enabled:true,


permissionCheck:true,


auditRequired:true,


sessionTimeout:3600


},







// ------------------------------------------------
// REPOSITORIES
// ------------------------------------------------


repository:{


pattern:
"RepositoryFactory",


validation:true,


softDelete:true,


versioning:true


},







// ------------------------------------------------
// ORGANIZATION
// ------------------------------------------------


organization:{


multiTenant:false,


organizationScope:true


},







// ------------------------------------------------
// FEATURES
// ------------------------------------------------


features:{


finance:true,


logistics:true,


crm:true,


analytics:true,


dashboard:true,


mobileReady:true


},







// ------------------------------------------------
// LOGGING
// ------------------------------------------------


logging:{


level:"INFO",


console:true,


audit:true


}





};




this.initialized=true;



Logger.info(
"Config READY v"+
this.version
);



return true;


},







// ============================================================
// GET
// ============================================================


get(path){


if(!path){

return null;

}



return path
.split(".")
.reduce(
(obj,key)=>
obj ? obj[key] : undefined,
this.settings
);



},







// ============================================================
// SET
// ============================================================


set(path,value){


if(this.readonly){

throw new Error(
"Config is readonly"
);

}



const parts =
path.split(".");


let obj =
this.settings;



while(parts.length>1){


const key =
parts.shift();


if(!obj[key]){

obj[key]={};

}


obj=obj[key];


}



obj[parts[0]]=value;



},







// ============================================================
// MERGE
// ============================================================


merge(data={}){


this.settings =
this.deepMerge(
this.settings,
data
);


},







deepMerge(target,source){


for(const key in source){


if(
source[key]
&&
typeof source[key]==="object"
&&
!Array.isArray(source[key])
){


target[key]=
this.deepMerge(
target[key] || {},
source[key]
);



}
else{


target[key]=source[key];


}



}



return target;


},







// ============================================================
// FLAGS
// ============================================================


feature(name){


return !!this.get(
"features."+name
);


},







// ============================================================
// ENVIRONMENT
// ============================================================


environment(){


return this.get(
"system.environment"
);


},







// ============================================================
// ALL
// ============================================================


all(){


return JSON.parse(
JSON.stringify(
this.settings
)
);


},







// ============================================================
// RESET
// ============================================================


reset(){


this.settings={};


this.initialized=false;


Logger.warn(
"Config RESET"
);


},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"Config",

this.initialized
?
"OK"
:
"WARNING",

{


version:this.version,


environment:
this.environment(),


features:
Object.keys(
this.settings.features || {}
),


database:
this.get(
"database.provider"
)


}

);


}



};






globalThis.Config =
Config;



Logger.log(
"Config READY v"+
Config.version
);