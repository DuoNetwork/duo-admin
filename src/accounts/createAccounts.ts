/*
This program takes csv file as phrase source to create parity accounts
*/
const rp = require('request-promise');
import { Promise } from 'es6-promise';
var fs = require('fs');
var parse = require('csv-parse');

var inputFile = './src/accounts/dictionary.csv';
let all_words = [];

class CreateAccount {
	sendRequest(url: string, params: string[]): Promise<object> {
		return new Promise((resolve, reject) =>
			rp(
				{
					url: url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: {
						method: 'parity_newAccountFromPhrase',
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
			let index = this.getRandomInt(200);

			if (i < 11) outString = outString + all_words[index] + ' ';
			else outString = outString + all_words[index];
		}
		return outString;
	}

	createAccount(num: number) {
		// let num = 2;
		if(!num){
			num = 1;
		}

		fs
			.createReadStream(inputFile)
			.pipe(parse({ delimiter: ':' }))
			.on('data', function(line) {
				all_words.push(line[0]);
				//do something with csvrow
			})
			.on('end', function() {
				for (let i = 0; i < num; i++) {
					//do something wiht csvData
					let url = 'http://localhost:8545';
					let params: string[] = [];
					let phrases: string = createAccount.generateRandomPhrase();
					params.push(phrases);
					params.push('hunter2');
					// console.log(phrases);
					createAccount.sendRequest(url, params).then(res => {
						console.log('successfully created account: ' + res['result']);
					});
				}
			});
	}
}

let createAccount = new CreateAccount();
export default createAccount;
