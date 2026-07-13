console.log("Menu");


function onOpen(){


    SpreadsheetApp
    .getUi()

    .createMenu(
        "TaxControl ERP"
    )

    .addItem(
        "🚀 Запустить ERP",
        "startERP"
    )

    .addItem(
        "❤️ Проверка системы",
        "healthERP"
    )

    .addToUi();


}




function startERP(){


    Bootstrap.start();


}





function healthERP(){


    return Inspector.inspect();


}