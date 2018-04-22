const mysql = require('mysql');
var math = require('mathjs');

var dbConn;

export var exchange_name = '';
export var db_host = '';
export var db_user = '';
export var db_password = '';
export var db_name = '';
export var db_table_name = '';

class MysqlUtil {
    
	setup(exchange_name: string, db_host: string, db_user: string, db_password: string, db_name: string, db_table_name: string) {
		this.exchange_name = exchange_name;
		this.db_host = db_host;
		this.db_user = db_user;
		this.db_password = db_password;
		this.db_name = db_name;
		this.db_table_name = db_table_name;
	}

	initDB() {
		if (this.db_host == '') {
			console.log('[Required Parameters] Please input the correct DB parameters first.');
		}

		this.dbConn = mysql.createConnection({
			host: this.db_host,
			user: this.db_user,
			password: this.db_password,
			database: this.db_name
		});

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

		var system_timestamp = Math.floor(Date.now()); //record down the MTS
		var price_str = math.format(price, { exponential: { lower: 1e-100, upper: 1e100 } });
		var amount_str = math.format(amount, { exponential: { lower: 1e-100, upper: 1e100 } });

		price_str=price_str.split('"').join('');
		amount_str=amount_str.split('"').join('');

		var sql =
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
		this.dbConn.query(sql, function(err, result) {
			// if (err) throw err;
			if (err && err.code != undefined && err.code === 'ER_DUP_ENTRY') {
				console.log('Insert record before');
			} else if (err) {
				console.log('err' + err);
			} else {
				console.log('insert 1 record into DB');
			}
		});
	}
}
module.exports = MysqlUtil;
