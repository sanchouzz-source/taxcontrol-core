console.log("testFullEntityLifecycle");


function testFullEntityLifecycle(){


Logger.log(
"========== FULL ENTITY LIFECYCLE TEST START =========="
);



try{


SystemInit.init();



const entities = [

"CLIENT"

];



entities.forEach(entity=>{


Logger.log(
"===== TEST ENTITY: "
+
entity
+
" ====="
);



if(entity==="CLIENT"){



/*
=========================
CREATE
=========================
*/


const client =
EntityService.create(

"CLIENT",

{


OrganizationID:
"ORG000001",


Name:
"Lifecycle Test",


INN:
"9999999999",


Phone:
"+79991112233",


Email:
"lifecycle@test.ru",


Status:
"ACTIVE",


Deleted:false


}

);



const id =
client.ClientID;



Logger.log(

"CREATE OK: "
+
id

);





/*
=========================
READ
=========================
*/


const found =
EntityService.findById(

"CLIENT",

id

);



if(!found){

throw new Error(
"READ FAILED"
);

}



Logger.log(
"READ OK"
);





/*
=========================
UPDATE
=========================
*/


const updated =
EntityService.update(

"CLIENT",

id,

{


Phone:
"+79990000000"


}

);



Logger.log(

"UPDATE OK: "
+
updated.Phone

);







/*
=========================
DELETE
=========================
*/


const deleted =
EntityService.delete(

"CLIENT",

id

);



if(!deleted.Deleted){

throw new Error(
"DELETE FAILED"
);

}



Logger.log(
"DELETE OK"
);







/*
=========================
RESTORE
=========================
*/


const restored =
EntityService.restore(

"CLIENT",

id

);



if(restored.Deleted){

throw new Error(
"RESTORE FAILED"
);

}



Logger.log(
"RESTORE OK"
);








/*
=========================
FINAL CHECK
=========================
*/


const final =
EntityService.findById(

"CLIENT",

id

);



Logger.log(

"FINAL STATE:"
+
JSON.stringify(
final,
null,
2
)

);





}




});






/*
=========================
AUDIT HEALTH
=========================
*/


Logger.log(
"===== AUDIT HEALTH ====="
);


Logger.log(

JSON.stringify(

AuditLog.health()

)

);





/*
=========================
VERSION HEALTH
=========================
*/


Logger.log(
"===== VERSION HEALTH ====="
);



Logger.log(

JSON.stringify(

Versioning.health()

)

);







/*
=========================
EVENT BUS HEALTH
=========================
*/


Logger.log(
"===== EVENT BUS HEALTH ====="
);



Logger.log(

JSON.stringify(

EventBus.health()

)

);







Logger.log(

"========== FULL ENTITY LIFECYCLE TEST SUCCESS =========="

);



}
catch(error){


Logger.error(

"FULL ENTITY LIFECYCLE TEST FAILED: "
+
error.message

);



throw error;


}



}