console.log("TripStatus v1.0");


const TripStatus = {


version:"1.0.0",


init(){


if(typeof TripConstants==="undefined")
{

throw new Error(
"TripStatus: TripConstants unavailable"
);

}


Logger.log(
"TripStatus READY v"+
this.version);

},



isValid(status){


return Object.values(
TripConstants.STATUS
)
.includes(status);


}



};



globalThis.TripStatus =
TripStatus;