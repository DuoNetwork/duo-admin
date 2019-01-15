import moment from 'moment';
import * as CST from '../common/constants';
import { IOption } from '../common/types';
// import { Options } from 'aws-cli-js';

class Util {
	public logLevel: string = CST.LOG_INFO;

	private log(text: any, level?: string): void {
		if (level && CST.LOG_RANKING[this.logLevel] >= CST.LOG_RANKING[level])
			console.log(`${moment().format('HH:mm:ss.SSS')} [${level}]: ` + text);
	}

	public logInfo(text: any): void {
		this.log(text, CST.LOG_INFO);
	}

	public logDebug(text: any): void {
		this.log(text, CST.LOG_DEBUG);
	}

	public logError(text: any): void {
		this.log(text, CST.LOG_ERROR);
	}

	public composeQuery(paras: { [key: string]: any }): string {
		let query: string = '?';
		for (const key in paras) query += key + '=' + paras[key] + '&';
		query = query.slice(0, -1);
		return query;
	}

	public parseOptions(argv: string[]): IOption {
		const option = {
			forceREST: argv.includes('rest'),
			live: process.argv.includes('live'),
			dbLive: process.argv.includes('dbLive'),
			server: process.argv.includes('server'),
			dynamo: process.argv.includes('dynamo'),
			aws: process.argv.includes('aws'),
			gcp: process.argv.includes('gcp'),
			azure: process.argv.includes('azure'),
			force: process.argv.includes('force'),
			pair: '',
			contractType: 'Beethoven',
			tenor: 'Perpetual',
			assets: [''],
			sources: [''],
			exSources: [''],
			gasPrice: 5e9,
			gasLimit: 200000,
			source: '',
			event: '',
			provider: '',
			period: 1,
			base: 'USD',
			quote: 'ETH'
		};
		for (let i = 3; i < argv.length; i++) {
			const args = argv[i].split('=');
			switch (args[0]) {
				case 'exSources':
					option.exSources = args[1].split(',');
					break;
				case 'sources':
					option.sources = args[1].split(',');
					break;
				case 'pair':
					option.pair = args[1].replace('_', '|') || option.pair;
					break;
				case 'assets':
					option.assets = args[1].split(',');
					break;
				case 'gasPrice':
					option.gasPrice = Number(args[1]) || option.gasPrice;
					break;
				case 'gasLimit':
					option.gasLimit = Number(args[1]) || option.gasLimit;
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
				case 'period':
					option.period = Number(args[1]);
					break;
				case 'base':
					option.base = args[1] || option.base;
					break;
				case 'quote':
					option.quote = args[1] || option.quote;
					break;
				case 'contractType':
					option.contractType = args[1] || option.contractType;
					break;
				case 'tenor':
					option.tenor = args[1] || option.tenor;
					break;
				default:
					break;
			}
		}

		return option;
	}

	public getPeriodStartTimestamp(timestamp: number, period: number = 1) {
		// const now = this.getUTCNowTimestamp();
		return Math.floor(timestamp / 60000 / period - 1) * 60000 * period;
	}

	public timestampToString(ts: number) {
		//just for debugging purpose
		return moment.utc(ts).format('YYYY-MM-DDTHH:mm:ss');
	}

	public getStatusProcess(tool: string, option: IOption) {
		let type = '';
		const platform = option.azure ? '_AZURE' : option.gcp ? '_GCP' : '_AWS';
		console.log('dynamo', option.dynamo);
		const privacy = option.dynamo ? '_PUBLIC' : '_PRIVATE';
		let source = '';

		switch (tool) {
			case CST.TRADES:
				type = 'TRADE';
				source = option.source ? '_' + option.source.toUpperCase() : '';
				break;
			case CST.TRIGGER:
			case CST.FETCH_EVENTS:
				type = 'EVENT';
				source =
					'_' +
					([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)
						? option.event.toUpperCase()
						: 'OTHERS');
				break;
			case CST.COMMIT:
				type = 'FEED';
				break;
			case CST.CLEAN_DB:
				type = 'CLEANDB';
				break;
			case CST.DB_PRICES:
				type = 'PRICE';
				if (option.period === 1) source = '_MINUTELY';
				else if (option.period === 60) source = '_HOURLY';
				else source = '';
				break;
			case 'minutely':
				type = 'MINUTELY';
				break;
			case CST.FETCH_PRICE:
				type = 'FETCH';
				break;
			default:
				return '';
		}

		return type + platform + privacy + source;
	}

	public getUTCNowTimestamp() {
		return moment().valueOf();
	}

	public isNumber(input: any): boolean {
		const num = Number(input);
		return isFinite(num) && !isNaN(num);
	}

	public isEmptyObject(obj: object | undefined | null): boolean {
		if (!obj) return true;

		for (const prop in obj) if (obj.hasOwnProperty(prop)) return false;

		return true;
	}

	public async sleep(ms: number) {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}
}

const util = new Util();
export default util;
