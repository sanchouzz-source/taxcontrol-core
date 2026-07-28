// ============================================================
// FinancialTransactionRepository v3.1.0
// Enterprise Finance Repository
// TaxControl ERP Core
//
// Entity:
// FINANCIAL_TRANSACTION
//
// Architecture:
//
// FinanceService
//      |
//      v
// FinancialTransactionRepository
//      |
//      v
// BaseRepository
//      |
//      v
// Database
//
// Prepared:
//
// FinanceEngine
// TaxEngine
// KPIEngine
// Dashboard
// Mobile API
//
// Compatible:
//
// EntityMetadata v3+
// EntityRegistry v2.5+
// SchemaManager v4.2+
// BaseRepository v5.7+
// RepositoryFactory v3+
// RepositoryRegistry v2+
// ============================================================


console.log(
"FinancialTransactionRepository v3.1.0"
);





const FinancialTransactionRepository = {



// ============================================================
// META
// ============================================================


version:"3.1.0",

entity:"FINANCIAL_TRANSACTION",

table:"FinancialTransactions",

initialized:false,

base:null,

architecture:
"Enterprise Finance Repository",







// ============================================================
// INIT
// ============================================================


init(){


if(this.initialized){

return true;

}



if(
typeof BaseRepository==="undefined"
){

throw new Error(
"FinancialTransactionRepository: BaseRepository unavailable"
);

}



this.base =
BaseRepository.createRepository(
this.entity
);



this.initialized=true;



Logger.log(
"FinancialTransactionRepository READY v"+
this.version
);



return true;


},







// ============================================================
// BASE ACCESS
// ============================================================


getBase(){


if(!this.initialized){

this.init();

}


return this.base;


},







// ============================================================
// CREATE
// ============================================================


create(
data={},
options={}
){


this.requireObject(
data,
"create"
);



const result =
this.getBase()
.create(
data,
options
);



this.emit(
"FINANCIAL_TRANSACTION_CREATED",
result
);



return result;


},







// ============================================================
// READ
// ============================================================


findById(
id,
options={}
){


this.requireId(
id,
"findById"
);



return this.getBase()
.findById(
id,
options
);


},







get(
id,
options={}
){


return this.findById(
id,
options
);


},







getById(
id,
options={}
){


return this.findById(
id,
options
);


},







findAll(
filters={},
options={}
){


return this.getBase()
.findAll(
filters,
options
);


},







findWhere(
criteria={},
options={}
){


const base =
this.getBase();



if(
typeof base.findWhere==="function"
){

return base.findWhere(
criteria,
options
);

}



return this.findAll(
criteria,
options
);


},







search(
criteria={}
){


return this.findAll(
criteria
);


},







// ============================================================
// BUSINESS FINANCE SEARCH
// ============================================================


findByOrganization(
organizationId
){


return this.findWhere({

OrganizationID:
organizationId

});


},






findByClient(
clientId
){


return this.findWhere({

ClientID:
clientId

});


},






findByTrip(
tripId
){


return this.findWhere({

TripID:
tripId

});


},






findByCarrier(
carrierId
){


return this.findWhere({

CarrierID:
carrierId

});


},






findIncome(){


return this.findWhere({

Type:
"INCOME"

});


},






findExpense(){


return this.findWhere({

Type:
"EXPENSE"

});


},
// ============================================================
// FINANCE ANALYTICS
// ============================================================


calculateTotal(
filters={}
){


const rows =
this.findAll(
filters
);



return rows.reduce(

(sum,row)=>

sum +
Number(
row.Amount || 0
),

0

);


},







calculateIncome(
filters={}
){


return this.calculateTotal({

...filters,

Type:"INCOME"

});


},







calculateExpense(
filters={}
){


return this.calculateTotal({

...filters,

Type:"EXPENSE"

});


},







calculateProfit(
filters={}
){


return (

this.calculateIncome(
filters
)

-

this.calculateExpense(
filters
)

);


},







calculatePeriod(
from,
to,
filters={}
){


const rows =
this.findAll(
filters
);



return rows.filter(row=>{


const date =
new Date(
row.Date
);



return (

date >= new Date(from)

&&

date <= new Date(to)

);


});


},







getOrganizationProfit(
organizationId,
from,
to
){


const rows =
this.calculatePeriod(

from,

to,

{

OrganizationID:
organizationId

}

);



return rows.reduce(

(sum,row)=>{


if(
row.Type==="INCOME"
){

return sum+
Number(
row.Amount||0
);

}



return sum-
Number(
row.Amount||0
);



},

0

);


},







// ============================================================
// UPDATE
// ============================================================


update(
id,
data={},
options={}
){


this.requireId(
id,
"update"
);



return this.getBase()
.update(
id,
data,
options
);


},







// ============================================================
// DELETE
// ============================================================


delete(
id,
options={}
){


this.requireId(
id,
"delete"
);



return this.getBase()
.delete(
id,
options
);


},







restore(
id,
options={}
){


this.requireId(
id,
"restore"
);



return this.getBase()
.restore(
id,
options
);


},







// ============================================================
// EXISTS
// ============================================================


exists(
id,
options={}
){


return !!this.findById(
id,
options
);


},







existsBy(
field,
value,
options={}
){


if(
!field
){

throw new Error(
"FinancialTransactionRepository.existsBy field required"
);

}



const rows =
this.findWhere({

[field]:value

},options);



return rows.length>0;


},







count(
filters={},
options={}
){


const base =
this.getBase();



if(
typeof base.count==="function"
){

return base.count(
filters,
options
);

}



return this.findAll(
filters,
options
)
.length;


},







// ============================================================
// BULK
// ============================================================


bulkCreate(
items=[],
options={}
){


if(
!Array.isArray(items)
){

throw new Error(
"FinancialTransactionRepository.bulkCreate items must array"
);

}



return this.getBase()
.bulkCreate(
items,
options
);


},







bulkUpdate(
ids=[],
data={},
options={}
){


if(
!Array.isArray(ids)
){

throw new Error(
"FinancialTransactionRepository.bulkUpdate ids must array"
);

}



return this.getBase()
.bulkUpdate(
ids,
data,
options
);


},







// ============================================================
// TRANSACTION
// ============================================================


transaction(callback){


if(
typeof callback!=="function"
){

throw new Error(
"FinancialTransactionRepository.transaction callback required"
);

}



const base =
this.getBase();



if(
typeof base.transaction==="function"
){

return base.transaction(
callback
);

}



return callback();


},







// ============================================================
// EVENT BUS
// ============================================================


emit(
event,
data
){


try{


if(
typeof EventBus!=="undefined"
&&
EventBus.emit
){

EventBus.emit(

event,

{

entity:this.entity,

data:data

}

);


}



}
catch(e){


Logger.warn(

"FinancialTransactionRepository event skipped "+
e.message

);


}



},







// ============================================================
// AUDIT COMPATIBILITY
// ============================================================


audit(
action,
data
){


this.emit(

"FINANCE_AUDIT",

{

action,

data

}

);


},







// ============================================================
// METADATA
// ============================================================


getMeta(){


if(
typeof SchemaRegistry!=="undefined"
&&
SchemaRegistry.get
){


const schema =
SchemaRegistry.get(
this.entity
);



if(schema){

return schema;

}

}



if(
typeof EntityRegistry!=="undefined"
&&
EntityRegistry.get
){

return EntityRegistry.get(
this.entity
);

}



return {


entity:this.entity,

table:this.table,

idField:"TransactionID"

};


},







// ============================================================
// VALIDATION
// ============================================================


requireId(
id,
method
){


if(
id===undefined ||
id===null ||
id===""
){

throw new Error(

"FinancialTransactionRepository."
+
method+
": id required"

);

}



return true;


},







requireObject(
obj,
method
){


if(
!obj ||
typeof obj!=="object"
||
Array.isArray(obj)
){

throw new Error(

"FinancialTransactionRepository."
+
method+
": object required"

);

}



return true;


},







// ============================================================
// REGISTER
// ============================================================


register(){


if(
typeof RepositoryFactory==="undefined"
){

return false;

}



RepositoryFactory.register(

this.entity,

this,

{

force:true

}

);



if(
typeof RepositoryRegistry!=="undefined"
&&
RepositoryRegistry.register
){

RepositoryRegistry.register(

this.entity,

this

);

}



return true;


},







// ============================================================
// DIAGNOSTICS
// ============================================================


diagnostics(){


let meta=null;


try{

meta=this.getMeta();

}
catch(e){}



return {


module:
"FinancialTransactionRepository",


version:
this.version,


entity:
this.entity,


table:
meta?.table ||
this.table,


initialized:
this.initialized,


layers:{


schema:
typeof SchemaRegistry!=="undefined",


metadata:
typeof EntityRegistry!=="undefined",


baseRepository:
typeof BaseRepository!=="undefined",


factory:
typeof RepositoryFactory!=="undefined",


registry:
typeof RepositoryRegistry!=="undefined"


},



registered:

typeof RepositoryFactory!=="undefined"
&&
RepositoryFactory.has
?

RepositoryFactory.has(
this.entity
)

:

false,



timestamp:
new Date()
.toISOString()


};


},







// ============================================================
// HEALTH
// ============================================================


health(){


const data =
this.diagnostics();



const status =

data.layers.baseRepository
&&
data.layers.schema

?

"OK"

:

"WARNING";




if(
typeof HealthContract!=="undefined"
&&
HealthContract.create
){

return HealthContract.create(

"FinancialTransactionRepository",

status,

data

);

}



return {

module:
"FinancialTransactionRepository",

status,

...data

};


}



};









// ============================================================
// GLOBAL
// ============================================================


globalThis.FinancialTransactionRepository =
FinancialTransactionRepository;









// ============================================================
// SAFE BOOT
// ============================================================


try{


FinancialTransactionRepository.init();


FinancialTransactionRepository.register();



}
catch(e){


Logger.warn(

"FinancialTransactionRepository deferred: "+
e.message

);


}







Logger.log(

"FinancialTransactionRepository GLOBAL READY v"+
FinancialTransactionRepository.version

);