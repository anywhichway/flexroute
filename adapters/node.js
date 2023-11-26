import sendFile from "../util/send-file.js"
let prototyped;
const node =(router,{methods={}}={}) => {
    return async (req,res) => {
        if(!prototyped) {
            prototyped = true;
            let proto = Object.getPrototypeOf(req);
            Object.assign(proto, methods.request);
            proto = Object.getPrototypeOf(res);
            Object.assign(proto, methods.response);
        }
        req.rawResponse = res;
        Object.assign(req,methods.request);
        Object.assign(res,methods.response);
        res.sendFile = sendFile
        return router.handle(req,res);
    }
};

export {node,node as default};