import child_process from 'child_process';
import apis from '../apis';
import * as CST from '../common/constants';
import { IOption, ISubProcess } from '../common/types';
import ContractService from '../services/ContractService';
import dbUtil from '../utils/dbUtil';
import osUtil from '../utils/osUtil';
import priceUtil from '../utils/priceUtil';
import util from '../utils/util';

export default class MarketDataService {
	public subProcesses: { [key: string]: ISubProcess } = {};

	public async startFetchingTrade(tool: string, option: IOption): Promise<void> {
		const assetIds = option.assets.length
			? option.assets
			: option.pair.split('|').filter(asset => asset !== '');

		if (!option.source) {
			util.logInfo('launching all sources for assets ' + assetIds.join(',') + ' in WS');
			for (const source in apis) {
				await util.sleep(1000);
				this.subProcesses[source] = {
					processName: source,
					lastFailTimestamp: 0,
					failCount: 0,
					instance: undefined as any
				};
				this.launchSource(tool, source, assetIds, option);
			}
		} else {
			const api = apis[option.source];
			if (!api) throw new Error('invalid source');
			api.init();

			const sourceInstruments = api.getSourcePairs(assetIds);
			if (!sourceInstruments.length) {
				util.logInfo(`[${option.source}]: No sourceInstruments to fetch. Process.exit()`);
				return;
			}
			util.logInfo(
				`[${option.source}]:` +
					'start fetching for pairs ' +
					JSON.stringify(
						sourceInstruments.map(instrument => api.sourcePairMapping[instrument])
					)
			);
			apis[option.source].fetchTrades(sourceInstruments);
		}
	}

	public async startFetchingEvent(tool: string, option: IOption): Promise<void> {
		if (!option.event)
			for (const event of option.events) {
				option.event = event;
				this.subProcesses[event] = {
					processName: option.event,
					lastFailTimestamp: 0,
					failCount: 0,
					instance: undefined as any
				};
				this.launchEvent(tool, event, option);
			}
		else {
			util.logDebug('start fetching events');
			const contractService = new ContractService(tool, option);
			if ([CST.EVENTS_START_PRE_RESET, CST.EVENTS_START_RESET].includes(option.event))
				contractService.trigger();
			else contractService.fetchEvent();
		}
	}

	public async startPriceFixService(tool: string, option: IOption): Promise<void> {
		if ((!option.pairs || !option.pairs.length) && !option.pair) {
			util.logDebug(`no pairs or pair specified`);
			return;
		} else if (!option.pair)
			for (const pair of option.pairs) {
				option.pair = pair;
				this.subProcesses[pair] = {
					processName: option.pair,
					lastFailTimestamp: 0,
					failCount: 0,
					instance: undefined as any
				};
				this.launchPriceFixService(tool, pair, option);
			}
		else {
			util.logDebug(`start committing price fix for pair ${option.pair}`);
			const contractService = new ContractService(tool, option);
			switch (tool) {
				case CST.COMMIT:
					contractService.commitPrice();
					break;
				case CST.FETCH_PRICE:
					contractService.fetchPrice(option);
					break;
				default:
					util.logDebug(`tool ${tool} is wrong`);
					break;
			}
		}
	}

	public launchPriceFixService(tool: string, pair: string, option: IOption) {
		const cmd =
			`npm run ${tool} pair=${pair}${option.live ? ' live' : ''} ${
				option.azure ? ' azure' : ''
			}${option.gcp ? ' gcp' : ''}${option.aws ? ' aws' : ''}${
				option.server ? ' server' : ''
			}` +
			(osUtil.isWindows() ? ' >>' : ' &>') +
			` ${tool}.${option.pair}.log`;

		const procInstance = child_process.exec(
			cmd,
			osUtil.isWindows() ? {} : { shell: '/bin/bash' }
		);

		this.subProcesses[option.pair].instance = procInstance;
		this.subProcesses[option.pair].lastFailTimestamp = util.getUTCNowTimestamp();

		if (!procInstance) {
			util.logError('Failed to launch public pair ');
			this.retry(pair, () => this.launchPriceFixService(tool, pair, option));
		} else
			procInstance.on('exit', code => {
				util.logError(`[${option.pair}]: Exit with code ${code}`);
				if (code) this.retry(pair, () => this.launchPriceFixService(tool, pair, option));
			});
	}

	public launchSource(tool: string, source: string, assets: string[], option: IOption) {
		util.logInfo(source);
		const cmd =
			`npm run ${tool} source=${source} assets=${assets.join(',')}${
				option.dynamo ? ' dynamo' : ''
			}${option.live ? ' live' : ''}${option.azure ? ' azure' : ''}${
				option.gcp ? ' gcp' : ''
			}${option.aws ? ' aws' : ''}${option.server ? ' server' : ''} ${
				option.forceREST ? 'rest' : ''
			}` +
			(osUtil.isWindows() ? '>>' : '&>') +
			` ${tool}.${source}.${assets.join('.')}.log`;

		util.logInfo(`[${source}]: ${cmd}`);

		const procInstance = child_process.exec(
			cmd,
			osUtil.isWindows() ? {} : { shell: '/bin/bash' }
		);

		this.subProcesses[source].instance = procInstance;
		this.subProcesses[source].lastFailTimestamp = util.getUTCNowTimestamp();

		if (!procInstance) {
			util.logError('Failed to launch ' + source);
			this.retry(source, () => this.launchSource(tool, source, assets, option));
		} else {
			util.logInfo(`[${source}]: Launched ${tool}  ${assets.join(',')}`);
			procInstance.on('exit', code => {
				util.logError(`[${source}]: Exit with code ${code}`);
				if (code) this.retry(source, () => this.launchSource(tool, source, assets, option));
			});
		}
	}

	public launchEvent(tool: string, event: string, option: IOption) {
		const cmd =
			`npm run ${tool} event=${event}${option.event === CST.EVENTS_OTHERS ? ' dynamo' : ''}${
				option.live ? ' live' : ''
			} ${option.azure ? ' azure' : ''}${option.gcp ? ' gcp' : ''}${
				option.aws ? ' aws' : ''
			}${option.server ? ' server' : ''}${option.force ? ' force' : ''}` +
			(osUtil.isWindows() ? ' >>' : ' &>') +
			` ${tool}.${option.event}.log`;

		const procInstance = child_process.exec(
			cmd,
			osUtil.isWindows() ? {} : { shell: '/bin/bash' }
		);

		this.subProcesses[option.event].instance = procInstance;
		this.subProcesses[option.event].lastFailTimestamp = util.getUTCNowTimestamp();

		if (!procInstance) {
			util.logError('Failed to launch public event ');
			this.retry(event, () => this.launchEvent(tool, event, option));
		} else
			procInstance.on('exit', code => {
				util.logError(`[${option.event}]: Exit with code ${code}`);
				if (code) this.retry(event, () => this.launchEvent(tool, event, option));
			});
	}

	public retry(name: string, task: () => any) {
		const now: number = util.getUTCNowTimestamp();

		if (now - this.subProcesses[name].lastFailTimestamp < 30000)
			this.subProcesses[name].failCount++;
		else this.subProcesses[name].failCount = 1;

		this.subProcesses[name].lastFailTimestamp = now;

		if (this.subProcesses[name].failCount < 3) global.setTimeout(() => task(), 5000);
		else util.logError('Retry Aborted ' + name);
	}

	public async cleanDb() {
		dbUtil.cleanDB();
		global.setInterval(() => dbUtil.cleanDB(), 60000 * 60 * 24);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}

	public async startAggregate(period: number) {
		await dbUtil.insertHeartbeat({ period: { N: period + '' } });
		await priceUtil.aggregatePrice(period);

		global.setInterval(
			() => dbUtil.insertHeartbeat({ period: { N: period + '' } }),
			CST.STATUS_INTERVAL * 1000
		);
		global.setInterval(() => priceUtil.aggregatePrice(period), 30000);
	}
}
