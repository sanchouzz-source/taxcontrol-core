console.log("DataRepair");


const DataRepair = {


fixClients(){


const sheet =
Database.getSheetOrThrow("Clients");


const values =
sheet.getDataRange().getValues();


const headers =
values[0];


const idIndex =
headers.indexOf("ClientID");


let fixed=0;


for(let i=1;i<values.length;i++){


let id =
values[i][idIndex];


if(
!id ||
id.startsWith("undefined")
){


const newId =
IdService.generate(
"CLI"
);



sheet
.getRange(
i+1,
idIndex+1
)
.setValue(newId);



fixed++;


Logger.log(
"FIX CLIENT ROW "
+i+
" => "
+newId
);


}


}



return {

status:"OK",

fixed:fixed

};


}



};



globalThis.DataRepair =
DataRepair;