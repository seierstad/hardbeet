const GATT_DECLARATION_NAME = {
    0x2800: "Primary Service",
    0x2801: "Secondary Service",
    0x2802: "Include",
    0x2803: "Characteristic"
};

const GATT_DECLARATION = {
    "PRIMARY_SERVICE": 0x2800,
    "SECONDARY_SERVICE": 0x2801,
    "INCLUDE": 0x2802,
    "CHARACTERISTIC": 0x2803
}

const GATT_DESCRIPTOR = {
    "CHARACTERISTIC_EXTENDED_PROPERTIES": 0x2900,
    "CHARACTERISTIC_USER_DESCRIPTION": 0x2901,
    "CLIENT_CHARACTERISTIC_CONFIGURATION": 0x2902,
    "SERVER_CHARACTERISTIC_CONFIGURATION": 0x2903,
    "CHARACTERISTIC_PRESENTATION_FORMAT": 0x2904,
    "CHARACTERISTIC_AGGREGATE_FORMAT": 0x2905,
    "VALID_RANGE": 0x2906,
    "EXTERNAL_REPORT_REFERENCE": 0x2907,
    "REPORT_REFERENCE": 0x2908,
    "NUMBER_OF_DIGITALS": 0x2909,
    "VALUE_TRIGGER_SETTING": 0x290A,
    "ENVIRONMENTAL_SENSING_CONFIGURATION": 0x290B,
    "ENVIRONMENTAL_SENSING_MEASUREMENT": 0x290C,
    "ENVIRONMENTAL_SENSING_TRIGGER_SETTING": 0x290D,
    "TIME_TRIGGER_SETTING": 0x290E,
    "COMPLETE_BR_EDR_TRANSPORT_BLOCK_DATA": 0x290F
};

const GATT_DESCRIPTOR_NAME = {
    0x2900: "Characteristic Extended Properties",
    0x2901: "Characteristic User Description",
    0x2902: "Client Characteristic Configuration",
    0x2903: "Server Characteristic Configuration",
    0x2904: "Characteristic Presentation Format",
    0x2905: "Characteristic Aggregate Format",
    0x2906: "Valid Range",
    0x2907: "External Report Reference",
    0x2908: "Report Reference",
    0x2909: "Number of Digitals",
    0x290A: "Value Trigger Setting",
    0x290B: "Environmental Sensing Configuration",
    0x290C: "Environmental Sensing Measurement",
    0x290D: "Environmental Sensing Trigger Setting",
    0x290E: "Time Trigger Setting",
    0x290F: "Complete BR-EDR Transport Block Data"
};

export {
    GATT_DECLARATION,
    GATT_DESCRIPTOR,
    GATT_DESCRIPTOR_NAME
};
