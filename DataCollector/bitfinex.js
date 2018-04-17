
'use strict';
const request = require('request');
const url='https://api.bitfinex.com/v1';


class BitfinexUtil {
	fetchCurrentOrderBook() {

		request.get(url+'/book/ethusd?limit_bids=50&limit_asks=50',
			function(error, response, body) {
				console.log(body);
				console.log('type:'+Object.prototype.toString(body));
				var orderObj= JSON.parse(body);
				console.log(orderObj.bids);
				console.log(orderObj.asks);

				var countBids=0;
				for (var i in orderObj.bids) {
					countBids++;
				}
				var countAsks=0;
				for (var i in orderObj.asks) {
					countAsks++;
				}

				console.log('ASK:'+countAsks+' BID:'+countBids);

				// console.log('convert type'+);
				// console.log(body);
			});
	}

	fetchCurrentETHPrice() {
		request.get(url + '/pubticker/ethusd',
			function(error, response, body) {
				console.log(body);
			});
	}

	fetchDataFromMysql(){
		var mysql = require('mysql');
		var con = mysql.createConnection({
			host: "localhost",
			user: "root",
			password: "123456",
			database: "test"
		});
    
		con.connect(function(err) {
			if (err) throw err;
			con.query("SELECT * FROM testTable", function (err, result, fields) {
				if (err) throw err;
				console.log(result);
			});
		});



	}

	insertDataIntoMysql(){
		var mysql = require('mysql');

		var con = mysql.createConnection({
			host: "localhost",
			user: "root",
			password: "123456",
			database: "test"
		});

		con.connect(function(err) {
			if (err) throw err;
			console.log("Connected!");
			var sql = "INSERT INTO testTable (test) VALUES ('Highway 37')";
			con.query(sql, function (err, result) {
				if (err) throw err;
				console.log("1 record inserted");
				con.end();
			});
		});

	}

	createDBInMongoDB(){

		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://localhost:27017/test";
    
		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			console.log("test Database created!");
			db.close();
		});


	}

	createDataCollectionInMongoDB(){
		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://localhost:27017/";

		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("test");
			dbo.createCollection("eth_data", function(err, res) {
				if (err) throw err;
				console.log("eth_data Collection created!");
				db.close();
			});
		});
	}

	insertDataIntoCollectionInMongoDB(){
		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://localhost:27017/";

		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("test");
			var myobj = { timestamp: "1", price: "400" };
			dbo.collection("eth_data").insertOne(myobj, function(err, res) {
				if (err) throw err;
				console.log("1 item inserted into eth_data collection");
				db.close();
			});
		});
	}


	findOperationInMongoDB(){
		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://localhost:27017/";

		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("test");
			dbo.collection("eth_data").findOne({}, function(err, result) {
				if (err) throw err;
				console.log(result.price);
				db.close();
			});
		});
	}

	queryOperationInMongoDB(){
		var MongoClient = require('mongodb').MongoClient;
		var url = "mongodb://localhost:27017/";

		MongoClient.connect(url, function(err, db) {
			if (err) throw err;
			var dbo = db.db("test");
			var query = { price: "400" };
			dbo.collection("eth_data").find(query).toArray(function(err, result) {
				if (err) throw err;
				console.log(result);
				db.close();
			});
		});
	}




	TCPListeningtest(){
 
		const net = require('net');

		const server = net.createServer((socket) => {
			socket.end('goodbye\n');
		}).on('error', (err) => {
			// handle errors here
			throw err;
		});
  
		// // grab an arbitrary unused port.
		// server.listen(() => {
		//   console.log('opened server on', server.address());
		// });
 
		server.on('error', (e) => {
			if (e.code === 'EADDRINUSE') {
				console.log('Address in use, retrying...');
				setTimeout(() => {
					server.close();
					server.listen(1337, '127.0.0.1');
				}, 1000);
			}
		});



	}

}

let bitfinexUtil = new BitfinexUtil();
// bitfinexUtil.fetchCurrentETHPrice();
bitfinexUtil.fetchCurrentOrderBook();
// bitfinexUtil.insertDataIntoMysql();


