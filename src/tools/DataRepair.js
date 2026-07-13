DataRepairconsole.log("DataRepair");


const DataRepair = {


version:"0.1.0",


scan(sheetName){


    const sheet =
        Database.getSheetOrThrow(sheetName);


    const values =
        sheet.getDataRange()
        .getValues();


    const headers =
        values[0];


    const report = {

        sheet:sheetName,

        rows:
            values.length-1,

        emptyIDs:[],

        undefinedIDs:[],

        duplicates:[]

    };



    const idField =
        SchemaRegistry.getIdField(sheetName);



    const idIndex =
        headers.indexOf(idField);



    const ids = {};



    for(
        let i=1;
        i<values.length;
        i++
    ){


        const id =
            values[i][idIndex];



        if(!id){

            report.emptyIDs.push(
                i+1
            );

        }



        if(
            String(id)
            .includes("undefined")
        ){

            report.undefinedIDs.push(
                {
                    row:i+1,
                    id:id
                }
            );

        }



        if(id){


            if(ids[id]){


                report.duplicates.push({

                    id:id,

                    rows:[
                        ids[id],
                        i+1
                    ]

                });


            }
            else{


                ids[id]=i+1;


            }


        }



    }



    return report;


},





repairUndefinedIDs(sheetName){


    const sheet =
        Database.getSheetOrThrow(sheetName);



    const values =
        sheet.getDataRange()
        .getValues();



    const headers =
        values[0];



    const idField =
        SchemaRegistry.getIdField(sheetName);



    const idIndex =
        headers.indexOf(idField);



    let fixed=0;



    for(
        let i=1;
        i<values.length;
        i++
    ){


        const id =
            values[i][idIndex];



        if(
            String(id)
            .includes("undefined")
            ||
            !id
        ){


            const newID =
                IdService.generate(
                    sheetName
                );



            sheet
            .getRange(
                i+1,
                idIndex+1
            )
            .setValue(
                newID
            );



            fixed++;


        }


    }



    return {

        sheet:sheetName,

        repaired:fixed

    };


},






health(){


return HealthContract.create(

"DataRepair",

"OK",

{

version:this.version

}

);


}



};



globalThis.DataRepair =
DataRepair;