const browser = (router) => {
        const handler = async (req) => {
            if(typeof(req)==="string") {
                if(req[0]==="#") {
                    const el = document.getElementById(req.substring(1));
                    if (el) {
                        if (el.tagName === "TEMPLATE") {
                            const content = el.innerHTML;
                            return new Response(content, {headers: {"content-type": "text/html"}});
                        }
                        el.scrollIntoView();
                        return el;
                    }
                    return;
                }
                const url = new URL(req);
                req = new Request(url.href);
            }
            return router.handle(req).then((value) => {
                if(value instanceof Request) return window.fetch(value);
                return value;
            })
        }
        handler.handle = handler;
        return handler;
    };


export {browser,browser as default};