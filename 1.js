function fixDuplicateClients(){

    const sheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName("Clients");


    const values =
        sheet.getDataRange()
        .getValues();


    const headers = values[0];

    const idIndex =
        headers.indexOf("ClientID");


    const seen = {};

    for(let i = values.length-1; i>=1; i--){

        const id =
            values[i][idIndex];


        if(!id){
            continue;
        }


        if(seen[id]){

            Logger.log(
                "DELETE DUPLICATE ROW "
                + (i+1)
                + " "
                + id
            );


            sheet.deleteRow(i+1);

        }
        else{

            seen[id]=true;

        }

    }
}