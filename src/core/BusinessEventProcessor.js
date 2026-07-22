console.log("BusinessEventProcessor v1.2");


const BusinessEventProcessor = {


version:"1.2.0",


ready:false,

processed:0,

failed:0,


processedEvents:{},



init(){


this.ready=true;


Logger.log(
"BusinessEventProcessor READY v"+
this.version
);


},




process(event){


try{


if(!event){

throw new Error(
"EMPTY ERP EVENT"
);

}



Logger.log(
"BUSINESS EVENT PROCESS "+
event.entity+
" "+
event.type
);




// защита от дублей

if(this.isProcessed(event.id)){


Logger.warn(
"DUPLICATE EVENT "+
event.id
);


return;

}




this.markProcessed(event);




// бизнес маршрутизация

this.processEntity(event);




// аудит через pipeline

this.processAudit(event);




// успешное выполнение

this.success(event);



this.processed++;



}
catch(e){


this.failed++;


Logger.error(
"BUSINESS PROCESS ERROR "+
e.message
);



this.failedEvent(
event,
e
);



}


},




// -------------------------
// Проверка дублей
// -------------------------

isProcessed(id){


if(!id)
return false;


return !!this.processedEvents[id];


},




markProcessed(event){


if(event.id){

this.processedEvents[event.id]={
timestamp:
new Date().toISOString()
};

}


},




// -------------------------
// Бизнес логика
// -------------------------


processEntity(event){



switch(event.entity){



case "TRANSPORT_ORDER":


Logger.log(
"TRANSPORT ORDER BUSINESS FLOW "+
event.type
);


break;



case "TRIP":


Logger.log(
"TRIP BUSINESS FLOW "+
event.type
);


break;




case "CLIENT":


Logger.log(
"CLIENT BUSINESS FLOW "+
event.type
);


break;




default:


Logger.warn(
"UNKNOWN BUSINESS ENTITY "+
event.entity
);


}



},




// -------------------------
// Audit
// -------------------------


processAudit(event){



if(
typeof AuditEventHandler!=="undefined"
){


AuditEventHandler.onEvent(
event
);


}



},




// -------------------------
// Успех
// -------------------------


success(event){


if(
typeof EventExecutionLog!=="undefined"
){


EventExecutionLog.success(
event
);


}



},




// -------------------------
// Ошибка
// -------------------------


failedEvent(event,error){



if(
typeof EventExecutionLog!=="undefined"
){


EventExecutionLog.failed(
event,
error
);


}




if(
typeof EventRetryQueue!=="undefined"
){


EventRetryQueue.enqueue(
event,
error
);


}



},




health(){


return HealthContract.create(

"BusinessEventProcessor",

this.ready?
"OK":
"WARNING",

{

version:this.version,

processed:this.processed,

failed:this.failed,

cache:
Object.keys(
this.processedEvents
).length

}

);


}


};



globalThis.BusinessEventProcessor =
BusinessEventProcessor;



Logger.log(
"BusinessEventProcessor LOADED v1.2.0"
);