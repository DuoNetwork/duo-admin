import ContractUtil from '../../duo-contract-util/src/contractUtil';
import * as CST from './constants';
import dynamoUtil from './database/dynamoUtil';
import { IEvent, IOption } from './types';
import util from './util';

class EventUtil {
	public async subscribe(
		address: string,
		privateKey: string,
		contractUtil: ContractUtil,
		option: IOption
	) {
		util.log('subscribing to ' + option.event);

		if (option.source)
			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event))
				setInterval(async () => {
					const sysState = await contractUtil.getCustodianStates();
					const state = sysState.state;
					util.log('current state is ' + state);

					if (option.event === CST.EVENT_START_PRE_RESET && state === CST.CTD_PRERESET)
						await contractUtil.triggerPreReset(address, privateKey);
					else if (
						option.event === CST.EVENT_START_RESET &&
						[CST.CTD_UP_RESET, CST.CTD_DOWN_RESET, CST.CTD_PERIOD_RESET].includes(
							state
						)
					)
						await contractUtil.triggerReset(address, privateKey);

					dynamoUtil.insertHeartbeat();
				}, 15000);
			else {
				let startBlk = option.force
					? contractUtil.inceptionBlk
					: Math.max(await dynamoUtil.readLastBlock(), contractUtil.inceptionBlk);
				util.log('starting blk number: ' + startBlk);
				let isProcessing = false;
				const fetch = async () => {
					if (isProcessing) return;

					isProcessing = true;
					const currentBlk = await contractUtil.web3.eth.getBlockNumber();
					while (startBlk <= currentBlk) {
						// const block = await contractUtil.web3.eth.getBlock(startBlk);
						// let timestamp = block.timestamp * 1000;
						const allEvents: IEvent[] = [];
						const end = Math.min(startBlk + CST.EVENT_FETCH_BLOCK_INTERVAL, currentBlk);
						const promiseList = CST.EVENTS.map(event =>
							contractUtil.pullEvents(contractUtil.custodian, startBlk, end, event)
						);

						const results = await Promise.all(promiseList);
						for (const result of results)
							for (const el of result) {
								const block = await contractUtil.web3.eth.getBlock(el.blockNumber);
								allEvents.push(contractUtil.parseEvent(el, block.timestamp * 1000));
							}

						util.log(
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
			util.log('starting listening ' + option.event);
			let tg: (r: any) => Promise<any> = () => Promise.resolve();

			if ([CST.EVENT_START_PRE_RESET, CST.EVENT_START_RESET].includes(option.event)) {
				const sysState = await contractUtil.getCustodianStates();
				const state = sysState.state;
				util.log('current state is ' + state);

				if (option.event === CST.EVENT_START_PRE_RESET) {
					tg = () => contractUtil.triggerPreReset(address, privateKey);
					if (state === CST.CTD_PRERESET)
						await contractUtil.triggerPreReset(address, privateKey);
				} else if (option.event === CST.EVENT_START_RESET) {
					tg = () => contractUtil.triggerReset(address, privateKey);
					if (
						[CST.CTD_UP_RESET, CST.CTD_DOWN_RESET, CST.CTD_PERIOD_RESET].includes(
							state
						)
					)
						await contractUtil.triggerReset(address, privateKey);
				}
			} else return Promise.resolve();

			contractUtil.custodian.events[option.event]({}, async (error, evt) => {
				if (error) util.log(error);
				else {
					console.log(evt);
					await tg(evt);
				}
			});

			setInterval(() => dynamoUtil.insertHeartbeat(), 30000);
		}
	}
}

const eventUtil = new EventUtil();
export default eventUtil;
