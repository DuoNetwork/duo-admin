import collector1 from "./Bitfinex/bitfinex";

let tool = process.argv[2];

switch (tool) {
	case "bitfinex":
		collector1.startProcess();
		break;

}
