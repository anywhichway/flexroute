import {TextDecoder} from "util";

const decoder = new TextDecoder();

const streamResponse= async function(response,callback)  {
    const reader = response.body.getReader();
    do {
        const {done,value} = await reader.read();
        if(done) break;
        callback(decoder.decode(value))
    } while(true);
}

export {streamResponse,streamResponse as default}