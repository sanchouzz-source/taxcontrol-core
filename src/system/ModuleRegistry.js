console.log("ModuleRegistry");


if(!globalThis.ModuleRegistry){


const ModuleRegistry = {


version:"0.2.1",


modules:{},


order:[

"TripEventHandler",
"FinanceEngine",
"KPIEngine",
"DashboardEngine"

],




register(name, instance){


if(!name || !instance){

Logger.error(
"MODULE REGISTER FAILED "
+name
);

return false;

}




if(this.modules[name]){


Logger.warn(
"MODULE EXISTS "
+name
);

return true;

}




this.modules[name]={


instance:instance,

status:"REGISTERED",

initialized:false,

error:null,

startedAt:null


};



Logger.log(
"REGISTERED: "
+name
);


return true;


},






init(name){



const item=this.modules[name];


if(!item){

Logger.error(
"MISSING MODULE "
+name
);

return false;

}





if(item.initialized){

return true;

}





try{


Logger.log(
"INITIALIZING "
+name
);





if(
typeof item.instance.init==="function"
){

item.instance.init();

}





item.initialized=true;

item.status="READY";

item.startedAt=
new Date().toISOString();




Logger.log(
name+" READY"
);



return true;



}

catch(e){



item.status="ERROR";

item.error=e.message;


Logger.error(
name+
" ERROR "+
e.message
);


return false;


}



},








initAll(){



Logger.log(
"MODULE INIT START"
);



this.order.forEach(name=>{


this.init(name);


});



Logger.log(
"MODULE INIT COMPLETE"
);



},







health(){



return HealthContract.create(


"ModuleRegistry",


"OK",


{


version:this.version,


modules:Object.keys(this.modules)
.map(name=>{


let m=this.modules[name];


return{


Module:name,

Status:m.status,

Initialized:m.initialized,

Error:m.error


};


})


}



);



},






get(name){


return this.modules[name]||null;


}




};



globalThis.ModuleRegistry=
ModuleRegistry;



}