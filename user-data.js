"use strict";

import Service from "./service.js";

class UserData extends Service {
    constructor (service, logger = console) {
        super(service, "user data");
        this.logger = logger;

        this.initCharacteristics();
    }

    initCharacteristics () {
        return Promise.all([
            //service.getCharacteristic("first_name").then(this.handleFirstNameCharacteristic)
        ]);
    }

    handleFirstNameCharacteristic (characteristic) {
        return characteristic.readValue().then(firstName => this.firstName = firstName.getUint8(0));
    }

    set firstName (name) {
        this.logger.log({"firstName": name});
    }
}

export default UserData;
