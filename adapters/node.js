import sendFile from "../util/send-file.js"

const node =(router) => {
    return async (req,res) => {
        res.sendFile = sendFile
        return router.handle(req,res);
    }
};

export {node,node as default};