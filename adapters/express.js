let nodeResponsePrototype;
const express = (router) => {
    router.useNext();
    return async (req,res) => {
        if(!nodeResponsePrototype) {
            const proto = nodeResponsePrototype = Object.getPrototypeOf(res);
            proto.get = function(field)  {
                this.getHeader(field);
            }
            proto.json = function(body) {
                this.setHeader("content-type","application/json");
                this.end(JSON.stringify(body));
                return this;
            }
            proto.send = function(body) {
                this.end(body);
                return this;
            }
            proto.set = function(field,value) {
                this.setHeader(field,value);
            }
            proto.status = function(code)  {
                this.statusCode = code;
                return this;
            }
        }
        return router.handle(req,res);
    }
};

export {express,express as default};