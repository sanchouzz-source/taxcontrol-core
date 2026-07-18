console.log("EntityService");


const EntityService = {


    version:"2.1.0",


    ready:false,



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






    create(entity,data){



        const meta =
            this.getMetadata(entity);





        SecurityGuard.check(

            meta.permissions.create

        );





        /*
            Нормализация ID
        */


        if(!data[meta.id]){


            data[meta.id] =
                this.generateId(
                    entity,
                    meta
                );

        }






        const repository =
            RepositoryFactory.get(
                entity
            );






        const result =
            repository.create(
                data
            );





        this.publishEvent(
            meta.events.created,
            result,
            "CREATE"
        );





        return result;


    },








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









    update(entity,id,data){



        const meta =
            this.getMetadata(entity);




        SecurityGuard.check(

            meta.permissions.update

        );




        const result =
            RepositoryFactory
            .get(entity)
            .update(
                id,
                data
            );




        this.publishEvent(

            meta.events.updated,

            result,

            "UPDATE"

        );




        return result;


    },









    delete(entity,id){



        const meta =
            this.getMetadata(entity);



        SecurityGuard.check(

            meta.permissions.delete

        );



        const result =
            RepositoryFactory
            .get(entity)
            .delete(id);




        this.publishEvent(

            meta.events.deleted,

            result,

            "DELETE"

        );



        return result;


    },








    restore(entity,id){


        const meta =
            this.getMetadata(entity);



        SecurityGuard.check(

            meta.permissions.restore

        );



        const result =
            RepositoryFactory
            .get(entity)
            .restore(id);




        this.publishEvent(

            meta.events.restored,

            result,

            "RESTORE"

        );



        return result;


    },









    exists(entity,id){


        return RepositoryFactory
            .get(entity)
            .exists(id);


    },









    repository(entity){


        return RepositoryFactory
            .get(entity);


    },









    generateId(entity,meta){


        /*
            ВАЖНО:
            используем metadata.idPrefix

        */


        let prefix =
            meta.idPrefix;



        if(!prefix){


            prefix =
                entity
                .toUpperCase()
                .substring(
                    0,
                    3
                );


        }




        return IdService.generate(
            prefix
        );


    },









    publishEvent(eventName,data,action){



        if(!eventName){

            return;

        }





        EventBus.publish(

            eventName,

            {

                action,

                entity:data

            }

        );



    },









    getMetadata(entity){



        const meta =
            EntityRegistry[entity];



        if(!meta){


            throw new Error(

                "Unknown entity: "
                +
                entity

            );


        }



        return meta;


    },









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
                    this.version

            }

        );


    }



};





globalThis.EntityService =
    EntityService;



Logger.log(
    "EntityService READY v2.1.0"
);