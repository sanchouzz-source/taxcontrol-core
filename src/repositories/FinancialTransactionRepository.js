const FinancialTransactionRepository = {

version:"1.0.0",


create(data){

return BaseRepository.create(
    "FINANCIAL_TRANSACTION",
    data
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


}


};


globalThis.FinancialTransactionRepository =
FinancialTransactionRepository;


Logger.log(
"FinancialTransactionRepository READY v1.0.0"
);