const { startServer } = require("./server/server");

const config = {
    PORT: process.env.PORT || 10507,
    MY_ADDRESS: process.env.MY_ADDRESS || "ws://192.168.29.213:10508",
    RPC_PORT: process.env.RPC_PORT || 20297,
    PEERS: process.env.PEERS ? process.env.PEERS.split(',') : [
        "ws://192.168.29.213:10507",
        "ws://192.168.29.213:10508"
    ],
    MAX_PEERS: 10,
    PRIVATE_KEY: "",
    ENABLE_LOGGING: true,
    ENABLE_RPC: true,
    ENABLE_CHAIN_REQUEST: true
};


(async () => {
    await startServer(config);
})();