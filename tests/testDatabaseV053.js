function testDatabaseV053(){


Logger.log(
Database.exists(
"Clients",
"CLI000020"
)
);


Logger.log(
Database.count(
"Clients"
)
);


Database.softDelete(
"Clients",
"CLI000020"
);


Logger.log(
Database.count(
"Clients"
)
);


}