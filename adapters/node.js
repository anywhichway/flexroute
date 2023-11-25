const node =(router) => {
    return async (req,res) => router.handle(req,res);
};

export {node,node as default};