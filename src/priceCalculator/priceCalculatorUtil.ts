'use strict';
var MysqlUtil = require('../utils/mysqlUtil');
import * as CST from '../constant';

let dbConn;

const DB_HOST = CST.DB_HOST;
const DB_USER = CST.DB_USER;
const DB_PASSWORD = CST.DB_PASSWORD;
const DB_PRICEFEED = CST.DB_PRICEFEED;
const DB_TABLE_TRADE = CST.DB_TABLE_TRADE;

export class CalculatePrice {
	
}
const geminiTradeFeedUtil = new CalculatePrice();
export default geminiTradeFeedUtil;