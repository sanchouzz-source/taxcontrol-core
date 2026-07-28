// ============================================================
// Menu v1.6.0
// TaxControl ERP UI Menu
//
// Enterprise Runtime Menu
//
// Compatible:
//
// ERPBootstrap v4+
// Bootstrap v3+
// SystemInit v3.1+
// ServiceRegistry v1.2+
// ERPDiagnostics v6+
// RepositoryRegistry v2+
//
// ============================================================


console.log(
"Menu v1.6.0"
);





function onOpen(){


const ui =
SpreadsheetApp
.getUi();



const menu =
ui.createMenu(
"🚀 TaxControl ERP"
);





// ====================================================
// SYSTEM
// ====================================================


menu


.addItem(
"▶ Запустить ERP",
"erpStart"
)


.addItem(
"❤️ Проверка системы",
"erpHealth"
)


.addItem(
"🔍 Диагностика ERP",
"erpDiag"
)


.addItem(
"📦 Версия ERP",
"showERPVersion"
)


.addSeparator();







// ====================================================
// CONTROL CENTER
// ====================================================


menu.addSubMenu(

ui.createMenu(
"🧠 ERP Control Center"
)


.addItem(
"🚀 Полная диагностика",
"erpControlCenter"
)


.addItem(
"📋 Статус ERP",
"erpControlStatus"
)


.addItem(
"🖥 Runtime Report",
"erpRuntimeReport"
)


.addItem(
"📊 ERP Dashboard",
"openERPControlDashboard"
)


.addItem(
"🔄 Refresh Dashboard",
"refreshERPControlDashboard"
)

);







// ====================================================
// REPOSITORY
// ====================================================


menu.addSubMenu(

ui.createMenu(
"🗄 Repository"
)


.addItem(
"🏥 Repository Health",
"repositoryHealth"
)


.addItem(
"📋 Repository Details",
"repositoryHealthDetails"
)


.addItem(
"🖨 Repository Report",
"repositoryPrint"
)

);








// ====================================================
// SERVICES NEW
// ====================================================


menu.addSubMenu(

ui.createMenu(
"🧩 Services"
)


.addItem(
"🏥 Service Health",
"serviceHealth"
)


.addItem(
"📋 Service Registry",
"serviceRegistryReport"
)


.addItem(
"🔄 Refresh Services",
"refreshServices"
)

);








// ====================================================
// TESTS
// ====================================================


menu.addSubMenu(

ui.createMenu(
"🧪 Тестирование"
)


.addItem(
"▶ SAFE тесты",
"runTests"
)


.addItem(
"🔥 FULL тесты",
"runTestsFull"
)


.addItem(
"🏗 Core Infrastructure",
"testCoreInfrastructure"
)


.addItem(
"🔄 Entity Lifecycle",
"testEntityLifecycleMatrix"
)


.addItem(
"🚀 System Init Contract",
"runSystemInitContractTest"
)


.addItem(
"🧩 Service Registry Contract",
"runServiceRegistryContractTest"
)


.addItem(
"📋 Test Report",
"testReport"
)

);








// ====================================================
// CLIENTS
// ====================================================


menu.addSubMenu(

ui.createMenu(
"👥 Клиенты"
)


.addItem(
"Добавить клиента",
"createClientUI"
)


.addItem(
"Обновить клиентов",
"refreshClients"
)

);








// ====================================================
// DASHBOARD
// ====================================================


menu.addSubMenu(

ui.createMenu(
"📊 Dashboard"
)


.addItem(
"Обновить Dashboard",
"refreshDashboard"
)


.addItem(
"KPI отчет",
"showKPIReport"
)

);








// ====================================================
// SERVICE
// ====================================================


menu.addSubMenu(

ui.createMenu(
"🛠 Обслуживание"
)


.addItem(
"Repair Database",
"repairDatabase"
)


.addItem(
"Очистить Cache",
"clearERPCache"
)


.addItem(
"Проверить дубли",
"runDuplicateCheck"
)


.addItem(
"ERP Reset",
"resetERP"
)

);






menu.addToUi();



Logger.log(
"ERP MENU CREATED v1.6.0"
);


}






// ============================================================
// SERVICE FUNCTIONS
// ============================================================



function serviceHealth(){


if(
typeof ServiceRegistry==="undefined"
){

throw new Error(
"ServiceRegistry unavailable"
);

}



const result =
ServiceRegistry.health();



SpreadsheetApp
.getUi()
.alert(

"Service Health\n\n"
+
JSON.stringify(
result,
null,
2
)

);



return result;


}







function serviceRegistryReport(){


if(
typeof ServiceRegistry==="undefined"
){

throw new Error(
"ServiceRegistry unavailable"
);

}



const result={


version:
ServiceRegistry.version,


services:
ServiceRegistry.list(),


count:
ServiceRegistry.count()


};



Logger.log(
JSON.stringify(
result,
null,
2
)
);



SpreadsheetApp
.getUi()
.alert(

"Service Registry\n\n"
+
JSON.stringify(
result,
null,
2
)

);



return result;


}








function refreshServices(){


if(
typeof ServiceRegistry==="undefined"
){

throw new Error(
"ServiceRegistry unavailable"
);

}



ServiceRegistry.refresh();



SpreadsheetApp
.getUi()
.alert(

"Services refreshed"

);



return ServiceRegistry.health();


}







// ============================================================
// VERSION
// ============================================================


function showERPVersion(){



const info={


ERP:
"TaxControl",


Bootstrap:
Bootstrap?.version || "-",


App:
App?.version || "-",


SystemInit:
SystemInit?.version || "-",


ServiceRegistry:
ServiceRegistry?.version || "-",


ClientService:
ClientService?.version || "-",


TransportOrderService:
TransportOrderService?.version || "-",


FinanceService:
FinanceService?.version || "-",


KPIService:
KPIService?.version || "-",


Database:
Database?.version || "-",


BaseRepository:
BaseRepository?.version || "-",


RepositoryFactory:
RepositoryFactory?.version || "-",


RepositoryRegistry:
RepositoryRegistry?.version || "-",


EventBus:
EventBus?.version || "-"


};



Logger.log(
JSON.stringify(
info,
null,
2
)
);



SpreadsheetApp
.getUi()
.alert(

JSON.stringify(
info,
null,
2
)

);



return info;


}







// ============================================================
// CACHE
// ============================================================


function clearERPCache(){


try{


Database?.clearCache?.();



SpreadsheetApp
.getUi()
.alert(
"ERP Cache очищен"
);



}
catch(e){



SpreadsheetApp
.getUi()
.alert(

"Cache error: "
+
e.message

);



}



}





Logger.log(
"ERP MENU READY v1.6.0"
);