const TYPE = {
    NEW_BLOCK: 0,
    CREATE_TRANSACTION: 1,
    REQUEST_BLOCK: 2,
    SEND_BLOCK: 3,
    HANDSHAKE: 4,
    PEER_LIST: 5,
    SYNCHRONIZATION: 6, 
}


function produceMessage(type, data) {
    return JSON.stringify({ type, data });
}
function parseJSON(message) {
    try {
        return JSON.parse(message);
    } catch (e) {
        console.error('Error parsing JSON message:', e);
    }
}

module.exports = {TYPE, produceMessage, parseJSON};