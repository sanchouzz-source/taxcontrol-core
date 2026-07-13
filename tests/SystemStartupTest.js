const SystemStartupTest={


fullHealth(){



Logger.log(
"===== ERP HEALTH TEST ====="
);



SystemInit.init();



const report =
Inspector.inspect();



Logger.log(
JSON.stringify(
report,
null,
2
)
);



return report;



}



};



globalThis.SystemStartupTest=
SystemStartupTest;