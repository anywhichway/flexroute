import * as process from "node:process";

const useStatic = (path) => (req,res) => {
    const pathname = req.url;
    if(path==="/") res.sendFile(process.cwd() + pathname)
    else res.sendFile(process.cwd() + path + pathname);
    return;
}

export {useStatic, useStatic as default}