/*
sample eventSender
const dateTime = function (req,res) {
    return setInterval(() => {
        res.send(`${new Date()}`);
    },1000);
}
 */
const sse = (eventSender) =>  (req) => {
    const res = req.rawResponse, // add rawResponse
        headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };
    let closed;
    res.on('close', () => {
        clearInterval(interval);
    });
    Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
    });
    res.flushHeaders();
    res.send = (value) => {
        res.write(`${JSON.stringify(value)}`);
    }
    // }
    const interval = eventSender(req,res);
    return res;
}

export {sse,sse as default}