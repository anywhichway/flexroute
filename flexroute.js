function flexroute(...args) {
    if(!this || typeof this!=="object" || !(this instanceof flexroute)) return new flexroute(...args);
    if(args.length>0) this.push(args);
    return this;
}
flexroute.prototype = [];
flexroute.prototype.constructor = flexroute;
flexroute.prototype.useNext = function() { Object.defineProperty(this,"handleNext",{value:true}); return this; }
flexroute.prototype.use = function(...routes) {
    for(const route of routes) this.push(typeof route[0] === "boolean" ? [() => route[0],...route.slice(1)] : route);
    return this;
}
flexroute.prototype.handle = async function(item,...rest) {
    let result = item;
    for (const route of this) {
        result = item;
        if(route.handle) {
            result = await route.handle(item,...rest);
            if(result == null) continue;
            return result;
        } else if(typeof route === "function") {
            result = await route(item,...rest);
            if(result == null) continue;
            return result;
        } else {
            const [gate, ...steps] = route;
            if(this.handleNext) rest.push(() => { steps.splice(0, steps.length) });
            if (!await test(gate,item, ...rest)) {
                result = undefined;
                continue;
            }
            for (const step of steps) {
                if(step.handle) result = await step.handle(item, ...rest);
                else result = await step(item, ...rest);
                if (result == null) continue;
                return result;
            }
        }
    }
    return result;
}
const test = (gate,item,...rest) => {
    const gtype = typeof gate;
    if(gtype==="function") return gate(item,...rest);
    if(gtype==="object") {
        if(gate instanceof RegExp) return gate.test(item)
        if(typeof gate.handle === "function")  return gate.handle(item);
        if(typeof gate.equals === "function")  return gate.equals(item);
        throw new TypeError(`tests of type "object", must be a RegExp, Request, or have a fetch, route, equal, or toRoute method`);
    }
    return gate===item;
}

export {flexroute,flexroute as default}
