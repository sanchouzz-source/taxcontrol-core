console.log("Database");


const Database = {


    version:"0.4.0",

    initialized:false,


    // =========================
    // INIT
    // =========================

    init(){


        if(this.initialized){

            Logger.log(
                "Database ALREADY READY"
            );

            return;

        }



        SchemaManager.init();



        this.initialized=true;



        Logger.log(
            "Database READY"
        );


    },



    // =========================
    // GET SHEET
    // =========================


    sheet(name){


        return SpreadsheetApp
            .getActiveSpreadsheet()
            .getSheetByName(name);


    },




    getSheetOrThrow(name){


        const sheet =
            this.sheet(name);



        if(!sheet){


            throw new Error(
                "Sheet not found: "
                +
                name
            );


        }


        return sheet;


    },





    // =========================
    // INSERT
    // =========================


    insert(sheetName,data){



        this.init();



        const sheet =
            this.getSheetOrThrow(
                sheetName
            );



        const values =
            sheet
            .getDataRange()
            .getValues();



        const headers =
            values[0];



        const idField =
            SchemaRegistry
            .getIdField(
                sheetName
            );




        if(
            idField
            &&
            data[idField]
        ){



            const idIndex =
                headers.indexOf(
                    idField
                );



            for(
                let i=1;
                i<values.length;
                i++
            ){


                if(
                    String(values[i][idIndex])
                    ===
                    String(data[idField])
                ){


                    throw new Error(
                        "Duplicate ID: "
                        +
                        data[idField]
                    );


                }


            }


        }






        const now =
            new Date();




        const row =
            headers.map(header=>{


                if(
                    header==="CreatedAt"
                ){

                    return now;

                }


                if(
                    header==="UpdatedAt"
                ){

                    return now;

                }


                if(
                    header==="Deleted"
                ){

                    return false;

                }



                return data[header] ?? "";



            });






        const rowNumber =
            sheet.getLastRow()+1;



        sheet
        .getRange(
            rowNumber,
            1,
            1,
            row.length
        )
        .setValues(
            [
                row
            ]
        );




        Logger.log(

            "INSERT "
            +
            sheetName
            +
            " ROW "
            +
            rowNumber

        );




        return {

            ...data,

            rowNumber:rowNumber

        };



    },





    // =========================
    // FIND ALL
    // =========================


    query(sheetName,filters={}){


        this.init();



        const sheet =
            this.getSheetOrThrow(
                sheetName
            );



        const data =
            sheet
            .getDataRange()
            .getValues();



        const headers =
            data[0];



        const result=[];



        for(
            let i=1;
            i<data.length;
            i++
        ){



            const row={};



            headers.forEach(
                (h,index)=>{


                    row[h]=
                    data[i][index];


                }
            );




            let match=true;



            Object.keys(filters)
            .forEach(key=>{


                if(
                    row[key]
                    !=
                    filters[key]
                ){

                    match=false;

                }


            });





            if(match){


                result.push(row);


            }



        }



        return result;


    },





    // =========================
    // FIND BY ID
    // =========================


    find(sheetName,id){



        this.init();



        const idField =
            SchemaRegistry
            .getIdField(
                sheetName
            );



        const records =
            this.query(
                sheetName,
                {
                    [idField]:id
                }
            );



        return records.length
        ?
        records[0]
        :
        null;



    },





    // =========================
    // UPDATE
    // =========================


    update(sheetName,id,data){



        this.init();



        const sheet =
            this.getSheetOrThrow(
                sheetName
            );



        const values =
            sheet
            .getDataRange()
            .getValues();



        const headers =
            values[0];



        const idField =
            SchemaRegistry
            .getIdField(
                sheetName
            );



        const idIndex =
            headers.indexOf(
                idField
            );




        for(
            let i=1;
            i<values.length;
            i++
        ){



            if(
                String(values[i][idIndex])
                ===
                String(id)
            ){



                const row =
                headers.map(header=>{


                    if(
                        header==="UpdatedAt"
                    ){

                        return new Date();

                    }


                    if(
                        data[header]
                        !==
                        undefined
                    ){

                        return data[header];

                    }


                    return values[i]
                    [
                        headers.indexOf(header)
                    ];



                });





                sheet
                .getRange(
                    i+1,
                    1,
                    1,
                    row.length
                )
                .setValues(
                    [
                        row
                    ]
                );




                return true;


            }


        }



        throw new Error(
            "Record not found "
            +
            id
        );


    },






    // =========================
    // DELETE SOFT
    // =========================


    remove(sheetName,id){



        this.update(

            sheetName,

            id,

            {
                Deleted:true
            }

        );



        Logger.log(

            "SOFT DELETE "
            +
            sheetName
            +
            " "
            +
            id

        );


    },






    // =========================
    // HEALTH
    // =========================


    health(){



        try{


            const ss =
            SpreadsheetApp
            .getActiveSpreadsheet();




            return HealthContract.create(

                "Database",

                "OK",

                {

                    version:this.version,

                    spreadsheet:
                    ss.getName()

                }

            );



        }
        catch(e){


            return HealthContract.create(

                "Database",

                "ERROR",

                {

                    error:e.message

                }

            );


        }



    }



};




globalThis.Database =
Database;