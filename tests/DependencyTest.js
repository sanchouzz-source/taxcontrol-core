function testDependencies(){


const modules=[

"Database",
"EventBus",
"SchemaManager",
"IdService",
"ModuleRegistry",
"ModuleLoader",
"FinanceEngine",
"KPIEngine",
"DashboardEngine",
"HealthService"

];


Logger.log(
"===== DEPENDENCY TEST ====="
);


modules.forEach(name=>{


if(
typeof globalThis[name]
==="undefined"
){

Logger.log(
"❌ "
+name
);

}

else{

Logger.log(
"✅ "
+name
);

}


});


Logger.log(
"===== END ====="
);


}