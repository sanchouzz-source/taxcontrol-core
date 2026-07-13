function testClientVersioning(){

const id="CLI000020";


ClientRepository.update(
id,
{
Phone:"+71111111111"
}
);


const history =
Versioning.get(
"CLIENT",
id
);


Logger.log(
JSON.stringify(
history,
null,
2
)
);


}