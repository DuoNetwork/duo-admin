import pf from "./priceFeed";

let tool = process.argv[2];

switch (tool) {
	case "pf":
		pf.startFeeding();
		break;

}
