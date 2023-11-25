const browser = (router) => {
        return async (req) => {
            if(typeof(req)==="string") {
                if(req[0]==="#") {
                    const el = document.getElementById(req.substring(1));
                    if (el) {
                        if (el.tagName === "TEMPLATE") {
                            const content = el.innerHTML;
                            return new Response(content, {headers: {"content-type": "text/html"}});
                        }
                        el.scrollIntoView();
                        return;
                    }
                    return;
                }
                req = new Request(req);
            }
            return router.fetch(req).then((value) => {
                if(value instanceof Request) return window.fetch(value);
                return value;
            })
        }
    };


export {browser,browser as default};