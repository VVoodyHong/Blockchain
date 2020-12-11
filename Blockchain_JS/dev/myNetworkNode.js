//웹프레임워크를 사용하여 간편한 웹서버 구축을 위해 import
const express = require('express');
var app = new express();

const Blockchain = require('./blockchain');
//Blockchain의 인스턴스인 bitcoin 선언
var bitcoin = new Blockchain();

const { v1: uuid } = require('uuid');
// split('-'): - 단위로 나누어 배열에 저장
// join(''): 각 원소를 ''로 구분하여 저장 ( ','일 시 원소 별로 ,로 구분하여 저장 됨)
var nodeAddress = uuid().split('-').join('');
// 5bc70a50-0522-11eb-a0ee-391ef49e5553 		// uuid()
// (5) ['5bc70a50', '0522', '11eb', 'a0ee', '391ef49e5553'] 	// uuid().split(‘-’)
// 5bc70a50052211eba0ee391ef49e5553 		// uuid().split(‘-’).join(‘’)5bc70a50.0522.11eb.a0ee.391ef49e5553	 	// uuid().split(‘-’).join(‘.’)

//bodyparser 모듈을 가져옴
const bodyparser = require('body-parser');

//bodyparser가 제공하는 미들웨어 사용하겠다고 명시
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

// 서로 다른 포트에서 실행되도록 하기 위해 포트를 파라미터로 설정
const port = process.argv[2];

const reqp = require('request-promise');

//블록체인에 대한 모든 것을 볼 수 있다.
app.get('/blockchain', function(req, res) {
    res.send(bitcoin);
});

// //트랜잭션을 생성한다.
// app.post('/transaction', function(req, res) {
//     //createNewTransaction의 리턴값은 마지막 블록의 인덱스 + 1
//     const blockIndex = bitcoin.createNewTransaction(
//         req.body.amount,
//         req.body.sender,
//         req.body.recipient
//     )
//     res.json({ note: `Transaction will be added in block ${blockIndex}.`});
// });

app.post('/transaction', function(req, res)
{
    //json으로 구성된 req.body를 newTransaction으로 설정
    const newTransaction = req.body;
    //대기중인 트랜잭션 배열에 트랜잭션을 넣고
    //마지막 블록 값에 1을 더한 값을 blockIndex으로 설정
    const blockIndex = bitcoin.addTransactionTonewTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}.`});
});

app.post('/transaction/broadcast', function(req, res)
{
    // json으로 리턴되는 데이터를 newTransaction으로 설정
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionTonewTransactions(newTransaction);

    // 요청할 객체들을 저장할 배열 생성
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        // 각 원소 networkNodeUrl : ( localhost/3001, localhost3002 ..)에
        // /transaction을 붙어 POST형식으로, newTransaction을 담은 json 파일
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        //객체들이 저장된 배열에 넣음
        requestPromises.push(reqp(requestOptions));
    });
    //배열에 대한 명령
    Promise.all(requestPromises)
    .then(data => {
        res.json({ note: 'Transaction created and broadcast successfully.'});
    });
});

app.post('/mine', function(req, res) {
    //마지막 블록을 lastBlock으로 설정
    const lastBlock = bitcoin.getLastBlock();
    // preBlockHash값 설정
    const preBlockHash = lastBlock['hash'];
    // json 형식으로 작성한 데이터를 curBlockData로 설정 
    const curBlockData = {
        transaction: bitcoin.newTransactions,
        Index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.ProofOfWork(preBlockHash, curBlockData);
    const blockHash = bitcoin.hashBlock(preBlockHash, curBlockData, nonce);
    // 새롭게 만든 블럭을 newBlock으로 설정
    const newBlock = bitcoin.createNewBlock(nonce, preBlockHash, blockHash);
    
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            // 내가 생각한 바로는
            // requestOptions에 데이터를 넣은 뒤 forEach를 통해
            // 옵션(?)을 추가한다.
            uri: networkNodeUrl + `/receive-new-block`,
            method: `POST`,
            body: { newBlock: newBlock },
            json: true
        };
        //배열에 추가한 옵션을 모두 추가한다.
        requestPromises.push(reqp(requestOptions));
    });

    // 배열 객체를 동시에 실행 시키는 명령
    Promise.all(requestPromises)
    .then(data => {
        // requestOptions에 데이터를 넣는다.
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + `/transaction/broadcast`,
            method: `POST`,
            body: {
                amount: 12.5,
                sender: `00`,
                recipient: nodeAddress
            },
            json: true
        };
        return reqp(requestOptions);
    })
    .then(data => {
        res.json({
            note: "New block mined && broadcast successfully",
            block: newBlock
        });
    });
});

app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = bitcoin.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.preBlockHash; 
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
	if (correctHash && correctIndex) {
		bitcoin.chain.push(newBlock);
		bitcoin.newTransactions = [];
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	}
	else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
}); 

// 자신의 서버에 등록하고 전체 네트워크에 브로드캐스팅
app.post('/register-and-broadcast-node',function(req,res){
    const newNodeUrl = req.body.newNodeUrl;   //등록 요청 URL
    //배열 networkNodes에서 없으면 추가
    if(bitcoin.networkNodes.indexOf(newNodeUrl)== -1) bitcoin.networkNodes.push(newNodeUrl);
     
    const regNodesPromises = []; 	// promise 객체들을 저장하는 배열

	// 다른 노드에게 브로드캐스팅
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
            uri: networkNodeUrl + `/register-node`,
			method: `POST`,
			body: { newNodeUrl: newNodeUrl },
			json: true
        };
        regNodesPromises.push(reqp(requestOptions));
    });

    Promise.all(regNodesPromises)	 // promise 객체들을 비동기 실행
    .then(data => {
        
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
			json: true
		};
		return reqp(bulkRegisterOptions); 
	})
    .then(data => {
        res.json({ note: 'New Node registered with network successfully'});
    })
});

// 새로 등록 요청받은 노드를 자신의 서버에 등록
app.post(`/register-node`, function(req, res)
{
    const newNodeUrl = req.body.newNodeUrl; // 등록 요청 URL
	// 배열 networkNodes에 없으면 true, 있으면 false
	const nodeNotExist = (bitcoin.networkNodes.indexOf(newNodeUrl)==-1);
	// currentNodeUrl과 newNodeUrl이 다르면 true, 같다면 false
	const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
	// 기존에 없고, 현재 노드의 url과 다르면 추가
	if (nodeNotExist && notCurrentNode)
		bitcoin.networkNodes.push(newNodeUrl);
	// 등록요청에 대한 회신
	res.json({ note: `New node registered successfully.` });

});

// 여러 개의 노드를 자신의 서버에 한 번에 등록

app.post(`/register-nodes-bulk`, function(req, res)
{
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl
    if (nodeNotAlreadyPresent && notCurrentNode)
    {
        bitcoin.networkNodes.push(networkNodeUrl);
    };
    });
    res.json({ note: `Bulk registered successfully.` });
});

app.post('/consensus', function(req, res) {
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        };

        requestPromises.push(reqp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(blockchains => {
        const currentChainLength = bitcoin.chain.length;
        let maxChainLength = currentChainLength;
        let newLongestChain = null;
        let newTransactions = null;

        //가장 긴 블록체인 검색
        blockchains.forEach(blockchain => {
            if (blockchain.chain.length > maxChainLength) {
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newTransactions = blockchain.newTransactions;
            };
        });

        if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain)))
        {
            res.json({
                note: 'Current chain has not been replaced.',
                chain: bitcoin.chain
            });
        }
        else {
            bitcoin.chain = newLongestChain;
            bitcoin.newTransactions = newTransactions;
            res.json({
                note: 'This chain has been replaced.',
                chain: bitcoin.chain
            })
        }
    })
})

// blockHash가 전송되면 해당 블록이 반환
app.get('/block/:blockHash', function(req, res) {
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    });
});

// transactionId가 전송되면 해당 트랜잭션과 블록 반환
app.get('/transaction/:transactionId', function(req, res) {
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    })
})


// address가 전송되면 해당 주소와 관련된 데이터를 반환
app.get('/address/:address', function(req, res) {
    const address = req.params.address;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

//웹 브라우저에서 검색할 수 있도록 하는 사용자 인터페이스 호출
app.get('/block-explorer', function(req, res) {
    res.sendFile('./block-explorer/index.html', { root: __dirname});
});

app.listen(port, function()
{
    console.log(`listening on port ${port}...`)
});