console.log("IdService");
const IdService = {

    generate(prefix) {

        if (!prefix) {
            throw new Error("IdService: prefix is required");
        }

        const props = PropertiesService.getScriptProperties();

        let counter = Number(props.getProperty(prefix + "_SEQ") || 0);

        counter++;

        props.setProperty(prefix + "_SEQ", counter);

        return prefix + String(counter).padStart(6, "0");
    }
};
globalThis.IdService = IdService;