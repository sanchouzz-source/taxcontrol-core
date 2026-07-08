console.log("DashboardService");


const DashboardService = {


    getOverview(){


        const trips =
            TripRepository.list();


        const kpis =
            KPIRepository.list();



        let revenue = 0;
        let cost = 0;
        let profit = 0;



        trips.forEach(trip=>{


            revenue +=
                Number(trip.Revenue || 0);


            cost +=
                Number(trip.ActualCost || 0);


        });



        profit =
            revenue - cost;



        const margin =
            revenue === 0
            ?
            0
            :
            profit / revenue;



        return {


            Trips:
                trips.length,


            Revenue:
                revenue,


            Cost:
                cost,


            Profit:
                profit,


            Margin:
                margin,


            KPI:
                kpis.length


        };


    }

};


globalThis.DashboardService =
DashboardService;