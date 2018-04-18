
'use strict';

class GeminiUtil {
 
	//version 2 WebSocket API ---

	fetchCurrentETHPriceByOwnWebSocket() {

		const ws = require('ws');
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');
	
		w.on('message', (msg) => {
			var parsedJson= JSON.parse(msg);
			// console.log(parsedJson.events[0].type);
			if(parsedJson.events[0].type=='trade'){
				console.log(parsedJson);
			}

			// console.log(msg);
		});
 
	
		w.on('open', () => {
			console.log('WebSocket is open');
		});  

	}

}

let geminiUtil = new GeminiUtil();
geminiUtil.fetchCurrentETHPriceByOwnWebSocket();


