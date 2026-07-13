console.log("App");

function erpStart(){

Logger.log(
"========== ERP START REQUEST =========="
);

Bootstrap.start();

return Inspector.inspect();

}

function erpHealth(){

Logger.log(
"========== ERP HEALTH REQUEST =========="
);

Bootstrap.start();

const report =
Inspector.inspect();

Logger.log(
JSON.stringify(
report,
null,
2
)
);

return report;

}

function erpReset(){

if(
ModuleRegistry
){

ModuleRegistry.reset();

}

Logger.log(
"ERP RESET COMPLETE"
);

}