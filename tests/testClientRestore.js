function testClientRestore(){


SystemInit.init();



const client =
ClientRepository.create({

Name:
"Restore Test",

INN:
"2222222222",

Phone:
"+79999999999",

Email:
"restore@test.ru"

});



Logger.log(
"CREATED"
+
client.ClientID
);



const deleted =
ClientRepository.delete(
client.ClientID
);



Logger.log(
"DELETED"
);



const restored =
ClientRepository.restore(
client.ClientID
);



Logger.log(
JSON.stringify(
restored,
null,
2
)

);


}