const getHandlers = state => ({
    setStaticTempo: tempo => state.staticTempo.value = parseFloat(tempo),
    setSource: source => state.source.value = source,
    setNumerator: value => state.fraction.numerator.value = parseInt(value, 10),
    setDenominator: value => state.fraction.denominator.value = parseInt(value, 10)
});


export {
    getHandlers
};
