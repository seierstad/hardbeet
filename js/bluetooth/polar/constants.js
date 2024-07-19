const POLAR_MEASUREMENT_DATA_SERVICE_UUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
const PFC_SERVICE = "6217ff4b-fb31-1140-ad5a-a45545d7ecf3";


const POLAR_UUID1 = 0xFEEE;
const POLAR_UUID2 = 0xFEFE;


const POLAR_MANUFACTURER_IDS = [0x006B, 0x00D1];


const POLAR_CHARACTERISTICS = {
    UNDOCUMENTED_1: "fb005c51-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_2: "fb005c52-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_3: "fb005c53-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_4: "6217ff4c-c8ec-b1fb-1380-3ad986708e2d",
    UNDOCUMENTED_5: "6217ff4d-91bb-91d0-7e2a-7cd3bda8a1f3",
    PMD_CONTROL_POINT: "fb005c81-02e7-f387-1cad-8acd2d8df0c8",
    PMD_DATA_MTU: "fb005c82-02e7-f387-1cad-8acd2d8df0c8"
};

const POLAR_NAMES = {
    [POLAR_UUID1]: "Polar proprietary UUID 1",
    [POLAR_UUID2]: "Polar proprietary UUID 2",
    [POLAR_MEASUREMENT_DATA_SERVICE_UUID]: "Polar Measurement Data Service",
    [PFC_SERVICE]: "Polar Features Configuration Service (PFCS)",
    [POLAR_CHARACTERISTICS.PMD_CONTROL_POINT]: "Polar Measurement Data Control Point",
    [POLAR_CHARACTERISTICS.PMD_DATA_MTU]: "Polar Measurement Data MTU Characteristic",
    [POLAR_CHARACTERISTICS.UNDOCUMENTED_1]: "Polar undocumented characteristic 1",
    [POLAR_CHARACTERISTICS.UNDOCUMENTED_2]: "Polar undocumented characteristic 2",
    [POLAR_CHARACTERISTICS.UNDOCUMENTED_3]: "Polar undocumented characteristic 3",
    [POLAR_CHARACTERISTICS.UNDOCUMENTED_4]: "Polar undocumented characteristic 4",
    [POLAR_CHARACTERISTICS.UNDOCUMENTED_5]: "Polar undocumented characteristic 5"
};

const POLAR_RESPONSE_CODES = {
    0: "SUCCESS", // Response when sent Control Point Command is handled with success.
    1: "ERROR INVALID OP CODE", // Response when sent Control Point Command is not supported by device.
    2: "ERROR INVALID MEASUREMENT TYPE", // Response when requested measurement is not known by the device.
    3: "ERROR NOT SUPPORTED", // Response when requested measurement is not supported by the device.
    4: "ERROR INVALID LENGTH", // Response when given length of doesn't match the received number of data.
    5: "ERROR INVALID PARAMETER", // Response when request contains parameters that prevents handling the request.
    6: "ERROR ALREADY IN STATE", // Response when device already in requested state.
    7: "ERROR INVALID RESOLUTION", // Response when requested measurement with a resolution that is not supported by device.
    8: "ERROR INVALID SAMPLE RATE", // Response when requested measurement with a sample rate that is not supported by device.
    9: "ERROR INVALID RANGE", // Response when requested measurement with a range that is not supported by device.
    10: "ERROR INVALID MTU", // Response when connection MTU is not matching the device required MTU.
    11: "ERROR INVALID NUMBER OF CHANNELS", // Response when measurement request contains invalid number of channels.
    12: "ERROR INVALID STATE", // Response when device in invalid state.
    13: "ERROR DEVICE IN CHARGER", // Response when device is in charger and doesn't support requested command in the current state.
    14: "ERROR DISK FULL"
    //     14 - 255 "RFU" // Reserved for Future Usage.
};

const OP_CODE = {
    NULL_ITEM: 0x00,
    GET_MEASUREMENT_SETTINGS: 0x01,
    START_MEASUREMENT: 0x02,
    STOP_MEASUREMENT: 0x03,
    GET_SDK_MODE_MEASUREMENT_SETTINGS: 0x04,
    GET_MEASUREMENT_STATUS: 0x05,
    GET_SDK_MODE_STATUS: 0x06,
    GET_OFFLINE_RECORDING_TRIGGER_STATUS: 0x07,
    SET_OFFLINE_RECORDING_TRIGGER_MODE: 0x08,
    SET_OFFLINE_RECORDING_TRIGGER_SETTINGS: 0x09
};

const MEASUREMENT_STATUS = {
    NO_ACTIVE_MEASUREMENT: 0x00,
    ONLINE_MEASUREMENT_ACTIVE: 0x01,
    OFFLINE_MEASUREMENT_ACTIVE: 0x02,
    ONLINE_AND_OFFLINE_ACTIVE: 0x03
};

const CONTROL_POINT_RESPONSE_TYPE = {
    FEATURE_READ: 0x0F,
    MEASUREMENT_CONTROL: 0xF0
};

const MEASUREMENT_TYPE = {
    "ECG": 0x00, // Volt (V)
    "PPG": 0x01,
    "ACCELERATION": 0x02, // Force per unit mass (g)
    "PP_INTERVAL": 0x03, // Second (s)
    "GYROSCOPE": 0x05, // Degrees per second (dps)
    "MAGNETOMETER": 0x06, // Gauss (G)
    "SDK_MODE": 0x09,
    "LOCATION": 0x0a, // = 10u?
    "PRESSURE": 0x0b, // = 11u?
    "TEMPERATURE": 0x0c, // = 12u?
    "OFFLINE_RECORDING": 0x0d, // =13u?
    "OFFLINE_HR": 0x0e, // = 14u?
    "OFFLINE_TEMP": 0x0f, // = 15u
    "UNKNOWN_TYPE": 0x3f // = 0x3fu?
};

/* Polar v5.0.0:

*/

const MEASUREMENT_NAME = {
    0x00: "ecg",
    0x01: "ppg",
    0x02: "acceleration",
    0x03: "ppInterval",
    0x05: "gyroscope",
    0x06: "magnetometer",
    0x09: "SDK mode",
    0x0a: "location",
    0x0b: "pressure",
    0x0c: "temperature",
    0x0d: "offline recording",
    0x0e: "offline heart rate",
    0x0f: "offline temperature",
    0x3f: "unknown type"
};

const ACC_FRAMETYPE = {
    RES8:  0x00,
    RES16: 0x01,
    RES24: 0x02,
    DELTA: 0x80
};

const ECG_FRAMETYPE = {
    RES14: 0x00
};

const RESOLUTION = {
    0x000E: 14,
    0x0010: 16,
    0x0016: 22
};

const SAMPLE_RATE = {
    0x0019:  25,
    0x0032:  50,
    0x0034:  52,
    0x0064: 100,
    0x0082: 130,
    0x00C8: 200
};

const RANGE = {
    0x0002: 2,
    0x0004: 4,
    0x0008: 8
};

const CHANNELS = {
    0x03: 3
};

const SETTING_TYPE = {
    SAMPLE_RATE: 0x00,
    RESOLUTION: 0x01,
    RANGE: 0x02,
    CHANNELS: 0x04,
    FACTOR: 0x05,
    SECURITY: 0x06
};


const SETTING_VALUES = {
    [SETTING_TYPE.SAMPLE_RATE]: SAMPLE_RATE,
    [SETTING_TYPE.RESOLUTION]: RESOLUTION,
    [SETTING_TYPE.RANGE]: RANGE,
    [SETTING_TYPE.CHANNELS]: CHANNELS
};

const SETTING_TYPE_NAME = {
    [SETTING_TYPE.SAMPLE_RATE]: "samplerate",
    [SETTING_TYPE.RESOLUTION]: "resolution",
    [SETTING_TYPE.RANGE]: "range",
    [SETTING_TYPE.CHANNELS]: "channels",
    [SETTING_TYPE.FACTOR]: "factor",
    [SETTING_TYPE.SECURITY]: "security"
};

// all multibyte values are little endian
const SETTING_TYPE_LENGTH = {
    [SETTING_TYPE.SAMPLE_RATE]: 2,
    [SETTING_TYPE.RESOLUTION]: 2,
    [SETTING_TYPE.RANGE]: 2,
    [SETTING_TYPE.CHANNELS]: 1,
    [SETTING_TYPE.FACTOR]: 4,
    [SETTING_TYPE.SECURITY]: 16
};

const SETTING_LENGTH = 0x01;

const PMD_FLAG_BYTE1 = {
    ECG_SUPPORTED: 0x1,
    PPG_SUPPORTED: 0x2,
    ACC_SUPPORTED: 0x4,
    PPI_SUPPORTED: 0x8,
    GYRO_SUPPORTED: 0x20,
    MAG_SUPPORTED:  0x40
};

const PMD_FLAG_BYTE2 = {
    SDK_MODE_SUPPORTED: 0x02,
    LOCATION_SUPPORTED: 0x04,
    PRESSURE_SUPPORTED: 0x08,
    TEMPERATURE_SUPPORTED: 0x10,
    OFFLINE_RECORDING_SUPPORTED: 0x20,
    OFFLINE_HR_SUPPORTED: 0x40
};


export {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_CHARACTERISTICS,
    PFC_SERVICE,
    POLAR_UUID1,
    POLAR_UUID2,
    POLAR_RESPONSE_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    MEASUREMENT_STATUS,
    SETTING_TYPE,
    SETTING_TYPE_NAME,
    SETTING_TYPE_LENGTH,
    SETTING_LENGTH,
    PMD_FLAG_BYTE1,
    PMD_FLAG_BYTE2,
    POLAR_NAMES,
    OP_CODE,
    SETTING_VALUES,
    ACC_FRAMETYPE,
    ECG_FRAMETYPE,
    CONTROL_POINT_RESPONSE_TYPE,
    POLAR_MANUFACTURER_IDS
};
