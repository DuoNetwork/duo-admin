import { Constants } from '@finbook/duo-market-data';
import BaseApi from './BaseApi';
import bitstampApi from './bitstampApi';
import gdaxApi from './gdaxApi';
import geminiApi from './geminiApi';
import krakenApi from './krakenApi';

const apis: { [key: string]: BaseApi } = {
	[Constants.API_GEMINI]: geminiApi,
	[Constants.API_KRAKEN]: krakenApi,
	[Constants.API_GDAX]: gdaxApi,
	[Constants.API_BITSTAMP]: bitstampApi
};

export default apis;
