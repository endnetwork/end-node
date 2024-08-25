const http = require('http');
const url = require('url');

// Function to create an HTTP server to expose connected nodes
function createHTTPServer(port, connected, blockchain, broadcastLatestBlock) {
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
                    const blocks = await blockchain.getFullChain();
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
        } else if (req.method === 'POST' && pathname === '/addBlock') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const latestBlockIndex = await blockchain.getLatestBlockIndex();
                    const latestBlock = await blockchain.getLatestBlock();

                    const newBlock = {
                        index: latestBlockIndex + 1,
                        previousHash: latestBlock.hash,
                        timestamp: new Date().toISOString(),
                        data: data,
                        hash: '' // Hash will be calculated below
                    };

                    // Calculate the hash for the new block
                    newBlock.hash = blockchain.calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data);

                    // Add the new block to the blockchain
                    await blockchain.addBlock(newBlock);
                    broadcastLatestBlock();

                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Block added successfully', block: newBlock }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Failed to add block: ' + error);
                }
            });
        }  else {
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
