console.log("ClientFinanceProfileRepository");



const ClientFinanceProfileRepository = {



version:"1.0.0",



entity:
"CLIENT_FINANCE_PROFILE",



table:
"ClientFinanceProfiles",



idField:
"FinanceProfileID",






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







findAll(filters={}){



return BaseRepository.findAll(

    this.entity,

    filters

);



},







update(
id,
data
){



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







exists(id){



return BaseRepository.exists(

    this.entity,

    id

);



},







findByClient(
clientId
){



return this.findAll(

    {

        ClientID:
            clientId

    }


);



},







updateBalance(
clientId,
amount
){



const profiles =
    this.findByClient(
        clientId
    );




if(
!profiles.length
){

    throw new Error(

        "Finance profile not found "

        +
        clientId

    );

}




const profile =
    profiles[0];





return this.update(

    profile.FinanceProfileID,

    {


        Balance:

            Number(
                profile.Balance || 0
            )
            +
            Number(amount)


    }


);



},







health(){



return HealthContract.create(


"ClientFinanceProfileRepository",


"OK",


{


version:this.version,


entity:this.entity,


table:this.table


}



);



}



};






globalThis.ClientFinanceProfileRepository =
ClientFinanceProfileRepository;



Logger.log(
"ClientFinanceProfileRepository READY v1.0.0"
);