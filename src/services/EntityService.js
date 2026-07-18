console.log("EntityService");



const EntityService = {


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
                "EntityService ALREADY READY"
            );


            return;


        }



        this.ready=true;



        Logger.log(
            "EntityService READY v"
            +
            this.version
        );


    },






    /*
    ====================================
    CREATE
    ====================================
    */


    create(entity,data={}){



        const meta =
            this.getMetadata(entity);






        SecurityGuard.check(

            meta.permissions.create

        );






        /*
        Генерация ID
        только через EntityRegistry
        */


        if(
            meta.idField &&
            !data[meta.idField]
        ){


            data[meta.idField] =

                IdService.generate(
                    entity
                );


        }







        const repository =

            RepositoryFactory
            .get(entity);







        const result =

            repository.create(
                data
            );






        /*
        Событие только после INSERT
        */


        this.publishEvent(

            meta.events.created,

            {

                entity,

                entityId:
                    data[meta.idField],

                action:
                    "CREATE",

                before:null,

                after:data,

                data

            }

        );





        return result;


    },









    /*
    ====================================
    READ ONE
    ====================================
    */


    findById(entity,id){



        const meta =
            this.getMetadata(entity);





        SecurityGuard.check(

            meta.permissions.read

        );





        return RepositoryFactory

            .get(entity)

            .findById(id);



    },











    /*
    ====================================
    READ ALL
    ====================================
    */


    findAll(entity,filters={}){



        const meta =
            this.getMetadata(entity);





        SecurityGuard.check(

            meta.permissions.read

        );






        return RepositoryFactory

            .get(entity)

            .findAll(filters);



    },











    /*
    ====================================
    UPDATE
    ====================================
    */


    update(entity,id,data){



        const meta =
            this.getMetadata(entity);






        SecurityGuard.check(

            meta.permissions.update

        );







        const repository =

            RepositoryFactory
            .get(entity);







        const before =

            repository.findById(
                id
            );







        const result =

            repository.update(

                id,

                data

            );








        this.publishEvent(

            meta.events.updated,

            {


                entity,


                entityId:id,


                action:
                    "UPDATE",



                before,



                after:
                    result,



                data:
                    result


            }


        );






        return result;


    },











    /*
    ====================================
    DELETE SOFT
    ====================================
    */


    delete(entity,id){



        const meta =
            this.getMetadata(entity);






        SecurityGuard.check(

            meta.permissions.delete

        );








        const repository =

            RepositoryFactory
            .get(entity);






        const before =

            repository.findById(
                id
            );






        const result =

            repository.delete(
                id
            );







        this.publishEvent(

            meta.events.deleted,


            {


                entity,


                entityId:id,


                action:
                    "DELETE",


                before,


                after:
                    result,


                data:
                    result


            }



        );







        return result;



    },











    /*
    ====================================
    RESTORE
    ====================================
    */


    restore(entity,id){



        const meta =
            this.getMetadata(entity);






        SecurityGuard.check(

            meta.permissions.restore

        );







        const repository =

            RepositoryFactory
            .get(entity);







        const before =

            repository.findById(
                id
            );






        const result =

            repository.restore(
                id
            );







        this.publishEvent(

            meta.events.restored,


            {


                entity,


                entityId:id,


                action:
                    "RESTORE",


                before,


                after:
                    result,


                data:
                    result


            }


        );






        return result;


    },









    /*
    ====================================
    EXISTS
    ====================================
    */


    exists(entity,id){



        return RepositoryFactory

            .get(entity)

            .exists(id);


    },









    /*
    ====================================
    REPOSITORY ACCESS
    ====================================
    */


    repository(entity){


        return RepositoryFactory

            .get(entity);


    },









    /*
    ====================================
    EVENT CONTRACT v3
    ====================================
    */


    publishEvent(eventName,payload){



        if(!eventName){


            return;


        }






        if(
            !EventBus
            ||
            !EventBus.publish
        ){



            throw new Error(

                "EventBus unavailable"

            );


        }








        const event = {


            eventId:

                Utilities
                .getUuid(),



            eventName,



            entity:

                payload.entity,



            entityId:

                payload.entityId,



            action:

                payload.action,



            before:

                payload.before || null,



            after:

                payload.after || null,



            data:

                payload.data || null,



            timestamp:

                new Date()
                .toISOString()



        };








        EventBus.publish(

            eventName,

            event

        );




        Logger.log(

            "EVENT PUBLISHED "
            +
            eventName
            +
            " "
            +
            event.entityId

        );



    },









    /*
    ====================================
    METADATA
    ====================================
    */


    getMetadata(entity){



        if(
            !EntityRegistry.has(entity)
        ){


            throw new Error(

                "Unknown entity: "
                +
                entity

            );


        }






        return EntityRegistry.get(entity);



    },









    /*
    ====================================
    HEALTH
    ====================================
    */


    health(){



        return HealthContract.create(

            "EntityService",


            this.ready
            ?
            "OK"
            :
            "WARNING",


            {

                version:
                    this.version,


                registry:
                    !!globalThis.EntityRegistry,


                repositoryFactory:
                    !!globalThis.RepositoryFactory,


                eventBus:
                    !!globalThis.EventBus


            }


        );


    }



};







globalThis.EntityService =
EntityService;





Logger.log(

"EntityService READY v"
+
EntityService.version

);