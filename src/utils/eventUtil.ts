import BaseWrapper from '../../../duo-contract-wrapper/src/BaseWrapper';
import BeethovenWapper from '../../../duo-contract-wrapper/src/BeethovenWapper';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from '../common/constants';
import { IEvent, IOption } from '../common/types';
import dynamoUtil from './dynamoUtil';
import util from './util';

class EventUtil {
	public async trigger(
		address: string,
		privateKey: string,
		beethovenWappers: BeethovenWapper[],
		option: IOption
	) {
		util.logInfo('subscribing to ' + option.event);
		if (![CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)) {
			util.logError('invalid event, exit');
			return Promise.resolve();
		}

		if (option.source)
			setInterval(async () => {
				const promiseList = beethovenWappers.map(async bw => {
					const sysState = await bw.getStates();
					const state = sysState.state;
					util.logDebug('current state is ' + state + ' for ' + bw.address);

					if (option.event === CST.EVENT_START_PRE_RESET && state === CST.CTD_PRERESET)
						await bw.triggerPreReset(address, privateKey);
					else if (option.event === CST.EVENT_START_RESET && state === CST.CTD_RESET)
						await bw.triggerReset(address, privateKey);

					dynamoUtil.insertHeartbeat();
				});
				await Promise.all(promiseList);
			}, 15000);
		else {
			for (const bw of beethovenWappers) {
				util.logInfo('starting listening ' + option.event + ' for ' + bw.address);
				let tg: () => Promise<any> = () => Promise.resolve();
				const sysState = await bw.getStates();
				const state = sysState.state;
				util.logInfo('current state is ' + state + ' for ' + bw.address);

				if (option.event === CST.EVENT_START_PRE_RESET) {
					tg = () => bw.triggerPreReset(address, privateKey);
					if (state === CST.CTD_PRERESET) await tg();
				} else if (option.event === CST.EVENT_START_RESET) {
					tg = () => bw.triggerReset(address, privateKey);
					if (state === CST.CTD_RESET) await tg();
				}

				bw.contract.events[option.event]({}, async (error, evt) => {
					if (error) util.logInfo(error);
					else {
						util.logInfo(evt);
						await tg();
					}
				});
			}

			setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		}
	}

	public async fetch(baseWrappers: BaseWrapper[], force: boolean) {
		util.logInfo('fetching events');

		const web3Wrapper = baseWrappers[0].web3Wrapper;

		let startBlk = force
			? web3Wrapper.inceptionBlockNumber
			: Math.max(await dynamoUtil.readLastBlock(), web3Wrapper.inceptionBlockNumber);
		util.logInfo('starting blk number: ' + startBlk);
		let isProcessing = false;
		const fetch = async () => {
			if (isProcessing) return;

			isProcessing = true;
			const blockTimestampMap: { [blk: number]: number } = {};
			const currentBlk = await web3Wrapper.getCurrentBlockNumber();
			while (startBlk <= currentBlk) {
				const allEvents: IEvent[] = [];
				const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
				const promiseList: Array<Promise<any>> = [];
				baseWrappers.forEach(bw =>
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
				if (allEvents.length > 0) await dynamoUtil.insertEventsData(allEvents);
				await dynamoUtil.insertHeartbeat({
					[CST.DB_ST_BLOCK]: { N: end + '' }
				});
				startBlk = end + 1;
			}
			isProcessing = false;
		};
		fetch();
		setInterval(() => fetch(), CST.EVENT_FETCH_TIME_INVERVAL);
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
