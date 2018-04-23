
'use strict';

class GeminiUtil {

	fetchETHTradesByOwnWebSocket() {

		const ws = require('ws');
		const w = new ws('wss://api.gemini.com/v1/marketdata/ETHUSD');
	
		w.on('message', (msg) => {
			var parsedJson= JSON.parse(msg);
			
			console.log(parsedJson);

				
			// if(parsedJson.events[0].type=='trade'){
			// 	console.log(parsedJson.events[0]);
			// }
			// console.log(msg);
		});
 
	
		w.on('open', () => {
			console.log('[Gemini]-WebSocket is open');
		});  
	}

}

let geminiUtil = new GeminiUtil();
geminiUtil.fetchETHTradesByOwnWebSocket();


