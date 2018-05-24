import moment from 'moment';
import request from 'request';
import * as CST from './constants';
import { IOption } from './types';

export class Util {
	public log(text: any): void {
		console.log(moment().format('HH:mm:ss.SSS') + ' ' + text);
	}

	// public truncateNum(num: number, decimal: number = 3): number {
	// 	let x = num.toString();
	// 	x = x.slice(0, x.indexOf('.') + decimal);
	// 	return Number(x);
	// }

	public get(url: string): Promise<any> {
		return new Promise((resolve, reject) =>
			request(
				{
					url,
					headers: {
						'user-agent': 'node.js'
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

	public generateRandomIdx(max: number, alpha: number): number[] {
		const output: number[] = [];
		if (alpha === 1) for (let i = 0; i < max; i++) output.push(i);
		else {
			const num = Math.floor(max * alpha);

			while (output.length < num) {
				const item = Math.floor(Math.random() * max);
				if (output.indexOf(item) < 0) output.push(item);
			}
		}

		return output;
	}

	public postJson(url: string, json: object): Promise<object> {
		return new Promise((resolve, reject) =>
			request(
				{
					url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	public parseOptions(argv: string[]): IOption {
		const option = {
			live: process.argv.includes('live'),
			aws: process.argv.includes('aws'),
			gasPrice: 5e9,
			gasLimit: 200000,
			eth: 0,
			address: '',
			privateKey: '',
			price: 0,
			source: '',
			pwd: '',
			event: '',
			provider: '',
			contractState: '',
			accountNum: 1,
			saveAccount: false,
			from: '',
			to: '',
			value: 0,
			index: 0,
			total: 10,
			minEther: 0.02,
			alpha: 0.3,
			amtA: 0,
			amtB: 0,
			generator: ''
		};
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'gasPrice':
					option.gasPrice = Number(args[1]) || option.gasPrice;
					break;
				case 'gasLimit':
					option.gasLimit = Number(args[1]) || option.gasLimit;
					break;
				case 'eth':
					option.eth = Number(args[1]) || option.eth;
					break;
				case 'address':
					option.address = args[1] || option.address;
					break;
				case 'privateKey':
					option.privateKey = args[1] || option.privateKey;
					break;
				case 'price':
					option.price = Number(args[1]) || option.price;
					break;
				case 'pwd':
					option.pwd = args[1] || option.pwd;
					break;
				case 'source':
					option.source = args[1] || option.source;
					break;
				case 'event':
					option.event = args[1] || option.event;
					break;
				case 'provider':
					option.provider = args[1] || option.provider;
					break;
				case 'contractState':
					option.contractState = args[1] || option.contractState;
					break;
				case 'accountNum':
					option.accountNum = Number(args[1]) || option.accountNum;
					break;
				case 'saveAccount':
					option.saveAccount = args[1] === 'yes' || option.saveAccount;
					break;
				case 'from':
					option.from = args[1] || option.from;
					break;
				case 'total':
					option.total = Number(args[1]) || option.total;
					break;
				case 'minEther':
					option.minEther = Number(args[1]) || option.minEther;
					break;
				case 'alpha':
					option.alpha = Number(args[1]) || option.alpha;
					break;
				case 'amtA':
					option.amtA = Number(args[1]) || option.amtA;
					break;
				case 'amtB':
					option.amtB = Number(args[1]) || option.amtB;
					break;
				case 'value':
					option.value = Number(args[1]) || option.value;
					break;
				case 'index':
					option.index = Number(args[1]) || option.index;
					break;
				case 'generator':
					option.generator = args[1] || option.generator;
					break;
				default:
					break;
			}
		}

		if (!option.provider)
			if (option.source === CST.SRC_MYETHER)
				option.provider = option.live
					? CST.PROVIDER_MYETHER_LIVE
					: CST.PROVIDER_MYETHER_DEV;
			else if (option.source === CST.SRC_INFURA)
				option.provider = option.live ? CST.PROVIDER_INFURA_LIVE : CST.PROVIDER_INFURA_DEV;
			else {
				option.provider = CST.PROVIDER_LOCAL_WS;
				option.source = '';
			}

		return option;
	}
}

const util = new Util();
export default util;
