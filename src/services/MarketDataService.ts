import child_process from 'child_process';
import apis from '../apis';
import { IOption, ISubProcess } from '../common/types';
import dbUtil from '../utils/dbUtil';
import osUtil from '../utils/osUtil';
import util from '../utils/util';
import BaseService from './BaseService';

export default class MarketDataService extends BaseService {
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
			this.retry(tool, option, source, assets);
		} else {
			util.logInfo(`[${source}]: Launched ${tool}  ${assets.join(',')}`);
			procInstance.on('exit', code => {
				util.logError(`[${source}]: Exit with code ${code}`);
				if (code) this.retry(tool, option, source, assets);
			});
		}
	}

	public retry(tool: string, option: IOption, source: string, assets: string[]) {
		const now: number = util.getUTCNowTimestamp();

		if (now - this.subProcesses[source].lastFailTimestamp < 30000)
			this.subProcesses[source].failCount++;
		else this.subProcesses[source].failCount = 1;

		this.subProcesses[source].lastFailTimestamp = now;

		if (this.subProcesses[source].failCount < 3)
			global.setTimeout(() => this.launchSource(tool, source, assets, option), 5000);
		else util.logError('Retry Aborted ' + source);
	}

	public async cleanDb() {
		await dbUtil.init(this.tool, this.option, this.web3Wrapper);
		dbUtil.cleanDB();
		global.setInterval(() => dbUtil.cleanDB(), 60000 * 60 * 24);
		global.setInterval(() => dbUtil.insertHeartbeat(), 30000);
	}
}
