console.log("CoreRegistry");



const CoreRegistry = {


version:"0.3.0",


loaded:{},


metadata:{},


initialized:false,





register(
    name,
    component,
    priority=100
){



if(!name){


Logger.error(
"CORE REGISTER FAILED: EMPTY NAME"
);


return false;


}





if(!component){


Logger.error(

"CORE REGISTER FAILED: "
+
name
+
" COMPONENT EMPTY"

);


return false;


}





if(this.loaded[name]){


Logger.warn(

"CORE ALREADY REGISTERED: "
+
name

);


return false;


}





this.loaded[name]=component;



this.metadata[name]={


priority:priority,


initialized:false,


status:"REGISTERED",


version:
component.version || null



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





const queue = Object.keys(this.loaded)

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



const meta =
this.metadata[name];





if(meta.initialized){


Logger.log(

"CORE SKIP ALREADY INITIALIZED: "
+
name

);


return;


}





try{



if(
typeof component.init === "function"
){


component.init();


}



meta.initialized=true;

meta.status="READY";



Logger.log(

"CORE INITIALIZED: "
+
name

);



}



catch(error){



meta.status="FAILED";

meta.error=
error.message;



Logger.error(

"CORE INIT FAILED: "
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






has(name){


return !!this.loaded[name];


},







getPriority(name){



return this.metadata[name]

?

this.metadata[name].priority

:

null;


},







getStatus(name){



return this.metadata[name]

?

this.metadata[name].status

:

"NOT_FOUND";


},







list(){



return Object.keys(
this.loaded
);


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


initialized:this.initialized,


components:this.loaded
?

Object.keys(this.loaded)

:

[],


metadata:this.metadata



}



);


}



};





globalThis.CoreRegistry =
CoreRegistry;