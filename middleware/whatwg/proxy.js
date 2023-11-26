const proxy = ({target,targets=[target],strategy=proxy.SERIAL}) => {
    const targetURL = new URL(target);
    return async (req) => {
        const url = req.URL || new URL(req.url);
        let oldHost;
        if(url.host!==targetURL.host || targetURL.pathname!=="/") {
            oldHost = url.host;
            const newURL = new URL(targetURL.href);
            newURL.pathname = newURL.pathname==="/" ? url.pathname : newURL.pathname + url.pathname;
            Object.defineProperty(req,"url",{value:newURL.href});
        }
       if(strategy===proxy.SERIAL) {
           let res;
           for(const target of targets) {
               res = await fetch(req);
               if (res.ok) return res;
           }
           return res;
       } else if(strategy===proxy.RACE) {
           const promises = targets.map(target => fetch(req))
           let res = await Promise.race(promise);
           if(res.ok) return res;
           res = await Promise.all(promises).then(responses => responses.find(res => res.ok));
           if(res) return res;
           return await Promise.all(promises).then(responses => responses[responses.length-1]);
       }
    }
}
proxy.SERIAL = 1;
proxy.RACE = 2;

export {proxy,proxy as default};