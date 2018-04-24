import * as mysql from 'mysql';
// const math = require("mathjs");

export default class MysqlUtil {
	dbConn: mysql.Connection;
	exchange_name: string;
	db_host: string;
	db_user: string;
	db_password: string;
	db_name: string;
	db_table_name: string;

	constructor(exchange_name: string, db_host: string, db_user: string, db_password: string, db_name: string, db_table_name: string) {
		this.exchange_name = exchange_name;
		this.db_host = db_host;
		this.db_user = db_user;
		this.db_password = db_password;
		this.db_name = db_name;
		this.db_table_name = db_table_name;

		if (this.db_host == '') {
			console.log('[Required Parameters] Please input the correct DB parameters first.');
		}

		this.dbConn = mysql.createConnection({
			host: this.db_host,
			user: this.db_user,
			password: this.db_password,
			database: this.db_name
		});
	}

	initDB() {
		this.dbConn.connect(function(err) {
			if (err) {
				console.log('err' + err);
				// throw err;
			}
			console.log('Connected!');
			// dbConn.close();
		});
	}

	insertDataIntoMysql(
		exchange_soucre: string,
		trade_id: string,
		price: string,
		amount: string,
		trade_type: string,
		exchange_returned_timestamp: string
	) {
		if (this.dbConn === undefined) {
			console.log('dbConn is null. Begin to do the init().');
		}

		const system_timestamp = Math.floor(Date.now()); // record down the MTS
		if (!exchange_returned_timestamp) {
			exchange_returned_timestamp = system_timestamp + '';
		}
		// let price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		// let amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		const price_str = price.split('"').join('');
		const amount_str = amount.split('"').join('');

		const sql =
			'INSERT INTO ' +
			this.db_table_name +
			" VALUES ('" +
			exchange_soucre +
			"','" +
			trade_id +
			"','" +
			price_str +
			"','" +
			amount_str +
			"','" +
			trade_type +
			"','" +
			exchange_returned_timestamp +
			"','" +
			system_timestamp +
			"')";

		console.log(sql);
		this.dbConn.query(sql, function(err: any, result: any) {
			// if (err) throw err;
			if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
				// console.log('.');
				// rocess.stdout.write(".");
			} else if (err) {
				console.log('err' + err);
			} else {
				console.log(result);
			}
		});
	}

	readDataMysql(current_timestamp: number): Promise<any> {
		if (this.dbConn === undefined) {
			console.log('dbConn is null. Begin to do the init().');
		}

		const lowerTime = current_timestamp - 3600000 + '';
		const upperTime = current_timestamp + '';
		// const sql = "SELECT * FROM " + this.db_table_name + " WHERE exchange_returned_timestamp >= UNIX_TIMESTAMP(NOW()) - 3600";
		const sql =
			'SELECT * FROM ' +
			this.db_table_name +
			' WHERE exchange_returned_timestamp >= ' +
			lowerTime +
			' AND exchange_returned_timestamp <= ' +
			upperTime;

		console.log(sql);
		return new Promise((resolve, reject) => {
			this.dbConn.query(sql, function(err: any, result: any) {
				// if (err) throw err;
				if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
					// console.log('.');
					// rocess.stdout.write(".");
					reject(err);
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}
}
