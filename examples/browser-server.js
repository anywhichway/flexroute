import {createServer} from "node:http";
import {flexroute} from "../flexroute.js";
import createFlexServer from "../util/create-flex-server.js";
import adapter from "../adapters/node.js";
import useStatic from "../middleware/node/use-static.js";

const flexServer = createFlexServer(flexroute(),adapter);
flexServer.get("/*", useStatic("/.."));

const port = 3000,
    host = process.env.HOST || "localhost";
const httpServer = createServer(flexServer);
httpServer.listen(port,host,port, async () => {
    console.log(`http server listening on port ${port}`);
});

