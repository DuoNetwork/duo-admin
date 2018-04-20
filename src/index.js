import pf from "./priceFeed";
import listenToAcceptPrice from "./listenToAcceptPrice";
import createAccount from "./accounts/createAccounts";

let tool = process.argv[2];

switch (tool) {
	case "pf":
		console.log("starting commitPrice process");
		pf.startFeeding();
		break;
	case "acceptPrice":
		console.log("starting listening to acceptPrice event");
		listenToAcceptPrice.startListening();
		break;
	case "createAccount":
		console.log("starting create accounts");
		createAccount.createAccount(process.argv[3]);
		break;


}
