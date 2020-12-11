const Blockchain = require('./dev/Blockchain');
const bitcoin = new Blockchain();
const preBlockHash = 'lsdkfjdslfjaeljfa34324'
const curBlockData = [{
    amount: 100,
    sender: 'JOHN',
    recipient: 'TOM'
}];
const nonce = 100;
console.log(bitcoin.hashBlock(preBlockHash, curBlockData, nonce));