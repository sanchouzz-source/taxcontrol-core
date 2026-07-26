console.log("TestEntityLifecycleMatrix");


const TestEntityLifecycleMatrix = {

  version: "1.4.0",


  run() {

    Logger.log("========== ENTITY MATRIX START ==========");


    try {

      Bootstrap.start();


      Logger.log("ERP SYSTEM READY");


      const result = {};


      result.SYSTEM_DATABASE = this.testSystemEntity();

      result.CLIENT = this.testClient();

      result.TRIP = this.testTrip();

      result.KPI = this.testKPI();

      result.VALIDATION = this.testValidation();


      Logger.log(JSON.stringify(result,null,2));


      Logger.log(
        "========== ENTITY MATRIX COMPLETE =========="
      );


      return result;


    } catch(e){

      Logger.error(
        "ENTITY MATRIX FAILED "
        + e.message
      );

      throw e;

    }

  },



  // ==================================================
  // SYSTEM ENTITY TEST
  // ==================================================

  testSystemEntity(){

    Logger.log(
      "========== TEST SYSTEM ENTITY =========="
    );


    const entity="__TEST_DATABASE";


    let meta;


    try {

      meta = SchemaRegistry.get(entity);

    } catch(e){

      Logger.error(
        "SchemaRegistry error "
        + e.message
      );

    }


    if(!meta){

      throw new Error(
        "SchemaRegistry missing "
        + entity
      );

    }


    Logger.log(
      "SCHEMA FOUND "
      + JSON.stringify(meta)
    );



    let record =
      EntityService.create(
        entity,
        {
          value:"matrix-test"
        }
      );


    Logger.log(
      "SYSTEM CREATE OK"
    );


    let read =
      EntityService.findById(
        entity,
        record.id
      );


    if(!read){

      throw new Error(
        "SYSTEM READ FAILED"
      );

    }


    Logger.log(
      "SYSTEM READ OK"
    );


    EntityService.delete(
      entity,
      record.id
    );


    Logger.log(
      "SYSTEM DELETE OK"
    );


    return true;

  },



  // ==================================================
  // CLIENT
  // ==================================================

  testClient(){

    Logger.log(
      "========== TEST CLIENT =========="
    );


    let client =
      EntityService.create(
        "CLIENT",
        {

          OrganizationID:
            OrganizationContext.get(),

          Name:
            "Matrix Client",

          INN:
            "7777777777",

          Phone:
            "+79990000001",

          Email:
            "matrix@test.ru",

          Status:
            "ACTIVE"

        }
      );


    Logger.log(
      "CREATE CLIENT OK"
    );



    let read =
      EntityService.findById(
        "CLIENT",
        client.ClientID
      );


    if(!read)
      throw new Error(
        "CLIENT READ FAILED"
      );



    EntityService.update(
      "CLIENT",
      client.ClientID,
      {
        Status:"UPDATED"
      }
    );


    EntityService.delete(
      "CLIENT",
      client.ClientID
    );


    EntityService.restore(
      "CLIENT",
      client.ClientID
    );


    return EntityService.findById(
      "CLIENT",
      client.ClientID
    );

  },


  // остальные методы testTrip,
  // testKPI,
  // testValidation
  // оставить без изменений

};



globalThis.TestEntityLifecycleMatrix =
TestEntityLifecycleMatrix;



function testEntityLifecycleMatrix(){

 return TestEntityLifecycleMatrix.run();

}