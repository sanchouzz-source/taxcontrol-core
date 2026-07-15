console.log("TripEventHandler");



const TripEventHandler = {


version:"0.2.0",



entity:

EntityRegistry.TRIP,




init(){



EventBus.subscribe(

this.entity.events.created,

this.onCreated.bind(this)

);



EventBus.subscribe(

this.entity.events.updated,

this.onUpdated.bind(this)

);



EventBus.subscribe(

this.entity.events.deleted,

this.onDeleted.bind(this)

);



EventBus.subscribe(

this.entity.events.restored,

this.onRestored.bind(this)

);



Logger.log(

"TripEventHandler READY v"
+
this.version

);



return true;


},






extract(payload){

if(!payload){

return null;

}


return payload.after || payload;


},





onCreated(event){


const trip=this.extract(event);


if(!trip)return;



Logger.log(

"TRIP CREATED "
+
trip[this.entity.idField]

);



},





onUpdated(event){


const trip=this.extract(event);


if(!trip)return;



Logger.log(

"TRIP UPDATED "
+
trip[this.entity.idField]

);



},





onDeleted(event){


const trip=this.extract(event);


if(!trip)return;



Logger.log(

"TRIP DELETED "
+
trip[this.entity.idField]

);



},





onRestored(event){


const trip=this.extract(event);


if(!trip)return;



Logger.log(

"TRIP RESTORED "
+
trip[this.entity.idField]

);



},





health(){


return HealthContract.create(

"TripEventHandler",

"OK",

{


version:this.version,


entity:this.entity.entity,


dependencies:{


EventBus:!!EventBus,


EntityRegistry:!!EntityRegistry


}



}

);


}



};




globalThis.TripEventHandler =
TripEventHandler;