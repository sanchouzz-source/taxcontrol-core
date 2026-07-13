console.log("SystemInit");



const SystemInit={



version:"0.4.0",


initialized:false,





init(){



if(this.initialized){


Logger.log(
"SYSTEM ALREADY INITIALIZED"
);


return;


}



Logger.log(
"ERP SYSTEM INIT START"
);





// базовые сервисы


if(
typeof Database!=="undefined"
){

Database.init?.();

}





if(
typeof EventBus!=="undefined"
){

EventBus.init?.();

}





// загрузка модулей


ModuleLoader.load();



// запуск модулей


ModuleLoader.init();





this.initialized=true;



Logger.log(
"ERP SYSTEM READY"
);



},








health(){


return {


status:
this.initialized
?
"OK"
:
"NOT_READY",


module:"SystemInit",


version:this.version,


initialized:this.initialized,


dependencies:{


Database:
typeof Database!=="undefined",


EventBus:
typeof EventBus!=="undefined",


ModuleLoader:
typeof ModuleLoader!=="undefined"


}


};



}



};



globalThis.SystemInit=
SystemInit;