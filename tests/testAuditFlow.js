function testAuditFlow(){

const client =
ClientRepository.create({

Name:"Audit Flow v2",

INN:"9999999999"

});


Logger.log(
JSON.stringify(client)
);


}