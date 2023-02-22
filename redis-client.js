/**
 *  Redis Client
 * 
 *  Notes
 * 
 *      docker run -p 6379:6379 -it redis/redis-stack-server:latest
 *      npm install redis
 * 
 */

import { createClient } from 'redis';

let key = process.env.TEST_KEY || 'my-key';
let store_this_value = process.env.TEST_KEY_VALUE || `this is my-key's stored value`;

// Connect to local REDIS if REDIS_HOST is not defined
//
let params = process.env.REDIS_HOST !== undefined ? {
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
} : {};

async function redisGetValue(key, rresolve, rreject) {

    let redis_html = ``;

    console.log(`==> Reading key ${key} from REDIS`);
    redis_html += `<br/>REDIS CLIENT<br/><br/>`;

    try {

        const client = createClient(params);

        client.on('error', err => console.log('Redis Client Error', err));

        redis_html += `&nbsp;&nbsp;REDIS.client.connect()<br/>`;
        await client.connect();

        console.log(`set  key: ${key}'s value: "${store_this_value}"`);
        redis_html += `&nbsp;&nbsp;REDIS.client.set("${key}", "${store_this_value}")<br/>`;
        await client.set(key, store_this_value);

        console.log(`getting value for key: ${key}`);
        
        let value = await client.get(key);
        console.log(`REDIS returned that key ${key}'s value is "${value}"`);
        redis_html += `&nbsp;&nbsp;REDIS.client.get('${key}') returned: "${store_this_value}"<br/>`;

        redis_html += `&nbsp;&nbsp;REDIS.client.disconnect()<br/><br/>`;
        await client.disconnect();

        rresolve(redis_html);

    }
    catch (err) {

        console.error(err.message);
        return (`${dynamo_html}<br style="color:red;">Exception:<br/>${err.message}<br/>`);

    }

}

export async function redisKeyValueGet(key, rresolve, rreject) {

    await new Promise((resolve, reject) => {
        redisGetValue(key, rresolve, rreject);
    })
        .then((html_response) => {
            res.send(html_response);
        })

}
