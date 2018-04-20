"use strict";
exports.__esModule = true;
var CST = require("./constant");
var rp = require('request-promise');
var es6_promise_1 = require("es6-promise");
var addressCustodianContract = CST.addressCustodianContract;
var ETHSCAN_API_KEY = CST.ETHSCAN_API_KEY;
var ETHSCAN_API_KOVAN_LINK = CST.ETHSCAN_API_KOVAN_LINK;
var KOVAN_FROM_BLOCK = CST.KOVAN_FROM_BLOCK;
var ACCEPT_PRICE_EVENT = CST.ACCEPT_PRICE_EVENT;
var RESULT = 'result';
var ListenToAcceptPrice = /** @class */ (function () {
    function ListenToAcceptPrice() {
    }
    ListenToAcceptPrice.prototype.getLogs = function (url) {
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
    ListenToAcceptPrice.prototype.startListening = function () {
        var _this = this;
        var logLink = ETHSCAN_API_KOVAN_LINK + 'module=logs&action=getLogs&fromBlock=' + KOVAN_FROM_BLOCK +
            '&toBlock=latest&address=' + addressCustodianContract
            + '&topic0=' + ACCEPT_PRICE_EVENT + '&apikey=' + ETHSCAN_API_KEY;
        var listenAcceptPriceFunc = function () {
            console.log("making a request to etherscan");
            _this.getLogs(logLink)
                .then(function (res) {
                var data = JSON.parse(res);
                var result = data[RESULT];
                console.log(result);
                for (var i = 0; i < result.length; i++) {
                    var price = parseInt(result[i].topics[1], 16);
                    var time = parseInt(result[i].topics[2], 16);
                    console.log("new price accepted: " + price + " at " + time);
                    // console.log(time);
                }
                // console.log(priceInWei);
                // console.log(priceInSeconds);
            });
        };
        var schedule = require('node-schedule');
        var job = schedule.scheduleJob({ rule: '/10 * * * * *' }, listenAcceptPriceFunc);
    };
    return ListenToAcceptPrice;
}());
var listenToAcceptPrice = new ListenToAcceptPrice();
exports["default"] = listenToAcceptPrice;
