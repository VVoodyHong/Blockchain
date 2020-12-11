// SHA256 라이브러리 사용을 위해 import
const sha256 = require('sha256');
// universally unique identifier 유니크한 식별자 생성을 위해 import
const { v1: uuid } = require('uuid');

// 각 네트워크 노드들이 자신의 url 알 수 있도록 argv[3]의 파라미터 설정
const currentNodeUrl = process.argv[3];

function Blockchain()
{
    // 채굴한 모든 블록을 저장하는 배열
    this.chain = [];
    // 블록에 아직 저장되지 않은 모든 트랜잭션을 저장하는 배열 선언
    this.newTransactions = [];
    // 제네시스 블록을 위한 임의의 값
    this.createNewBlock(100,'0','0');

    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];                 // 노드들의 URL 저장 배열
}

Blockchain.prototype.createNewBlock = function(nonce, prevBlockHash, hash)
{
    // Blockchain 내부 새로운 블록으로 관련 데이터들은 모두 이 안에 저장
    const newBlock = {
        index: this.chain.length +1,         //몇번째 블록인지 체크
        timestamp: Date.now(),               //블록 생성 시점
        transactions: this.newTransactions,  //새로운 트랜잭션들과 미결 트랜잭션들 추가
        nonce: nonce,                        //자격증명(POW)을 통해 찾은 숫자 값
        hash: hash,                          //트랜잭션들의 해시값
        prevBlockHash: prevBlockHash           //이전블록의 해시값
    }

    // 새블록 생성 시 새트랜잭션들을 저장할 배열 초기화
    this.newTransactions = [];
    //새로운 블록을 체인에 추가
    this.chain.push(newBlock);
    // 새로운 블록을 반환
    return newBlock;
}

Blockchain.prototype.getLastBlock = function()
{
    // 체인 배열에서 제일 마지막 블록 반환
    return this.chain[this.chain.length -1];
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient)
{
    //새로운 트랜잭션 생성
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
    return newTransaction;
}

Blockchain.prototype.addTransactionTonewTransactions = function(transactionObj)
{
    //대기 중인 트랜잭션 배열에 트랜잭션을 넣음
    this.newTransactions.push(transactionObj);
    //마지막 블록의 인덱스 값에 1을 더해서 리턴
    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function(prevBlockHash, curBlockData, nonce)
{
    // 이전 블록 해시, 넌스, 현재 블록 데이터를 데이터 스트링으로 생성
    const dataString = prevBlockHash + nonce.toString() + JSON.stringify(curBlockData);

    // 데이터 스트링을 해시
    const hash = sha256(dataString);

    return hash;
}

Blockchain.prototype.ProofOfWork = function(prevBlockHash, curBlockData)
{
    let nonce = 0;
    // 작업증명
    while(1) {
        let hash = this.hashBlock(prevBlockHash, curBlockData, nonce);
        process.stdout.write('\r'+"Hash: "+hash+ " "+"Nonce: "+nonce)
        if (hash.substring(0,3) === "000") break;
        nonce++;
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
    // 모든 블록을 순회하며 직전 블록의 해쉬 함수값과 현재 블록 해쉬값 비교 확인
    for ( var i = 1; i < blockchain.length; i++){
        // 현재 블록을 currentBlock에 넣음
        const currentBlock = blockchain[i];
        // 이전 블록을 prevBlock에 넣음
        const prevBlock = blockchain[i-1];
        // 이전블록 해시와 현재블록 데이터, 넌스값을 이용해 해싱
        const blockHash = this.hashBlock(prevBlock['hash'],
        { transaction: currentBlock['transactions'], Index: currentBlock['index']},
        currentBlock['nonce']);
        // 유효한 블록인지 확인
        if (blockHash.substring(0,3) !== '000')
        {
            validChain = false;
        };
        // 해시값이 일치하는지 확인
        if (currentBlock['prevBlockHash'] !== prevBlock['hash'])
        {
            validChain = false;
        };
    };
    // 최초 생성한 제네시스 블록 검증
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['prevBlockHash'] ==='0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    // 유효한 제네시스 블록이 아닐 시
    if (!correctNonce || !correctPreviousBlockHash || !correctHash || ! correctTransactions)
    {
        validChain = false;
    };

    return validChain;
}

// 전체 블록체인에서 특정 해시 관련 블록을 검색하는 메소드
Blockchain.prototype.getBlock = function(blockHash) {
    // 플래그를 남기기 위해 correctBlock 생성
    let correctBlock = null;
    // forEach --> chain 배열 내의 모든 원소에 대해 for문을 돌리는 것,
    // 각 원소는 block으로 지칭
    this.chain.forEach(block => {
        // 각 원소(블록체인의 각 블록)의 해시값이 입력한 blockHash와 일치할 때
        if(block.hash === blockHash)
        {
            //correctBlock에 해당 블록 기입
            correctBlock = block;
        }
    });
    return correctBlock;
}

// 전체 블록체인에서 특정 트랜잭션을 검색하는 메소드
Blockchain.prototype.getTransaction = function(transactionId) {
    // 플래그를 위한 correctTransaction
    let correctTransaction = null;
    // 플래그
    let correctBlock = null;
    // forEach를 통해 블록체인 내의 블록 순회, 그리고 각 블록의 트랜잭션 순회
    this.chain.forEach(block => {
        block.transactions.forEach( transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
    });
    return {
        transaction: correctTransaction,
        block: correctBlock
    }
}

// 전체 블록체인에서 특정 주소에 대한 데이터를 검색하는 메소드
Blockchain.prototype.getAddressData = function(address) {
    //address의 트랜잭션을 담을 배열
    const addressTransactions = [];

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            // address가 발신자 혹은 수신자일 경우 배열에 트랜잭션 담음
            if ( transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);
            };
        });
    });

    //addressTransactions의 금액
    let balance = 3000;
    // 송금, 수금 내역을 통해 balance 가감
    addressTransactions.forEach(transaction => {
        if ( transaction.recipient === address) balance += transaction.amount;
        else if ( transaction.sender === address) balance -= transaction.amount;

    });
    return {
            addressTransactions: addressTransactions,
            addressBalance: balance
    }
}

// 다른 소스에서 사용하기 위해 export
module.exports = Blockchain;

