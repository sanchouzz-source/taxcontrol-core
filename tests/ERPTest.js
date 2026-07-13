function erpHealthTest(){


Logger.log(
"========== ERP HEALTH REQUEST =========="
);


Bootstrap.start();


const report =
Bootstrap.health();



Logger.log(
JSON.stringify(
report,
null,
2
)
);


return report;


}