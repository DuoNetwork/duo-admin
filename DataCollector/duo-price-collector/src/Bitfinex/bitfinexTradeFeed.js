
'use strict';
var math = require('mathjs');
const mysql = require('mysql');
var dbConn;


const EXCHANGE_NAME='BITFINEX';
const db_host="localhost";
const db_user="root";
const db_password="123456";
const db_name="priceFeedDB";
const db_table_name="ETH_Trades_Table";


class BitfinexUtil {

	initDB(){
		dbConn = mysql.createConnection({
			host: db_host,
			user: db_user,
			password: db_password,
			database: db_name
		});
        
		dbConn.connect(function(err) {
    		if (err) {
				console.log("err"+err);
				// throw err;
			}
			console.log("Connected!");
			// dbConn.close();
    		});
	}

	insertDataIntoMysql(exchange_soucre: string, trade_id: string, price: string, amount: string,trade_type: string,exchange_returned_timestamp: string){

    	if (dbConn === undefined) {
			console.log("dbConn is null. Begin to do the init().");
			bitfinexUtil.initDB();
    	}
        
    	var system_timestamp=Math.floor(Date.now());  //record down the MTS
		var price_str=math.format(price,{exponential:{lower:1e-100,upper:1e100}});
		var amount_str=math.format(amount,{exponential:{lower:1e-100,upper:1e100}});
        
		var sql = "INSERT INTO "+db_table_name+" VALUES ('"+exchange_soucre+"','"+trade_id+"','"+price_str+"','"+amount_str+"','"+trade_type+"','"+exchange_returned_timestamp+"','"+system_timestamp+"')";
		// console.log(sql);
		dbConn.query(sql, function (err, result) {
			// if (err) throw err;
			if (err&&err.code!=undefined&&err.code === 'ER_DUP_ENTRY') {
				console.log("Insert record before");
			}else{
				console.log("insert 1 record into DB");
			}
    	});
	}

	//Version 2 WebSocket API ---
	fetchETHTradesByOwnWebSocket() {

    	const ws = require('ws');
    	const w = new ws('wss://api.bitfinex.com/ws/2');
	
    	w.on('message', (msg) => {



			var parsedJson= JSON.parse(msg);
			if(parsedJson!=undefined){
		    	//handle the snopshot
				if(parsedJson.event===undefined&&parsedJson[1]!='hb'&&!(parsedJson[1]=='te'||parsedJson[1]=='tu')){
					console.log(parsedJson);
					var snopshotArr=parsedJson[1];
					snopshotArr.forEach(element => {
						// console.log("===>"+element);
						var price=parseFloat(element[2]);
						var trade_type="buy";
						if(price>0){
							trade_type="buy";
						}else{
							trade_type="sell";
						}
						// console.log("=>"+trade_type);
						bitfinexUtil.insertDataIntoMysql(EXCHANGE_NAME,element[0],element[3],Math.abs(price),trade_type,element[1]);
					});

				}else if(parsedJson[1]!='hb'&&parsedJson[1]=='te') {
					// console.log("<==="+parsedJson);
					parsedJson=parsedJson[2];
					var price=parseFloat(parsedJson[2]);
					var trade_type="buy";
					if(price>0){
						trade_type="buy";
					}else{
						trade_type="sell";
					}
					// console.log("=>"+trade_type);
					bitfinexUtil.insertDataIntoMysql(EXCHANGE_NAME,parsedJson[0],parsedJson[3],Math.abs(price),trade_type,parsedJson[1]);

					// console.log(parsedJson);
				}
			}
  
    	});
	
    	let msg = JSON.stringify({ 
    		event: 'subscribe', 
    		channel: 'trades', 
    		symbol: 'ETHUSD' 
    	});
	
    	w.on('open', () => {
    		console.log('[Bitfinex]-WebSocket is open');
    		w.send(msg);
			console.log('subscribe trade');
			console.log('open DB');


    	});  
        
    	w.on('close',()=>{
			console.log('[Bitfinex]-WebSocket is close now');
			console.log('close DB');
    	});
	}

}

let bitfinexUtil = new BitfinexUtil();
bitfinexUtil.fetchETHTradesByOwnWebSocket();
