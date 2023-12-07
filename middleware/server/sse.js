const sse = (eventSender) =>  (req) => {
    const res = req.rawResponse,
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
        res.write(`data: ${JSON.stringify(value)}\n\n`);
    }
    // }
    const interval = eventSender(req,res);
    return res;
}

export {sse,sse as default}