import process from "node:process";
import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import adapter from "../adapters/express.js";
import sse from "../middleware/server/sse.js";
import createFlexServer from "../util/create-flex-server.js";
import {stream} from "../util/stream-response.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/", (req,res,next) => { res.write("start ")}, (req,res,next) => { return next()}, (req,res,next) => res.write("fail"))
flexServer.get("/", (req,res,next) => {
    res.status(200).end("hello world");
    return res;
})
flexServer.get("/sse", sse((req,res) => {
    return setInterval(() => {
        res.send(`${new Date()}`);
    }, 1000)
}))
flexServer.delete("/", (req,res,next) => {
    res.status(200).end("goodbye");
    return res;
})


const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
    let response = await fetch(`http://${host}:${port}/`);
    console.log(await response.text());
    response = await fetch(`http://${host}:${port}/`,{method:"DELETE"});
    console.log(await response.text());
    response = await fetch(`http://${host}:${port}/sse`);
    stream.call(response,console.log);
});