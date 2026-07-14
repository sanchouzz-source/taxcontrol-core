function testAuditFlow(){


SystemInit.init();



const client =
ClientRepository.create({

Name:"Audit Flow v3",

INN:"9999999999",

Phone:"+79999999999",

Email:"audit3@test.ru"

});


Logger.log(client);


}