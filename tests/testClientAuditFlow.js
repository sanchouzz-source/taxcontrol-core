function testClientAuditFlow(){


SystemInit.init();



const client = {

OrganizationID:
"ORG000001",

Name:
"Audit Flow Test",

INN:
"3333333333",

Phone:
"+79999999999",

Email:
"audit@test.ru"

};



const result =
Database.insert(
"Clients",
client
);



EventBus.emit(
"CLIENT_CREATED",
result
);



Logger.log(result);


}