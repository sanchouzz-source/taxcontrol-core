// ============================================================
// Bootstrap v0.6.0
// ERP Startup Controller
// TaxControl ERP Core
//
// Compatible:
// SystemInit v2.4.x
// Inspector
// HealthContract
// ============================================================


console.log("Bootstrap v0.6.0");



const Bootstrap = {


version:"0.6.0",


started:false,


starting:false,


startedAt:null,




// ============================================================
// START
// ============================================================


async start(){


if(this.started){

Logger.warn(
"ERP already started"
);

return this.health();

}



if(this.starting){

Logger.warn(
"ERP startup already running"
);

return;

}



this.starting=true;



try{


Logger.log(
"🚀 ERP BOOT START"
);



this.startedAt =
new Date().toISOString();




// главный запуск

const result =
await SystemInit.init();



this.started=true;



Logger.log(
"✅ ERP BOOT COMPLETE"
);



return result;



}
catch(e){


Logger.error(

"❌ ERP BOOT FAILED "+
e.message

);



throw e;



}
finally{


this.starting=false;


}



},






// ============================================================
// HEALTH
// ============================================================


health(){


try{


if(
typeof SystemInit!=="undefined" &&
SystemInit.health
){


return SystemInit.health();


}



if(
typeof Inspector!=="undefined" &&
Inspector.inspect
){


return Inspector.inspect();


}



return {


status:"UNKNOWN",

message:
"Health services unavailable",

timestamp:
new Date().toISOString()


};



}
catch(e){


return{


status:"FAILED",

error:e.message,


timestamp:
new Date().toISOString()


};



}



},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return{


version:this.version,


started:this.started,


starting:this.starting,


startedAt:this.startedAt,



system:
typeof SystemInit!=="undefined"
?
SystemInit.diagnostics()
:
null



};


},







// ============================================================
// RESET
// ============================================================


reset(){


this.started=false;

this.starting=false;

this.startedAt=null;


Logger.log(
"Bootstrap RESET"
);


}



};





// ============================================================
// GLOBAL
// ============================================================


globalThis.Bootstrap =
Bootstrap;






// ============================================================
// COMMANDS
// ============================================================


globalThis.bootERP = function(){

return Bootstrap.start();

};



globalThis.bootHealth = function(){

return Bootstrap.health();

};



globalThis.bootDiag = function(){

return Bootstrap.diagnostics();

};





Logger.log(
"Bootstrap READY v"+
Bootstrap.version
);



Logger.log(
"ERP COMMANDS:"
);


Logger.log(
" bootERP()"
);


Logger.log(
" bootHealth()"
);


Logger.log(
" bootDiag()"
);