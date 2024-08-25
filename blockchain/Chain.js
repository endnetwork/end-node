const crypto = require('crypto');
const { Level } = require('level');

class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

class Blockchain {
    constructor(dbPath) {
        this.chain = [];
        this.db = new Level(dbPath, { valueEncoding: 'json' });
    }

    async createGenesisBlock() {
        const genesisBlock = new Block(0, '0', '2024-08-25T14:01:26.365Z', 'Genesis Block', this.calculateHash(0, '0', '2024-08-25T14:01:26.365Z', 'Genesis Block'));
        await this.db.put(genesisBlock.index, genesisBlock);
        this.chain.push(genesisBlock);
    }

    calculateHash(index, previousHash, timestamp, data) {
        return crypto.createHash('sha256').update(index + previousHash + timestamp + JSON.stringify(data)).digest('hex');
    }

    async getLatestBlock() {
        const latestBlockIndex = this.chain.length - 1;
        return latestBlockIndex >= 0 ? this.chain[latestBlockIndex] : null;
    }

    async getLatestBlockIndex() {
        const latestBlock = await this.getLatestBlock();
        return latestBlock ? latestBlock.index : -1;
    }

    async getBlockByIndex(index) {
        try {
            return await this.db.get(index);
        } catch (error) {
            console.error('Error fetching block by index:', error);
            return null;
        }
    }

    async addBlock(newBlock) {
        // newBlock.previousHash = this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '0';
        // newBlock.hash = this.calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data);
        await this.db.put(newBlock.index, newBlock);
        this.chain.push(newBlock);

    }

    async isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== this.calculateHash(currentBlock.index, currentBlock.previousHash, currentBlock.timestamp, currentBlock.data)) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    async loadBlockchain() {
        this.chain = [];
        for await (const [key, value] of this.db.iterator()) {
            this.chain.push(value);
        }
    }
}

module.exports = Blockchain;
