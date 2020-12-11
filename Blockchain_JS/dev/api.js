// // Express.js 테스트
// const express = require('express');
// var app = new express();
// app.get('/', function(req, res) {
//     res.send("Hi~~~");
// });

// app.listen(3000);

///////////////////////////////////////////////////////////

// const express = require('express');
// var app = new express();
// app.post('/blockchain', function(req, res){});
// app.post('/transaction', function(req, res){
//     res.send("It work!!!");
// });
// app.post('/mine', function(req, res){});
// app.listen(3000, function() { console.log('listening on port 3000...')});

const express = require('express');
var app = new express();

const Blockchain = require('./blockchain');
var bitcoin = new Blockchain();

const { v1: uuid } = require('uuid');
var nodeAddress = uuid().split('-').join('');
// 5bc70a50-0522-11eb-a0ee-391ef49e5553 		// uuid()
// (5) ['5bc70a50', '0522', '11eb', 'a0ee', '391ef49e5553'] 	// uuid().split(‘-’)
// 5bc70a50052211eba0ee391ef49e5553 		// uuid().split(‘-’).join(‘’)5bc70a50.0522.11eb.a0ee.391ef49e5553	 	// uuid().split(‘-’).join(‘.’)

const bodyparser = require('body-parser');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

// app.post('/transaction', function(req, res) {
//     console.log(req.body); // 요청 내용 콘솔에 출력
//     // 요청 결과 문자열로 반환
//     res.send(`The amount of the transaction is ${req.body.amount} bitcoin from ${req.body.sender} to ${req.body.recipient}.`);
// });

//블록체인에 대한 모든 것을 볼 수 있다.
app.get('/blockchain', function(req, res) {
    res.send(bitcoin);
});

//트랜잭션을 생성한다.
app.get('/transaction', function(req, res) {
    //createNewTransaction의 리턴값은 마지막 블록의 인덱스 + 1
    const blockIndex = bitcoin.createNewTransaction(
        req.body.amount,
        req.body.sender,
        req.body.recipient
    )
    res.json({ note: `Transaction will be added in block ${blockIndex}.`});
});

//채굴
app.get('/mine', function(req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const preBlockHash = lastBlock['Hash'];
    const curBlockData = {
        transaction: bitcoin.newTransactions,
        Index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.ProofOfWork(preBlockHash, curBlockData);
    const blockHash = bitcoin.hashBlock(preBlockHash, curBlockData, nonce);
    const newBlock = bitcoin.createNewBlock(nonce, preBlockHash, blockHash);
    res.json({ note: "New block mined successfully", block: newBlock});
    bitcoin.createNewTransaction(12.5, "00", nodeAddress);
})

bitcoin.ProofOfWork = function(preBlockHash, curBlockData)
{
    let nonce = 0;
    // 작업증명
    while(1) {
        hash = this.hashBlock(preBlockHash, curBlockData, nonce);
        process.stdout.write('\r'+hash)
        nonce++;
        if (hash.substring(0,3) == "000") break;
    }
    return nonce;
}

app.listen(3000, function() { console.log('listening on port 3000...')});
