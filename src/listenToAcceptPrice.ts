import * as CST from './constant';
const rp = require('request-promise');
import { Promise } from 'es6-promise';

const addressCustodianContract = CST.addressCustodianContract;
const ETHSCAN_API_KEY = CST.ETHSCAN_API_KEY;
const ETHSCAN_API_KOVAN_LINK = CST.ETHSCAN_API_KOVAN_LINK;
const KOVAN_FROM_BLOCK = CST.KOVAN_FROM_BLOCK;
const ACCEPT_PRICE_EVENT = CST.ACCEPT_PRICE_EVENT;

const RESULT = 'result';

class ListenToAcceptPrice {
	getLogs(url: string): Promise<string> {
		return new Promise((resolve, reject) =>
			rp(
				{
					url: url,
					headers: {
						'user-agent': 'node.js'
					}
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	startListening() {
		
		let logLink = ETHSCAN_API_KOVAN_LINK+'module=logs&action=getLogs&fromBlock='+KOVAN_FROM_BLOCK+
		'&toBlock=latest&address='+addressCustodianContract
		+'&topic0='+ACCEPT_PRICE_EVENT+'&apikey='+ETHSCAN_API_KEY;

		let listenAcceptPriceFunc = () => {
			console.log("making a request to etherscan");
			
			this.getLogs(logLink)
				.then(res => {
					let data = JSON.parse(res);
					let result = data[RESULT];
					// console.log(result);
					for(let i = 0; i< result.length; i++){
						let price =parseInt(result[i].topics[1],16);
						let time = parseInt(result[i].topics[2],16);
						console.log("new price accepted: "+price+" at "+time);
						// console.log(time);
					}
					// console.log(priceInWei);
					// console.log(priceInSeconds);
				});
				
		};

		
		var schedule = require('node-schedule');


		var job = schedule.scheduleJob({ rule: '/2 * * * *' }, listenAcceptPriceFunc);
	}
}

let listenToAcceptPrice = new ListenToAcceptPrice();
export default listenToAcceptPrice;



