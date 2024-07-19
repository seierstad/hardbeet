import {
    POLAR_RESPONSE_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    SETTING_TYPE,
    SETTING_TYPE_NAME,
    SETTING_TYPE_LENGTH,
    PMD_FLAG_BYTE1,
    PMD_FLAG_BYTE2,
    OP_CODE,
    SETTING_VALUES,
    ACC_FRAMETYPE,
    ECG_FRAMETYPE,
    CONTROL_POINT_RESPONSE_TYPE
} from "./constants.js";


const parseFeatureReadResponse = data => {

    const flags1 = data.getUint8(1);
    const flags2 = data.getUint8(2);
    const result = [{
        code: MEASUREMENT_TYPE.ECG,
        supported: !!(flags1 & PMD_FLAG_BYTE1.ECG_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.PPG,
        supported: !!(flags1 & PMD_FLAG_BYTE1.PPG_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.ACCELERATION,
        supported: !!(flags1 & PMD_FLAG_BYTE1.ACC_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.PP_INTERVAL,
        supported: !!(flags1 & PMD_FLAG_BYTE1.PPI_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.GYROSCOPE,
        supported: !!(flags1 & PMD_FLAG_BYTE1.GYRO_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.MAGNETOMETER,
        supported: !!(flags1 & PMD_FLAG_BYTE1.MAG_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.SDK_MODE,
        supported: !!(flags2 & PMD_FLAG_BYTE2.SDK_MODE_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.LOCATION,
        supported: !!(flags2 & PMD_FLAG_BYTE2.LOCATION_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.PRESSURE,
        supported: !!(flags2 & PMD_FLAG_BYTE2.PRESSURE_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.TEMPERATURE,
        supported: !!(flags2 & PMD_FLAG_BYTE2.TEMPERATURE_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.OFFLINE_RECORDING,
        supported: !!(flags2 & PMD_FLAG_BYTE2.OFFLINE_RECORDING_SUPPORTED)
    }, {
        code: MEASUREMENT_TYPE.OFFLINE_HR,
        supported: !!(flags2 & PMD_FLAG_BYTE2.OFFLINE_HR_SUPPORTED)
    }];


    /* just a test if there are bits set with no matching flags...
    const allFlags = (acc, curr) => acc | curr;
    const allByte1Flags = Object.values(PMD_FLAG_BYTE1).reduce(allFlags);
    const allByte2Flags = Object.values(PMD_FLAG_BYTE2).reduce(allFlags);
    const byte1Rest = flags1 & (allByte1Flags ^ 0xff);
    const byte2Rest = flags2 & (allByte2Flags ^ 0xff);


    if (byte1Rest !== 0) {
        console.log(`flere byte 1-flagg: ${Number(byte1Rest).toString(2)}`);
    }
    if (byte2Rest !== 0) {
        console.log(`flere byte 2-flagg: ${Number(byte2Rest).toString(2)}`);
    }
    */

    return result;
};


const parseControlPointResponse = data => {

    const result = {};
    const datatype = data.getUint8(0);

    if (datatype !== CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL) {
        return result;
    }

    const op_code = data.getUint8(1);
    const measurementCode = data.getUint8(2);

    result.measurement = {
        code: measurementCode,
        name: MEASUREMENT_NAME[measurementCode]
    };

    const statusCode = data.getUint8(3);

    result.status = {
        code: statusCode,
        message: POLAR_RESPONSE_CODES[statusCode]
    };
    result.error = (POLAR_RESPONSE_CODES[statusCode] !== "SUCCESS");


    const moreFrames = data.byteLength > 4 && data.getUint8(4);

    if (moreFrames) {
        result.moreFrames = moreFrames;
    }

    switch (op_code) {
        case OP_CODE.GET_MEASUREMENT_SETTINGS:
            result.operation = {
                name: "parameterMap",
                code: op_code
            };
            break;

        case OP_CODE.START_MEASUREMENT:
            result.operation = {
                name: "startStream",
                code: op_code
            };
            if (data.byteLength > 5) {
                console.log("more bytes: ", [...new Uint8Array(data.buffer, 5)]);
                return result;
            }
            break;

        case OP_CODE.STOP_MEASUREMENT:
            result.operation = {
                name: "stopStream",
                code: op_code
            };
            if (data.byteLength > 5) {
                console.log("more bytes: ", [...new Uint8Array(data.buffer, 5)]);
            }
            return result;

        case OP_CODE.GET_MEASUREMENT_STATUS:
            result.operation = {
                name: "getStatus",
                code: op_code
            };
            return result;

        default:
            throw new Error(`unknown operation: 0x${Number(op_code).toString(16).padStart(2, "0")}`);
    }


    const parameters = [];
    result.parameters = parameters;

    let i = 5;
    while (i < data.byteLength) {
        const parameterCode = data.getUint8(i);
        i += 1;

        const parameter = {
            name: SETTING_TYPE_NAME[parameterCode],
            values: [],
            code: parameterCode
        };
        switch (parameterCode) {
            case SETTING_TYPE.SAMPLE_RATE:
                parameter.unit = "Hz";
                break;

            case SETTING_TYPE.RESOLUTION:
                parameter.unit = "bits";
                break;

            case SETTING_TYPE.RANGE:
                parameter.unit = "G";
                break;

            case SETTING_TYPE.CHANNELS:
                parameter.unit = "";
                break;

            default:
                throw new Error(`unknown parameter: ${Number(parameterCode).toString(16).padStart(2, "0")}`);
        }

        parameters.push(parameter);
        const valueCount = data.getUint8(i);
        i += 1;
        const valueLength = SETTING_TYPE_LENGTH[parameterCode];

        for (let j = i + valueCount * valueLength; i < j; i += valueLength) {
            let value;
            switch (valueLength) {
                case 1:
                    value = [data.getUint8(i)];
                    break;
                case 2:
                    value = [data.getUint16(i, true)];
                    break;
            }
            const label = SETTING_VALUES[parameterCode][value];
            parameter.values.push({label, value});
        }

    }

    return result;
};


const parseECGData = (data, settings = {}) => {
    const {
        channels = 1,
        resolution = 14
    } = settings;

    let i = 0;
    const frameType = data.getUint8(i);
    i += 1;
    const result = [];
    const metadata = {};

    switch (frameType) {
        case ECG_FRAMETYPE.RES14:


            // read 24 bits as 3 unsigned bytes, concatinate, shift to
            const shift = 32 - resolution;
            for (; i < data.byteLength; i += 3) {
                // concatinate 3 unsigned bytes, convert to 32 bit signed and scale to -1...1
                result.push(
                    //[((data.getUint8(i + 2) << 16) | data.getUint8(i + 1) << 8 | data.getUint8(i))]

                    [(
                        (
                            (
                                (data.getUint8(i + 2) << 16)
                                | data.getUint8(i + 1) << 8
                                | data.getUint8(i)
                            )
                            << shift
                        )
                        >> shift
                    ) / (1 << (resolution - 1))
                    ]
                );
            }
            break;


        default:
            // "unknown ecg frame type"
            break;
    }
    return {
        ...metadata,
        channels,
        data: result
    };
};


const parsePPGData = (data, settings) => ({data, settings});


const totalMagnitudeAdder = values => [Math.sqrt(values.reduce((acc, curr) => acc + curr * curr, 0)), ...values];

const parseAccelerationData = (data, settings = {}) => {
    const {
        channels = 4
    } = settings;

    let i = 0;
    const frameType = data.getUint8(i);
    i += 1;
    const result = [];
    const metadata = {};
    const accumulatedValues = [];

    switch (frameType) {
        case ACC_FRAMETYPE.RES8:
            metadata.frameType = "8 bit";
            while (i < data.byteLength - 3) {
                accumulatedValues[0] = data.getInt8(i, true) / 128;
                accumulatedValues[1] = data.getInt8(i + 1, true) / 128;
                accumulatedValues[2] = data.getInt8(i + 2, true) / 128;
                i += 3;
                result.push([...totalMagnitudeAdder(accumulatedValues)]);
            }
            break;

        case ACC_FRAMETYPE.RES16:
            for (; i < data.byteLength; i += 6) {
                accumulatedValues[0] = data.getInt16(i, true) / (1 << 15);
                accumulatedValues[1] = data.getInt16(i + 2, true) / (1 << 15);
                accumulatedValues[2] = data.getInt16(i + 4, true) / (1 << 15);
                result.push([...totalMagnitudeAdder(accumulatedValues)]);
            }
            break;

        case ACC_FRAMETYPE.RES24:
            for (; i < data.byteLength; i += 9) {
                accumulatedValues[0] = data.getInt32(i, true) >> 8;
                accumulatedValues[1] = data.getInt32(i + 3, true) >> 8;
                // TODO: possibly off by one
                accumulatedValues[2] = data.getInt32(i + 6, true) >> 8;
                result.push([...totalMagnitudeAdder(accumulatedValues)]);
            }
            break;

        case ACC_FRAMETYPE.DELTA:
            metadata.frameType = "delta";
            metadata.deltaResolutionPrChannel = data.getUint8(i, true);
            i += 1;
            metadata.deltaSampleCount = data.getUint8(i, true);
            i += 1;
            metadata.deltaSampleBytes = Math.ceil(metadata.deltaResolutionPrChannel * channels / 8);

            result.push([...totalMagnitudeAdder(accumulatedValues)]);
            break;

        default:
            throw new Error("unknown acc frame type");
    }

    return {
        ...metadata,
        channels,
        data: result
    };
};

const MEASUREMENT_DATA_START = 9;
const parseMeasurementData = (data, measurementSettings) => {
    const typeCode = data.getUint8(0);
    const timeView = new DataView(data.buffer, 1, 8);
    const time = timeView.getBigUint64(0, true);

    const metadata = {
        type: {
            code: typeCode,
            name: MEASUREMENT_NAME[typeCode]
        },
        time
    };

    switch (typeCode) {
        case MEASUREMENT_TYPE.ECG:
            return {
                ...metadata,
                ...parseECGData(new DataView(data.buffer, MEASUREMENT_DATA_START), measurementSettings)
            };
        case MEASUREMENT_TYPE.PPG:
            return {
                ...metadata,
                ...parsePPGData(new DataView(data.buffer, MEASUREMENT_DATA_START), measurementSettings)
            };
        case MEASUREMENT_TYPE.ACCELERATION:
            return {
                ...metadata,
                ...parseAccelerationData(new DataView(data.buffer, MEASUREMENT_DATA_START), measurementSettings)
            };
    }

};

export {
    parseMeasurementData,
    parseFeatureReadResponse,
    parseControlPointResponse
};
