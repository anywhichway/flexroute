const contentTypes = {
    ".js": {encoding:"utf8",type:"application/javascript"},
    ".cjs": {encoding:"utf8",type:"application/javascript"},
    ".mjs": {encoding:"utf8",type:"application/javascript"},
    ".css": {encoding:"utf8",type:"text/css"},
    ".html": {encoding:"utf8",type:"text/html"},
    ".md": {encoding:"utf8",type:"text/html"},
    ".json": {encoding:"utf8",type:"application/json"},
    ".svg": {type:"image/svg+xml"},
    ".png": {type:"image/png"},
    ".jpg": {type:"image/jpeg"},
    ".jpeg": {type:"image/jpeg"},
    ".gif": {type:"image/gif"},
    ".ico": {type:"image/x-icon"},
    ".txt": {encoding:"utf8",type:"text/plain"}
}

export {contentTypes, contentTypes as default};