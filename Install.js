const Installer = {

    install() {

        Logger.log("ERP INSTALL START");

        SchemaManager.init();

        Registry.init();

        DefaultData.init?.();

        Logger.log("ERP INSTALL COMPLETE");
    }
};

globalThis.Installer = Installer;