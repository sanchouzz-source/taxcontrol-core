console.log("EntityRegistry");



const EntityRegistry = {


version:"1.0.0",



ready:false,





CLIENT:{


entity:"CLIENT",


module:"core",


table:"Clients",



idField:"ClientID",


idPrefix:"CLIENT",



metadata:"CLIENT",



repository:"ClientRepository",



audit:true,


softDelete:true,


timestamps:true,





get validator(){

    return globalThis.ClientValidator;

},





permissions:{


create:
PERMISSION_CLIENT_CREATE,


read:
PERMISSION_CLIENT_READ,


update:
PERMISSION_CLIENT_UPDATE,


delete:
PERMISSION_CLIENT_DELETE,


restore:
PERMISSION_CLIENT_RESTORE


},





events:{


created:
"CLIENT_CREATED",


updated:
"CLIENT_UPDATED",


deleted:
"CLIENT_DELETED",


restored:
"CLIENT_RESTORED"


}



},







TRIP:{


entity:"TRIP",


module:"core",


table:"Trips",



idField:"TripID",


idPrefix:"TRIP",



metadata:"TRIP",



repository:"TripRepository",



audit:true,


softDelete:true,


timestamps:true,





get validator(){

    return globalThis.TripValidator;

},





permissions:{


create:
PERMISSION_TRIP_CREATE,


read:
PERMISSION_TRIP_READ,


update:
PERMISSION_TRIP_UPDATE,


delete:
PERMISSION_TRIP_DELETE,


restore:
PERMISSION_TRIP_RESTORE


},





events:{


created:
"TRIP_CREATED",


updated:
"TRIP_UPDATED",


deleted:
"TRIP_DELETED",


restored:
"TRIP_RESTORED"


}



},







CLIENT_FINANCE_PROFILE:{


entity:"CLIENT_FINANCE_PROFILE",


module:"finance",


table:"ClientFinanceProfiles",



idField:"FinanceProfileID",


idPrefix:"FP",



metadata:"CLIENT_FINANCE_PROFILE",



repository:"ClientFinanceProfileRepository",



audit:true,


softDelete:true,


timestamps:true,





permissions:{


create:
PERMISSION_CLIENT_CREATE,


read:
PERMISSION_CLIENT_READ,


update:
PERMISSION_CLIENT_UPDATE,


delete:
PERMISSION_CLIENT_DELETE,


restore:
PERMISSION_CLIENT_RESTORE


},





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



}





};








/*
=================================
API
=================================
*/



EntityRegistry.get=function(entity){


const meta =
this[entity];



if(
!meta ||
!meta.entity
){

throw new Error(
"Entity not registered: "
+
entity
);

}


return meta;


};






EntityRegistry.has=function(entity){


return !!this[entity];


};








EntityRegistry.list=function(){


return Object.keys(this)
.filter(
key=>
typeof this[key]==="object"
&&
this[key].entity
);


};







EntityRegistry.register=function(
entity,
config
){


if(this[entity]){


throw new Error(

"Entity already exists: "
+
entity

);


}




this[entity]=config;



Logger.log(

"ENTITY REGISTERED "
+
entity

);



};







EntityRegistry.getIdPrefix=function(entity){


return this
.get(entity)
.idPrefix;


};







EntityRegistry.getTable=function(entity){


return this
.get(entity)
.table;


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


entities:this.list()


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