function testDashboardFlow(){


Logger.log(
"===== DASHBOARD TEST ====="
);



installSystem();



const result =
DashboardEngine.render();



Logger.log(
JSON.stringify(result)
);



Logger.log(
"===== DASHBOARD COMPLETE ====="
);


}