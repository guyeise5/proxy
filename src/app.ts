import express from 'express';
import proxy from 'express-http-proxy'
import bodyParser from "body-parser";

import util from "util";

const app = express();
const port = Number(process.env.PORT) || 15000;
const host = process.env.PROXY_HOST
const https = process.env.PROXY_HTTPS !== "false"
const timeout = Number(process.env.PROXY_TIMEOUT) || undefined
const overrideHost = process.env.PROXY_OVERRIDE_HOST

const printHelp = () => {
    console.log(`
========= PROXY =========
PROXY_HOST - (required) - the host to pass requests to.
PROXY_HTTPS - Should the proxy use https. Default true
PORT - the port that the proxy listens on. (default 15000)
PROXY_OVERRIDE_HOST - override the host to proxy.
PROXY_TIMEOUT - timeout from the origin (default infinity)  
==========================
    `)
}

if (!host) {
    console.error("env PROXY_HOST in required")
    printHelp()
    process.exit(1)
}

if (process.argv.includes("--help")) {
    printHelp()
    process.exit(0)
}
app.use(bodyParser.json())
app.use((req, res, next) => {
    const oldWrite = res.write
    const oldEnd = res.end;

    const chunks = [];

    res.write = function (chunk) {
        chunks.push(chunk);

        return oldWrite.apply(res, arguments);
    };

    // @ts-ignore
    res.end = function (chunk) {
        if (chunk)
            chunks.push(chunk);

        const newChunks = chunks.map(c =>
            typeof c === 'string' ? Buffer.from(c) : c
        )
        // @ts-ignore
        res.body = Buffer.concat(newChunks).toString('utf-8')

        oldEnd.apply(res, arguments);
    };

    next();
});


let seq = 0
app.use("*", (req, res, next) => {
    seq = seq + 1
    const startTime = new Date().getTime()
    const body = req.body
    const request = {
        ip: req.ip,
        path: req.originalUrl,
        headers: req.headers,
        method: req.method,
        body: body
    };

    res.on('finish', () => {
        const endTime = new Date().getTime()
        // @ts-ignore
        // @ts-ignore
        console.log(util.inspect({
            rtt: endTime - startTime,
            seq: seq,
            request: request,
            response: {
                status: res.statusCode,
                headers: Object.fromEntries(Object.entries(res.getHeaders())),
                //@ts-ignore
                body: res.body
            }
        }, {showHidden: false, depth: null, colors: true}))
    })
    next()
})
app.use("*", proxy(host, {
    preserveHostHdr: false,
    https: https,
    timeout: timeout,

    // userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
    //     // recieves an Object of headers, returns an Object of headers.
    //     headers["X-PX-cookie-cfg-block-result"] = "1"
    //     return headers;
    // },
    proxyReqPathResolver: req => req.originalUrl,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        if (overrideHost) {
            proxyReqOpts.host = overrideHost;
        }
        return proxyReqOpts
    }
}))


app.listen(port, () => {
    console.log(`Express is listening at http://localhost:${port}`);
    const h = https ? "https://" : "http://"
    console.log(`Proxy to host ${h}${host}`)
});
