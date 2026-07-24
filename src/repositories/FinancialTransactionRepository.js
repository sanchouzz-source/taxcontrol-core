// ============================================================
// FinancialTransactionRepository v1.1.0
// ============================================================

const FinancialTransactionRepository = {

  version:"1.1.0",

  entityName:"FINANCIAL_TRANSACTION",


  // ============================================================
  // CREATE
  // ============================================================

  create(data){

    return BaseRepository.create(
      this.entityName,
      data
    );

  },


  // ============================================================
  // FIND BY ID
  // ============================================================

  findById(id){

    return BaseRepository.findById(
      this.entityName,
      id
    );

  },


  // ============================================================
  // FIND ALL
  // ============================================================

  findAll(){

    return BaseRepository.findAll(
      this.entityName
    );

  },


  // ============================================================
  // UPDATE
  // ============================================================

  update(id,data){

    return BaseRepository.update(
      this.entityName,
      id,
      data
    );

  },


  // ============================================================
  // DELETE
  // ============================================================

  delete(id){

    return BaseRepository.delete(
      this.entityName,
      id
    );

  },


  // ============================================================
  // HEALTH
  // ============================================================

  health(){

    return {

      status:"OK",

      repository:
        "FinancialTransactionRepository",

      version:this.version,

      entity:this.entityName

    };

  }


};


// ============================================================
// GLOBAL REGISTER
// ============================================================

globalThis.FinancialTransactionRepository =
FinancialTransactionRepository;


Logger.log(
"FinancialTransactionRepository READY v1.1.0"
);