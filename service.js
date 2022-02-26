"use strict";
import {html} from "./preact-standalone.module.min.js";

const Service = ({heading = "service", children = null}) => (html`
    <div class="service">
        <header><h3>${heading}</h3></header>
        ${children}
    </div>
`);

export default Service;
