// ============================================================
// MigrationManager v1.0
// ERP Migration Control Engine
// ============================================================

console.log("MigrationManager v1.0");


const MigrationManager = {

version:"1.0",

_sheetName:"_Migrations",

_lockTimeout:30000,


_getSpreadsheet(){

 const ss =
 SpreadsheetApp.getActiveSpreadsheet();

 if(!ss)
 throw new Error(
 "Spreadsheet unavailable"
 );

 return ss;

},



_withLock(fn){

 const lock =
 LockService.getScriptLock();

 lock.waitLock(this._lockTimeout);

 try{

   return fn();

 }
 finally{

   lock.releaseLock();

 }

},



_getSheet(){

 const ss=this._getSpreadsheet();

 let sheet =
 ss.getSheetByName(
 this._sheetName
 );


 if(!sheet){

 sheet =
 ss.insertSheet(
 this._sheetName
 );


 sheet.getRange(
 1,1,1,7
 )
 .setValues([[
 "id",
 "version",
 "name",
 "status",
 "executedAt",
 "up",
 "down"
 ]]);

 }


 return sheet;

},



list(){

 const sheet=this._getSheet();

 const data=
 sheet.getDataRange()
 .getValues();


 return data.slice(1)
 .map(r=>({

 id:r[0],
 version:r[1],
 name:r[2],
 status:r[3],
 date:r[4]

 }));

},




isApplied(id){

 return this.list()
 .some(
 m=>
 m.id===id &&
 m.status==="DONE"
 );

},




run(
 id,
 name,
 upFn,
 downFn
){

 this._withLock(()=>{


 if(this.isApplied(id)){

 Logger.log(
 "Migration already applied "
 +id
 );

 return;

 }



 Logger.log(
 "RUN MIGRATION "
 +id
 );



 try{


 upFn();



 this._record({

 id,
 name,
 status:"DONE",
 up:upFn.toString(),
 down:
 downFn?
 downFn.toString():
 ""

 });



 this._emit(
 "MIGRATION_DONE",
 {
 id,
 name
 }
 );


 }
 catch(e){


 this._record({

 id,
 name,
 status:"FAILED"

 });


 throw e;


 }



 });


},




rollback(id){


 this._withLock(()=>{


 const migration=
 this.list()
 .find(
 m=>m.id===id
 );


 if(!migration)

 throw new Error(
 "Migration not found "
 +id
 );


 const sheet=
 this._getSheet();


 const data=
 sheet.getDataRange()
 .getValues();



 let row=null;



 for(
 let i=1;i<data.length;i++
 ){

 if(data[i][0]===id){

 row=i+1;

 break;

 }

 }


 const down=
 data[row-1][6];



 if(!down)

 throw new Error(
 "No rollback script"
 );



 const fn=
 eval("(" + down + ")");



 fn();



 sheet
 .getRange(row,4)
 .setValue(
 "ROLLED_BACK"
 );



 this._emit(
 "MIGRATION_ROLLBACK",
 {
 id
 }
 );



 });


},




_record(data){


 this._getSheet()
 .appendRow([

 data.id,
 data.version||1,
 data.name,
 data.status,
 new Date(),
 data.up||"",
 data.down||""

 ]);


},




_emit(event,payload){

 try{

 if(
 typeof EventBus!=="undefined"
 &&
 EventBus.emit
 ){

 EventBus.emit(
 event,
 payload,
 {
 source:
 "MigrationManager"
 }
 );

 }

 }
 catch(e){}



},




health(){

return {

module:
"MigrationManager",

version:
this.version,

status:
"OK",

migrations:
this.list().length

};


}


};



globalThis.MigrationManager=
MigrationManager;


Logger.log(
"MigrationManager REGISTERED"
);
