
// CLIENT-SIDE
import { createPublicKrakenClient } from 'kraken-api-universal-client';
 

'use strict';




class KrankenTesting {

	fetchCurrentETHPriceByOwnWebSocket() {


		const publicKraken = createPublicKrakenClient();
 
		// Handles only public requests; will throw error if attempting private requests
		publicKraken.request('trade')
			.then(response => { 
                
				console.log(response);
				/* handle response */ }
			)
			.catch(error => { 
				console.log(error);
			});

	}

}

let krankenUtil = new KrankenTesting();
krankenUtil.fetchCurrentETHPriceByOwnWebSocket();


