console.log("Inspector");


const Inspector = {


inspect(){


Logger.log(
"========== ERP INSPECTOR =========="
);



this.section(
"CORE",
[
"SystemInit",
"SchemaManager",
"Database",
"Registry",
"IdService",
"EventBus",
"EventStore",
"SecurityGuard",
"AuditLog",
"Versioning"
]
);



this.section(
"BUSINESS MODULES",
[
"TripRepository",
"ClientRepository",

"TripValidator",
"ClientValidator",

"FinanceEngine",

"KPIEngine",
"KPIRepository",
"KPIService",

"DashboardEngine",
"DashboardService",

"ReportEngine"
]
);



this.section(
"MODULE SYSTEM",
[
"ModuleRegistry",
"ModuleLoader"
]
);



Logger.log(
"==================================="
);


},



section(title,list){


Logger.log(
"----- "
+ title
+" -----"
);



list.forEach(name=>{


if(
typeof globalThis[name]
==="undefined"
){

Logger.log(
"❌ "
+name+
" NOT FOUND"
);


}
else{


Logger.log(
"✅ "
+name+
" OK"
);


}


});


}



};



function inspectSystem(){

Inspector.inspect();

}