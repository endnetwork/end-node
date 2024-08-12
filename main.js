const { startServer } = require("./server/server");
const config = require("./config.json");

(async () => {
    await startServer(config);
})();