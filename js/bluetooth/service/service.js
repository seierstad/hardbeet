import {html} from "htm/preact";

const Service = ({heading = "service", classNames = [], children = null}) => html`
    <div class=${["service", ...(typeof classNames === "string" ? [classNames] : classNames)].join(" ")}>
        <header><h3>${heading}</h3></header>
        ${children}
    </div>
`;

export default Service;
