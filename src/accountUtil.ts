/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import request from 'request';
import * as CST from './constants';
import * as fs from 'fs';

const dictFile = './src/static/dictionary.txt';

export class AccountUtil {
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

	generateRandomPhrase(words: string[]): string {
		let outString: string = '';
		for (let i = 0; i < 12; i++) {
			const index = this.getRandomInt(200);
			const word = words[index].replace('.', '');
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

		const dict = fs.readFileSync(dictFile, 'utf8');
		const words = dict.split('\n');

		for (let i = 0; i < num; i++) {
			const params: string[] = [];
			const phrases: string = this.generateRandomPhrase(words);
			console.log(phrases);
			params.push(phrases);
			params.push('hunter2');
			this.sendRequest('parity_newAccountFromPhrase', CST.NETWORK, params).then(res => {
				console.log('successfully created account: ' + res['result']);
			});
		}
	}

	removeAccount(address: string) {
		const params: string[] = [];
		params.push(address);
		this.sendRequest('parity_removeAddress', CST.NETWORK, params).then(res => {
			console.log('successfully removed account: ' + address + ' ' + res['result']);
		});
	}

	allAccountsInfo() {
		const params: string[] = [];
		this.sendRequest('parity_allAccountsInfo', CST.NETWORK, params).then(res => {
			console.log('all accounts information: ' + res['result']);
		});
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
