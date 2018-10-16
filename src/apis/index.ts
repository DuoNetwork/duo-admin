import * as CST from '../common/constants';
import BaseApi from './BaseApi';
import bitfinexApi from './bitfinexApi';
import gdaxApi from './gdaxApi';
import geminiApi from './geminiApi';
import krakenApi from './krakenApi';

const apis: { [key: string]: BaseApi } = {
	[CST.API_BITFINEX]: bitfinexApi,
	[CST.API_GEMINI]: geminiApi,
	[CST.API_KRAKEN]: krakenApi,
	[CST.API_GDAX]: gdaxApi
};

export default apis;
