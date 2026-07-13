function clearTestClients(){

const sheet =
SpreadsheetApp
.getActive()
.getSheetByName("Clients");


const last =
sheet.getLastRow();


if(last>1){

sheet
.deleteRows(
2,
last-1
);

}


Logger.log(
"Clients cleaned"
);


}