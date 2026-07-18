console.log("EntityConstants");


const EntityConstants = {


version:"0.6.0",


entities:{


    ORGANIZATION:{
        name:"Organizations",
        prefix:"ORG"
    },


    CLIENT:{
        name:"Clients",
        prefix:"CLI"
    },


    CLIENT_FINANCE_PROFILE:{
        name:"ClientFinanceProfiles",
        prefix:"CFP"
    },


    TRIP:{
        name:"Trips",
        prefix:"TRP"
    },


    FINANCIAL_TRANSACTION:{
        name:"FinancialTransactions",
        prefix:"FIN"
    },


    KPI:{
        name:"KPIMetrics",
        prefix:"KPI"
    },


    AUDIT:{
        name:"AuditLog",
        prefix:"AUD"
    },


    EVENT:{
        name:"EventLog",
        prefix:"EVT"
    }


},





get(key){


    return this.entities[key]
    ||
    null;


},





getPrefix(key){


    const entity =
        this.get(key);


    return entity
    ?
    entity.prefix
    :
    null;


},





getSheet(key){


    const entity =
        this.get(key);


    return entity
    ?
    entity.name
    :
    null;


},





list(){


    return Object.keys(
        this.entities
    );


},





health(){


    return HealthContract.create(

        "EntityConstants",

        "OK",

        {

            version:this.version,

            entities:this.list()

        }

    );

}


};





globalThis.EntityConstants =
EntityConstants;



Logger.log(
"EntityConstants READY v"
+
EntityConstants.version
);