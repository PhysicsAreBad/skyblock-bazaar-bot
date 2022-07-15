//Right now, the only point of this is to shut heroku up

import http from 'http'

export default function startServer () {
    const host = 'localhost';
    const port = process.env.PORT as unknown as number || 5000;

    const requestListener : http.RequestListener = function (req, res) {
        res.writeHead(200);
        res.end("go away");
    };

    const server = http.createServer(requestListener);
    server.listen(port, host, undefined, () => {
        console.log(`Server is running on http://${host}:${port}`);
    });
}