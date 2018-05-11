/*
This program is to create parity accounts.
It takes number of accounts to create,
and use csv file as phrase source to create parity accounts
*/
import * as fs from 'fs';
import * as CST from './constants';
import util from './util';

const dictFile = './src/static/dictionary.txt';

export class AccountUtil {
	public sendRequest(name: string, url: string, params: string[]): Promise<object> {
		return util.postJson(url, {
			method: name,
			params: params,
			id: 1,
			jsonrpc: '2.0'
		});
	}

	public getRandomInt(max: number): number {
		return Math.floor(Math.random() * Math.floor(max));
	}

	public generateRandomPhrase(words: string[]): string {
		let phrase = '';
		for (let i = 0; i < 12; i++) {
			const index = this.getRandomInt(words.length);
			const word = words[index];
			phrase += word + (i < 11 ? ' ' : '');
		}
		util.log(phrase);
		return phrase;
	}

	public async createAccount(num: number) {
		// by default, only one account is created
		if (num <= 0) {
			num = 1;
		}

		const dict = fs.readFileSync(dictFile, 'utf8');
		const words = dict.includes('\r') ? dict.split('\r\n') : dict.split('\n');
		util.log(words.length);

		for (let i = 0; i < num; i++) {
			const params: string[] = [];
			const phrases: string = this.generateRandomPhrase(words);
			// util.log("Generated phrases: " + phrases);
			params.push(phrases);
			params.push('hunter2');
			util.log(
				'successfully created account: ' +
					(await this.sendRequest(
						'parity_newAccountFromPhrase',
						CST.PROVIDER_LOCAL_HTTP,
						params
					))['result']
			);
		}
	}

	public async removeAccount(address: string) {
		const params: string[] = [];
		params.push(address);
		util.log(
			'successfully removed account: ' +
				address +
				' ' +
				(await this.sendRequest('parity_removeAddress', CST.PROVIDER_LOCAL_HTTP, params))[
					'result'
				]
		);
	}

	public async allAccountsInfo() {
		const params: string[] = [];
		util.log(
			'all accounts information: ' +
				(await this.sendRequest('parity_allAccountsInfo', CST.PROVIDER_LOCAL_HTTP, params))[
					'result'
				]
		);
	}
}

const accountUtil = new AccountUtil();
export default accountUtil;
