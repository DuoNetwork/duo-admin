const abiDecoder = require('abi-decoder'); // NodeJS

const CustodianABI = require('../ABI/Custodian.json'); // Custodian Contract ABI

export class Decoder {
	decode(input) {
		abiDecoder.addABI(CustodianABI['abi']);

		return abiDecoder.decodeMethod(input);
	}
}

const decoder = new Decoder();
export default decoder;