function testDatabaseRead(){


const clients =
Database.query(
"Clients"
);


Logger.log(
JSON.stringify(
clients,
null,
2
)
);


}
