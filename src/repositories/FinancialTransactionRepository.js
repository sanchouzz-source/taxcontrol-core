// ============================================================
// FinancialTransactionRepository v1.1.0
// ERP Core Repository Contract
// ============================================================

console.log("FinancialTransactionRepository v1.1.0");


const FinancialTransactionRepository = {

    version:"1.1.0",


    entity:"FINANCIAL_TRANSACTION",


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


    findAll(filter){

        return BaseRepository.findAll(
            this.entity,
            filter || {}
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


    count(filter){

        if(BaseRepository.count){

            return BaseRepository.count(
                this.entity,
                filter || {}
            );

        }


        const rows = this.findAll(filter);

        return rows.length;

    },


    exists(id){

        return !!this.findById(id);

    },


    health(){

        return {

            status:"READY",

            repository:this.entity,

            version:this.version

        };

    }


};



globalThis.FinancialTransactionRepository =
FinancialTransactionRepository;



Logger.log(
"FinancialTransactionRepository READY v1.1.0"
);