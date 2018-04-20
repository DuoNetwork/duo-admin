
'use strict';

class GDAXUtil {

	fetchCurrentETHPriceByOwnWebSocket() {

		const ws = require('ws');
		const w = new ws('wss://ws-feed.gdax.com');

		w.on('message', (msg) => {
			console.log(msg);
		});

		// let msg = "{ \"type\": \"subscribe\", \"product_ids\": [ \"ETH-USD\" ], \"channels\": [ \"level2\", \"heartbeat\", { \"name\": \"ticker\", \"product_ids\": [ \"ETH-BTC\", \"ETH-USD\" ] } ] }";
		let msg = "{ \"type\": \"subscribe\", \"product_ids\": [ \"ETH-USD\" ] }";
		w.on('open', () => {
			console.log('[Bitfinex]-WebSocket is open');
			w.send(msg);
			console.log('subscribe trade');
		});  


	}
}
let gdaxUtil = new GDAXUtil();
gdaxUtil.fetchCurrentETHPriceByOwnWebSocket();


