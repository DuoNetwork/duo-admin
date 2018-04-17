import pf1 from "./priceFeed1";

let tool = process.argv[2];

switch (tool) {
	case "pf1":
		pf1.startFeeding();
		break;

}
