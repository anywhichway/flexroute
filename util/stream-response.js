import {TextDecoder} from "util";

const decoder = new TextDecoder();

const streamResponse= async function(callback)  {
    const reader = this.body.getReader();
    do {
        const {done,value} = await reader.read();
        if(done) break;
        callback(decoder.decode(value))
    } while(true);
}

export {streamResponse,streamResponse as stream,streamResponse as default}