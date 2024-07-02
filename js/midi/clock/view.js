import {useState, useEffect} from "preact/hooks";
import {html} from "htm/preact";

import {Clock} from "./clock.js";
import {STATIC_TEMPO_MIN, STATIC_TEMPO_MAX} from "./constants.js";


const ClockView = (props = {}) => {

    const {
        port,
        state,
        handlers
    } = props;

    const {
        staticTempo
    } = state;

    const {
        setStaticTempo
    } = handlers;

    const [clock] = useState(new Clock(port));
    const [clockRunning, setClockRunning] = useState(false);
    const [clockSource, setClockSource] = useState("static");
    const [numerator] = useState(1);
    const [denominator] = useState(1);

    const clockStartHandler = () => {
        setClockRunning(true);
    };

    const clockStopHandler = () => {
        setClockRunning(false);
    };

    const numeratorHandler = (event) => {
        const value = parseInt(event.target.value, 10);
        //setNumerator(value);
        clock.numerator = value;
    };

    const denominatorHandler = (event) => {
        clock.denominator = parseInt(event.target.value, 10);
    };

    const clockSourceHandler = (event) => {
        setClockSource(event.target.value);
    };

    const staticTempoHandler = (event) => {
        setStaticTempo(parseInt(event.target.value, 10));
    };

    useEffect(() => {
        clock.source = clockSource;
    }, [clockSource]);

    useEffect(() => {
        if (clockRunning) {
            clock.start();
        } else if (clock.running) {
            clock.stop();
        }
    }, [clockRunning]);

    useEffect(() => {
        clock.staticTempo = staticTempo.value;
    }, [staticTempo.value]);


    return html`
        <div class="midi-clock">
            <h5>clock</h5>
            <button disabled=${!!clockRunning} onClick=${clockStartHandler}>start</button>
            <button disabled=${!clockRunning} onClick=${clockStopHandler}>stop</button>

            <div>
                <label>
                    <input
                        checked=${clockSource === "static"}
                        type="radio"
                        name="clock-source"
                        value="static"
                        onClick=${clockSourceHandler}
                    />
                    <span class="label-text">static</span>
                </label>
                <input
                    type="range"
                    min=${STATIC_TEMPO_MIN}
                    max=${STATIC_TEMPO_MAX}
                    value=${staticTempo}
                    step="0.1"
                    onInput=${staticTempoHandler}
                />
                <span class="static-tempo-display">${staticTempo}</span>
            </div>

            <div>
                <label>
                    <input
                        checked=${clockSource === "heart-rate"}
                        type="radio"
                        name="clock-source"
                        value="heart-rate"
                        onClick=${clockSourceHandler}
                    />
                    <span class="label-text">heart-rate</span>
                </label>
                <input
                    type="number"
                    min="1"
                    max="12"
                    step="1"
                    size="2"
                    value=${numerator}
                    onChange=${numeratorHandler}
                />
                <input
                    type="number"
                    min="1"
                    max="12"
                    step="1"
                    size="2"
                    value=${denominator}
                    onChange=${denominatorHandler}
                />
                (${numerator} / ${denominator})
            </div>
        </div>
    `;
};


export {
    ClockView
};
