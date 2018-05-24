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
const accountsFile = './src/static/KovanAccounts.json';
const accountsData: IAccount[] = require('./static/KovanAccounts.json');
const KEY = require('./keys/privateKey.json');

export class AccountUtil {
	public getMainAccount(option: IOption): IAccount {
		let mainAccount;
		let privateKey;
		if (!option.from || !option.privateKey) {
			mainAccount = CST.KOVAN_ACCOUNTS[0].address;
			privateKey = KEY[mainAccount];
			util.log('no account specified, use defaut account: ' + mainAccount);
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
		util.log(
			'creating accounts: ' + option.accountNum + ' saveAccounts: ' + option.saveAccount
				? 'yes'
				: 'no'
		);
		// util.log(accountsData);
		for (let i = 0; i < option.accountNum; i++) {
			util.log('creating account no: ' + i);
			const createdAccount = await contractUtil.web3.eth.accounts.create(
				contractUtil.web3.utils.randomHex(32)
			);
			util.log(createdAccount);
			if (option.saveAccount) {
				const obj = {
					address: createdAccount.address,
					privateKey: createdAccount.privateKey
				};
				accountsData.push(obj);
			}
		}
		// util.log(accountsData);
		const allAccounts = JSON.stringify(accountsData);
		fs.writeFileSync(accountsFile, allAccounts, 'utf8');
	}

	public async allAccountsInfo(contractUtil: ContractUtil) {
		util.log('there are total accounts no ' + accountsData.length);
		accountsData.forEach(async account => {
			const balance = await contractUtil.web3.eth.getBalance(account.address);
			util.log(
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
		if (mainAccountBalance < option.total)
			util.log(
				'mian account balance is: ' +
					mainAccountBalance +
					' less than ' +
					option.total +
					' ether, stop'
			);
		else {
			util.log(
				'mian account balance is: ' + mainAccountBalance + ' starting fuel other accounts'
			);

			const filterredAccounts: IAccount[] = [];
			await Promise.all(
				accountsData.map(async account => {
					const currentBalance = Number(
						contractUtil.web3.utils.fromWei(
							await contractUtil.web3.eth.getBalance(account.address),
							'ether'
						)
					);
					// util.log(currentBalance, option.minEther);
					if (currentBalance < option.minEther) filterredAccounts.push(account);
				})
			);

			if (filterredAccounts.length > 0) {
				const avgEthPerAccount = option.total / filterredAccounts.length;
				util.log('need fuel ether to ' + filterredAccounts.length + ' address');
				let i = 0;
				let nonce: number = await contractUtil.web3.eth.getTransactionCount(
					mainAccount.address
				);
				const interval = setInterval(async () => {
					if (i >= filterredAccounts.length) {
						util.log('complet fuel process');
						clearInterval(interval);
					} else {
						const account = filterredAccounts[i++];
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
						await contractUtil.transferEth(
							mainAccount.address,
							mainAccount.privateKey,
							account.address,
							amt,
							nonce++
						);
					}
				}, CST.TRANSFER_INTERVAL * 1000);
			} else util.log('no need to fuel');
		}
	}

	public async collectEther(contractUtil: ContractUtil, option: IOption) {
		const mainAccount: IAccount = this.getMainAccount(option);
		util.log(mainAccount);

		const filterredAccounts: IAccount[] = [];
		await Promise.all(
			accountsData.map(async account => {
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				if (currentBalance > CST.TRANSFER_GAS_TH) filterredAccounts.push(account);
			})
		);

		if (filterredAccounts.length > 0) {
			util.log('need collect ether from ' + filterredAccounts.length + ' accounts');
			let i = 0;
			const interval = setInterval(async () => {
				if (i >= filterredAccounts.length) {
					util.log('completed collect process');
					clearInterval(interval);
				} else {
					const account = filterredAccounts[i++];
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
					await contractUtil.transferEth(
						account.address,
						account.privateKey.replace('0x', ''),
						mainAccount.address,
						amt,
						nonce
					);
				}
			}, CST.TRANSFER_INTERVAL * 1000);
		} else util.log('no account to collect ether from');
	}

	public async makeCreation(contractUtil: ContractUtil, option: IOption) {
		util.log('there are total accounts of ' + accountsData.length);
		const alpha = option.alpha;
		const accountsIdxToCreate = util.generateRandomIdx(accountsData.length, alpha);
		util.log('number of random accounts to create ' + accountsIdxToCreate.length);

		const filterredAccounts: IAccount[] = [];
		await Promise.all(
			accountsIdxToCreate.map(async idx => {
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(accountsData[idx].address)
				);
				if (currentBalance > CST.CREATE_GAS_TH) filterredAccounts.push(accountsData[idx]);
			})
		);
		util.log('number of accounts able to create ' + filterredAccounts.length);
		let i = 0;
		const interval = setInterval(async () => {
			if (i >= filterredAccounts.length) {
				util.log('completd creation process');
				clearInterval(interval);
			} else {
				const account = filterredAccounts[i++];
				const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				const amtAfterGas = Number(
					contractUtil.web3.utils.fromWei(
						currentBalance - CST.CREATE_GAS_TH + '',
						'ether'
					)
				);
				const ethRandom: number = amtAfterGas * Math.random();
				const amt: number = ethRandom === 0 ? amtAfterGas : ethRandom;
				util.log(
					'starting creating from account no ' +
						i +
						' address: ' +
						account.address +
						' ethAmt: ' +
						amt
				);
				await contractUtil.create(
					account.address,
					account.privateKey.replace('0x', ''),
					CST.DEFAULT_GAS_PRICE,
					CST.CREATE_GAS,
					Number(Number(amt.toFixed(10)).toPrecision(3)),
					nonce
				);
			}
		}, CST.CREATE_INTERVAL * 1000);
	}

	public async makeRedemption(contractUtil: ContractUtil) {
		util.log('there are total accounts of ' + accountsData.length);
		const filterredAccounts: IAccount[] = [];
		await Promise.all(
			accountsData.map(async account => {
				const balanceOfA = Number(
					await contractUtil.contract.methods.balanceOf(0, account.address).call()
				);
				const balanceOfB = Number(
					await contractUtil.contract.methods.balanceOf(1, account.address).call()
				);
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				// util.log(balanceOfA, balanceOfB);
				if (balanceOfA > 0 && balanceOfB > 0 && currentBalance > CST.REDEEM_GAS_TH)
					filterredAccounts.push(account);
			})
		);
		util.log('there are ' + filterredAccounts.length + ' accounts able to Redeem');
		let i = 0;
		const interval = setInterval(async () => {
			if (i >= filterredAccounts.length) {
				util.log('completd redemption process');
				clearInterval(interval);
			} else {
				const account = filterredAccounts[i++];
				const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
				const balanceA = await contractUtil.contract.methods
					.balanceOf(0, account.address)
					.call();
				const balanceARandom = balanceA * Math.random();
				const createA = balanceARandom === 0 ? balanceA : balanceARandom.toFixed(0);

				const balanceB = await contractUtil.contract.methods
					.balanceOf(1, account.address)
					.call();
				const balanceBRandom = balanceB * Math.random();
				const createB = balanceBRandom === 0 ? balanceB : balanceBRandom.toFixed(0);

				util.log(
					'starting redemption from account no ' +
						i +
						' address: ' +
						account.address +
						' amtA: ' +
						createA +
						' amtB: ' +
						createB
				);
				await contractUtil.redeem(
					account.address,
					account.privateKey.replace('0x', ''),
					createA,
					createB,
					CST.DEFAULT_GAS_PRICE,
					CST.REDEEM_GAS,
					nonce
				);
			}
		}, CST.REDEEM_INTERVAL * 1000);
	}

	public async makeTokenTransfer(contractUtil: ContractUtil) {
		util.log('there are total accounts of ' + accountsData.length);
		const filterredAccounts: any[] = [];
		await Promise.all(
			accountsData.map(async account => {
				const balanceOfA = Number(
					await contractUtil.contract.methods.balanceOf(0, account.address).call()
				);
				const balanceOfB = Number(
					await contractUtil.contract.methods.balanceOf(1, account.address).call()
				);
				const currentBalance = Number(
					await contractUtil.web3.eth.getBalance(account.address)
				);
				// util.log(balanceOfA, balanceOfB);
				if (
					(balanceOfA > 0 || balanceOfB > 0) &&
					currentBalance > CST.TRANSFER_TOKEN_GAS_TH
				)
					filterredAccounts.push(account);
			})
		);
		util.log('there are ' + filterredAccounts.length + ' accounts able to Transfer');
		let i = 0;
		const interval = setInterval(async () => {
			if (i >= filterredAccounts.length) {
				util.log('completd tokenTransfer process');
				clearInterval(interval);
			} else {
				const account = filterredAccounts[i++];
				const nonce = await contractUtil.web3.eth.getTransactionCount(account.address);
				const balanceA = await contractUtil.contract.methods
					.balanceOf(0, account.address)
					.call();
				const balanceARandom = balanceA * Math.random();
				const transferA = balanceARandom === 0 ? balanceA : balanceARandom.toFixed(0);

				const balanceB = await contractUtil.contract.methods
					.balanceOf(1, account.address)
					.call();
				const balanceBRandom = balanceB * Math.random();
				const transferB = balanceBRandom === 0 ? balanceB : balanceBRandom.toFixed(0);

				const toAIdx = Math.floor(Math.random() * accountsData.length);
				const toAaddress = accountsData[toAIdx].address;

				const toBIdx = Math.floor(Math.random() * accountsData.length);
				const toBaddress = accountsData[toBIdx].address;

				util.log(
					'starting transferingToken from account no ' +
						i +
						' address: ' +
						account.address +
						' transfer A to: ' +
						toAaddress +
						' with amount: ' +
						transferA +
						' transfer B to: ' +
						toBaddress +
						' with amount: ' +
						transferB
				);
				await contractUtil.transferToken(
					0,
					account.address,
					account.privateKey.replace('0x', ''),
					toAaddress,
					transferA,
					CST.DEFAULT_GAS_PRICE,
					CST.TRANSFER_TOKEN_GAS,
					nonce
				);
				await contractUtil.transferToken(
					0,
					account.address,
					account.privateKey.replace('0x', ''),
					toBaddress,
					transferB,
					CST.DEFAULT_GAS_PRICE,
					CST.TRANSFER_TOKEN_GAS,
					nonce + 1
				);
			}
		}, CST.TRANSFER_TOKEN_INTERVAL * 1000);
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
