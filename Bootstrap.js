const Bootstrap = {


version:"0.5.0",


start(){

Logger.log("🚀 ERP BOOT START");


SystemInit.init();


Logger.log("✅ ERP BOOT COMPLETE");


},



health(){

return Inspector.inspect();

}


};


globalThis.Bootstrap = Bootstrap;