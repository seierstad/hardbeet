import {GATT_DESCRIPTOR_NAME, GATT_SERVICE_NAME, POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE} from "./GATT_constants.js";
import {lookupUUID} from "./functions.js";


const lookupNameFromUUID = (uuid, dictionaries) => {
    const lookup = lookupUUID(uuid);
    const dictionary = dictionaries.find(({[lookup]: match = null}) => match !== null);

    return dictionary ? dictionary[lookup] : lookup.toString();
};

const getDescriptorName = uuid => lookupNameFromUUID(uuid, [GATT_DESCRIPTOR_NAME]);
const getCharacteristicName = uuid => lookupNameFromUUID(uuid, [POLAR_NAMES, CHARACTERISTIC_OR_OBJECT_TYPE]);
const getServiceName = uuid => lookupNameFromUUID(uuid, [POLAR_NAMES, GATT_SERVICE_NAME]);


export {
    getServiceName,
    getCharacteristicName,
    getDescriptorName
};
