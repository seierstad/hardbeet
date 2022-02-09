"use strict";

import Service from "./service.js";

class UserData extends Service {
    constructor (service) {
        super(service, "user data");

        this.initCharacteristics();
    }

    initCharacteristics () {
        return Promise.all([
            //service.getCharacteristic("first_name").then(this.handleFirstNameCharacteristic)
        ]);
    }

    handleFirstNameCharacteristic (characteristic) {
        return characteristic.readValue().then(firstNameData => this.firstName = firstName.getUint8(0));
    }

    set firstName (name) {
        console.log({"firstName": name});
    }
}

export default UserData;
