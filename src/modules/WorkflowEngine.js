const WorkflowEngine = {


version:"1.0.0",


rules:{


TRANSPORT_ORDER:{


NEW:[
"CONFIRMED",
"CANCELLED"
],


CONFIRMED:[
"ASSIGNED",
"CANCELLED"
],


ASSIGNED:[
"LOADING",
"CANCELLED"
],


LOADING:[
"LOADED"
],


LOADED:[
"IN_TRANSIT"
],


IN_TRANSIT:[
"DELIVERED"
],


DELIVERED:[
"CLOSED"
]


}


},



canMove(entity,from,to){


if(
!this.rules[entity]
)
return false;


return (
this.rules[entity][from] || []
)
.includes(to);


},



move(entity,data,newStatus){


const oldStatus=data.Status;


if(
!this.canMove(
entity,
oldStatus,
newStatus
)
){

throw new Error(
"INVALID WORKFLOW "
+
oldStatus
+
" -> "
+
newStatus
);

}


data.Status=newStatus;


return data;

}


};


globalThis.WorkflowEngine=WorkflowEngine;