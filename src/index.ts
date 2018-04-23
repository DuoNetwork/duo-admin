import pf from "./priceSender/priceFeed";
import listenToAcceptPrice from "./listenToAcceptPrice";
// import createAccount from "./accounts/createAccounts";
import bitfinexTradeFeedUtil  from "./dataFetcher/bitfinex/bitfinexUtil";
import geminiTradeFeedUtil from "./dataFetcher/gemini/geminiUtil";
import krankenTradeFeedUtil from "./dataFetcher/kraken/krakenUtil";
import coinbaseGDAXTradeFeedUtil from "./dataFetcher/gdax/gdaxUtil";

let tool: string = process.argv[2];
// let option: string = process.argv[3];

switch (tool) {
	case "pf":
		console.log("starting commitPrice process");
		pf.startFeeding();
		break;
	case "acceptPrice":
		console.log("starting listening to acceptPrice event");
		listenToAcceptPrice.startListening();
		break;
	// case "createAccount":
	// 	console.log("starting create accounts");
	// 	createAccount.createAccount(option);
	// 	break;
	case "bitfinex":
		console.log("starting fetchTrade of bitfinex");
		bitfinexTradeFeedUtil.fetchETHTradesByOwnWebSocket();
		break;
	case "gemini":
		console.log("starting fetchTrade of gemini");
		geminiTradeFeedUtil.fetchETHTradesByOwnWebSocket();
		break;
	case "kraken":
		console.log("starting fetchTrade of kraken");
		krankenTradeFeedUtil.startFetching();
		break;

	case "gdax":
		console.log("starting fetchTrade of gdax");
		coinbaseGDAXTradeFeedUtil.startFetching();
		break;
	default:
		 console.log("no such tool");
		 break;
}
