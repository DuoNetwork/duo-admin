/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import request from 'request';
import * as CST from '../constant';
const fs = require('fs');
const parse = require('csv-parse');

const inputFile = './src/accounts/dictionary.csv';
const all_words: any[] = [];

const NETWORK = CST.NETWORK;

export class ParityAccount {
	sendRequest(name: string, url: string, params: string[]): Promise<object> {
		return new Promise((resolve, reject) =>
			request(
				{
					url: url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: {
						method: name,
						params: params,
						id: 1,
						jsonrpc: '2.0'
					}
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	getRandomInt(max: number): number {
		return Math.floor(Math.random() * Math.floor(max));
	}

	generateRandomPhrase(): string {
		let outString: string = '';
		for (let i = 0; i < 12; i++) {
			const index = this.getRandomInt(200);
			const word = all_words[index].replace('.', '');
			if (i < 11) outString = outString + word + ' ';
			else outString = outString + word;
		}
		return outString;
	}

	createAccount(num: number) {
		// by default, only one account is created
		if (num <= 0) {
			num = 1;
		}

		fs
			.createReadStream(inputFile)
			.pipe(parse({ delimiter: ':' }))
			.on('data', line => {
				all_words.push(line[0]);
			})
			.on('end', function() {
				for (let i = 0; i < num; i++) {
					const params: string[] = [];
					const phrases: string = parityAccount.generateRandomPhrase();
					console.log(phrases);
					params.push(phrases);
					params.push('hunter2');
					parityAccount.sendRequest('parity_newAccountFromPhrase', NETWORK, params).then(res => {
						console.log('successfully created account: ' + res['result']);
					});
				}
			});
	}

	removeAccount(address: string) {
		const params: string[] = [];
		params.push(address);
		parityAccount.sendRequest('parity_removeAddress', NETWORK, params).then(res => {
			console.log('successfully removed account: ' + address + ' ' + res['result']);
		});
	}

	allAccountsInfo() {
		const params: string[] = [];
		parityAccount.sendRequest('parity_allAccountsInfo', NETWORK, params).then(res => {
			console.log('all accounts information: ' + res['result']);
		});
	}
}

const parityAccount = new ParityAccount();
export default parityAccount;
