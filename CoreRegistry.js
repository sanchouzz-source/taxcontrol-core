console.log("CoreRegistry");



const CoreRegistry = {


version:"0.2.0",


loaded:{},


metadata:{},


initialized:false,





register(
    name,
    component,
    priority=100
){



if(!component){


Logger.warn(

"CORE REGISTER FAILED: "
+
name

);


return false;


}




if(this.loaded[name]){


Logger.log(

"CORE ALREADY REGISTERED "
+
name

);



return false;


}





this.loaded[name]=component;



this.metadata[name]={

priority:priority,

initialized:false

};





Logger.log(

"CORE REGISTERED: "
+
name
+
" PRIORITY "
+
priority

);




return true;


},







initAll(){



if(this.initialized){


Logger.log(

"CORE REGISTRY ALREADY READY"

);


return;


}





Logger.log(

"CORE INITIALIZATION START"

);





const queue =

Object.keys(
this.loaded
)

.sort(

(a,b)=>{


return (

this.metadata[a].priority

-

this.metadata[b].priority

);


}

);






queue.forEach(name=>{



const component =
this.loaded[name];



try{



if(
typeof component.init==="function"
){



component.init();



}




this.metadata[name]
.initialized=true;



Logger.log(

"CORE INITIALIZED: "
+
name

);



}

catch(error){



Logger.error(

"CORE INIT FAILED "
+
name
+
" : "
+
error.message

);



}



});






this.initialized=true;




Logger.log(

"CORE REGISTRY READY v"
+
this.version

);



},







get(name){


return this.loaded[name];


},



getPriority(name){


return this.metadata[name]
?
this.metadata[name].priority
:
null;


},







health(){



return HealthContract.create(


"CoreRegistry",


this.initialized

?

"OK"

:

"WARNING",



{


version:this.version,


components:

Object.keys(
this.loaded
),


metadata:this.metadata


}



);


}



};





globalThis.CoreRegistry =
CoreRegistry;