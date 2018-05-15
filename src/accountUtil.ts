/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import * as fs from 'fs';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import { IOption } from './types';
const Tx = require('ethereumjs-tx');
const accountsFile = './src/static/KovanAccounts.json';

export class AccountUtil {
	public async createAccount(contractUtil: ContractUtil, option: IOption) {
		// by default, only one account is created
		const saveAccount = option.saveAccount ? 'yes' : 'no';
		console.log('creating accounts: ' + option.accountNum + ' saveAccounts: ' + saveAccount);
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		// console.log(accountsData);

		const createdAccount = await contractUtil.web3.eth.accounts.create(
			contractUtil.web3.utils.randomHex(32)
		);
		console.log(createdAccount);

		if (option.saveAccount) {
			const obj = {
				address: createdAccount.address,
				privateKey: createdAccount.privateKey
			};
			accountsData.push(obj);
			const allAccounts = JSON.stringify(accountsData);
			fs.writeFileSync(accountsFile, allAccounts, 'utf8');
		}
	}

	public async allAccountsInfo(contractUtil: ContractUtil) {
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		accountsData.forEach(async account => {
			const balance = await contractUtil.web3.eth.getBalance(account.address);
			console.log(
				'account address: ' +
					account.address +
					' eth balance ' +
					contractUtil.web3.utils.fromWei(balance + '', 'ether')
			);
		});
	}

	public async fuelAccounts(contractUtil: ContractUtil, option: IOption) {
		let mainAccount;
		let privateKey;
		if (!option.from || !option.privateKey) {
			mainAccount = CST.KOVAN_ACCOUNTS[0].address;
			privateKey = CST.KOVAN_ACCOUNTS[0].privateKey;
			console.log('no from account specified, use defaut account: ' + mainAccount);
		} else {
			mainAccount = option.from;
			privateKey = option.privateKey;
		}

		let mainAccountBalance = await contractUtil.web3.eth.getBalance(mainAccount);
		mainAccountBalance = Number(
			contractUtil.web3.utils.fromWei(mainAccountBalance + '', 'ether')
		);
		if (mainAccountBalance < 10) {
			console.log(
				'mian account balance is: ' + mainAccountBalance + ' less than 10 ether, stop'
			);
		} else {
			console.log(
				'mian account balance is: ' + mainAccountBalance + ' starting fuel other accounts'
			);
			const data = fs.readFileSync(accountsFile, 'utf8');
			const accountsData = JSON.parse(data);
			const avgEthPerAccount = 1 / accountsData.length;
			let promiseList: any[] = [];
			promiseList = accountsData.map(async account => {
				const amt = Math.random() * avgEthPerAccount;
				return await this.transferEth(contractUtil, mainAccount, privateKey, account.address, amt);
			});
			await Promise.all(promiseList);
		}
	}

	public async transferEth(
		contractUtil: ContractUtil,
		from: string,
		privatekey: string,
		to: string,
		amt: number
	) {
		console.log('transfering from: ' + from + ' to: ' + to + ' amount: ' + amt);
		const privateKey = new Buffer(privatekey.toLocaleLowerCase(), 'hex');
		const rawTx = {
			nonce: await contractUtil.web3.eth.getTransactionCount(from),
			gasPrice: contractUtil.web3.utils.toHex(
				(await contractUtil.getGasPrice()) || CST.DEFAULT_GAS_PRICE
			),
			gasLimit: contractUtil.web3.utils.toHex(23000),
			from: from,
			to: to,
			value: contractUtil.web3.utils.toHex(
				contractUtil.web3.utils.toWei(amt.toFixed(3) + '', 'ether')
			)
		};
		const tx = new Tx(rawTx);
		tx.sign(privateKey);
		const serializedTx = tx.serialize();
		await contractUtil.web3.eth
			.sendSignedTransaction('0x' + serializedTx.toString('hex'))
			.on('receipt', console.log);
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
