const Blockchain = require('./Blockchain');
const bitcoin = new Blockchain();

const bc1={
    "chain": [
    {
    "index": 1,
    "timestamp": 1604555316751,
    "transactions": [],
    "nonce": 100,
    "preBlockHash": "0",
    "hash": "0"
    },
    {
    "index": 2,
    "timestamp": 1604555334720,
    "transactions": [
    {
    "amount": 30,
    "sender": "wjddnr",
    "recipient": "dnrwjd",
    "transactionId": "941d07701f2a11ebbeff7557cb455377"
    }
    ],
    "nonce": 3856,
    "preBlockHash": "0",
    "hash": "00058554ca8a5ab3d6904b531ac277d14e748c51d7822bd27b3d0cf33ce24395"
    },
    {
    "index": 3,
    "timestamp": 1604555345238,
    "transactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "8c4791001f2a11ebbeff7557cb455377",
    "transactionId": "96fe55701f2a11ebbeff7557cb455377"
    }
    ],
    "nonce": 6357,
    "preBlockHash": "00058554ca8a5ab3d6904b531ac277d14e748c51d7822bd27b3d0cf33ce24395",
    "hash": "0006c5267d14445b8f70edb42b03c04144ed800f924b8b6f6a0a9bca758f71f3"
    }
    ],
    "newTransactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "8c4791001f2a11ebbeff7557cb455377",
    "transactionId": "9d4319c01f2a11ebbeff7557cb455377"
    }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": [
    "http://localhost:3002"
    ]
    }
    console.log('Valid :', bitcoin.chainIsValid(bc1.chain));