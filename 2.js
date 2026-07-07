function resetClientSequence(){

    const clients =
        Database.query("Clients",{});


    let max = 0;


    clients.forEach(c=>{

        if(c.ClientID){

            const n =
                Number(
                    c.ClientID.replace("CLI","")
                );

            if(n>max){
                max=n;
            }
        }

    });


    PropertiesService
        .getScriptProperties()
        .setProperty(
            "CLI_SEQ",
            max
        );


    Logger.log(
        "CLI_SEQ reset to "
        + max
    );
}