console.log("EntityMetadata");



const EntityMetadata = {



version:"0.1.0",




CLIENT:{


fields:[


{
name:"ClientID",
type:"ID",
required:true
},


{
name:"OrganizationID",
type:"REFERENCE",
required:true
},


{
name:"Name",
type:"STRING",
required:true
},


{
name:"INN",
type:"STRING"
},


{
name:"Phone",
type:"STRING"
},


{
name:"Email",
type:"STRING"
},


{
name:"Status",
type:"ENUM"
}


]

},






TRIP:{


fields:[


{
name:"TripID",
type:"ID",
required:true
},


{
name:"ClientID",
type:"REFERENCE",
required:true
},


{
name:"VehicleID",
type:"REFERENCE"
},


{
name:"DriverID",
type:"REFERENCE"
},


{
name:"StartDate",
type:"DATE"
},


{
name:"EndDate",
type:"DATE"
},


{
name:"Revenue",
type:"MONEY"
},


{
name:"Cost",
type:"MONEY"
},


{
name:"Profit",
type:"MONEY",
calculated:true
},


{
name:"Status",
type:"ENUM"
}


]

}



};





globalThis.EntityMetadata =
EntityMetadata;



console.log(
"EntityMetadata READY v"
+
EntityMetadata.version
);