import { BaseContractWrapper, Constants as WrapperConstants, DualClassWrapper, IEvent, VivaldiWrapper, Web3Wrapper } from '@finbook/duo-contract-wrapper';
import { Constants as DataConstants } from '@finbook/duo-market-data';
import * as CST from '../common/constants';
import dbUtil from './dbUtil';
import util from './util';

class EventUtil {
	public async trigger(account: string, dualClassWrappers: Array<DualClassWrapper | VivaldiWrapper>, event: string) {
		util.logInfo('subscribing to ' + event);
		if (
			![WrapperConstants.EVENT_START_PRE_RESET, WrapperConstants.EVENT_START_RESET].includes(
				event
			)
		) {
			util.logError('invalid event, exit');
			return Promise.resolve();
		}

		global.setInterval(async () => {
			dbUtil.insertHeartbeat();
			const promiseList = dualClassWrappers.map(async dcw => {
				const sysState = await dcw.getStates();
				const state = sysState.state;
				util.logDebug('current state is ' + state + ' for ' + dcw.address);

				if (
					event === WrapperConstants.EVENT_START_PRE_RESET &&
					state === WrapperConstants.CTD_PRERESET
				)
					await dcw.triggerPreReset(account);
				else if (
					event === WrapperConstants.EVENT_START_RESET &&
					state === WrapperConstants.CTD_RESET
				)
					await dcw.triggerReset(account);
				else util.logDebug('state not matched!');
			});
			await Promise.all(promiseList);
		}, 15000);
	}

	public async fetch(BaseContractWrappers: BaseContractWrapper[], force: boolean) {
		util.logInfo('fetching events');
		if (BaseContractWrappers.length <= 0) {
			util.logDebug('no contractWrappers initiated');
			return;
		}

		const web3Wrapper = BaseContractWrappers[0].web3Wrapper;

		let startBlk = force
			? web3Wrapper.inceptionBlockNumber
			: Math.max(await dbUtil.readLastBlock(), web3Wrapper.inceptionBlockNumber);
		util.logInfo('starting blk number: ' + startBlk);
		const loop = async () => {
			const blockTimestampMap: { [blk: number]: number } = {};
			const currentBlk = await web3Wrapper.getCurrentBlockNumber();
			while (startBlk <= currentBlk) {
				const allEvents: IEvent[] = [];
				const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
				const promiseList: Array<Promise<any>> = [];
				BaseContractWrappers.forEach(bw =>
					bw.events.forEach(event =>
						promiseList.push(Web3Wrapper.pullEvents(bw.contract, startBlk, end, event))
					)
				);

				const results = await Promise.all(promiseList);
				for (const result of results)
					for (const el of result) {
						const blockTimestamp =
							blockTimestampMap[el.blockNumber] ||
							(await web3Wrapper.getBlockTimestamp(el.blockNumber));
						blockTimestampMap[el.blockNumber] = blockTimestamp;
						allEvents.push(Web3Wrapper.parseEvent(el, blockTimestamp));
					}

				util.logInfo(
					'total ' + allEvents.length + ' events from block ' + startBlk + ' to ' + end
				);
				if (allEvents.length > 0) await dbUtil.insertEventsData(allEvents);

				await dbUtil.insertHeartbeat({
					[DataConstants.DB_ST_BLOCK]: { N: end + '' }
				});
				startBlk = end + 1;
			}
			global.setTimeout(() => loop(), CST.EVENT_FETCH_TIME_INTERVAL);
		};
		await loop();
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
