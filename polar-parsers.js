import {
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
} from "./polar-codes.js";

function parseFeatureReadResponse (data) {

    const result = {};
    const datatype = data.getUint8(0);
    if (datatype !== CONTROL_POINT_RESPONSE_TYPE.FEATURE_READ) {
        return result;
    }

    const flags = data.getUint8(1);
    result.ecg= !!(flags & PMD_FLAG.ECG_SUPPORTED);
    result.ppg = !!(flags & PMD_FLAG.PPG_SUPPORTED);
    result.acc = !!(flags & PMD_FLAG.ACC_SUPPORTED);
    result.ppi = !!(flags & PMD_FLAG.PPI_SUPPORTED);
    result.gyro = !!(flags & PMD_FLAG.GYRO_SUPPORTED);
    result.mag = !!(flags & PMD_FLAG.MAG_SUPPORTED);
    return result;
}



function parseControlPointResponse (data) {
    let i = 0;
    const result = {};
    const datatype = data.getUint8(i++);
    console.log("parse control point response!!!!");
    if (datatype !== CONTROL_POINT_RESPONSE_TYPE.MEASUREMENT_CONTROL) {
        console.log("not control point response?!?");
        return result;
    }

    const op_code = data.getUint8(i++);
    switch (op_code) {
        case  OP_CODE.GET_MEASUREMENT_SETTINGS:
            result.type = "parameterMap";
            break;
        case  OP_CODE.START_MEASUREMENT:
            result.type = "startStream";
            break;
        case  OP_CODE.STOP_MEASUREMENT:
            result.type = "stopStream";
            break;
    }


    const measurementType = {};
    result[MEASUREMENT_NAME[data.getUint8(i++)]] = measurementType;

    while (i < data.byteLength) {
        const setting = {
            values: []
        };
        const settingCode = data.getUint8(i++);
        switch (settingCode) {
            case SETTING_TYPE.SAMPLE_RATE:
                setting.unit = "Hz";
                break;
            case SETTING_TYPE.RESOLUTION:
                setting.unit = "bits";
                break;
            case SETTING_TYPE.RANGE:
                setting.unit = "G";
                break;
            case SETTING_TYPE.CHANNELS:
                setting.unit = "";
                break;

        }
        measurementType[SETTING_TYPE_NAME[settingCode]] = setting;
        const length = data.getUint8(i++);

        for (let j = i + length; i < j; i += 2) {
            const key = [data.getUint8(i)];

            if (i + 1 < data.byteLength) {
                // number of channels is coded with one byte only
                key.push(data.getUint8(i + 1));
            }

            const lookupValue = key.reduce((acc, curr) => acc << 8 | curr);
            const value = SETTING_VALUES[settingCode][lookupValue];
            setting.values.push({[value]: key});
        }

    }

    console.log({result});
    return result;
}



function parseECGData (data, settings = {}) {
    const {
        channels = 1,
        resolution = 14
    } = settings;

    let i = 0;
    const frameType = data.getUint8(i++);
    const result = [];
    const metadata = {};

    switch (frameType) {
        case ECG_FRAMETYPE.RES14:
            const shift = 32 - resolution;
            for ( ; i < data.byteLength; i += 3) {
                result.push({
                    [(((data.getUint8(i + 2) << 16) | data.getUint8(i + 1) << 8 | data.getUint8(i)) << shift) >> shift]:
                    [data.getUint8(i), data.getUint8(i + 1), data.getUint8(i + 2)]
                });
            }
            break;

        default:
            console.error("unknown ecg frame type");
            break;
    }
    return {
        ...metadata,
        channels,
        data: result
    };
}



function parsePPGData (data, settings) {
    return {data};
}



function parseAccelerationData (data, settings = {}) {
    const {
        channels = 3
    } = settings;

    let i = 0;
    const frameType = data.getUint8(i++);
    const result = [];
    const metadata = {};
    const accumulatedValues = [];

    switch (frameType) {
        case ACC_FRAMETYPE.RES8:
            metadata.frameType = "8 bit";
            while (i < data.byteLength - 3) {
                accumulatedValues[0] = data.getInt8(i++, true);
                accumulatedValues[1] = data.getInt8(i++, true);
                accumulatedValues[2] = data.getInt8(i++, true);
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.RES16:
            for ( ; i < data.byteLength; i += 6) {
                accumulatedValues[0] = data.getInt16(i, true);
                accumulatedValues[1] = data.getInt16(i + 2, true);
                accumulatedValues[2] = data.getInt16(i + 4, true);
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.RES24:
            for ( ; i < data.byteLength; i += 9) {
                accumulatedValues[0] = data.getInt32(i, true) >> 8;
                accumulatedValues[1] = data.getInt32(i + 3, true) >> 8;
                // TODO: possibly off by one
                accumulatedValues[2] = data.getInt32(i + 6, true) >> 8;
                result.push([...accumulatedValues]);
            }
            break;
        case ACC_FRAMETYPE.DELTA:
            metadata.frameType = "delta";
            metadata.deltaResolutionPrChannel = data.getUint8(i++, true);
            metadata.deltaSampleCount = data.getUint8(i++, true);
            metadata.deltaSampleBytes = Math.ceil(deltaResolutionPrChannel * channels / 8);


            //for (let end = i + deltaSampleBytes * deltaSampleCount; i < end; i += deltaSampleBytes) {
                //accumulatedValues[0] += data.getInt32(i, true) >> (32 - deltaResolutionPrChannel);
                // TODO: channel 1 and 2
                result.push([...accumulatedValues]);
            //}
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
    console.log({originallengde: data.byteLength});
    const timeView = new DataView(data.buffer, 1, 8);
    const time = timeView.getBigUint64(0, true);
    console.log({time, typeCode});
    const {
        ecg = {},
        ppg = {},
        acceleration = {}
    } = measurementSettings;

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
                ...parseECGData(new DataView(data.buffer, 9), ecg)
            };
        case MEASUREMENT_TYPE.PPG:
            return {
                ...metadata,
                ...parsePPGData(new DataView(data.buffer, 9), ppg)
            };
        case MEASUREMENT_TYPE.ACCELERATION:
            return {
                ...metadata,
                ...parseAccelerationData(new DataView(data.buffer, 9), acceleration)
            };
    }

}

export {
    parseMeasurementData,
    parseFeatureReadResponse,
    parseControlPointResponse
};
