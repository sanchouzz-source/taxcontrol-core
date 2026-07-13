console.log("Bootstrap");


const Bootstrap={


version:"0.5.0",




start(){


const props =
PropertiesService
.getScriptProperties();



if(
props.getProperty("ERP_STARTED")
==="true"
){


Logger.log(
"ERP ALREADY STARTED"
);


return;


}



Logger.log(
"🚀 ERP BOOT START"
);



SystemInit.init();



props.setProperty(
"ERP_STARTED",
"true"
);



Logger.log(
"✅ ERP BOOT COMPLETE"
);



},





reset(){


PropertiesService
.getScriptProperties()
.deleteProperty(
"ERP_STARTED"
);


Logger.log(
"BOOT RESET"
);



}




};


globalThis.Bootstrap=
Bootstrap;