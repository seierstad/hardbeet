//this.characteristicNotificationEventHandler = this.characteristicNotificationEventHandler.bind(this);
//this.queryService = this.queryService.bind(this);

/*

characteristicNotificationEventHandler (event) {
    this.logger.log(
        `sensor ${this.index}:
         notification from ${getCharacteristicName(event.target.uuid)} -
         ${byteArray2Array(event.target.value)} - ${byteArray2String(event.target.value)}`);
}




function lookupNameFromUUID (uuid, dictionaries) {
    let name = null;

    dictionaries.forEach(d => {
        if (d.hasOwnProperty(uuid)) {
            name = d[uuid];
        }
    });

    if (name === null && typeof uuid === "string" && uuid.length === 36) {
        const shortID = parseInt(uuid.substring(4, 8), 16);
        dictionaries.forEach(d => {
            if (d.hasOwnProperty(shortID)) {
                name = d[shortID];
            }
        });
    }

    return name || uuid.toString();
}

function getDescriptorName (uuid) {
    return lookupNameFromUUID(uuid, [GATT_DESCRIPTOR_NAME]);
}

function getCharacteristicName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE]);
}

function getServiceName (uuid) {
    return lookupNameFromUUID(uuid, [POLAR_NAMES, GATT_SERVICE_NAME]);
}




*/
/*
    queryService (uuid) {
        return this.server.getPrimaryService(uuid)
            .then(service => {
                this.services[service.uuid] = {
                    service,
                    characteristics: {}
                };

                return service.getCharacteristics().then(chars => chars.forEach(char => {
                    this.services[service.uuid].characteristics[char.uuid] = {characteristic: char, descriptors: {}};
                    //console.log(getCharacteristicName(char.uuid), char.properties);
-
                    const promises = [
                        char.getDescriptors().then(descriptors => descriptors.forEach(descriptor => {
                            console.log(`sensor ${this.index}: service ${getServiceName(service.uuid)}, ${getCharacteristicName(char.uuid)}: descriptor ${decriptor.uuid}`);
                        })).catch(error => {
                            console.log(`sensor ${this.index}: no descriptors found in service ${getServiceName(service.uuid)}, characteristic ${getCharacteristicName(char.uuid)}`)
                        }),
                    ];

                    if (char.properties.read) {
                        this.logger.log(`reading characteristic ${getCharacteristicName(char.uuid)} from service ${getServiceName(service.uuid)}`);
                        promises.push(
                            char.readValue()
                                .then(value => {
                                    this.services[service.uuid].characteristics[char.uuid].value = value;
                                    this.services[service.uuid].characteristics[char.uuid].valueString = byteArray2String(value);
                                    this.services[service.uuid].characteristics[char.uuid].valueBytes = byteArray2Array(value);
                                })
                                .catch(err => console.error(`sensor ${this.index} ${getCharacteristicName(char.uuid)} read error: ${err}`))
                        );
                    }

                    if (char.properties.notify) {
                        char.addEventListener("characteristicvaluechanged", this.characteristicNotificationEventHandler);

                        promises.push(
                            char.startNotifications()
                                .then(char => {
                                    console.log(`sensor ${this.index}: notifications started for characteristic ${getCharacteristicName(char.uuid)}`);
                                })
                                .catch(err => console.error(`sensor ${this.index}: start notifications failed for characteristic ${getCharacteristicName(char.uuid)}: ${err}`))
                        );
                    }

                    return Promise.all(promises).catch(err => console.log(err));
                }));
            });
    }
*/