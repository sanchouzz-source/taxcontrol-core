console.log("EntityValidator");


const EntityValidator = {


version:"1.0.0",


validate(entity,data){


const metadata =
EntityMetadata.get(entity);


if(!metadata){

throw new Error(
"Metadata missing for entity "
+
entity
);

}



const errors=[];



const fields =
metadata.fields || [];



// проверяем неизвестные поля

const allowed =
fields.map(
f=>f.name
);



Object.keys(data)
.forEach(key=>{


if(
!allowed.includes(key)
&&
!key.endsWith("At")
){

errors.push(
"Unknown field: "
+
key
);

}


});




// проверяем обязательные поля

fields.forEach(field=>{


if(
field.required
&&
(
data[field.name]===undefined
||
data[field.name]===""
)

){

errors.push(
"Required field missing: "
+
field.name
);

}


});




// проверяем типы

fields.forEach(field=>{


const value =
data[field.name];


if(
value===undefined ||
value===""
)

return;



switch(field.type){


case "NUMBER":

if(isNaN(value)){

errors.push(
field.name+
" must be NUMBER"
);

}

break;



case "MONEY":

if(isNaN(value)){

errors.push(
field.name+
" must be MONEY"
);

}

break;



case "BOOLEAN":

if(
typeof value!=="boolean"
&&
value!=="true"
&&
value!=="false"
){

errors.push(
field.name+
" must be BOOLEAN"
);

}

break;



}



});




if(errors.length){


throw new Error(
"ENTITY VALIDATION FAILED "
+
entity
+
": "
+
errors.join(", ")
);


}



return true;


},





health(){


return HealthContract.create(

"EntityValidator",

"OK",

{

version:this.version

}

);


}



};




globalThis.EntityValidator =
EntityValidator;



Logger.log(
"EntityValidator READY v"
+
EntityValidator.version
);