/*
This program is to create parity accounts.
Fuel created accounts with Ether or collect ether from created accoutns
Use created accounts to interact with smart contract
*/
import * as fs from 'fs';
import * as CST from './constants';
import ContractUtil from './contractUtil';
import { IAccount, IOption } from './types';
import util from './util';
const Tx = require('ethereumjs-tx');
const accountsFile = './src/static/KovanAccounts.json';
const schedule = require('node-schedule');

export class AccountUtil {
	public async transferEth(
		contractUtil: ContractUtil,
		from: string,
		privatekey: string,
		to: string,
		amt: number,
		nonce: number
	) {
		// util.log(
		// 	'transfering from: ' + from + ' to: ' + to + ' amount: ' + amt + ' nonce ' + nonce
		// );
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
	public async createAccount(contractUtil: ContractUtil, option: IOption) {
		// by default, only one account is created
		const saveAccount = option.saveAccount ? 'yes' : 'no';
		console.log('creating accounts: ' + option.accountNum + ' saveAccounts: ' + saveAccount);
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		// console.log(accountsData);
		let createdAccount;
		for (let i = 0; i < option.accountNum; i++) {
			console.log('creating account no: ' + i);
			createdAccount = await contractUtil.web3.eth.accounts.create(
				contractUtil.web3.utils.randomHex(32)
			);
			console.log(createdAccount);
			if (option.saveAccount) {
				const obj = {
					address: createdAccount.address,
					privateKey: createdAccount.privateKey
				};
				accountsData.push(obj);
			}
		}
		// console.log(accountsData);
		const allAccounts = JSON.stringify(accountsData);
		fs.writeFileSync(accountsFile, allAccounts, 'utf8');
	}

	public async allAccountsInfo(contractUtil: ContractUtil) {
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		console.log('there are total accounts no ' + accountsData.length);
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

			const filterredAccounts: any[] = [];
			let promiseList: any[] = [];
			promiseList = accountsData.map(async account => {
				let currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				currentBalance = Number(
					contractUtil.web3.utils.fromWei(currentBalance + '', 'ether')
				);
				// console.log(currentBalance, option.minEther);

				if (currentBalance < option.minEther) {
					return filterredAccounts.push(account);
					// promiseList.push()
				} else {
					return undefined;
				}
			});
			await Promise.all(promiseList);

			if (filterredAccounts.length > 0) {
				console.log('need fuel ether to ' + filterredAccounts.length + ' address');
				const sendInterval = 10;
				const startTime = new Date(Date.now());
				const endTime = new Date(
					startTime.getTime() +
						sendInterval * 1000 * (filterredAccounts.length + 1) +
						1000
				);
				let i = 0;
				let nonce: number = await contractUtil.web3.eth.getTransactionCount(
					mainAccount.address
				);
				const rule = '*/' + sendInterval + ' * * * * *';
				schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, async () => {
					if (i >= filterredAccounts.length) {
						console.log('completd fuel process');
					} else {
						i++;
						const account = filterredAccounts[i - 1];
						const randomAmt = Math.random() * avgEthPerAccount;
						const amt = randomAmt < 0.01 ? 0.01 : randomAmt;
						util.log(
							'starting transfer ether to account no ' +
								i +
								' address: ' +
								account.address +
								' ethAmt: ' +
								amt
						);
						nonce++;
						await this.transferEth(
							contractUtil,
							mainAccount.address,
							mainAccount.privateKey,
							account.address,
							amt,
							nonce - 1
						);
					}
				});
			} else {
				console.log('no need to fuel');
			}
		}
	}

	public async collectEther(contractUtil: ContractUtil, option: IOption) {
		const mainAccount: IAccount = this.getMainAccount(option);
		console.log(mainAccount);
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);

		const filterredAccounts: any[] = [];
		let promiseList: any[] = [];
		promiseList = accountsData.map(async account => {
			const currentBalance = Number(await contractUtil.web3.eth.getBalance(account.address));
			if (currentBalance > CST.TRANSFER_GAS_TH) {
				return filterredAccounts.push(account);
				// promiseList.push()
			} else {
				return undefined;
			}
		});
		await Promise.all(promiseList);
		if (filterredAccounts.length > 0) {
			util.log('need collect ether form ' + filterredAccounts.length + ' accounts');
			const sendInterval = 10;
			const startTime = new Date(Date.now());
			const endTime = new Date(
				startTime.getTime() + sendInterval * 1000 * (filterredAccounts.length + 1) + 1000
			);
			let i = 0;
			const rule = '*/' + sendInterval + ' * * * * *';
			schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, async () => {
				if (i >= filterredAccounts.length) {
					console.log('completd collect process');
				} else {
					i++;
					const account = filterredAccounts[i - 1];
					const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
					const currentBalance = Number(
						await contractUtil.web3.eth.getBalance(account.address)
					);
					const amt: number = Number(
						contractUtil.web3.utils.fromWei(
							currentBalance - CST.TRANSFER_GAS_TH + '',
							'ether'
						)
					);
					util.log(
						'starting collect ether from account no ' +
							i +
							' address: ' +
							account.address +
							' ethAmt: ' +
							amt
					);
					await this.transferEth(
						contractUtil,
						account.address,
						account.privateKey.replace('0x', ''),
						mainAccount.address,
						amt,
						nonce
					);
				}
			});
		} else {
			util.log('no account to collect ether from');
		}
	}

	public async makeCreation(contractUtil: ContractUtil, option: IOption) {
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		const alpha = option.alpha;
		const accountsIdxToCreate = util.generateRandomIdx(accountsData.length - 1, alpha);

		const filterredAccounts: any[] = [];
		let promiseList: any[] = [];
		promiseList = accountsIdxToCreate.map(async idx => {
			const currentBalance = Number(
				await contractUtil.web3.eth.getBalance(accountsData[idx].address)
			);
			if (currentBalance > CST.TRANSFER_GAS_TH) {
				return filterredAccounts.push(accountsData[idx]);
			} else {
				return undefined;
			}
		});
		await Promise.all(promiseList);
		console.log(filterredAccounts);

		util.log('there are ' + filterredAccounts.length + ' accounts to create');
		const sendInterval = 10;
		const startTime = new Date(Date.now());
		const endTime = new Date(
			startTime.getTime() + sendInterval * 1000 * (filterredAccounts.length + 1) + 1000
		);
		let i = 0;
		const rule = '*/' + sendInterval + ' * * * * *';
		schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, async () => {
			if (i >= filterredAccounts.length) {
				console.log('completd creation process');
			} else {
				i++;
				const account = accountsData[i - 1];
				const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				console.log(currentBalance - CST.TRANSFER_GAS_TH);
				const amt: number =
					Number(
						contractUtil.web3.utils.fromWei(
							currentBalance - CST.TRANSFER_GAS_TH + '',
							'ether'
						)
					) * Math.random();
				util.log(
					'starting creating from account no ' +
						i +
						' address: ' +
						account.address +
						' ethAmt: ' +
						amt
				);
				option.address = account.address;
				option.privateKey = account.privateKey.replace('0x', '');
				option.eth = util.truncateNum(amt);
				option.gasLimit = 400000;
				await contractUtil.create(option, nonce);
			}
		});
	}

	public async makeRedemption(contractUtil: ContractUtil, option: IOption) {
		//
		const data = fs.readFileSync(accountsFile, 'utf8');
		const accountsData = JSON.parse(data);
		const filterredAccounts: any[] = [];
		let promiseList: any[] = [];
		promiseList = accountsData.map(async account => {
			const balanceOfA = Number(
				await contractUtil.contract.methods.balanceOf(0, account.address).call()
			);
			const balanceOfB = Number(
				await contractUtil.contract.methods.balanceOf(1, account.address).call()
			);
			const currentBalance = Number(
				await contractUtil.web3.eth.getBalance(account.address)
			);
			// console.log(balanceOfA, balanceOfB);
			if (balanceOfA > 0 && balanceOfB > 0 && currentBalance > CST.REDEEM_GAS_TH) {
				return filterredAccounts.push(account);
				// promiseList.push()
			} else {
				return undefined;
			}
		});
		await Promise.all(promiseList);
		// console.log(filterredAccounts);
		// const alpha = option.alpha;
		// const accountsIdxToCreate = util.generateRandomIdx(accountsData.length - 1, alpha);

		util.log('there are ' + filterredAccounts.length + ' accounts to Redeem');
		const sendInterval = 10;
		const startTime = new Date(Date.now());
		const endTime = new Date(
			startTime.getTime() + sendInterval * 1000 * (filterredAccounts.length + 1) + 1000
		);
		let i = 0;
		const rule = '*/' + sendInterval + ' * * * * *';
		schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, async () => {
			if (i >= filterredAccounts.length) {
				console.log('completd redemption process');
			} else {
				i++;
				const account = filterredAccounts[i - 1];
				const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
				const balanceOfA = Number(
					(
						(await contractUtil.contract.methods.balanceOf(0, account.address).call()) *
						Math.random()
					).toFixed(0)
				);
				const balanceOfB = Number(
					(
						(await contractUtil.contract.methods.balanceOf(1, account.address).call()) *
						Math.random()
					).toFixed(0)
				);
				util.log(
					'starting redemption from account no ' +
						i +
						' address: ' +
						account.address +
						' amtA: ' +
						balanceOfA +
						' amtB: ' +
						balanceOfB
				);
				option.address = account.address;
				option.privateKey = account.privateKey.replace('0x', '');
				option.amtA = balanceOfA;
				option.amtB = balanceOfB;
				option.gasLimit = 800000;
				console.log(option);
				await contractUtil.redeem(option, nonce);
			}
		});
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
