import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/node.js";
import sse from "../middleware/server/sse.js";
import {stream} from "../util/stream-response.js";
import createFlexServer from "../util/create-flex-server.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/hello/:name", (req,res) => {
    res.end(`hello ${req.params.name}`);
    return res;
})
flexServer.get("/sse", sse((req,res) => {
    return setInterval(() => {
        res.send(`${new Date()}`);
    }, 1000)
}))


flexServer.delete("/", (req,res) => {
    res.end("goodbye");
    return res;
})

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/hello/joe`);
    console.log(await response.text());
    response = await fetch(`http://${host}:${port}/`,{method:"DELETE"});
    console.log(await response.text());
    response = await fetch(`http://${host}:${port}/sse`);
    stream.call(response,console.log);
});

