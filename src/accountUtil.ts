/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import * as fs from 'fs';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import { IAccount, IOption } from './types';
import util from './util';
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
		const mainAccount: IAccount = this.getMainAccount(option);

		let mainAccountBalance = await contractUtil.web3.eth.getBalance(mainAccount.address);
		mainAccountBalance = Number(
			contractUtil.web3.utils.fromWei(mainAccountBalance + '', 'ether')
		);
		if (mainAccountBalance < option.total) {
			console.log(
				'mian account balance is: ' + mainAccountBalance + ' less than 10 ether, stop'
			);
		} else {
			console.log(
				'mian account balance is: ' + mainAccountBalance + ' starting fuel other accounts'
			);
			const data = fs.readFileSync(accountsFile, 'utf8');
			const accountsData = JSON.parse(data);
			const avgEthPerAccount = option.total / accountsData.length;
			let promiseList: any[] = [];
			const currentNonce: number = await contractUtil.web3.eth.getTransactionCount(
				mainAccount.address
			);
			promiseList = accountsData.map(async account => {
				const amt = Math.random() * avgEthPerAccount;
				// promiseList.push(
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				if (Number(contractUtil.web3.utils.fromWei(currentBalance + '', 'ether')) < option.minEther) {
					return this.transferEth(
						contractUtil,
						mainAccount.address,
						mainAccount.privateKey,
						account.address,
						amt,
						currentNonce + accountsData.indexOf(account)
					);
				}
				// );
			});
			await Promise.all(promiseList);
		}
	}

	public async transferEth(
		contractUtil: ContractUtil,
		from: string,
		privatekey: string,
		to: string,
		amt: number,
		nonce: number
	) {
		util.log(
			'transfering from: ' + from + ' to: ' + to + ' amount: ' + amt + ' nonce ' + nonce
		);
		const privateKey = new Buffer(privatekey.toLocaleLowerCase(), 'hex');
		const rawTx = {
			nonce: nonce,
			gasPrice: contractUtil.web3.utils.toHex(
				(await contractUtil.getGasPrice()) || CST.DEFAULT_GAS_PRICE
			),
			gasLimit: contractUtil.web3.utils.toHex(23000),
			from: from,
			to: to,
			value: contractUtil.web3.utils.toHex(
				contractUtil.web3.utils.toWei(util.truncateNum(amt, 3) + '', 'ether')
			)
		};
		const tx = new Tx(rawTx);
		tx.sign(privateKey);
		const serializedTx = tx.serialize();
		await contractUtil.web3.eth
			.sendSignedTransaction('0x' + serializedTx.toString('hex'))
			.on('receipt', console.log);
	}

	public getMainAccount(option: IOption): IAccount {
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
		return {
			address: mainAccount,
			privateKey: privateKey
		};
	}

	public async collectEther(contractUtil: ContractUtil, option: IOption) {
		const mainAccount: IAccount = this.getMainAccount(option);
		console.log(mainAccount);
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);

		let promiseList: any[] = [];

		promiseList = accountsData.map(async account => {
			const currentBalance = Number(await contractUtil.web3.eth.getBalance(account.address));
			console.log(currentBalance);
			if (currentBalance > CST.TRANSFER_GAS_TH) {
				const amt: number = Number(
					contractUtil.web3.utils.fromWei(
						currentBalance - CST.TRANSFER_GAS_TH + '',
						'ether'
					)
				);
				console.log(amt);
				const nonce: number = await contractUtil.web3.eth.getTransactionCount(
					account.address
				);
				// console.log(account);
				// promiseList.push(
				return this.transferEth(
					contractUtil,
					account.address,
					account.privateKey.replace('0x', ''),
					mainAccount.address,
					amt,
					nonce
				);
				// );
			}
		});
		await Promise.all(promiseList);
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
