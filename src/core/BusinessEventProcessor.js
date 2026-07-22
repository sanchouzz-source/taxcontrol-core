console.log("BusinessEventProcessor v1.1");


const BusinessEventProcessor = {

version:"1.1.0",

ready:false,

processed:0,


init(){

    this.ready=true;

    Logger.log(
    "BusinessEventProcessor READY v"+
    this.version);

},



process(event){

    try{


        if(!event){
            throw new Error(
            "EMPTY ERP EVENT");
        }


        Logger.log(
        "BUSINESS EVENT PROCESS "+
        event.entity+
        " "+
        event.type);


        this.processEntity(event);


        this.processAudit(event);


        this.processed++;


    }
    catch(e){

        Logger.error(
        "BUSINESS PROCESS ERROR "+
        e.message);

    }

},




processEntity(event){


    switch(event.entity){


        case "TRANSPORT_ORDER":

            Logger.log(
            "TRANSPORT ORDER BUSINESS FLOW "+
            event.type);

            break;



        case "TRIP":

            Logger.log(
            "TRIP BUSINESS FLOW "+
            event.type);

            break;



        default:

            Logger.warn(
            "UNKNOWN BUSINESS ENTITY "+
            event.entity);

    }


},




processAudit(event){


    if(
    typeof AuditEventHandler!=="undefined")
    {

        AuditEventHandler.onEvent(event);

    }


},




health(){

return HealthContract.create(

"BusinessEventProcessor",

this.ready?"OK":"WARNING",

{

version:this.version,

processed:this.processed

});

}


};



globalThis.BusinessEventProcessor =
BusinessEventProcessor;


Logger.log(
"BusinessEventProcessor LOADED v1.1.0");