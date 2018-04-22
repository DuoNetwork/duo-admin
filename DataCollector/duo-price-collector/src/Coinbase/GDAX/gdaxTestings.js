
'use strict';

// const request = require('request');

class GDAXUtil {

	fetchETHTradesHTTPSRestfulAPI(){
		var https = require('https');

		var options = {
			host: 'api.gdax.com',
			path: '/products/ETH-USD/trades',
			port: '443',
			//This is the only line that is new. `headers` is an object with the headers to request
			headers: {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0'}
		};

		var callbackFunc = function(response) {
			var responseStr = '';
			response.on('data', function (chunk) {
				responseStr += chunk;
			});

			response.on('end', function () {
				// console.log(str);

				console.log(responseStr);
				console.log('type:'+Object.prototype.toString(responseStr));
				var tradeObj= JSON.parse(responseStr);

				tradeObj.forEach(function(item){
					console.log(item);

				});
			});
		};

/*

output is:

{ time: '2018-04-22T03:37:51.027Z',
  trade_id: 32537453,
  price: '601.59000000',
  size: '0.01000000',
  side: 'buy' }

{ time: '2018-04-22T03:37:51.82Z',
  trade_id: 32537459,
  price: '601.37000000',
  size: '2.01374149',
  side: 'sell' }

  */


		var req = https.request(options, callbackFunc);
		req.end();
	}


	// fetchETHTradesByRestfulAPI(){
	// 	// https://api.gdax.com/products/ETH-USD/trades
		
	// 	var options = {
	// 		host: '"https://api.gdax.com',
	// 		path: '/products/ETH-USD/trades"',
	// 		port: '443',
	// 		headers: {'User-Agent': ''}
	// 	  };

	// 	request.get(options,
	// 		function(error, response, body) {
	// 			console.log(response+" "+error+" "+body);
	// 			// console.log('type:'+Object.prototype.toString(body));
	// 		});
	// }



	fetchETHTradesByOwnWebSocket() {

		const ws = require('ws');
		const w = new ws('wss://ws-feed.gdax.com');

		w.on('message', (msg) => {
			var parsedJson= JSON.parse(msg);

			// filter out the cancelled 
			// focus on the 'Done' and 'filled' orders only.
			if(parsedJson.type=="done" && (parsedJson.reason=="filled")){
				console.log(msg);
			}
		});

		// let msg = "{ \"type\": \"subscribe\", \"product_ids\": [ \"ETH-USD\" ], \"channels\": [ \"level2\", \"heartbeat\", { \"name\": \"ticker\", \"product_ids\": [ \"ETH-BTC\", \"ETH-USD\" ] } ] }";
		let msg = "{ \"type\": \"subscribe\", \"product_ids\": [ \"ETH-USD\" ] }";
		w.on('open', () => {
			console.log('[Coinbase_Gdax]-WebSocket is open');
			w.send(msg);
			console.log('subscribe trade');
		});  


	}
}
let gdaxUtil = new GDAXUtil();
gdaxUtil.fetchETHTradesHTTPSRestfulAPI();


