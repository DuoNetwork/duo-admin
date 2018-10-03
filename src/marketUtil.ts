import child_process from 'child_process';
import apis from './apis';
import { IOption } from './types';
import util from './util';

class MarketUtil {
	public async startFetching(tool: string, option: IOption): Promise<void> {
		const assetIds = option.assets.length
			? option.assets
			: option.pair.split('|').filter(asset => asset !== '');
		console.log('source' + option.source);

		if (!option.source) {
			util.logInfo('launching all sources for assets ' + assetIds.join(',') + ' in WS');
			for (const source in apis) {
				await util.sleep(1000);
				this.launchSource(tool, source, assetIds, option);
			}
		} else {
			const api = apis[option.source];
			if (!api) throw new Error('invalid source');
			api.init();

			const sourceInstruments = api.getSourceInstruments(assetIds);
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
			`npm run ${tool} source=${source} assets=${assets.join(',')} ${
				option.forceREST ? 'rest' : ''
			}` +
			(process.platform === 'win32' ? '>>' : '&>') +
			` ${tool}.${source}.${assets.join('.')}.log`;

		util.logInfo(`[${source}]: ${cmd}`);

		const procInstance = child_process.exec(
			cmd,
			process.platform === 'win32' ? {} : { shell: '/bin/bash' }
		);

		if (!procInstance) util.logError('failed to launch ' + source);
		else util.logInfo(`[${source}]: Launched ${tool}  ${assets.join(',')}`);
	}
}

const marketUtil = new MarketUtil();
export default marketUtil;
