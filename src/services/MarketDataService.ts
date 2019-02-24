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

	public async startFetching(tool: string, option: IOption): Promise<void> {
		const assetIds = option.assets.length
			? option.assets
			: option.pair.split('|').filter(asset => asset !== '');

		if (!option.source) {
			util.logInfo('launching all sources for assets ' + assetIds.join(',') + ' in WS');
			for (const source in apis) {
				await util.sleep(1000);
				this.subProcesses[source] = {
					source: source,
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
		if (!option.event) {
			option.event = 'public';
			this.subProcesses[option.event] = {
				source: option.event,
				lastFailTimestamp: 0,
				failCount: 0,
				instance: undefined as any
			};
			this.launchEvent(tool, option.event, option);
		} else {
			util.logDebug('start fetching events');
			new ContractService(tool, option).fetchEvent();
		}
	}

	public launchSource(tool: string, source: string, assets: string[], option: IOption) {
		util.logInfo(source);
		const cmd =
			`npm run ${tool} source=${source} assets=${assets.join(',')}${
			option.dynamo ? ' dynamo' : ''
			}${option.azure ? ' azure' : ''}${option.gcp ? ' gcp' : ''}${option.aws ? ' aws' : ''}${
			option.server ? ' server' : ''
			} ${option.forceREST ? 'rest' : ''}` +
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
			this.retry(tool, option, source, assets, false);
		} else {
			util.logInfo(`[${source}]: Launched ${tool}  ${assets.join(',')}`);
			procInstance.on('exit', code => {
				util.logError(`[${source}]: Exit with code ${code}`);
				if (code) this.retry(tool, option, source, assets, false);
			});
		}
	}

	launchEvent(tool: string, event: string, option: IOption) {
		const cmd =
			`npm run ${tool} event=${event}${
			option.dynamo ? ' dynamo' : ''
			} ${option.azure ? ' azure' : ''}${option.gcp ? ' gcp' : ''}${option.aws ? ' aws' : ''}${
			option.server ? ' server' : ''
			}` +
			(osUtil.isWindows() ? '>>' : '&>') +
			` ${tool}.${option.event}.log`;

		console.log(cmd);
		const procInstance = child_process.exec(
			cmd,
			osUtil.isWindows() ? {} : { shell: '/bin/bash' }
		);

		this.subProcesses[option.event].instance = procInstance;
		this.subProcesses[option.event].lastFailTimestamp = util.getUTCNowTimestamp();

		if (!procInstance) {
			util.logError('Failed to launch public event ');
			this.retry(tool, option, option.event, [], true);
		} else {

			procInstance.on('exit', code => {
				util.logError(`[${option.event}]: Exit with code ${code}`);
				if (code) this.retry(tool, option, option.event, [], true);
			});
		}

	}

	public retry(tool: string, option: IOption, source: string, assets: string[], isEvent: boolean) {
		const now: number = util.getUTCNowTimestamp();

		if (now - this.subProcesses[source].lastFailTimestamp < 30000)
			this.subProcesses[source].failCount++;
		else this.subProcesses[source].failCount = 1;

		this.subProcesses[source].lastFailTimestamp = now;

		if (this.subProcesses[source].failCount < 3 && isEvent) {
			global.setTimeout(() => this.launchEvent(tool, option.event, option), 5000);
		} else if (this.subProcesses[source].failCount < 3 && !isEvent) {
			global.setTimeout(() => this.launchSource(tool, source, assets, option), 5000);

		}
		else util.logError('Retry Aborted ' + source);
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
