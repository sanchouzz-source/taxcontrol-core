console.log("TripConstants v1.0");


const TripConstants = {


STATUS:{


NEW:"NEW",

PLANNED:"PLANNED",

LOADING:"LOADING",

IN_PROGRESS:"IN_PROGRESS",

COMPLETED:"COMPLETED",

CANCELLED:"CANCELLED"


},



TYPES:{


INTERNAL:"INTERNAL",

EXTERNAL:"EXTERNAL"


}



};



globalThis.TripConstants =
TripConstants;


Logger.log(
"TripConstants READY v1.0.0");