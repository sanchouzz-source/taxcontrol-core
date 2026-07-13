console.log("Bootstrap");


const Bootstrap = {


version:"0.4.0",


started:false,



start(){


if(this.started){

Logger.log(
"BOOT ALREADY STARTED"
);

return;

}



Logger.log(
"🚀 ERP BOOT START"
);



SystemInit.init();



this.started=true;



Logger.log(
"✅ ERP BOOT COMPLETE"
);



},





health(){


return {


status:
this.started
?
"OK"
:
"NOT_READY",


module:"Bootstrap",


version:this.version



};


}



};



globalThis.Bootstrap =
Bootstrap;