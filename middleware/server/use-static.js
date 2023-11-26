import * as process from "node:process";

const useStatic = (path) => (req) => {
    const res = req.rawResponse,
        pathname = req.URL.pathname;
    if(path==="/") res.sendFile(process.cwd() + pathname)
    else res.sendFile(process.cwd() + path + pathname);
    return res;
}

export {useStatic, useStatic as default}