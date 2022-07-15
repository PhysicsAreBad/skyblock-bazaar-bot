//Right now, the only point of this is to shut heroku up

import http from 'http'

export default function startServer () {
    const requestListener : http.RequestListener = function (req, res) {
        res.writeHead(200);
        res.end("go away");
    };

    const server = http.createServer(requestListener).listen(process.env.PORT as unknown as number || 5000);
}