"use strict";

class Service {
    constructor (service, headingText = "service") {
        this.service = service;
        this.rootElement = document.createElement("div");
        this.rootElement.classList.add("service");
        this.header = document.createElement("header");
        const heading = document.createElement("h3");
        heading.innerText = headingText;
        this.header.appendChild(heading);
        this.rootElement.appendChild(this.header);
    }
}

export default Service;
