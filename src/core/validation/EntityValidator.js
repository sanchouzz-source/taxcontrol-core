// ============================================================
// EntityValidator v1.1.0
// Enterprise Entity Validation Layer
// TaxControl ERP Core
//
// Compatible:
// EntityMetadata v3.x
// EntityRegistry v2.4+
// SchemaRegistry v4+
// EntityService v5+
//
// Features:
// - Required fields
// - Unknown fields protection
// - Type validation
// - Object/Array metadata compatibility
// - System fields support
// - Diagnostics
// ============================================================


console.log("EntityValidator v1.1.0");



const EntityValidator = {


version:"1.1.0",



// ============================================================
// GET FIELDS
// ============================================================


getFields(entity){


const metadata =
EntityMetadata.get(entity);



if(!metadata){

throw new Error(
"Metadata missing for entity "+
entity
);

}



let fields =
metadata.fields ||
metadata.fieldsArray ||
[];



// Новый формат:
// fields:{Name:{type:"STRING"}}

if(
!Array.isArray(fields)
&&
typeof fields==="object"
){


fields =
Object.keys(fields)
.map(name=>{


return {

name:name,

...fields[name]

};


});


}



return fields;


},







// ============================================================
// VALIDATE
// ============================================================


validate(entity,data={}){


const metadata =
EntityMetadata.get(entity);



if(!metadata){

throw new Error(
"Metadata missing for entity "+
entity
);

}



const errors=[];



const fields =
this.getFields(entity);





// ------------------------------------------------------------
// allowed fields
// ------------------------------------------------------------


const allowed =
fields.map(
field=>field.name
);




// ------------------------------------------------------------
// UNKNOWN FIELDS
// ------------------------------------------------------------


Object.keys(data)
.forEach(key=>{


// разрешаем системные поля

if(

allowed.includes(key)

||

key.endsWith("At")

||

key.startsWith("_")

){

return;

}



errors.push(
"Unknown field: "+
key
);


});





// ------------------------------------------------------------
// REQUIRED
// ------------------------------------------------------------


fields.forEach(field=>{


if(
field.required
){


const value =
data[field.name];



if(
value===undefined
||
value===null
||
value===""
){


errors.push(
"Required field missing: "+
field.name
);


}


}



});







// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------


fields.forEach(field=>{


const value =
data[field.name];



if(
value===undefined
||
value===null
||
value===""
){

return;

}




switch(
String(field.type)
.toUpperCase()
){



case "NUMBER":

case "INTEGER":


if(
isNaN(Number(value))
){

errors.push(
field.name+
" must be NUMBER"
);

}


break;





case "MONEY":


if(
isNaN(Number(value))
){

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

&&

value!==1

&&

value!==0

){


errors.push(
field.name+
" must be BOOLEAN"
);


}


break;





case "DATE":


if(
isNaN(
Date.parse(value)
)

){


errors.push(
field.name+
" must be DATE"
);


}


break;





case "STRING":


if(
typeof value!=="string"
){

errors.push(
field.name+
" must be STRING"
);


}


break;



}



});







// ------------------------------------------------------------
// RESULT
// ------------------------------------------------------------


if(errors.length){


const message =

"ENTITY VALIDATION FAILED "

+
entity

+
": "

+
errors.join(", ");



Logger.error(message);



throw new Error(message);


}




return true;


},







// ============================================================
// SAFE VALIDATE
// ============================================================


check(entity,data={}){


try{


this.validate(
entity,
data
);


return {

valid:true,

errors:[]

};


}
catch(e){


return {

valid:false,

errors:[
e.message
]

};


}



},







// ============================================================
// HEALTH
// ============================================================


health(){


return HealthContract.create(

"EntityValidator",

"OK",

{

version:this.version,

features:[

"Required",

"UnknownFields",

"Types",

"MetadataAdapter"

]

}

);


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


return {


module:
"EntityValidator",


version:
this.version,


timestamp:
new Date()
.toISOString()


};


}



};





globalThis.EntityValidator =
EntityValidator;



Logger.log(
"EntityValidator READY v"+
EntityValidator.version
);