import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import createFlexServer from "../util/create-flex-server.js";
import adapter from "../adapters/whatwg.js";
import useStatic from "../middleware/server/use-static.js";
import sendFile from "../util/send-file.js";

const flexServer = createFlexServer(flexroute(),adapter,{methods:{response:{sendFile}}})
flexServer.get("/*", useStatic("/.."));

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host, () => {
    console.log(`http server listening on port ${port}`);
});

flexServer.withSockets(httpServer,{host,port,callback: () => {
    console.log(`ws server listening on port ${port}`);
}});

