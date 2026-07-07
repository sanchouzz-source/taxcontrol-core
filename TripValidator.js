const TripValidator = {


    validate(data) {


        if (!data.ClientID) {

            throw new Error(
                "ClientID is required"
            );

        }


        if (!data.From) {

            throw new Error(
                "Trip origin is required"
            );

        }


        if (!data.To) {

            throw new Error(
                "Trip destination is required"
            );

        }


        if (!data.Revenue) {

            data.Revenue = 0;

        }


        if (!data.Cost) {

            data.Cost = 0;

        }


        if (!data.Status) {

            data.Status = "NEW";

        }


        return data;

    }

};


globalThis.TripValidator = TripValidator;