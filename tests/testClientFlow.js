function testClientFlow(){


const client =
ClientRepository.create({

Name:"Тестовый клиент",

INN:"1111111111",

Phone:"+79999999999",

Email:"test@test.ru"

});



Logger.log(
JSON.stringify(
client,
null,
2
)
);



const updated =
ClientRepository.update(

client.ClientID,

{

Phone:"+70000000000"

}

);



Logger.log(
JSON.stringify(
updated,
null,
2
)
);



}