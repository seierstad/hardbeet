class Visualizer {
    constructor () {
        this._configured = false;
        this.rootElement = document.createElement("div");
        this.canvas = document.createElement("canvas");
        this.canvas.classList.add("visualizer");
        this.rootElement.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d", {willReadFrequently: true});

        this.drawWaveform = this.drawWaveform.bind(this);
        this.addToBuffer = this.addToBuffer.bind(this);

        this.dpr = 1;


        this.buffer = [];
        this.animationFrameRequest = null;
    }

    configure (config = {}) {
        const {
            zeroLineStyle = "lightgrey",
            plotStyle = ["black", "red", "blue", "green"],
            lineWidth = [3],
            pixelsPrSample = 3,
            channels = 1,
            type: {
                name = ""
            } = {}
        } = config;

        this.name = name;
        this.zeroLineStyle = zeroLineStyle;
        this.plotStyle = plotStyle;
        this.lineWidth = lineWidth;
        this.channelCount = channels;
        this.previousY = new Array(channels);
        this.min = new Array(channels).fill(Number.MAX_VALUE);
        this.max = new Array(channels).fill(Number.MIN_VALUE);
        this.dashOffset = 0;
        this.pixelsPrSample = pixelsPrSample;
        this._configured = true;
    }

    get configured () {
        return !!this._configured;
    }

    getScaledY (value, lineWidth = 1) {
        const pixelHeight = ((-value + 1) / 2) * (this.canvas.height - lineWidth);
        return value > 0 ? Math.floor(pixelHeight) : Math.ceil(pixelHeight);
    }

    horisontalLine (value = 0, start = 0, end = this.canvas.width, lineWidth = 1, strokeStyle = this.plotStyle, lineDash = null) {
        const y = this.getScaledY(value);
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;
        if (lineDash !== null) {
            this.ctx.setLineDash(lineDash);
        }
        this.ctx.beginPath();
        this.ctx.moveTo(start, y);
        this.ctx.lineTo(end, y);
        this.ctx.stroke();
        if (lineDash !== null) {
            this.ctx.setLineDash([]);
        }
    }

    zeroLine (start = 0, end = this.canvas.width) {
        this.horisontalLine(0, start, end, 1, this.zeroLineStyle);
    }

    reset () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.zeroLine();
        this.dashOffset = this.canvas.width;

        if (this.previousY) {
            this.previousY = this.previousY.fill(this.zeroY);
        }
        if (this.min) {
            this.min.fill(Number.MAX_VALUE);
        }
        if (this.max) {
            this.max.fill(Number.MIN_VALUE);
        }
    }

    initializeResolution () {
        // Get the DPR and size of the canvas
        this.dpr = window.devicePixelRatio;
        const rect = this.canvas.getBoundingClientRect();

        // Set the "actual" size of the canvas
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;

        // Set the "drawn" size of the canvas
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.dashOffset = this.canvas.width;
    }


    drawWaveform () {
        const drawData = [...this.buffer];
        this.buffer = [];
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const zeroHeight = this.getScaledY(0);

        const addedWidth = drawData.length * this.pixelsPrSample;
        const keepWidth = width - addedWidth;
        const keepPixels = ctx.getImageData(addedWidth, 0, keepWidth, height);
        ctx.putImageData(keepPixels, 0, 0);
        ctx.clearRect(keepWidth, 0, addedWidth, height);

        // zero line
        this.zeroLine(keepWidth - this.pixelsPrSample);

        for (let c = 0; c < this.channelCount; c += 1) {
            this.previousY[c] = (this.previousY[c] === null) ? zeroHeight : this.previousY[c];
            const {[c]: lineWidth = this.lineWidth[0]} = this.lineWidth;
            const {[c]: strokeStyle = this.plotStyle[0]} = this.plotStyle;

            ctx.beginPath();
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(keepWidth - this.pixelsPrSample, this.previousY[c]);

            // plot line
            for (let i = 0; i < drawData.length; i += 1) {
                const value = drawData[i][c];
                const y = this.getScaledY(value);
                ctx.lineTo(keepWidth + (i * this.pixelsPrSample), y);
                this.previousY[c] = y;
            }
            ctx.stroke();

            // min and max lines:
            for (let i = 0; i < drawData.length; i += 1) {

                const value = drawData[i][c];

                ctx.lineDashOffset = this.dashOffset + i * this.pixelsPrSample;
                if (value < this.min[c]) {
                    this.min[c] = value;
                } else {
                    this.horisontalLine(
                        this.min[c],
                        keepWidth + ((i - 1) * this.pixelsPrSample),
                        keepWidth + (i * this.pixelsPrSample),
                        1,
                        strokeStyle,
                        [this.pixelsPrSample, this.pixelsPrSample * 3]
                    );
                }

                if (value > this.max[c]) {
                    this.max[c] = value;
                } else {
                    this.horisontalLine(
                        this.max[c],
                        keepWidth + ((i - 1) * this.pixelsPrSample),
                        keepWidth + (i * this.pixelsPrSample),
                        1,
                        strokeStyle,
                        [this.pixelsPrSample, this.pixelsPrSample * 3]
                    );
                }

            }
        }

        this.dashOffset += addedWidth;
        this.animationFrameRequest = null;
    }

    addToBuffer (data) {
        this.buffer.push(data);

        if (this.animationFrameRequest === null) {
            this.animationFrameRequest = window.requestAnimationFrame(this.drawWaveform);
        }
    }

    appendData (data, parameters) {
        const {
            samplerate = 100
        } = parameters;
        const interval = 1000 / samplerate;

        data.forEach((d, index) => setTimeout(this.addToBuffer, interval * index, d));
    }
}

export default Visualizer;
