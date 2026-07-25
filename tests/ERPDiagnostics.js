console.log("ERP Diagnostics v4.0.0");


const ERPDiagnostics = {


version:"4.0.0",



// =================================================
// MAIN
// =================================================

run(options={}){


    const report=this.buildReport();


    if(options.json)
        return report;


    this.print(report);


    return report;

},




// =================================================
// BUILD
// =================================================

buildReport(){


return {


timestamp:new Date().toISOString(),


system:this.system(),


components:this.components(),


schema:this.schema(),


database:this.database(),


repositories:this.repositories(),


events:this.events(),


modules:this.modules(),


health:this.health(),


summary:this.summary()


};


},




// =================================================
// SYSTEM
// =================================================

system(){


return {


version:
SystemInit?.version || null,


initialized:
SystemInit?.initialized || false,


startedAt:
SystemInit?.startedAt || null,


uptime:
SystemInit?.startedAt
?
Date.now()
-
new Date(SystemInit.startedAt).getTime()
:
0


};


},





// =================================================
// COMPONENTS
// =================================================


components(){


const check=(name)=>{


const obj=globalThis[name];


if(!obj)
return "NOT_FOUND";


if(
obj.ready===true ||
obj.initialized===true ||
obj.status==="READY"
)
return "READY";


return "LOADED";


};



return {


Config:check("Config"),

Logger:check("Logger"),

SchemaRegistry:check("SchemaRegistry"),

SchemaManager:check("SchemaManager"),

Database:check("Database"),

EntityRegistry:check("EntityRegistry"),

RepositoryFactory:check("RepositoryFactory"),

RepositoryRegistry:check("RepositoryRegistry"),

EventBus:check("EventBus"),

BusinessEventProcessor:check("BusinessEventProcessor"),

ModuleRegistry:check("ModuleRegistry")


};


},





// =================================================
// SCHEMA
// =================================================

schema(){


try{


if(typeof SchemaRegistry!=="undefined"){


return {


status:
SchemaRegistry.status,


initialized:
SchemaRegistry.initialized,


entities:
Object.keys(
SchemaRegistry.schemas||{}
),


tables:
Object.keys(
SchemaRegistry.tableIndex||{}
).length


};


}



}catch(e){

return {
error:e.message
};

}


return {};

},






// =================================================
// DATABASE
// =================================================


database(){


try{


return {


status:
Database?.status || null,


initialized:
Database?.initialized || false,


ready:
Database?.ready || false,


tables:
SchemaRegistry?.tableIndex
?
Object.keys(
SchemaRegistry.tableIndex
)
:
[]


};


}
catch(e){


return {
error:e.message
};


}


},






// =================================================
// REPOSITORIES
// =================================================

repositories(){


return {


factory:


RepositoryFactory?.registry
?
Object.keys(
RepositoryFactory.registry
)
:
RepositoryFactory?.repositories
?
Object.keys(
RepositoryFactory.repositories
)
:
[],



registry:


RepositoryRegistry?.repositories
?
Object.keys(
RepositoryRegistry.repositories
)
:
[]


};


},






// =================================================
// EVENTS
// =================================================

events(){


try{


let events=[];


if(EventBus?.list)
events=EventBus.list();


else
if(EventBus?.events)
events=
Object.keys(EventBus.events);



return {


ready:
EventBus?.ready || false,


count:
events.length,


events


};


}
catch(e){

return {
error:e.message
};

}



},







// =================================================
// MODULES
// =================================================


modules(){


try{


return {


count:

ModuleRegistry?.modules
?
Object.keys(ModuleRegistry.modules).length
:
0,


items:

ModuleRegistry?.modules
?
Object.keys(ModuleRegistry.modules)
:
[],


failed:

ModuleRegistry?.failed || []


};


}
catch(e){

return {};

}


},







// =================================================
// HEALTH
// =================================================


health(){


try{


if(SystemInit?.health)

return SystemInit.health();



return {

status:"UNKNOWN"

};


}
catch(e){

return {

status:"ERROR",

error:e.message

};

}



},






// =================================================
// SUMMARY
// =================================================

summary(){


const h=this.health();


return {


status:
h?.status || "UNKNOWN",


critical:


{


database:
Database?.initialized || false,


eventBus:
EventBus?.ready || false,


processor:
BusinessEventProcessor?.ready || false


}



};


},






// =================================================
// DIAGNOSTICS
// =================================================


diagnostics(){

return this.buildReport();

},






// =================================================
// PRINT
// =================================================


print(r){


Logger.log(
"========== ERP DIAGNOSTICS v"+
this.version+
" =========="
);



Logger.log(
JSON.stringify(
r.summary,
null,
2
)
);



Logger.log(
JSON.stringify(
r.components,
null,
2
)
);



Logger.log(
"========== END =========="
);



}



};




// GLOBAL


globalThis.ERPDiagnostics=
ERPDiagnostics;



globalThis.erpDiag=
()=>ERPDiagnostics.run();



globalThis.erpDiagJSON=
()=>ERPDiagnostics.run({
json:true
});



globalThis.erpHealth=
()=>ERPDiagnostics.health();



Logger.log(
"ERP Diagnostics READY v"+
ERPDiagnostics.version
);