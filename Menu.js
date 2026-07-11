console.log("Menu");


const Menu = {


create(){


SpreadsheetApp
.getUi()
.createMenu("ERP SYSTEM")


.addItem(
"Initialize System",
"erpInit"
)


.addItem(
"Health Check",
"erpHealth"
)


.addItem(
"Startup Test",
"erpTest"
)


.addToUi();


}


};


function erpInit(){

    Bootstrap.init();

}


function erpHealth(){

    CoreFunctions.health();

}


function erpTest(){

    CoreFunctions.startupTest();

}


globalThis.Menu =
Menu;