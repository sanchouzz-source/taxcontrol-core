console.log("KPIRepository");


const KPIRepository = {

    version:"1.1.0",

    entity:"KPI",


    create(data){

        return BaseRepository.create(
            this.entity,
            data
        );

    },


    findById(id){

        return BaseRepository.findById(
            this.entity,
            id
        );

    },


    get(id){

        return this.findById(id);

    },


    exists(id){

        return BaseRepository.exists(
            this.entity,
            id
        );

    },


    findAll(filters={}){

        return BaseRepository.findAll(
            this.entity,
            filters
        );

    },


    update(id,data){

        return BaseRepository.update(
            this.entity,
            id,
            data
        );

    },


    delete(id){

        return BaseRepository.delete(
            this.entity,
            id
        );

    },


    restore(id){

        return BaseRepository.restore(
            this.entity,
            id
        );

    },


    health(){

        return HealthContract.create(

            "KPIRepository",

            "OK",

            {

                version:this.version,

                entity:this.entity

            }

        );

    }


};



globalThis.KPIRepository =
KPIRepository;


Logger.log(
"KPIRepository READY v"
+
KPIRepository.version
);