// ============================================================
// ModuleManifest v2.1.0
// Enterprise ERP Module Registry
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.6.x
// ModuleLoader v1.2.x
// ModuleRegistry v2.x
//
// ============================================================


console.log("ModuleManifest v2.1.0");





function createModule(config){


const definition={


apiVersion:"2.0",


enabled:true,


autoStart:true,


critical:false,


productionReady:false,


services:[],


entities:[],


events:[],


permissions:[],


tags:[],


...config


};





return {


moduleDefinition:definition,



context:null,



registered:false,


initialized:false,


started:false,






register(context){


this.context=context;


this.registered=true;



const module =
globalThis[definition.name];



if(
module &&
typeof module.register==="function"
){


return module.register(context);


}



return true;


},







init(context){


this.context=context || this.context;


const module =
globalThis[definition.name];



if(
module &&
typeof module.init==="function"
){


module.init(
this.context
);


}



this.initialized=true;



return true;


},







start(context){


this.context=context || this.context;



const module =
globalThis[definition.name];



if(
module &&
typeof module.start==="function"
){


module.start(
this.context
);


}



this.started=true;



return true;


},







stop(){


const module =
globalThis[definition.name];



if(
module &&
typeof module.stop==="function"
){


module.stop();


}



this.started=false;


return true;


},







health(){



const module =
globalThis[definition.name];



if(
module &&
typeof module.health==="function"
){


return module.health();


}



return HealthContract.create(

definition.name,

"WARNING",

{


version:
definition.version,


status:
"STUB",


initialized:
this.initialized,


started:
this.started


}


);



},







diagnostics(){


return {


name:
definition.name,


version:
definition.version,


phase:
definition.phase,


initialized:
this.initialized,


started:
this.started,


definition


};


}



};



}









const ERP_MODULE_MANIFEST={






// ============================================================
// LOGISTICS
// ============================================================



TransportOrderModule:createModule({


name:"TransportOrderModule",


version:"1.1.0",


description:
"Управление транспортными заказами",


owner:"LOGISTICS",


phase:"DOMAIN",


priority:100,


critical:true,


dependencies:[

"Database",

"EntityRegistry",

"EntityService",

"EventBus"

],



entities:[

"TRANSPORT_ORDER"

],



events:[

"TRANSPORT_ORDER_CREATED",

"TRANSPORT_ORDER_UPDATED",

"TRANSPORT_ORDER_DELETED"

]



}),








TripModule:createModule({


name:"TripModule",


version:"1.1.0",


description:
"Управление рейсами",


owner:"LOGISTICS",


phase:"DOMAIN",


priority:95,


dependencies:[

"Database",

"EntityService",

"EventBus"

],



entities:[

"TRIP"

],


events:[

"TRIP_CREATED",

"TRIP_STARTED",

"TRIP_COMPLETED",

"TRIP_DELAYED"

]



}),







// ============================================================
// CRM
// ============================================================


CRMSubscriptions:createModule({


name:"CRMSubscriptions",


version:"1.1.0",


description:
"CRM события клиентов",


owner:"CRM",


phase:"APPLICATION",


priority:80,


dependencies:[

"EntityService",

"EventBus"

],


entities:[

"CLIENT"

],


events:[

"CLIENT_CREATED",

"CLIENT_UPDATED"

]


}),








// ============================================================
// FINANCE
// ============================================================


FinanceEngine:createModule({


name:"FinanceEngine",


version:"1.1.0",


description:
"Финансовый движок",


owner:"FINANCE",


phase:"SERVICES",


priority:70,


dependencies:[

"Database",

"EntityService",

"EventBus"

],



entities:[

"FINANCIAL_TRANSACTION",

"CLIENT_FINANCE_PROFILE"

],



services:[

"Finance"

]



}),








// ============================================================
// ANALYTICS
// ============================================================



KPISubscriptions:createModule({


name:"KPISubscriptions",


version:"1.3.0",


description:
"Обновление KPI через события",


owner:"ANALYTICS",


phase:"APPLICATION",


priority:60,


dependencies:[

"EventBus",

"EntityService"

],


entities:[

"KPI"

]


}),






KPIEngine:createModule({


name:"KPIEngine",


version:"1.1.0",


description:
"Расчет KPI",


owner:"ANALYTICS",


phase:"SERVICES",


priority:50,


dependencies:[

"Database",

"EntityService"

],


services:[

"KPI"

]


}),








// ============================================================
// REPORTING
// ============================================================


DashboardEngine:createModule({


name:"DashboardEngine",


version:"1.1.0",


description:
"Dashboard и отчеты",


owner:"REPORTING",


phase:"REPORTING",


priority:40,


dependencies:[

"Database",

"EntityService",

"EventBus"

],


services:[

"Dashboard"

]


}),








// ============================================================
// COMMUNICATION
// ============================================================



NotificationSubscriptions:createModule({


name:"NotificationSubscriptions",


version:"1.4.0",


description:
"Система уведомлений",


owner:"COMMUNICATION",


phase:"APPLICATION",


priority:30,


dependencies:[

"EventBus"

],


events:[

"TRANSPORT_ORDER_CREATED",

"TRIP_COMPLETED",

"CLIENT_CREATED"

]


})





};






// ============================================================
// MANIFEST API v2.1.1
// Non enumerable methods
// ============================================================


Object.defineProperty(
ERP_MODULE_MANIFEST,
"manifestVersion",
{
    enumerable:false,
    value:"2.1.1"
});




// ------------------------------------------------------------
// LIST
// ------------------------------------------------------------

Object.defineProperty(
ERP_MODULE_MANIFEST,
"list",
{

enumerable:false,


value:function(){


return Object.keys(this)

.filter(name=>{


const item=this[name];


return (

item &&

typeof item==="object" &&

item.moduleDefinition &&

item.moduleDefinition.name

);


});


}

});






// ------------------------------------------------------------
// GET
// ------------------------------------------------------------


Object.defineProperty(
ERP_MODULE_MANIFEST,
"get",
{

enumerable:false,


value:function(name){


return this[name] || null;


}


});







// ------------------------------------------------------------
// VALIDATE
// ------------------------------------------------------------


Object.defineProperty(
ERP_MODULE_MANIFEST,
"validate",
{

enumerable:false,


value:function(){


const errors=[];



this.list()
.forEach(name=>{


const module=this[name];


const d=
module.moduleDefinition;



if(!d.name){

errors.push(
name+": name missing"
);

}



if(!d.phase){

errors.push(
name+": phase missing"
);

}



if(
!Array.isArray(d.dependencies)
){

errors.push(
name+": dependencies missing"
);

}



if(
typeof module.init!=="function"
){

errors.push(
name+": init missing"
);

}



});



return errors;


}


});







// ------------------------------------------------------------
// HEALTH
// ------------------------------------------------------------


Object.defineProperty(
ERP_MODULE_MANIFEST,
"health",
{

enumerable:false,


value:function(){



const errors=
this.validate();



return HealthContract.create(

"ERP_MODULE_MANIFEST",


errors.length
?
"WARNING"
:
"OK",


{


version:this.manifestVersion,


modules:this.list(),


count:this.list().length,


errors


}


);



}



});








// ============================================================
// GLOBAL
// ============================================================


globalThis.ERP_MODULE_MANIFEST =
ERP_MODULE_MANIFEST;



Logger.log(

"ModuleManifest READY v"+
ERP_MODULE_MANIFEST.manifestVersion+
" modules="+
ERP_MODULE_MANIFEST.list().length

);