// ============================================================
// StartupSequence v1.0.0
// TaxControl ERP Core
//
// Central startup order controller
// ============================================================


const StartupSequence = {


version:"1.0.0",


steps:[


{
name:"Logger",
phase:"FOUNDATION"
},


{
name:"HealthContract",
phase:"FOUNDATION"
},


{
name:"EntityMetadata",
phase:"SCHEMA"
},


{
name:"EntityRegistry",
phase:"SCHEMA"
},


{
name:"SchemaRegistry",
phase:"SCHEMA"
},


{
name:"Database",
phase:"DATABASE"
},


{
name:"BaseRepository",
phase:"REPOSITORY"
},


{
name:"RepositoryFactory",
phase:"REPOSITORY"
},


{
name:"RepositoryRegistry",
phase:"REPOSITORY"
},


{
name:"EventBus",
phase:"EVENTS"
},
{
name:"ServiceRegistry",
phase:"SERVICES"
},

{
name:"FinanceEngine",
phase:"SERVICES"
},


{
name:"KPIEngine",
phase:"SERVICES"
},


{
name:"DashboardEngine",
phase:"MODULES"
}


],




run(){


Logger.log(
"STARTUP SEQUENCE BEGIN"
);



this.steps.forEach(step=>{


const module =
globalThis[step.name];



if(!module){

Logger.warn(
"SKIP "+step.name
);

return;

}



if(
typeof module.init==="function"
){

try{


module.init();



Logger.log(

"STARTED "
+
step.name

);



}
catch(e){


Logger.error(

"FAILED "
+
step.name
+
" "
+
e.message

);



throw e;


}


}



});



Logger.log(
"STARTUP SEQUENCE COMPLETE"
);


return true;


}



};



globalThis.StartupSequence =
StartupSequence;