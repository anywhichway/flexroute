import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/whatwg.js";
import sse from "../middleware/whatwg/sse.js";
import streamResponse from "../util/stream-response.js";
import createFlexServer from "../util/create-flex-server.js";
import WebSocket from "ws";
import {TextDecoder, TextEncoder} from "util";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/hello/:name", (req) => {
    return new Response(`hello ${req.params.name}`);
})

flexServer.get("/sse", sse((req,res) => {
        return setInterval(() => {
            res.send(`${new Date()}`);
        }, 1000)
}))

flexServer.get("/json/:name", (req,res) => {
    return {"hello":req.params.name}
})


flexServer.delete("/", (req) => {
   return new Response("goodbye");
})

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
flexServer.withSockets(httpServer,{host,port});
const decoder = new TextDecoder();
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/hello/joe`);
    console.log(await response.text());
    response = await flexServer(new Request(`http://${host}:${port}/json/peter`)).then((json) => new Response(JSON.stringify(json)));
    console.log(await response.json());
    response = await flexServer(`http://${host}:${port}/json/paul`).then((json) => new Response(JSON.stringify(json)));
    console.log(await response.json());
    response = await flexServer.handle(`http://${host}:${port}/json/mary`).then((json) => new Response(JSON.stringify(json)));
    console.log(await response.json());
    response = await fetch(`http://${host}:${port}/`,{method:"DELETE"});
    console.log(await response.text());
    response = await fetch(`http://${host}:${port}/sse`);
    streamResponse(response,console.log);
    const ws = new WebSocket(`ws://${host}:${port}`);
    ws.on("open",async () => {
        ws.on("message",(message) => {
            console.log(decoder.decode(message));
        });
        ws.send(JSON.stringify({url:"/",method:"GET"}));
        const response = await fetch(`ws://${host}:${port}/`);
        console.log(await response.text());
    });

});