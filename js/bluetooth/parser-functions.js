const byteArray2Array = byteArray => {
    const result = [];
    for (let i = 0; i < byteArray.byteLength; i += 1) {
        result.push(byteArray.getUint8(i));
    }
    return result;
};

const byteArray2String = byteArray => String.fromCharCode(...byteArray2Array(byteArray));

const string2hex = str => Array.from(new TextEncoder().encode(str)).map(u8 => Number(u8).toString(16));


export {
    byteArray2Array,
    byteArray2String,
    string2hex
};
