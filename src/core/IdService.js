console.log("IdService");


const IdService = {


    version:"3.0.0",


    ready:false,



    /*
    ====================================
    INIT
    ====================================
    */


    init(){


        if(this.ready){


            Logger.log(
                "IdService ALREADY READY"
            );


            return;

        }



        this.ready=true;



        Logger.log(
            "IdService READY v"
            +
            this.version
        );


    },





    /*
    ====================================
    GENERATE ID
    ONLY EntityRegistry
    ====================================
    */


    generate(entity){



        if(!entity){


            throw new Error(
                "IdService entity missing"
            );


        }






        /*
        Проверяем EntityRegistry
        */


        if(
            !globalThis.EntityRegistry
        ){


            throw new Error(
                "IdService EntityRegistry missing"
            );


        }






        /*
        Получаем Entity metadata
        */


        const meta =
            EntityRegistry.get(entity);






        if(
            !meta.idPrefix
        ){


            throw new Error(

                "Entity prefix missing: "
                +
                entity

            );


        }







        const prefix =
            meta.idPrefix;






        /*
        Потокобезопасный счетчик
        */


        const lock =
            LockService
            .getScriptLock();




        try {



            lock.waitLock(
                5000
            );





            const props =
                PropertiesService
                .getScriptProperties();





            const key =
                "ID_COUNTER_"
                +
                prefix;






            let counter =
                Number(
                    props.getProperty(key)
                )
                ||
                0;






            counter++;







            props.setProperty(

                key,

                String(counter)

            );








            return this.format(

                prefix,

                counter

            );



        }
        catch(e){



            Logger.log(

                "IdService ERROR: "
                +
                e.message

            );



            throw e;


        }
        finally{



            lock.releaseLock();


        }




    },









    /*
    ====================================
    FORMAT
    PREFIX000001
    ====================================
    */


    format(prefix,counter){



        return (

            prefix

            +

            String(counter)
            .padStart(
                6,
                "0"
            )

        );


    },









    /*
    ====================================
    RESET COUNTER
    ADMIN ONLY
    ====================================
    */


    reset(entity){



        const meta =
            EntityRegistry.get(entity);




        const prefix =
            meta.idPrefix;





        PropertiesService
        .getScriptProperties()
        .deleteProperty(

            "ID_COUNTER_"
            +
            prefix

        );



        Logger.log(

            "ID COUNTER RESET "
            +
            entity

        );


    },









    /*
    ====================================
    CURRENT VALUE
    ====================================
    */


    current(entity){



        const meta =
            EntityRegistry.get(entity);




        const prefix =
            meta.idPrefix;






        return Number(

            PropertiesService
            .getScriptProperties()
            .getProperty(

                "ID_COUNTER_"
                +
                prefix

            )

        )
        ||
        0;


    },









    /*
    ====================================
    HEALTH
    ====================================
    */


    health(){



        return HealthContract.create(

            "IdService",

            this.ready
            ?
            "OK"
            :
            "WARNING",

            {


                version:
                    this.version,


                registry:
                    !!globalThis.EntityRegistry


            }


        );


    }




};





globalThis.IdService =
IdService;





Logger.log(

    "IdService READY v"
    +
    IdService.version

);