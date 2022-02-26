"use strict";

import {
    POLAR_ERROR_CODES,
    MEASUREMENT_TYPE,
    MEASUREMENT_NAME,
    SETTING_TYPE,
    SETTING_TYPE_NAME,
    PMD_FLAG,
    OP_CODE,
    SETTING_VALUES,
    ACC_FRAMETYPE,
    ECG_FRAMETYPE,
    CONTROL_POINT_RESPONSE_TYPE
} from "./polar-codes.js";

function parseFeatureReadResponse (data) {

    const flags = data.getUint8(1);
    const result = {
        [MEASUREMENT_TYPE.ECG]: {
            supported: !!(flags & PMD_FLAG.ECG_SUPPORTED)
        },
        [MEASUREMENT_TYPE.PPG]: {
            supported: !!(flags & PMD_FLAG.PPG_SUPPORTED)
        },
        [MEASUREMENT_TYPE.ACCELERATION]: {
            supported: !!(flags & PMD_FLAG.ACC_SUPPORTED)
        },
        [MEASUREMENT_TYPE.PP_INTERVAL]: {
            supported: !!(flags & PMD_FLAG.PPI_SUPPORTED)
        },
        [MEASUREMENT_TYPE.GYROSCOPE]: {
            supported: !!(flags & PMD_FLAG.GYRO_SUPPORTED)
        },
        [MEASUREMENT_TYPE.MAGNETOMETER]: {
            supported: !!(flags & PMD_FLAG.MAG_SUPPORTED)
        }
    };

    return result;
}


function parseControlPointResponse (data) {

    let i = 0;
    const result = {};
    const datatype = data.getUint8(i);
    i += 1;

    if (datatype !== CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL) {
        return result;
    }

    const op_code = data.getUint8(i);
    i += 1;
    const measurementCode = data.getUint8(i);
    i += 1;

    result.measurement = {
        code: measurementCode,
        name: MEASUREMENT_NAME[measurementCode]
    };

    const statusCode = data.getUint8(i);
    i += 1;

    result.status = {
        code: statusCode,
        message: POLAR_ERROR_CODES[statusCode]
    };
    result.error = (POLAR_ERROR_CODES[statusCode] !== "SUCCESS");


    const moreFrames = data.getUint8(i);
    i += 1;

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
            if (i >= data.byteLength - 1) {
                return result;
            }
            break;
        case OP_CODE.STOP_MEASUREMENT:
            result.operation = {
                name: "stopStream",
                code: op_code
            };
            return result;
    }


    const parameters = [];
    result.parameters = parameters;


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
                // "unknown parameter"
                break;

        }
        parameters.push(parameter);
        const length = data.getUint8(i);
        i += 1;

        for (let j = i + length * 2; i < j; i += 2) {
            const value = [data.getUint16(i, true)];
            const label = SETTING_VALUES[parameterCode][value];
            parameter.values.push({label, value});
        }

    }

    return result;
}


function parseECGData (data, settings = {}) {
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
}


function parsePPGData (data, settings) {
    return {data, settings};
}


function parseAccelerationData (data, settings = {}) {
    const {
        channels = 3,
        resolution = 16
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
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.RES16:
            for (; i < data.byteLength; i += 6) {
                accumulatedValues[0] = data.getInt16(i, true) / (1 << 15);
                accumulatedValues[1] = data.getInt16(i + 2, true) / (1 << 15);
                accumulatedValues[2] = data.getInt16(i + 4, true) / (1 << 15);
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.RES24:
            for (; i < data.byteLength; i += 9) {
                accumulatedValues[0] = data.getInt32(i, true) >> 8;
                accumulatedValues[1] = data.getInt32(i + 3, true) >> 8;
                // TODO: possibly off by one
                accumulatedValues[2] = data.getInt32(i + 6, true) >> 8;
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.DELTA:
            metadata.frameType = "delta";
            metadata.deltaResolutionPrChannel = data.getUint8(i, true);
            i += 1;
            metadata.deltaSampleCount = data.getUint8(i, true);
            i += 1;
            metadata.deltaSampleBytes = Math.ceil(deltaResolutionPrChannel * channels / 8);

            result.push([...accumulatedValues]);
            break;

        default:
            console.error("unknown acc frame type");
    }

    return {
        ...metadata,
        channels,
        data: result
    };
}


function parseMeasurementData (data, measurementSettings) {
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
                ...parseECGData(new DataView(data.buffer, 9), measurementSettings)
            };
        case MEASUREMENT_TYPE.PPG:
            return {
                ...metadata,
                ...parsePPGData(new DataView(data.buffer, 9), measurementSettings)
            };
        case MEASUREMENT_TYPE.ACCELERATION:
            return {
                ...metadata,
                ...parseAccelerationData(new DataView(data.buffer, 9), measurementSettings)
            };
    }

}

export {
    parseMeasurementData,
    parseFeatureReadResponse,
    parseControlPointResponse
};
