console.log("EntityMetadata");


const EntityMetadata = {


version:"0.2.0",


CLIENT:{

entity:"CLIENT",

table:"Clients",

id:"ClientID",

idPrefix:"CLIENT",


permissions:{

create:"CLIENT_CREATE",

read:"CLIENT_READ",

update:"CLIENT_UPDATE",

delete:"CLIENT_DELETE",

restore:"CLIENT_RESTORE"

},


events:{

created:"CLIENT_CREATED",

updated:"CLIENT_UPDATED",

deleted:"CLIENT_DELETED",

restored:"CLIENT_RESTORED"


},


fields:[

{
name:"ClientID",
type:"ID",
required:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"INN",
type:"STRING"
},


{
name:"Phone",
type:"STRING"
},


{
name:"Email",
type:"STRING"
},


{
name:"Address",
type:"STRING"
},


{
name:"ManagerID",
type:"REFERENCE"
},


{
name:"Rating",
type:"NUMBER"
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
},


{
name:"Deleted",
type:"BOOLEAN"
}


]

},

    AUDIT: {
        entity: "AUDIT",
        table: "AuditLog",
        id: "AuditID",           // было idField
        idPrefix: "AUD",         // было prefix
        permissions: {           // добавлено для единообразия
            create: "AUDIT_CREATE",
            read: "AUDIT_READ",
            update: "AUDIT_UPDATE",
            delete: "AUDIT_DELETE",
            restore: "AUDIT_RESTORE"
        },
        events: {                // добавлено для единообразия
            created: "AUDIT_CREATED",
            updated: "AUDIT_UPDATED",
            deleted: "AUDIT_DELETED",
            restored: "AUDIT_RESTORED"
        },
        fields: [],              // можно оставить пустым или описать поля аудита
        timestamps: true         // дополнительное поле, сохранено
    },   // ← запятая обязательна




TRIP:{

entity:"TRIP",

table:"Trips",


id:"TripID",

idPrefix:"TRIP",


permissions:{


            create:"TRIP_CREATE",

            read:"TRIP_READ",

            update:"TRIP_UPDATE",

            delete:"TRIP_DELETE",

            restore:"TRIP_RESTORE"


},


events:{

        created:"TRIP_CREATED",

        updated:"TRIP_UPDATED",

        deleted:"TRIP_DELETED",

        restored:"TRIP_RESTORED"


},






fields:[

        {
        name:"TripID",
        type:"ID",
        required:true
        },


        {
        name:"OrganizationID",
        type:"REFERENCE",
        required:true
        },


        {
        name:"ClientID",
        type:"REFERENCE",
        required:true
        },


        {
        name:"VehicleID",
        type:"REFERENCE"
        },


        {
        name:"DriverID",
        type:"REFERENCE"
        },


        {
        name:"ManagerID",
        type:"REFERENCE"
        },


        {
        name:"LoadingPoint",
        type:"STRING"
        },


        {
        name:"UnloadingPoint",
        type:"STRING"
        },


        {
        name:"Distance",
        type:"NUMBER"
        },


        {
        name:"Cargo",
        type:"STRING"
        },


        {
        name:"Revenue",
        type:"MONEY"
        },


        {
        name:"PlannedCost",
        type:"MONEY"
        },


        {
        name:"ActualCost",
        type:"MONEY"
        },


        {
        name:"Margin",
        type:"MONEY",
        calculated:true
        },


        {
        name:"Status",
        type:"ENUM",
        default:"NEW"
        },


        {
        name:"CreatedAt",
        type:"DATETIME"
        },


        {
        name:"UpdatedAt",
        type:"DATETIME"
        },


        {
        name:"Deleted",
        type:"BOOLEAN"
        }


]

},


CLIENT_FINANCE_PROFILE:{


                    entity:"CLIENT_FINANCE_PROFILE",

                    table:"ClientFinanceProfiles",


                    id:"FinanceProfileID",

                    idPrefix:"FP",




        permissions:{


                    create:"CLIENT_FINANCE_CREATE",

                    read:"CLIENT_FINANCE_READ",

                    update:"CLIENT_FINANCE_UPDATE",

                    delete:"CLIENT_FINANCE_DELETE",

                    restore:"CLIENT_FINANCE_RESTORE"


        },




        events:{


                created:"CLIENT_FINANCE_PROFILE_CREATED",

                updated:"CLIENT_FINANCE_PROFILE_UPDATED",

                deleted:"CLIENT_FINANCE_PROFILE_DELETED",

                restored:"CLIENT_FINANCE_PROFILE_RESTORED"


        },






        fields:[


        {
        name:"FinanceProfileID",
        type:"ID",
        required:true
        },


        {
        name:"OrganizationID",
        type:"REFERENCE",
        required:true
        },


        {
        name:"ClientID",
        type:"REFERENCE",
        required:true
        },


        {
        name:"Balance",
        type:"MONEY",
        default:0
        },


        {
        name:"CreditLimit",
        type:"MONEY",
        default:0
        },


        {
        name:"Status",
        type:"ENUM",
        default:"ACTIVE"
        },


        {
        name:"CreatedAt",
        type:"DATETIME"
        }


        ]

        },

KPI:{


entity:"KPI",

table:"KPIMetrics",

id:"KPIID",

idPrefix:"KPI",


permissions:{


create:"KPI_CREATE",

read:"KPI_READ",

update:"KPI_UPDATE",

delete:"KPI_DELETE",

restore:"KPI_RESTORE"

},


events:{


created:"KPI_CREATED",

updated:"KPI_UPDATED"


},


fields:[


{
name:"KPIID",
type:"ID",
required:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"Value",
type:"NUMBER"
},


{
name:"Period",
type:"STRING"
},


{
name:"Status",
type:"ENUM",
default:"ACTIVE"
},


{
name:"CreatedAt",
type:"DATETIME"
},


{
name:"UpdatedAt",
type:"DATETIME"
}


]


}        







};







/*
    Методы доступа
*/



EntityMetadata.get=function(entity){


return this[entity]
||
null;


};


EntityMetadata.has=function(entity){


return !!this[entity];

};

EntityMetadata.list=function(){


return Object.keys(this)
.filter(
key=>
typeof this[key]==="object"
&&
this[key].fields
);


};







EntityMetadata.health=function(){



return HealthContract.create(


"EntityMetadata",


"OK",


{


version:this.version,


entities:this.list()


}


);


};







globalThis.EntityMetadata =
EntityMetadata;



Logger.log(
"EntityMetadata READY v"
+
EntityMetadata.version
);