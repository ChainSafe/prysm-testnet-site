import Web3 from 'web3';
import { ContractService } from './contract.service';
import { DEPOSIT_CONTRACT_ABI } from './DepositContract';
import { environment } from '../../environments/environment';

const TESTNET_ID = 5;
const TESTNET_URL = 'https://goerli.prylabs.net';
export const DEPOSIT_AMOUNT = environment.depositAmount;

export enum Web3Provider {
  PORTIS,
  METAMASK,
}

const w = new Web3('noop');
export const toWei = w.utils.toWei;
export const fromWei = w.utils.fromWei;
export const toBN = w.utils.toBN;

export abstract class Web3Service {
  constructor(public readonly web3: Web3) {}

  /** Throws an error if the provider is on the wrong network. */
  ensureTestnet(): Promise<void> {
    return this.web3.eth.net.getId().then(id => {
      if (id !== TESTNET_ID) {
        throw new Error(`Invalid testnet id: ${id}. Restart your web3 provider connected to ${TESTNET_URL} or other Goerli network node.`);
      }
    });
  }

  /** Returns list of accounts associated with the web3 provider */
  queryAccounts(): Promise<string[]> {
    return this.web3.eth.getAccounts();
  }

  /** Returns the balance of an account in units of ETH */
  ethBalanceOf(address: string): Promise<string> {
    return this.web3.eth.getBalance(address)
      .then(bal => this.web3.utils.fromWei(bal, 'ether'));
  }

  /** Reference to the deposit contract */
  depositContract(address: string) {
    return new this.web3.eth.Contract(DEPOSIT_CONTRACT_ABI as any, address);
  }

  /** Number of validators that have deposited so far */
  numValidators(address: string): Promise<number> {
    return this.depositContract(address)
      .methods
      .deposit_count()
      .call()
      .then(res => res[0]);
  }

  /** Max value required to deposit */ 
  maxDepositValue(address: string): Promise<number> {
    return this.depositContract(address)
      .methods
      .MAX_DEPOSIT_AMOUNT() // Note: this is denoted in gwei!
      .call() 
      .then(res => this.web3.utils.toWei(res[0], 'gwei'));
  }

  /** Deposit event stream */ 
  depositEvents(address: string) {
    return this.depositContract(address)
       .events.Deposit();
  }
}
