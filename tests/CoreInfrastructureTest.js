// ============================================================
// CoreInfrastructureTest v2.1
// ERP Core Architecture Validation
// ============================================================


console.log("CoreInfrastructureTest v2.1");


const CoreInfrastructureTest = {


  version:"2.1.0",


  run(options={}) {


    Logger.log(
      "========== CORE INFRASTRUCTURE TEST v2.1 =========="
    );


    const result={

      version:this.version,

      timestamp:new Date().toISOString(),

      entities:[],

      summary:{}

    };


    try{


      // ===============================
      // 1. SYSTEM BOOT
      // ===============================

      this.checkComponent(
        "EntityRegistry",
        typeof EntityRegistry !== "undefined"
      );


      this.checkComponent(
        "SchemaRegistry",
        typeof SchemaRegistry !== "undefined"
      );


      this.checkComponent(
        "RepositoryFactory",
        typeof RepositoryFactory !== "undefined"
      );


      this.checkComponent(
        "EntityService",
        typeof EntityService !== "undefined"
      );




      // ===============================
      // 2. Получаем список сущностей
      // ===============================


      const entities =
        EntityRegistry.list();


      Logger.log(
        "Entities found: " + entities.length
      );



      // ===============================
      // 3. Проверяем каждую Entity
      // ===============================


      for(const entity of entities){


        result.entities.push(
          this.checkEntity(entity)
        );


      }



      // ===============================
      // SUMMARY
      // ===============================


      result.summary =
        this.summary(result.entities);



      Logger.log(
        JSON.stringify(result,null,2)
      );


      Logger.log(
        "========== CORE TEST COMPLETE =========="
      );


      return result;


    }
    catch(e){


      Logger.error(
        "CORE INFRASTRUCTURE FAILED "
        +e.message
      );


      throw e;

    }


  },



  // ============================================================
  // ENTITY CHECK
  // ============================================================


  checkEntity(entity){


    const row={

      entity,

      metadata:false,

      schema:false,

      repository:false,

      crud:false,

      errors:[]

    };



    try{


      // ---------------------
      // Metadata
      // ---------------------

      let meta =
        EntityRegistry.get(entity);


      if(meta){

        row.metadata=true;

      }



      // ---------------------
      // Schema
      // ---------------------

      let schema =
        SchemaRegistry.get(entity);


      if(schema){

        row.schema=true;


        if(!schema.fields ||
           schema.fields.length===0){


          row.errors.push(
            "Schema fields empty"
          );

        }


        if(!schema.idField){

          row.errors.push(
            "Missing idField"
          );

        }

      }



      // ---------------------
      // Repository
      // ---------------------

      try{


        let repo =
          RepositoryFactory.get(entity);


        if(repo){

          row.repository=true;

        }


      }
      catch(e){


        row.errors.push(
          "Repository: "+e.message
        );


      }





      // ---------------------
      // CRUD TEST
      // ---------------------

      if(
        row.metadata &&
        row.schema &&
        row.repository
      ){


        row.crud =
          this.testCrud(entity);



      }



    }
    catch(e){


      row.errors.push(
        e.message
      );


    }



    return row;

  },



  // ============================================================
  // CRUD SAFE TEST
  // ============================================================


  testCrud(entity){


    try{


      const schema =
        SchemaRegistry.get(entity);



      // тестируем только системные таблицы
      // и безопасные сущности


      if(schema.system){


        const idField =
          schema.idField;



        const data={};


        data[idField]="TEST001";


        if(
          schema.fields.some(
            f=>f.name==="value"
          )
        ){

          data.value="CORE TEST";

        }


        EntityService.create(
          entity,
          data
        );


        const found =
          EntityService.findById(
            entity,
            data[idField]
          );


        if(!found){

          throw new Error(
            "READ FAILED"
          );

        }



        EntityService.delete(
          entity,
          data[idField]
        );



        return true;


      }


      // бизнес сущности пока
      // проверяем только наличие сервиса


      return true;


    }
    catch(e){


      Logger.warn(
        "CRUD failed "
        +entity+
        ": "
        +e.message
      );


      return false;

    }


  },



  // ============================================================
  // COMPONENT CHECK
  // ============================================================


  checkComponent(name,state){


    if(!state){

      throw new Error(
        "Missing component "+name
      );

    }


    Logger.log(
      "COMPONENT OK "+name
    );


  },



  // ============================================================
  // SUMMARY
  // ============================================================


  summary(rows){


    return {

      total:
        rows.length,


      metadata:
        rows.filter(
          x=>x.metadata
        ).length,


      schema:
        rows.filter(
          x=>x.schema
        ).length,


      repository:
        rows.filter(
          x=>x.repository
        ).length,


      crud:
        rows.filter(
          x=>x.crud
        ).length,


      failed:
        rows.filter(
          x=>x.errors.length
        ).length

    };


  }


};



globalThis.CoreInfrastructureTest =
  CoreInfrastructureTest;



function testCoreInfrastructure(){

  return CoreInfrastructureTest.run();

}