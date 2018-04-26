/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import * as fs from 'fs';
import util from './util';
import * as CST from './constants';

const dictFile = './src/static/dictionary.txt';

export class AccountUtil {
	sendRequest(name: string, url: string, params: string[]): Promise<object> {
		return util.postJson(url, {
			method: name,
			params: params,
			id: 1,
			jsonrpc: '2.0'
		});
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

	async createAccount(num: number) {
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
			console.log(
				'successfully created account: ' +
					(await this.sendRequest('parity_newAccountFromPhrase', CST.NETWORK, params))[
						'result'
					]
			);
		}
	}

	async removeAccount(address: string) {
		const params: string[] = [];
		params.push(address);
		console.log(
			'successfully removed account: ' +
				address +
				' ' +
				(await this.sendRequest('parity_removeAddress', CST.NETWORK, params))['result']
		);
	}

	async allAccountsInfo() {
		const params: string[] = [];
		console.log(
			'all accounts information: ' +
				(await this.sendRequest('parity_allAccountsInfo', CST.NETWORK, params))['result']
		);
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
