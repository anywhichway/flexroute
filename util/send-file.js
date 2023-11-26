import {promises as fs} from "fs";
import WebSocket from "ws";
import path from "path";
import contentTypes from "./content-types.js";

function toArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return arrayBuffer;
}
async function sendFile(pathname,{mangle=true}={}) {
    pathname = path.normalize(pathname.replace(/\\/g,"/"));
    const headers = {},
        options = {};
    try {
        Object.entries(contentTypes).forEach(([key, {encoding,type}]) => {
            if(pathname.endsWith(key)) {
                headers["content-type"] = type;
                if(encoding) options.encoding = encoding;
            }
        });
        const content = await fs.readFile(pathname,options),
            type = typeof content;
        if(this instanceof WebSocket) {
            const body = type === "string" ? content : toArrayBuffer(content);
            this.send(JSON.stringify({headers,body:content})); // not correct, need to handle not string stuff
            return;
        }
        this.setHeaders(new Headers(headers));
        if(type === "string") this.end(content)
        else this.end(toArrayBuffer(data));
    } catch(e) {
        //console.log(e)
        if(e.code==="ENOENT") new Response("Not Found",{statuse:404});
        return new Response("Server Error", {status:500,body:e.code}); //pathname+" "+e+""
    }
}

export {sendFile,sendFile as default};