const http = require('http');
const url = require('url');

// Function to create an HTTP server to expose connected nodes
function createHTTPServer(port, connected) {
    const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const { pathname } = parsedUrl;

        if (req.method === 'GET') {
            if (pathname === '/') {
                // Return connected nodes
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ connectedNodes: connected }));
            } else if (pathname === '/blocks') {
                // Get all blocks
                try {
                    const blocks = await blockchain.getLatestBlock();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({blocks}));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Failed to retrieve blocks' + error);
                }
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    });

    server.listen(port, () => {
        console.log(`\x1b[32mLOG\x1b[0m [${(new Date()).toISOString()}] HTTP server listening on PORT ${port}`);
    });

    return server;
}

module.exports = createHTTPServer;
