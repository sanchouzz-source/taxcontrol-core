console.log("BusinessEventProcessor v1.0");


const BusinessEventProcessor = {


  version:"1.0.0",

  initialized:false,

  processors:[],


  init(){


    if(this.initialized){

      Logger.log(
        "BusinessEventProcessor ALREADY READY"
      );

      return true;
    }


    this.registerProcessors();


    this.initialized=true;


    Logger.log(
      "BusinessEventProcessor READY v"+
      this.version
    );


    return true;

  },



  registerProcessors(){


    this.processors=[];


    const services=[


      {
        name:"AuditEventHandler",
        method:"handle"
      },


      {
        name:"KPIEngine",
        method:"process"
      },


      {
        name:"FinanceEngine",
        method:"process"
      },


      {
        name:"DashboardEngine",
        method:"process"
      }


    ];



    services.forEach(service=>{


      if(
        typeof globalThis[service.name]!=="undefined"
        &&
        typeof globalThis[service.name][service.method]
        ==="function"
      ){


        this.processors.push(service);


        Logger.log(
          "EVENT PROCESSOR REGISTERED "+
          service.name
        );

      }


    });


  },





  process(event){


    if(!event)
      return;



    Logger.log(
      "BUSINESS EVENT PROCESS "+
      event.entity+
      " "+
      event.action
    );



    this.processors.forEach(
      processor=>{


        try{


          globalThis[
            processor.name
          ][
            processor.method
          ](event);



        }
        catch(e){


          Logger.log(

            "PROCESSOR ERROR "+
            processor.name+
            " "+
            e.message

          );


        }


      }
    );


  },





  health(){


    return HealthContract.create(

      "BusinessEventProcessor",

      this.initialized
      ?
      "OK"
      :
      "WARNING",


      {

        version:this.version,

        processors:
        this.processors.map(
          p=>p.name
        )

      }

    );


  }


};



globalThis.BusinessEventProcessor =
BusinessEventProcessor;


Logger.log(
"BusinessEventProcessor LOADED v1.0.0"
);