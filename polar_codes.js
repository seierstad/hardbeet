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

const MEASUREMENT_TYPE = {
    "ECG": 0x00,           // Volt (V)
    "PPG": 0x01,
    "ACCELERATION": 0x02,  // Force per unit mass (g)
    "PP_INTERVAL": 0x03,   // Second (s)
    "GYROSCOPE": 0x05,     // Degrees per second (dps)
    "MAGNETOMETER": 0x06   // Gauss (G)
    //4, 7-255 Reserved for Future Use
};

export {
    POLAR_ERROR_CODES,
    MEASUREMENT_TYPE
};
