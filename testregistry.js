function testRegistry(){


Logger.log(
"===== REGISTRY TEST ====="
);



SystemInit.init();



Logger.log(
JSON.stringify(
Registry.health()
)
);



Logger.log(
"===== REGISTRY COMPLETE ====="
);



}