console.log("EventExecutionLogConstants v1.0");


const EventExecutionLogConstants = {


version:"1.0.0",


sheetName:"EventExecutionLog",


columns:[

"ID",
"EVENT_ID",
"ENTITY",
"TYPE",
"STATUS",
"PROCESSOR",
"ERROR",
"TIMESTAMP"

]


};


globalThis.EventExecutionLogConstants =
EventExecutionLogConstants;


Logger.log(
"EventExecutionLogConstants READY v1.0.0"
);