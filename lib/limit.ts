import {Ratelimit} from "@upstash/ratelimit";
import {Redis} from "@upstash/redis";

let login:Ratelimit|undefined;
let contact:Ratelimit|undefined;

function redisClient(){
  const url=process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
  if(!url||!token)throw new Error("Upstash Redis environment variables are missing");
  return new Redis({url,token});
}

function limiter(kind:"login"|"contact"){
  if(kind==="login")return login??=new Ratelimit({redis:redisClient(),limiter:Ratelimit.slidingWindow(5,"15 m"),prefix:"av:login"});
  return contact??=new Ratelimit({redis:redisClient(),limiter:Ratelimit.slidingWindow(5,"1 h"),prefix:"av:contact"});
}

export async function allowed(req:any,kind:"login"|"contact"){
  const ip=String(req.headers["x-real-ip"]||req.headers["x-forwarded-for"]||"unknown").split(",")[0].trim();
  return (await limiter(kind).limit(ip)).success;
}
