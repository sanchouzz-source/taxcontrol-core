function testEntityLifecycleMatrix(){


Logger.log(
"========== ENTITY MATRIX START =========="
);



ERPSystem.init();



TestEntityLifecycleMatrix.run(
"CLIENT",
ClientRepository,
{
Name:"Matrix Test",
INN:"8888888888",
Phone:"+79990000002"
}
);



Logger.log(
"========== ENTITY MATRIX SUCCESS =========="
);


}