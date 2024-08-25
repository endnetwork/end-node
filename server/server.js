const WS = require("ws");
const {Level} = require('level');
const createHTTPServer = require('../rpc/rpc');
const {TYPE, produceMessage, parseJSON} = require("./msg-types");


const opened    = [];  // Addresses and sockets from connected nodes.
const connected = [];  // Addresses from connected nodes.
let connectedNodes = 0;

function connect(MY_ADDRESS, address, retryCount = 0) {
    if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
        const socket = new WS(address); // Get address's socket.

        // Open a connection to the socket.
        socket.on("open", async () => {

            for (const _address of [MY_ADDRESS, ...connected]) socket.send(produceMessage(TYPE.HANDSHAKE, _address));
            for (const node of opened) node.socket.send(produceMessage(TYPE.HANDSHAKE, address));
            socket.send(produceMessage(TYPE.PEER_LIST, connected))

            // If the address already existed in "connected" or "opened", we will not push, preventing duplications.
            if (!opened.find(peer => peer.address === address) && address !== MY_ADDRESS) {
                opened.push({ socket, address });
            }

            if (!connected.find(peerAddress => peerAddress === address) && address !== MY_ADDRESS) {
                connected.push(address);
                connectedNodes++;
                console.log(`\x1b[32mLOG\x1b[0m [${(new Date()).toISOString()}] Connected to ${address}.`);

                // Listen for disconnection, will remove them from "opened" and "connected".
                socket.on("close", () => {
                    opened.splice(connected.indexOf(address), 1);
                    connected.splice(connected.indexOf(address), 1);
                    console.log(`\x1b[32mLOG\x1b[0m [${(new Date()).toISOString()}] Disconnected from ${address}.`);
                });
            }
        });

        socket.on("error", (error) => {
            if (error.code === 'ECONNREFUSED') {
                console.error(`\x1b[31mERROR\x1b[0m [${(new Date()).toISOString()}] Connection refused to ${address}. Skipping.`);
                // Implementing a backoff strategy
                const backoff = Math.min(1000 * (2 ** retryCount), 30000); // Exponential backoff with max 30s
                setTimeout(() => connect(MY_ADDRESS, address, retryCount + 1), backoff);
            } else {
                console.error(`\x1b[31mERROR\x1b[0m [${(new Date()).toISOString()}] Connection error with ${address}:`, error.message);
            }
        });

    }
    return true;
}

async function startServer(options) {
    const PORT                 = options.PORT || 3000;                        // Node's PORT
    const RPC_PORT             = options.RPC_PORT || 5000;                    // RPC server's PORT
    const PEERS                = options.PEERS || [];                         // Peers to connect to
    const MAX_PEERS            = options.MAX_PEERS || 10                      // Maximum number of peers to connect to
    const MY_ADDRESS           = options.MY_ADDRESS || "ws://localhost:3000"; // Node's address
    const ENABLE_LOGGING       = options.ENABLE_LOGGING ? true : false;       // Enable logging?
    const ENABLE_RPC           = options.ENABLE_RPC ? true : false;           // Enable RPC server?
    let   ENABLE_CHAIN_REQUEST = options.ENABLE_CHAIN_REQUEST ? true : false; // Enable chain sync request?
    const GENESIS_HASH         = options.GENESIS_HASH || ""; 
    // Genesis block's hash

    createHTTPServer(PORT+ 1000, connected);

    const server = new WS.Server({ port: PORT });
    console.log(`\x1b[32mLOG\x1b[0m [${(new Date()).toISOString()}] P2P server listening on PORT`, PORT.toString());

    server.on("connection", async (socket) => {
        socket.on("message", async message => {
            const _message = parseJSON(message);  

            switch (_message.type) {

                case TYPE.HANDSHAKE:
                    const address = _message.data;

                    if (connectedNodes <= MAX_PEERS) {
                        try {
                            connect(MY_ADDRESS, address);
                        } catch(e) {
                            // Debug console.log(e);
                        }
                    }
                    break;

                case TYPE.PEER_LIST:
                    const peers = _message.data;
                    peers.forEach(peer => {
                        if (!connected.includes(peer) && peer !== MY_ADDRESS) {
                            connect(MY_ADDRESS, peer);
                        }
                    });
                    break;

                case TYPE.REQUEST_BLOCK:
                    break;

                case TYPE.SEND_BLOCK:
                    break;

            }
        });
    });

    if (!ENABLE_CHAIN_REQUEST) { }
    try {
        PEERS.forEach(peer => connect(MY_ADDRESS, peer)); // Connect to peers
    } catch(e) {}
}



module.exports = { startServer };