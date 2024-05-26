# Proxy
An HTTP server that proxies the request to other HTTP(S) server and logs the entire traffic.

## TL;DR
### Docker
#### start
```docker
docker run --rm --name proxy -d \
 -e PROXY_HOST=example.com \
 -e PROXY_HTTPS=true \
 -p 15000:15000 guyeise5/proxy
 
docker logs proxy
```
#### clean 
```docker
docker rm -f proxy
```


### npm
1. clone this repository
```console
git clone https://github.com/guyeise5/proxy.git
cd proxy
```

2. set environment variables
```console
export PROXY_HOST=example.com
export PROXY_HTTPS=true
export PROXY_OVERRIDE_HOST=example.com
```

3. install
```npm
npm install
```

4. build
```npm
npm run build
```

5. start
```npm
npm start
```

---

## Deploy with ngrok
create docker network
```console
docker network create my-network
```
deploy the service
```console
docker run --name proxy -d \
 --network my-network \
 -e PROXY_HOST=example.com \
 -e PROXY_HTTPS=true \
 -p 15000:15000 guyeise5/proxy
```

deploy ngrok 
```console
docker run -d --name proxy-ngrok --network my-network \
-e NGROK_AUTHTOKEN=<NGROK_TOKEN> ngrok/ngrok:alpine \
 http --log=stdout [--hostname=<hostname>] http://proxy:15000
```

ngrok logs
```console
docker logs proxy-ngrok
```
