console.log("EntityRegistry");


const EntityRegistry = {


version:"2.1.0",


ready:false,


aliases:{


    ClientFinanceProfiles:
        "CLIENT_FINANCE_PROFILE",


    FinancialTransactions:
        "FINANCIAL_TRANSACTION",


    AuditLogs:
        "AUDIT",


    Versions:
        "VERSION"


},



CLIENT:{


entity:"CLIENT",

module:"core",

table:"Clients",

idField:"ClientID",

idPrefix:"CLI",

repository:"ClientRepository",

audit:true,

softDelete:true,

timestamps:true,


events:{


created:"CLIENT_CREATED",

updated:"CLIENT_UPDATED",

deleted:"CLIENT_DELETED",

restored:"CLIENT_RESTORED"


}


},





TRIP:{


entity:"TRIP",

module:"core",

table:"Trips",

idField:"TripID",

idPrefix:"TRP",

repository:"TripRepository",

audit:true,

softDelete:true,

timestamps:true,


events:{


created:"TRIP_CREATED",

updated:"TRIP_UPDATED",

deleted:"TRIP_DELETED",

restored:"TRIP_RESTORED"


}


},





CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",

module:"finance",

table:"ClientFinanceProfiles",

idField:"FinanceProfileID",

idPrefix:"FP",

repository:
"ClientFinanceProfileRepository",

audit:true,

softDelete:true,

timestamps:true,


events:{


created:
"CLIENT_FINANCE_PROFILE_CREATED",


updated:
"CLIENT_FINANCE_PROFILE_UPDATED",


deleted:
"CLIENT_FINANCE_PROFILE_DELETED",


restored:
"CLIENT_FINANCE_PROFILE_RESTORED"


}


},





FINANCIAL_TRANSACTION:{


entity:
"FINANCIAL_TRANSACTION",


module:
"finance",


table:
"FinancialTransactions",


idField:
"TransactionID",


idPrefix:
"FIN",


repository:
"FinancialTransactionRepository",


audit:true,


events:{


created:
"FINANCIAL_TRANSACTION_CREATED",


updated:
"FINANCIAL_TRANSACTION_UPDATED",


deleted:
"FINANCIAL_TRANSACTION_DELETED"


}


},





AUDIT:{


entity:"AUDIT",

module:"core",

table:"AuditLog",

idField:"AuditID",

idPrefix:"AUD",

repository:"AuditRepository",

audit:false,


events:{}


},





VERSION:{


entity:"VERSION",

module:"core",

table:"Versions",

idField:"VersionID",

idPrefix:"VER",

repository:"VersionRepository",

audit:true,


events:{}


},





KPI:{


entity:"KPI",

module:"analytics",

table:"KPIs",

idField:"KPIID",

idPrefix:"KPI",

repository:"KPIRepository",

audit:true,


events:{


created:"KPI_CREATED",

updated:"KPI_UPDATED"


}


}

};





/*
==============================
API
==============================
*/


EntityRegistry.resolve=function(entity){


if(this.has(entity)){

return entity;

}



if(
this.aliases[entity]
){

return this.aliases[entity];

}



throw new Error(
"Unknown entity: "
+
entity
);


};





EntityRegistry.get=function(entity){


entity =
this.resolve(entity);


const meta =
this[entity];


if(!meta){

throw new Error(
"Entity metadata missing: "
+
entity
);

}


return meta;


};






EntityRegistry.has=function(entity){


return !!(
this[entity]
&&
this[entity].entity
);


};






EntityRegistry.list=function(){


return Object.keys(this)
.filter(key=>{


const item=this[key];


return (
item &&
typeof item==="object" &&
item.entity
);


});


};





EntityRegistry.getRepository=function(entity){

return this.get(entity).repository;

};





EntityRegistry.getTable=function(entity){

return this.get(entity).table;

};





EntityRegistry.getIdPrefix=function(entity){

return this.get(entity).idPrefix;

};





EntityRegistry.health=function(){


return HealthContract.create(

"EntityRegistry",

this.ready
?
"OK"
:
"WARNING",

{

version:this.version,

entities:this.list(),

count:this.list().length

}

);


};





EntityRegistry.ready=true;


globalThis.EntityRegistry =
EntityRegistry;



Logger.log(
"EntityRegistry READY v"
+
EntityRegistry.version
);