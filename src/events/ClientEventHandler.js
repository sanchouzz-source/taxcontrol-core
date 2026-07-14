const ClientEventHandler = {


init(){

EventBus.subscribe(
"CLIENT_CREATED",
this.onCreated.bind(this)
);


EventBus.subscribe(
"CLIENT_UPDATED",
this.onUpdated.bind(this)
);


EventBus.subscribe(
"CLIENT_DELETED",
this.onDeleted.bind(this)
);


EventBus.subscribe(
"CLIENT_RESTORED",
this.onRestored.bind(this)
);


console.log(
"ClientEventHandler READY"
);

},



extract(payload){

return payload.after || payload;

},



onCreated(payload){

const client =
this.extract(payload);


console.log(
"CLIENT CREATED EVENT:",
client.ClientID
);

},



onUpdated(payload){

const client =
this.extract(payload);


console.log(
"CLIENT UPDATED EVENT:",
client.ClientID
);


},



onDeleted(payload){

const client =
this.extract(payload);


console.log(
"CLIENT DELETED EVENT:",
client.ClientID
);


},



onRestored(payload){

const client =
this.extract(payload);


console.log(
"CLIENT RESTORED EVENT:",
client.ClientID
);


}


};


globalThis.ClientEventHandler =
ClientEventHandler;