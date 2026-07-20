const Carrier = {


create(data){

return {


CarrierID:
IdService.generate("CAR"),


OrganizationID:
data.OrganizationID,


Name:
data.Name,


INN:
data.INN,


Phone:
data.Phone,


Status:
"ACTIVE",


CreatedAt:
new Date()


};

}


};