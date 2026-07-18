console.log("testEntityService");



function testEntityService(){


Logger.log(
"========== ENTITY SERVICE TEST START =========="
);



try{


Logger.log(
"ERP SYSTEM INIT"
);



SystemInit.init();



Logger.log(
"===== STEP 0: SYSTEM HEALTH ====="
);



Logger.log(
JSON.stringify(
EntityRegistry.health()
)
);



Logger.log(
JSON.stringify(
RepositoryFactory.list()
)
);






/*
====================================
CREATE
====================================
*/


Logger.log(
"===== STEP 1: CREATE CLIENT ====="
);



const client =
EntityService.create(


"CLIENT",


{


OrganizationID:
"ORG000001",


Name:
"EntityService Test",


INN:
"8888888888",


Phone:
"+79998887766",


Email:
"entity@test.ru",


Address:
"",


ManagerID:
"",


Rating:
"",


Status:
"ACTIVE",


Deleted:false


}



);





Logger.log(
"CREATED CLIENT ID: "
+
client.ClientID
);



Logger.log(
JSON.stringify(client,null,2)
);






/*
====================================
READ
====================================
*/


Logger.log(
"===== STEP 2: READ CLIENT ====="
);



const found =
EntityService.findById(

"CLIENT",

client.ClientID

);



Logger.log(
"FOUND CLIENT:"
);



Logger.log(
JSON.stringify(
found,
null,
2
)
);







/*
====================================
UPDATE
====================================
*/


Logger.log(
"===== STEP 3: UPDATE CLIENT ====="
);



const updated =
EntityService.update(

"CLIENT",

client.ClientID,


{


Phone:
"+79990001122",


Email:
"updated_entity@test.ru"


}

);




Logger.log(
"UPDATED CLIENT:"
);



Logger.log(
JSON.stringify(
updated,
null,
2
)
);








/*
====================================
DELETE
====================================
*/


Logger.log(
"===== STEP 4: DELETE CLIENT ====="
);



const deleted =
EntityService.delete(

"CLIENT",

client.ClientID

);



Logger.log(
"DELETED CLIENT:"
);



Logger.log(
JSON.stringify(
deleted,
null,
2
)
);







/*
====================================
RESTORE
====================================
*/


Logger.log(
"===== STEP 5: RESTORE CLIENT ====="
);



const restored =
EntityService.restore(

"CLIENT",

client.ClientID

);



Logger.log(
"RESTORED CLIENT:"
);



Logger.log(
JSON.stringify(
restored,
null,
2
)
);








/*
====================================
FINAL
====================================
*/


Logger.log(
"===== STEP 6: FINAL CHECK ====="
);



const finalClient =
EntityService.findById(

"CLIENT",

client.ClientID

);



Logger.log(
"FINAL CLIENT STATE:"
);



Logger.log(
JSON.stringify(
finalClient,
null,
2
)
);








/*
====================================
AUDIT CHECK
====================================
*/


Logger.log(
"===== STEP 7: AUDIT CHECK ====="
);



if(
typeof AuditLog !== "undefined"
){


Logger.log(
JSON.stringify(
AuditLog.health()
)
);


}






/*
====================================
VERSIONING CHECK
====================================
*/


Logger.log(
"===== STEP 8: VERSION CHECK ====="
);



if(
typeof Versioning !== "undefined"
){


Logger.log(
JSON.stringify(
Versioning.health()
)
);


}






Logger.log(
"========== ENTITY SERVICE TEST SUCCESS =========="
);



}
catch(error){



Logger.error(

"ENTITY SERVICE TEST FAILED: "
+
error.message

);



Logger.error(
error.stack
);



throw error;



}



}