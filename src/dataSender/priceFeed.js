"use strict";
exports.__esModule = true;
var Web3 = require('web3');
var rp = require('request-promise');
var Tx = require('ethereumjs-tx');
var es6_promise_1 = require("es6-promise");
var CST = require("../constant");
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
var provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
// const provider = 'http://localhost:8545';
var web3 = new Web3(new Web3.providers.HttpProvider(provider));
// const CustodianABI = require('./ABI/Custodian.json'); //Custodian Contract ABI
var addressCustodianContract = CST.addressCustodianContract;
// const custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);
var pfAddress = CST.pfAddress;
var privateKey = CST.privateKey;
var gas_price = 100 * Math.pow(10, 9);
var gas_limit = 80000;
var ETH_PRICE_LINK = CST.ETH_PRICE_LINK;
// let priceFeedInterval = 60 * 60 * 1000;
var PriceFeed = /** @class */ (function () {
    function PriceFeed() {
    }
    PriceFeed.prototype.getETHprice = function (url) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            return rp({
                url: url,
                headers: {
                    'user-agent': 'node.js'
                }
            }, function (error, res, body) {
                if (error)
                    reject(error);
                else if (res.statusCode === 200)
                    resolve(body);
                else
                    reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
            });
        });
    };
    PriceFeed.prototype.generateTxStrng = function (priceInWei, priceInSeconds, name) {
        var res = web3.eth.abi.encodeFunctionCall({
            name: name,
            type: 'function',
            inputs: [
                {
                    name: 'priceInWei',
                    type: 'uint256'
                },
                {
                    name: 'timeInSecond',
                    type: 'uint256'
                }
            ]
        }, [priceInWei, priceInSeconds]);
        return res;
    };
    PriceFeed.prototype.create_tx_command = function (nonce, gas_price, gas_limit, to_address, amount, data) {
        var rawTx = {
            nonce: nonce,
            gasPrice: web3.utils.toHex(gas_price),
            gasLimit: web3.utils.toHex(gas_limit),
            to: to_address,
            value: web3.utils.toHex(web3.utils.toWei(amount.toString())),
            data: data
        };
        return rawTx;
    };
    PriceFeed.prototype.sign_tx = function (rawTx, private_key) {
        try {
            var tx = new Tx(rawTx);
            var private_key_hex = new Buffer(private_key, 'hex');
            tx.sign(private_key_hex);
        }
        catch (err) {
            console.log(err);
            return;
        }
        var serializedTx = tx.serialize().toString('hex');
        return serializedTx;
    };
    PriceFeed.prototype.startFeeding = function () {
        var _this = this;
        var priceInWei;
        var priceInSeconds;
        var startContract = function () {
            priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
            console.log("start contract at " + priceInSeconds);
            _this.getETHprice(ETH_PRICE_LINK)
                .then(function (res) {
                var data = JSON.parse(res);
                priceInWei = data['USD'] * Math.pow(10, 9);
                // console.log(priceInWei);
                // console.log(priceInSeconds);
            })
                .then(function () {
                web3.eth.getTransactionCount(pfAddress).then(function (nonce) {
                    var command;
                    // console.log(nonce);
                    command = _this.generateTxStrng(priceInWei, priceInSeconds, 'startContract');
                    var rawTx = _this.create_tx_command(nonce, gas_price, gas_limit, addressCustodianContract, 0, command);
                    var transactionMSG = _this.sign_tx(rawTx, privateKey);
                    // sending out transaction
                    web3.eth.sendSignedTransaction('0x' + transactionMSG).on('receipt', console.log);
                });
            });
        };
        var commitFunc = function () {
            priceInSeconds = (new Date().getTime() / 1000).toFixed(0);
            console.log("fetch ETH price at " + priceInSeconds);
            _this.getETHprice(ETH_PRICE_LINK)
                .then(function (res) {
                var data = JSON.parse(res);
                priceInWei = data['USD'] * Math.pow(10, 9);
                // console.log(priceInWei);
                // console.log(priceInSeconds);
            })
                .then(function () {
                web3.eth.getTransactionCount(pfAddress).then(function (nonce) {
                    var command;
                    console.log(nonce);
                    command = _this.generateTxStrng(priceInWei, priceInSeconds, 'commitPrice');
                    var rawTx = _this.create_tx_command(nonce, gas_price, gas_limit, addressCustodianContract, 0, command);
                    var transactionMSG = _this.sign_tx(rawTx, privateKey);
                    // sending out transaction
                    web3.eth.sendSignedTransaction('0x' + transactionMSG).on('receipt', console.log);
                });
            });
        };
        var schedule = require('node-schedule');
        var startTime = new Date(Date.now());
        // startTime.setMinutes(59);
        // startTime.setSeconds(0);
        // startTime.setMilliseconds(0);
        var endTime = new Date(startTime.getTime() + 298000);
        var commitStart = new Date(endTime.getTime() + 1000);
        var rule = new schedule.RecurrenceRule();
        rule.minute = new schedule.Range(0, 59, 5);
        var job_start = schedule.scheduleJob({ start: startTime, end: endTime, rule: rule }, startContract);
        var job_commit = schedule.scheduleJob({ start: commitStart, rule: rule }, commitFunc);
    };
    return PriceFeed;
}());
var pf = new PriceFeed();
exports["default"] = pf;
