function testAuditFlow(){


const client =
ClientRepository.create({

Name:"Audit Flow v2",

INN:"9999999999",

Phone:"+79999999999",

Email:"audit2@test.ru"

});


Logger.log(
JSON.stringify(client)
);


}