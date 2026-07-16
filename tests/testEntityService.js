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
"===== STEP 1: CREATE CLIENT ====="
);





const client = EntityService.create(


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

"CREATED CLIENT: "
+
client.ClientID

);









Logger.log(
"===== STEP 2: READ CLIENT ====="
);




const found =
EntityService.findById(


"CLIENT",


client.ClientID


);





Logger.log(

"FOUND CLIENT: "
+
JSON.stringify(found)

);










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

"UPDATED CLIENT: "
+
JSON.stringify(updated)

);










Logger.log(
"===== STEP 4: DELETE CLIENT ====="
);





const deleted =
EntityService.delete(


"CLIENT",


client.ClientID


);





Logger.log(

"DELETED CLIENT: "
+
JSON.stringify(deleted)

);










Logger.log(
"===== STEP 5: RESTORE CLIENT ====="
);





const restored =
EntityService.restore(


"CLIENT",


client.ClientID


);





Logger.log(

"RESTORED CLIENT: "
+
JSON.stringify(restored)

);









Logger.log(
"===== STEP 6: FINAL CHECK ====="
);





const finalClient =
EntityService.findById(


"CLIENT",


client.ClientID


);





Logger.log(

"FINAL CLIENT STATE: "
+
JSON.stringify(finalClient,null,2)

);










Logger.log(
"========== ENTITY SERVICE TEST COMPLETE =========="
);



}
catch(error){



Logger.error(

"ENTITY SERVICE TEST FAILED: "
+
error.message

);



throw error;



}



}