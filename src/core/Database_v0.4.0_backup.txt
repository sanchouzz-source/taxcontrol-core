console.log("Database");


const Database = {


    version:"0.4.0",

    initialized:false,



    init(){


        if(this.initialized){

            return;

        }


        this.initialized=true;


        Logger.log(
            "Database READY"
        );


    },





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
                + name
            );

        }


        return sheet;


    },





// =====================
// INSERT
// =====================


insert(sheetName,data){



    const sheet =
        this.getSheetOrThrow(
            sheetName
        );



    const range =
        sheet.getDataRange();



    const values =
        range.getValues();



    const headers =
        values.length
        ?
        values[0]
        :
        [];




    const row =
        headers.map(h=>{


            if(h==="CreatedAt")
                return new Date();



            if(h==="UpdatedAt")
                return new Date();



            if(h==="Deleted")
                return false;



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





// =====================
// QUERY
// =====================


query(sheetName,filters={}){



    const sheet =
        this.getSheetOrThrow(
            sheetName
        );



    const values =
        sheet
        .getDataRange()
        .getValues();



    if(values.length<=1)
        return [];



    const headers =
        values[0];



    const result=[];



    values
    .slice(1)
    .forEach(row=>{


        const obj={};



        headers.forEach(
            (h,i)=>{

                obj[h]=row[i];

            }
        );



        // скрываем удаленные

        if(
            obj.Deleted===true
        )
        {
            return;
        }





        let ok=true;



        Object.keys(filters)
        .forEach(key=>{


            if(
                obj[key]!=filters[key]
            )
            {
                ok=false;
            }


        });



        if(ok)
            result.push(obj);



    });



    return result;


},







// =====================
// FIND
// =====================


find(sheetName,id){



    const rows =
        this.query(
            sheetName
        );



    const idField =
        SchemaRegistry
        .getIdField(
            sheetName
        );



    return rows.find(
        r =>
        r[idField]===id
    )
    ||
    null;



},







// =====================
// UPDATE
// =====================


update(sheetName,id,data){



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
            values[i][idIndex]===id
        ){


            const newRow =
            headers.map(h=>{


                if(
                    h==="UpdatedAt"
                )
                {
                    return new Date();
                }


                return data[h]
                ??
                values[i]
                [
                    headers.indexOf(h)
                ];

            });



            sheet
            .getRange(
                i+1,
                1,
                1,
                newRow.length
            )
            .setValues(
                [newRow]
            );



            return data;


        }


    }


    throw new Error(
        "Record not found "
        + id
    );


},







// =====================
// HEALTH
// =====================


health(){



    try{


        const ss =
            SpreadsheetApp
            .getActiveSpreadsheet();



        return HealthContract.create(

            "Database",

            "OK",

            {


                version:
                this.version,


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

                message:e.message

            }

        );


    }


}



};



globalThis.Database =
Database;