function testClientInsert(){

const client={

ClientID:
IdService.generate("CLI"),

OrganizationID:
OrganizationContext.get(),

Name:
"Тестовый клиент"

};


Database.insert(
"Clients",
client
);


}