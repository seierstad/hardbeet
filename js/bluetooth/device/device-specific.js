
    const [serviceDescriptors] = useState([
        /*
        {
            id: HEART_RATE_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        },*/ {
            id: USER_DATA_SERVICE_UUID,
            connectFn: logService,
            errorFn: serviceError
        },
        {
            id: BATTERY_SERVICE_UUID,
            connectFn: log,
            errorFn: logError
        }, {
            id: DEVICE_INFORMATION_SERVICE_UUID,
            connectFn: log,
            errorFn: logError
        },
        ...additionalServices
    ]);
