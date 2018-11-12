import BeethovanWapper from '../../../duo-contract-wrapper/src/BeethovanWapper';
import Web3Wrapper from '../../../duo-contract-wrapper/src/Web3Wrapper';
import * as CST from '../common/constants';
import { IEvent, IOption } from '../common/types';
import dynamoUtil from './dynamoUtil';
import util from './util';

class EventUtil {
	public async subscribe(
		address: string,
		privateKey: string,
		beethovanWapper: BeethovanWapper,
		option: IOption
	) {
		util.logInfo('subscribing to ' + option.event);

		if (option.source)
			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event))
				setInterval(async () => {
					const sysState = await beethovanWapper.getStates();
					const state = sysState.state;
					util.logInfo('current state is ' + state);

					if (option.event === CST.EVENT_START_PRE_RESET && state === CST.CTD_PRERESET)
						await beethovanWapper.triggerPreReset(address, privateKey);
					else if (option.event === CST.EVENT_START_RESET && state === CST.CTD_RESET)
						await beethovanWapper.triggerReset(address, privateKey);

					dynamoUtil.insertHeartbeat();
				}, 15000);
			else {
				let startBlk = option.force
					? beethovanWapper.inceptionBlk
					: Math.max(await dynamoUtil.readLastBlock(), beethovanWapper.inceptionBlk);
				util.logInfo('starting blk number: ' + startBlk);
				let isProcessing = false;
				const fetch = async () => {
					if (isProcessing) return;

					isProcessing = true;
					const currentBlk = await beethovanWapper.web3Wrapper.getCurrentBlock();
					while (startBlk <= currentBlk) {
						// const block = await contractUtil.web3.eth.getBlock(startBlk);
						// let timestamp = block.timestamp * 1000;
						const allEvents: IEvent[] = [];
						const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
						const promiseList = CST.EVENTS.map(event =>
							Web3Wrapper.pullEvents(beethovanWapper.contract, startBlk, end, event)
						);

						const results = await Promise.all(promiseList);
						for (const result of results)
							for (const el of result) {
								const block = await beethovanWapper.web3Wrapper.web3.eth.getBlock(
									el.blockNumber
								);
								allEvents.push(Web3Wrapper.parseEvent(el, block.timestamp * 1000));
							}

						util.logInfo(
							'total ' +
								allEvents.length +
								' events from block ' +
								startBlk +
								' to ' +
								end
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
		else {
			util.logInfo('starting listening ' + option.event);
			let tg: (r: any) => Promise<any> = () => Promise.resolve();

			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)) {
				const sysState = await beethovanWapper.getStates();
				const state = sysState.state;
				util.logInfo('current state is ' + state);

				if (option.event === CST.EVENT_START_PRE_RESET) {
					tg = () => beethovanWapper.triggerPreReset(address, privateKey);
					if (state === CST.CTD_PRERESET)
						await beethovanWapper.triggerPreReset(address, privateKey);
				} else if (option.event === CST.EVENT_START_RESET) {
					tg = () => beethovanWapper.triggerReset(address, privateKey);
					if (state === CST.CTD_RESET)
						await beethovanWapper.triggerReset(address, privateKey);
				}
			} else return Promise.resolve();

			beethovanWapper.contract.events[option.event]({}, async (error, evt) => {
				if (error) util.logInfo(error);
				else {
					util.logInfo(evt);
					await tg(evt);
				}
			});

			setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
