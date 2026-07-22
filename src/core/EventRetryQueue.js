console.log("EventRetryQueue v1.0");


const EventRetryQueue={


version:"1.0.0",

maxRetry:3,


enqueue(event,error){


const item={

event:event,

error:error.message,

attempt:1,

created:
new Date()

};


Logger.log(
"EVENT RETRY QUEUED "+
event.id
);



if(
typeof FailedEventRepository!=="undefined"
){

FailedEventRepository.save(
event,
error
);

}


return item;

},




retry(event){


Logger.log(
"RETRY EVENT "+
event.id
);



if(
typeof BusinessEventProcessor!=="undefined"
){

BusinessEventProcessor.process(
event
);

}


},




health(){

return HealthContract.create(
"EventRetryQueue",
"OK",
{
version:this.version
});

}


};


globalThis.EventRetryQueue =
EventRetryQueue;


Logger.log(
"EventRetryQueue READY v1.0.0"
);