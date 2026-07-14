function testAuditUpdate(){

const client =
ClientRepository.getById(
"CLI000028"
);


ClientRepository.update(
"CLI000028",
{
Phone:"+70000000000"
}
);


}