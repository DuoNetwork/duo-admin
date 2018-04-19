
// CLIENT-SIDE
// import { createPublicKrakenClient } from 'kraken-api-universal-client';
 

'use strict';




class KrankenTesting {

	// fetchCurrentETHPriceByOwnWebSocket() {


	// 	const publicKraken = createPublicKrakenClient();
 
	// 	// Handles only public requests; will throw error if attempting private requests
	// 	publicKraken.request('Trades', { pair : 'ETHUSD', since:'0' })
	// 		.then(response => { 
                
	// 			console.log(response);
	// 			/* handle response */ }
	// 		)
	// 		.catch(error => { 
	// 			console.log(error);
	// 		});

	// }
    


	/*


    https://www.kraken.com/help/api#get-recent-trades

Input:

pair = asset pair to get trade data for
since = return trade data since given id (optional.  exclusive)

Output

<pair_name> = pair name
    array of array entries(<time>, <bid>, <ask>)
last = id to be used as since when polling for new spread data


Kranken实际的return value：
    array of array entries(<time>, <bid>, <ask>)

    price,       amount,         timestamp       trade type
[ '556.70000', '0.81900000', 1524154859.9084, 's', 'l', '' ]
[ '557.62000', '0.30160936', 1524154843.7233, 'b', 'l', '' ]



    */

	fetchCurrentETHPrice() {


		const Kraken = require('kraken-wrapper');

		const kraken = new Kraken();

		kraken.getTrades({ pair: 'ETHUSD' }).then((response) => {
			// var jsonObj= JSON.parse(response);
            
			var returnFirstLevelArray=response.result.XETHZUSD;
	

			returnFirstLevelArray.forEach(function(secondLevelArr){
				console.log(secondLevelArr);
				secondLevelArr.forEach(function(value){
					console.log(value);
				});
			});

			// console.log(response);
            
			var last=returnFirstLevelArray=response.result.last;
			console.log(last);

		}).catch((error) => {
			console.log(error);
		});

	}
}
let krankenUtil = new KrankenTesting();
krankenUtil.fetchCurrentETHPrice();


