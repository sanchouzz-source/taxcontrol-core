console.log("Database");


const Database = {


version:"0.5.1",

initialized:false,



// =========================
// INIT
// =========================

init(){


    if(this.initialized){

        return;

    }


    SchemaManager.init();


    this.initialized=true;


    Logger.log(
        "Database READY"
    );


},



// =========================
// SHEET
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



    const headers =
        sheet
        .getRange(
            1,
            1,
            1,
            sheet.getLastColumn()
        )
        .getValues()[0];



    const idField =
        SchemaRegistry
        .getIdField(
            sheetName
        );




    // генерация ID

    if(
        idField &&
        !data[idField]
    ){


        data[idField] =
            IdService.generate(
                sheetName
            );


    }




    // защита от дублей

    if(
        idField &&
        data[idField]
    ){


        const existing =
            this.find(
                sheetName,
                data[idField]
            );



        if(existing){


            throw new Error(

                "Duplicate ID detected: "
                +
                data[idField]

            );


        }


    }






    const row =
        headers.map(h=>{


            if(
                h==="CreatedAt"
            ){

                return new Date();

            }



            if(
                h==="UpdatedAt"
            ){

                return new Date();

            }



            if(
                h==="Deleted"
            ){

                return false;

            }




            return data[h] ?? "";


        });






    const nextRow =
        sheet.getLastRow()+1;



    sheet
    .getRange(
        nextRow,
        1,
        1,
        row.length
    )
    .setValues(
        [row]
    );





    Logger.log(

        "INSERT "
        +
        sheetName
        +
        " ROW "
        +
        nextRow

    );




    return data;


},






// =========================
// FIND
// =========================

find(sheetName,id){


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



    const index =
        headers.indexOf(
            idField
        );



    if(index===-1){

        throw new Error(
            "ID field not found: "
            +
            idField
        );

    }




    for(
        let i=1;
        i<values.length;
        i++
    ){


        if(

            String(values[i][index])
            .trim()

            ===

            String(id)
            .trim()

        ){


            let result={};



            headers.forEach(
                (h,j)=>{

                    result[h]=
                        values[i][j];

                }
            );



            return result;


        }


    }



    return null;


},






// =========================
// QUERY
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



    const currentOrg =
        PropertiesService
        .getScriptProperties()
        .getProperty(
            "CURRENT_ORG"
        );




    return data
    .slice(1)
    .map(row=>{


        let obj={};



        headers.forEach(
            (h,i)=>{

                obj[h]=row[i];

            }
        );



        return obj;


    })



    .filter(obj=>{


        if(

            obj.OrganizationID

            &&

            currentOrg

            &&

            obj.OrganizationID
            !==
            currentOrg

        ){

            return false;

        }




        return Object.keys(filters)
        .every(

            k=>

            obj[k]
            ==
            filters[k]

        );


    });


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
            .trim()

            ===

            String(id)
            .trim()

        ){



            const row =
            headers.map(h=>{


                if(
                    h==="UpdatedAt"
                ){

                    return new Date();

                }



                if(
                    data[h]!==undefined
                ){

                    return data[h];

                }



                return values[i]
                [
                    headers.indexOf(h)
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
                [row]
            );




            return data;


        }


    }



    throw new Error(
        "Record not found: "
        +
        id
    );


},






// =========================
// HEALTH
// =========================

health(){


    return HealthContract.create(


        "Database",


        this.initialized
        ?
        "OK"
        :
        "WARNING",


        {


            version:this.version,


            spreadsheet:
            SpreadsheetApp
            .getActiveSpreadsheet()
            .getName()


        }


    );


}



};




globalThis.Database =
Database;