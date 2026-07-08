console.log("DashboardEngine");


const DashboardEngine = {


    initialized:false,


    sheetName:
        "Dashboard",



    init(){


        if(this.initialized){

            return;

        }


        this.initialized=true;


        Logger.log(
            "DashboardEngine READY"
        );


    },



    render(){


        try{


            const ss =
                SpreadsheetApp
                .getActiveSpreadsheet();



            let sheet =
                ss.getSheetByName(
                    this.sheetName
                );



            if(!sheet){


                sheet =
                    ss.insertSheet(
                        this.sheetName
                    );


            }



            sheet.clear();



            this.writeTitle(sheet);



            const data =
                this.getDashboardData();



            this.writeSummary(
                sheet,
                data
            );



            this.writeTrips(
                sheet,
                data
            );



            this.writeFinance(
                sheet,
                data
            );



            Logger.log(
                "Dashboard rendered"
            );



            return data;



        }
        catch(e){


            Logger.log(
                "Dashboard ERROR: "
                +
                e.message
            );


            return null;


        }


    },





    getDashboardData(){


        let data={

            clients:{},
            trips:{},
            finance:{},
            kpi:{}

        };



        // ======================
        // SERVICE LAYER
        // ======================


        if(
            typeof DashboardService !== "undefined"
        ){

            data =
                DashboardService.getData();


        }



        return data;


    },





    writeTitle(sheet){


        sheet
        .getRange(
            1,
            1
        )
        .setValue(
            "TAXCONTROL ERP DASHBOARD"
        );


        sheet
        .getRange(
            1,
            1,
            1,
            5
        )
        .setFontWeight(
            "bold"
        );


    },





    writeSummary(sheet,data){


        sheet
        .getRange(
            3,
            1
        )
        .setValue(
            "SYSTEM SUMMARY"
        );



        const rows=[


            [
                "Clients",
                data.clients.total || 0
            ],


            [
                "Trips",
                data.trips.total || 0
            ],


            [
                "Revenue",
                data.finance.revenue || 0
            ],


            [
                "Profit",
                data.finance.profit || 0
            ]


        ];



        sheet
        .getRange(
            4,
            1,
            rows.length,
            2
        )
        .setValues(rows);



    },






    writeTrips(sheet,data){


        sheet
        .getRange(
            10,
            1
        )
        .setValue(
            "TRIPS KPI"
        );



        sheet
        .getRange(
            11,
            1,
            4,
            2
        )
        .setValues([


            [
                "Total",
                data.trips.total || 0
            ],


            [
                "Revenue",
                data.trips.revenue || 0
            ],


            [
                "Cost",
                data.trips.cost || 0
            ],


            [
                "Margin",
                data.trips.margin || 0
            ]


        ]);


    },





    writeFinance(sheet,data){


        sheet
        .getRange(
            17,
            1
        )
        .setValue(
            "FINANCE KPI"
        );



        sheet
        .getRange(
            18,
            1,
            3,
            2
        )
        .setValues([


            [
                "Revenue",
                data.finance.revenue || 0
            ],


            [
                "Cost",
                data.finance.cost || 0
            ],


            [
                "Profit",
                data.finance.profit || 0
            ]


        ]);


    }



};



globalThis.DashboardEngine =
    DashboardEngine;