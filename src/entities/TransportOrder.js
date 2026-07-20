const TransportOrder = {

    create(data){

        return {

            TransportOrderID:
                IdService.generate("TOR"),


            OrganizationID:
                data.OrganizationID,


            ClientID:
                data.ClientID,


            OrderNumber:
                data.OrderNumber,


            LoadingAddress:
                data.LoadingAddress,


            DeliveryAddress:
                data.DeliveryAddress,


            CargoWeight:
                data.CargoWeight || 0,


            Status:
                "NEW",


            CreatedAt:
                new Date(),


            UpdatedAt:
                new Date()

        };

    }

};