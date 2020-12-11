// test01.js에서 Blockchain.js를 사용하기 위해 import
const Blockchain = require('./dev/Blockchain');
// Blockchain 생성자 함수의 인스턴스
const bitcoin = new Blockchain();
// 임이의 값을 파라미터로 입력
bitcoin.createNewBlock(1234,'ABCDEFGHIJ1','123456789A');
bitcoin.createNewBlock(2234,'ABCDEFGHIJ2','123456789B');
bitcoin.createNewBlock(3234,'ABCDEFGHIJ3','123456789C');

console.log(bitcoin);