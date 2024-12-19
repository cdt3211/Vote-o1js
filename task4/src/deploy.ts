import {
  CrowdfundingContract
} from './crowFunding.js';
import {
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt64,
  fetchAccount,
  UInt32
} from 'o1js';

const network = Mina.Network({
  mina: 'https://api.minascan.io/node/devnet/v1/graphql/',
  archive: 'https://api.minascan.io/archive/devnet/v1/graphql/'
});
Mina.setActiveInstance(network);

const senderKey = PrivateKey.fromBase58('EKEjV69fgpwSkjgdd7shep26PoVJYTY2ndK1ZxTa9yu83nKrxj3x');
const sender = senderKey.toPublicKey();

const senderAccount = await fetchAccount({ publicKey: sender });
const accountDetails = senderAccount?.account;
if (!accountDetails) {
  console.error('Account not found');
}
console.log('sender', sender.toBase58())
console.log('nonce', accountDetails?.nonce)
console.log('balance', accountDetails?.balance)

console.log('编译合约')
await CrowdfundingContract.compile();

let zkAppKey = PrivateKey.random();
let zkAppAccount = zkAppKey.toPublicKey();
let zkApp = new CrowdfundingContract(zkAppAccount);

console.log('部署合约')
let txn = await Mina.transaction({
  sender,
  fee: 0.2 * 1e9,
  memo: 'deploy task4',
},
  async () => {
    AccountUpdate.fundNewAccount(sender);
    await zkApp.deploy({
      creator: sender,
      fundraisingGoal: UInt64.from(100 * 1e9),
      endTime: UInt32.from(10)
    });
  });
await txn.prove();
await txn.sign([senderKey, zkAppKey]).send();

await fetchAccount({ publicKey: zkAppAccount });
await fetchAccount({ publicKey: sender });
