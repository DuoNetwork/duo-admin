import * as CST from '../constants';
import BaseApi from './BaseApi';
import bitfinexApi from './bitfinexApi';
import gdaxApi from './gdaxApi';
import geminiApi from './geminiApi';
import krakenApi from './krakenApi';

const apis: { [key: string]: BaseApi } = {
	[CST.EXCHANGE_BITFINEX]: bitfinexApi,
	[CST.EXCHANGE_GEMINI]: geminiApi,
	[CST.EXCHANGE_KRAKEN]: krakenApi,
	[CST.EXCHANGE_GDAX]: gdaxApi
};

export default apis;
