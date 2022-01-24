const POLAR_MEASUREMENT_DATA_SERVICE_UUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";

const POLAR_UUID1 = 0xFEEE;
const POLAR_UUID2 = 0xFEFE;

const POLAR_MANUFACTURER_IDS = [0x006B, 0x00D1];

const POLAR_H10_UNDOCUMENTED_SERVICE = "6217ff4b-fb31-1140-ad5a-a45545d7ecf3";

const POLAR_NAMES = {
    0xFEEE: "Polar proprietary UUID 1",
    0xFEFE: "Polar proprietary UUID 2",
    "fb005c80-02e7-f387-1cad-8acd2d8df0c8": "Polar Measurement Data Service",
    "fb005c81-02e7-f387-1cad-8acd2d8df0c8": "Polar Measurement Data Control Point",
    "fb005c82-02e7-f387-1cad-8acd2d8df0c8": "Polar Measurement Data MTU Characteristic",
    "6217ff4b-fb31-1140-ad5a-a45545d7ecf3": "Polar H10 undocumented service",
    "fb005c51-02e7-f387-1cad-8acd2d8df0c8": "Polar undocumented characteristic 1",
    "fb005c52-02e7-f387-1cad-8acd2d8df0c8": "Polar undocumented characteristic 2",
    "fb005c53-02e7-f387-1cad-8acd2d8df0c8": "Polar undocumented characteristic 3",
    "6217ff4c-c8ec-b1fb-1380-3ad986708e2d": "Polar undocumented characteristic 4",
    "6217ff4d-91bb-91d0-7e2a-7cd3bda8a1f3": "Polar undocumented characteristic 5"
};

const POLAR_CHARACTERISTICS = {
    UNDOCUMENTED_1: "fb005c51-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_2: "fb005c52-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_3: "fb005c53-02e7-f387-1cad-8acd2d8df0c8",
    UNDOCUMENTED_4: "6217ff4c-c8ec-b1fb-1380-3ad986708e2d",
    UNDOCUMENTED_5: "6217ff4d-91bb-91d0-7e2a-7cd3bda8a1f3",
    PMD_CONTROL_POINT: "fb005c81-02e7-f387-1cad-8acd2d8df0c8",
    PMD_DATA_MTU: "fb005c82-02e7-f387-1cad-8acd2d8df0c8"
};

const POLAR_ERROR_CODES = {
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
    13: "ERROR DEVICE IN CHARGER" // Response when device is in charger and doesn't support requested command in the current state.
    //     14 - 255 "RFU" // Reserved for Future Usage.
};

const OP_CODE = {
    GET_MEASUREMENT_SETTINGS: 0x01,
    START_MEASUREMENT: 0x02,
    STOP_MEASUREMENT: 0x03
};

const CONTROL_POINT_RESPONSE_TYPE = {
    FEATURE_READ: 0x0F,
    MEASUREMENT_CONTROL: 0xF0
};

const MEASUREMENT_TYPE = {
    "ECG": 0x00,           // Volt (V)
    "PPG": 0x01,
    "ACCELERATION": 0x02,  // Force per unit mass (g)
    "PP_INTERVAL": 0x03,   // Second (s)
    "GYROSCOPE": 0x05,     // Degrees per second (dps)
    "MAGNETOMETER": 0x06   // Gauss (G)
    //4, 7-255 Reserved for Future Use
};

const MEASUREMENT_NAME = {
    0x00: "ecg",
    0x01: "ppg",
    0x02: "acceleration",
    0x03: "ppInterval",
    0x04: "gyroscope",
    0x05: "magnetometer"
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
    0x0E00: 14,
    0x1000: 16,
    0x1600: 22
};

const RESOLUTION_CODE = {
    14: [0x0E, 0x00],
    16: [0x10, 0x00],
    22: [0x16, 0x00]
};

const SAMPLE_RATE = {
    0x1900:  25,
    0x3200:  50,
    0x3400:  52,
    0x6400: 100,
    0x8200: 130,
    0xC800: 200
};

const SAMPLE_RATE_CODE = {
    25: [0x19, 0x00],
    50: [0x32, 0x00],
    52: [0x34, 0x00],
    100: [0x64, 0x00],
    130: [0x82, 0x00],
    200: [0xC8, 0x00]
}

const RANGE = {
    0x0200: 2,
    0x0400: 4,
    0x0800: 8
};

const RANGE_CODE = {
    2: [0x02, 0x00],
    4: [0x04, 0x00],
    8: [0x08, 0x00]
};

const CHANNELS = {
    0x03: 3
};

const SETTING_TYPE = {
    SAMPLE_RATE: 0x00,
    RESOLUTION: 0x01,
    RANGE: 0x02,
    CHANNELS: 0x04
};


const SETTING_VALUES = {
    [SETTING_TYPE.SAMPLE_RATE]: SAMPLE_RATE,
    [SETTING_TYPE.RESOLUTION]: RESOLUTION,
    [SETTING_TYPE.RANGE]: RANGE,
    [SETTING_TYPE.CHANNELS]: CHANNELS
};

const SETTING_TYPE_NAME = {
    0x00: "samplerate",
    0x01: "resolution",
    0x02: "range",
    0x03: "channels"
};

const SETTING_LENGTH = 0x01;

const CONTROL_POINT_REQUEST = {
    GET_ACC_STREAM_SETTINGS: Uint8Array.of(OP_CODE.GET_MEASUREMENT_SETTINGS, MEASUREMENT_TYPE.ACCELERATION),
    GET_ECG_STREAM_SETTINGS: Uint8Array.of(OP_CODE.GET_MEASUREMENT_SETTINGS, MEASUREMENT_TYPE.ECG),
    ECG_START: Uint8Array.of(OP_CODE.START_MEASUREMENT, MEASUREMENT_TYPE.ECG, SETTING_TYPE.SAMPLE_RATE, SETTING_LENGTH, ...SAMPLE_RATE_CODE[130], SETTING_TYPE.RESOLUTION, SETTING_LENGTH, ...RESOLUTION_CODE[14]),
    ECG_STOP: Uint8Array.of(OP_CODE.STOP_MEASUREMENT, MEASUREMENT_TYPE.ECG),
    ACC_START: Uint8Array.of(OP_CODE.START_MEASUREMENT, MEASUREMENT_TYPE.ACCELERATION, SETTING_TYPE.RANGE, SETTING_LENGTH, ...RANGE_CODE[8], SETTING_TYPE.SAMPLE_RATE, SETTING_LENGTH, ...SAMPLE_RATE_CODE[200], SETTING_TYPE.RESOLUTION, SETTING_LENGTH, ...RESOLUTION_CODE[16]),
    ACC_STOP: Uint8Array.of(OP_CODE.STOP_MEASUREMENT, MEASUREMENT_TYPE.ACCELERATION)
};

const PMD_FLAG = {
    ECG_SUPPORTED: 0x1,
    PPG_SUPPORTED: 0x2,
    ACC_SUPPORTED: 0x4,
    PPI_SUPPORTED: 0x8,
    GYRO_SUPPORTED: 0x10,
    MAG_SUPPORTED:  0x20
};

export {
    POLAR_MEASUREMENT_DATA_SERVICE_UUID,
    POLAR_CHARACTERISTICS,
    POLAR_H10_UNDOCUMENTED_SERVICE,
    POLAR_UUID1,
    POLAR_UUID2,
    POLAR_ERROR_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    SETTING_TYPE,
    SETTING_TYPE_NAME,
    CONTROL_POINT_REQUEST,
    PMD_FLAG,
    POLAR_NAMES,
    OP_CODE,
    SETTING_VALUES,
    ACC_FRAMETYPE,
    ECG_FRAMETYPE,
    CONTROL_POINT_RESPONSE_TYPE
};
