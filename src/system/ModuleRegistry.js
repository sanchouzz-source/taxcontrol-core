console.log("ModuleRegistry");


const ModuleRegistry = {


version:"0.3.0",


modules:{},



register(name,module){


if(!name || !module){

Logger.log(
"MODULE REGISTER FAILED "
+name
);

return false;

}



this.modules[name]={


name:name,

instance:module,

status:"REGISTERED",

initialized:false,

error:null,

startedAt:null


};



Logger.log(
"MODULE REGISTERED: "
+name
);


return true;


},




init(name){


const item=this.modules[name];


if(!item){

Logger.log(
"MODULE NOT FOUND "
+name
);

return false;

}



if(item.initialized){

return true;

}



try{


if(
typeof item.instance.init==="function"
){

item.instance.init();

}



item.initialized=true;

item.status="READY";

item.startedAt=
new Date()
.toISOString();



Logger.log(
name+" READY"
);


return true;



}

catch(e){


item.status="ERROR";

item.error=e.message;


Logger.log(
name+" ERROR "+e.message
);


return false;


}



},





initAll(){


Object.keys(this.modules)
.forEach(
name=>{

this.init(name);

}

);


},





health(){


return {


status:"OK",

module:"ModuleRegistry",

version:this.version,


modules:

Object.keys(this.modules)
.map(name=>{


let m=this.modules[name];


return {


Module:name,

Status:m.status,

Initialized:m.initialized,

Error:m.error


};


})


};



}



};



globalThis.ModuleRegistry =
ModuleRegistry;