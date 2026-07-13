function testDatabaseInsert(){


Database.insert(

"Clients",

{

ClientID:
IdService.generate("CLI"),

Name:
"Тестовый клиент",

Phone:
"89000000000"

}

);


}