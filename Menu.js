console.log("Menu");


function onOpen(){


    const ui =
        SpreadsheetApp
        .getUi();



    ui.createMenu(
        "🚀 TaxControl ERP"
    )


    .addItem(
        "▶ Запустить ERP",
        "erpStart"
    )


    .addItem(
        "❤️ Проверка системы",
        "erpHealth"
    )


    .addSeparator()



    .addSubMenu(

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


    )


    .addSubMenu(

        ui.createMenu(
            "📊 Dashboard"
        )

        .addItem(
            "Обновить Dashboard",
            "refreshDashboard"
        )


    )


    .addSeparator()



    .addItem(
        "🛠 Data Repair",
        "repairDatabase"
    )


    .addToUi();



    Logger.log(
        "ERP MENU CREATED"
    );


}