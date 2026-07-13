function testDatabase(){


Database.init();


const client={


ClientID:
IdService.generate("CLI"),


OrganizationID:
OrganizationContext.get(),


Name:
"Тест клиент",


Phone:
"+79990000000"


};



Database.insert(
"Clients",
client
);



Logger.log(
"CLIENT INSERT OK"
);



}
