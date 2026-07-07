const EventBus = {

    handlers: {},

    on(event, handler) {

        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }

        this.handlers[event].push(handler);
    },

   emit(event, payload) {

    Logger.log(
        "EVENT: " + event
    );


    const list = this.handlers[event];

    if (!list || list.length === 0) return;


    list.forEach(fn => {

        try {

            fn(payload);

        } catch (e) {

            Logger.log(
                "EventBus error: "
                + e.message
            );

        }

    });


    }
};
globalThis.EventBus = EventBus;