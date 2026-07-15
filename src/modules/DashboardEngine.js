console.log("DashboardEngine");


const DashboardEngine = {


    initialized: false,


    health(){

        return HealthContract.create(
            "DashboardEngine",
            this.initialized
            ?
            "OK"
            :
            "WARNING",
            {

                initialized:
                    this.initialized,

                dependencies:{

                    DashboardService:true,
                    SpreadsheetApp:true,
                    Logger:true

                }

            }
        );

    },


    init() {


        if (this.initialized) {

            return;

        }


        this.initialized = true;


        Logger.log(
            "DashboardEngine READY"
        );

    },


    refresh() {


        try {


            const data =
                DashboardService.getOverview();


            this.render(data);


        }
        catch(e){


            Logger.log(
                "Dashboard ERROR: "
                + e.message
            );


        }


    },


    render(data) {


        const ss =
            SpreadsheetApp
            .getActiveSpreadsheet();


        let sheet =
            ss.getSheetByName(
                "Dashboard"
            );


        if(!sheet){


            sheet =
                ss.insertSheet(
                    "Dashboard"
                );


        }


        sheet.clear();


        sheet.getRange("A1")
            .setValue(
                "ERP DASHBOARD"
            );


        sheet.getRange("A3")
            .setValue("Trips");


        sheet.getRange("B3")
            .setValue(
                data.Trips
            );


        sheet.getRange("A4")
            .setValue("Revenue");


        sheet.getRange("B4")
            .setValue(
                data.Revenue
            );


        sheet.getRange("A5")
            .setValue("Cost");


        sheet.getRange("B5")
            .setValue(
                data.Cost
            );


        sheet.getRange("A6")
            .setValue("Profit");


        sheet.getRange("B6")
            .setValue(
                data.Profit
            );


        sheet.getRange("A7")
            .setValue("Margin");


        sheet.getRange("B7")
            .setValue(
                data.Margin
            );


        sheet.getRange("A8")
            .setValue("KPI");


        sheet.getRange("B8")
            .setValue(
                data.KPI
            );


        Logger.log(
            "Dashboard rendered"
        );


    }


};


globalThis.DashboardEngine =
DashboardEngine;