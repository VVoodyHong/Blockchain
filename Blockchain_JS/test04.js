const Blockchain = require('./dev/Blockchain');
const bitcoin = new Blockchain();

bitcoin.ProofOfWork = function(preBlockHash, curBlockData)
{
    let nonce = 0;
    // 작업증명
    while(1) {
        hash = this.hashBlock(preBlockHash, curBlockData, nonce);
        console.log(hash);
        nonce++;
        if (hash.substring(0,4) == "0000") break;
    }
    return nonce;
}

const preBlockHash = 'asldkfjsalkfj3jr3232423lwekjflsd'
const curBlockData = [
    { amount: 100, sender: 'JOHN', recipient: 'TOM'},
    { amount: 50, sender: 'TOM', recipient: 'JANE'},
    { amount: 10, sender: 'JANE', recipient: 'JOHN'}
];

console.log(bitcoin.ProofOfWork(preBlockHash, curBlockData));