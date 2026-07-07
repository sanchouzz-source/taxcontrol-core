const TripValidator = {


    validate(data) {


        if (!data.ClientID) {

            throw new Error(
                "ClientID is required"
            );

        }


        if (!data.LoadingPoint) {

            throw new Error(
                "LoadingPoint is required"
            );

        }


        if (!data.UnloadingPoint) {

            throw new Error(
                "UnloadingPoint is required"
            );

        }


        if (!data.Status) {

            data.Status = "NEW";

        }


        if (!data.Revenue) {

            data.Revenue = 0;

        }


        if (!data.PlannedCost) {

            data.PlannedCost = 0;

        }


        if (!data.ActualCost) {

            data.ActualCost = 0;

        }


        data.Margin =
            Number(data.Revenue)
            -
            Number(data.ActualCost);


        return data;

    }

};


globalThis.TripValidator = TripValidator;