const ModuleDependencies = {


CRMSubscriptions:{
    requires:[
        "EventBus",
        "CRMRepository",
        "EntityRegistry"
    ]
},


FinanceEngine:{
    requires:[
        "EventBus",
        "Database",
        "RepositoryFactory"
    ]
},


TransportOrderEventHandler:{
    requires:[
        "EventBus",
        "EntityRegistry",
        "ERPEventContract"
    ]
}


};


globalThis.ModuleDependencies = ModuleDependencies;