function testDatabaseExists(){

const result =
Database.exists(
"Clients",
"CLI000020"
);


Logger.log(result);

}