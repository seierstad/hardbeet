class PolarFeature {
	constructor (name, parameters = {}, state = {}, startFn = () => console.log("start " + name), stopFn = () => console.log("stop " + name)) {
		this._parameters = {};
		this.parameters = parameters;

		this._state = {};
		this.state = state;

		this.startFn = startFn;
		this.stopFn = stopFn;
		this.rootElement = document.createElement("div");
		const heading = document.createElement("h4");
		heading.innerText = name;
		this.rootElement.appendChild(heading);

		this.startButton = document.createElement("button");
		this.startButton.innerText = "start";
		this.stopButton = document.createElement("button");
		this.stopButton.innerText = "stop";

		this.rootElement.appendChild(this.startButton);
		this.rootElement.appendChild(this.stopButton);
	}


}

export default PolarFeature;
