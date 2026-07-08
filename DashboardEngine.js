console.log("DashboardEngine");


const DashboardEngine = {


    sheetName:"Dashboard",


    initialized:false,



    // =========================
    // INIT EVENTS
    // =========================

    init(){


        if(this.initialized){

            return;

        }



        if(
            typeof EventBus !== "undefined"
        ){


            EventBus.on(
                "TRIP_COMPLETED",
                ()=>{

                    Logger.log(
                        "Dashboard refresh: TRIP_COMPLETED"
                    );


                    this.render(true);

                }
            );



            EventBus.on(
                "KPI_CREATED",
                ()=>{

                    Logger.log(
                        "Dashboard refresh: KPI_CREATED"
                    );


                    this.render(true);

                }
            );


        }



        this.initialized=true;



        Logger.log(
            "DashboardEngine READY"
        );


    },



    // =========================
    // MAIN RENDER
    // =========================

    render(safe=false){


        try {


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



            // сохраняем форматирование
            sheet.clearContents();



            this._writeHeader(sheet);


            this._writeClientsKPI(sheet);


            this._writeTripsKPI(sheet);


            this._writeManagerKPI(sheet);


            this._writeFinanceKPI(sheet);



            Logger.log(
                "Dashboard rendered"
            );



        }
        catch(e){


            if(safe){


                Logger.log(
                    "Dashboard SAFE ERROR: "
                    +
                    e.message
                );


                return;


            }


            throw e;


        }


    },



    // =========================
    // HEADER
    // =========================

    _writeHeader(sheet){


        sheet
        .getRange(1,1)
        .setValue(
            "ERP DASHBOARD"
        );



        sheet
        .getRange(1,1,1,4)
        .setFontSize(16)
        .setFontWeight("bold");


    },



    // =========================
    // CLIENT KPI
    // =========================

    _writeClientsKPI(sheet){


        const kpi =
            ReportEngine.clientsKPI();



        sheet
        .getRange(3,1)
        .setValue(
            "Clients KPI"
        );



        sheet
        .getRange(4,1,3,2)
        .setValues([

            [
                "Total",
                kpi.total
            ],

            [
                "Active",
                kpi.active
            ],

            [
                "Deleted",
                kpi.deleted
            ]

        ]);


    },



    // =========================
    // TRIPS KPI
    // =========================

    _writeTripsKPI(sheet){


        const kpi =
            ReportEngine.tripsKPI();



        sheet
        .getRange(8,1)
        .setValue(
            "Trips KPI"
        );



        sheet
        .getRange(9,1,4,2)
        .setValues([


            [
                "Total Trips",
                kpi.totalTrips
            ],


            [
                "Revenue",
                kpi.revenue
            ],


            [
                "Cost",
                kpi.cost
            ],


            [
                "Margin",
                kpi.margin
            ]


        ]);


    },



    // =========================
    // MANAGER KPI
    // =========================

    _writeManagerKPI(sheet){


        const data =
            ReportEngine.managerKPI();



        sheet
        .getRange(14,1)
        .setValue(
            "Manager KPI"
        );



        const headers =
        [
            "ManagerID",
            "Trips",
            "Revenue",
            "Cost",
            "Margin"
        ];



        sheet
        .getRange(
            15,
            1,
            1,
            headers.length
        )
        .setValues([
            headers
        ])
        .setFontWeight(
            "bold"
        );



        const rows =
            data.map(m=>[

                m.ManagerID,
                m.Trips,
                m.Revenue,
                m.Cost,
                m.Margin

            ]);



        if(rows.length){


            sheet
            .getRange(
                16,
                1,
                rows.length,
                headers.length
            )
            .setValues(rows);


        }


    },



    // =========================
    // FINANCE KPI
    // =========================

    _writeFinanceKPI(sheet){


        if(
            typeof KPIRepository === "undefined"
        ){

            return;

        }



        const data =
            KPIRepository.list();



        let revenue=0;
        let cost=0;
        let profit=0;



        data.forEach(k=>{


            revenue +=
                Number(k.Revenue || 0);


            cost +=
                Number(k.Cost || 0);


            profit +=
                Number(k.Profit || 0);


        });



        sheet
        .getRange(22,1)
        .setValue(
            "Finance KPI"
        );



        sheet
        .getRange(23,1,4,2)
        .setValues([


            [
                "Revenue",
                revenue
            ],


            [
                "Cost",
                cost
            ],


            [
                "Profit",
                profit
            ],


            [
                "Margin",
                revenue
                ?
                profit/revenue
                :
                0
            ]


        ]);


    }


};



globalThis.DashboardEngine =
DashboardEngine;