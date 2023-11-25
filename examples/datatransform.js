import {flexroute} from "../flexroute.js";

const transformer = flexroute().use(
    [(item)=>item.name==null,(item) => { item.name = "Joe"}],
    [(item)=> item.age==null, (item) => { item.age = 21; }],
    [true,(item) => { return item }]
);

console.log(await transformer.handle({name:"Bob"}));
console.log(await transformer.handle({age:30}));
console.log(await transformer.handle({name:"Bob",age:30}));
console.log(await transformer.handle({}));
