import { Constants as DataConstants } from '@finbook/duo-market-data';
import moment from 'moment';
import * as CST from '../common/constants';
import { IOption } from '../common/types';

class Util {
	public logLevel: string = CST.LOG_INFO;

	public logInfo(text: any) {
		this.log(text, CST.LOG_INFO);
	}

	public logDebug(text: any) {
		this.log(text, CST.LOG_DEBUG);
	}

	public logError(text: any) {
		this.log(text, CST.LOG_ERROR);
	}

	private log(text: any, level: string) {
		if (CST.LOG_RANKING[this.logLevel] >= CST.LOG_RANKING[level])
			console.log(
				`${moment.utc(util.getUTCNowTimestamp()).format('DD HH:mm:ss.SSS')} [${level}]: ` +
					text
			);
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
			events: [''],
			sources: [''],
			exSources: [''],
			pairs: [''],
			source: '',
			event: '',
			provider: '',
			period: 1
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
				case 'events':
					option.events = args[1].split(',');
					break;
				case 'pairs':
					option.pairs = args[1].split(',');
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
		let privacy = option.dynamo ? '_PUBLIC' : '_PRIVATE';
		let source = '';

		switch (tool) {
			case CST.TRADES:
				type = 'TRADE';
				source = option.source ? '_' + option.source.toUpperCase() : '';
				break;
			case CST.EVENTS:
				type = 'EVENT';
				source = option.event ? '_' + option.event.toUpperCase() : '';
				if (option.event === CST.EVENTS_OTHERS) privacy = '_PUBLIC';
				break;
			case CST.COMMIT:
				type = 'FEED';
				break;
			case CST.CLEAN_DB:
				type = 'CLEANDB';
				break;
			case DataConstants.DB_PRICES:
				type = 'PRICE';
				if (option.period === 1) source = '_MINUTELY';
				else if (option.period === 60) source = '_HOURLY';
				else source = '';
				break;
			case CST.FETCH_PRICE:
				type = 'FETCH';
				break;
			case CST.ROUND:
				type = 'ROUND';
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
