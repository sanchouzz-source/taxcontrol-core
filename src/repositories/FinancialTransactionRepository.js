// ============================================================
// FinancialTransactionRepository v1.2.0
// ============================================================

console.log("FinancialTransactionRepository v1.2.0");


const FinancialTransactionRepository = {

version:"1.2.0",


create(data){

return BaseRepository.create(
    "FINANCIAL_TRANSACTION",
    data
);

},


findAll(){

return BaseRepository.findAll(
    "FINANCIAL_TRANSACTION"
);

},


findById(id){

return BaseRepository.findById(
    "FINANCIAL_TRANSACTION",
    id
);

},


update(id,data){

return BaseRepository.update(
    "FINANCIAL_TRANSACTION",
    id,
    data
);

},


delete(id){

return BaseRepository.delete(
    "FINANCIAL_TRANSACTION",
    id
);

},


restore(id){

return BaseRepository.restore(
    "FINANCIAL_TRANSACTION",
    id
);

}


};


globalThis.FinancialTransactionRepository =
FinancialTransactionRepository;


Logger.log(
"FinancialTransactionRepository READY v1.2.0"
);