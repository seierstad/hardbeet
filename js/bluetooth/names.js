import {GATT_DESCRIPTOR_NAME, GATT_SERVICE_NAME, POLAR_NAMES} from "./GATT_constants.js";

const lookupNameFromUUID = (uuid, dictionaries) => {
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
};

const getDescriptorName = uuid => lookupNameFromUUID(uuid, [GATT_DESCRIPTOR_NAME]);
const getCharacteristicName = uuid => lookupNameFromUUID(uuid, [POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE]);
const getServiceName = uuid => lookupNameFromUUID(uuid, [POLAR_NAMES, GATT_SERVICE_NAME]);


export {
    getServiceName,
    getCharacteristicName,
    getDescriptorName
};
