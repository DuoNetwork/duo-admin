"use strict";
exports.__esModule = true;
/*
This program takes csv file as phrase source to create parity accounts
*/
var rp = require('request-promise');
var es6_promise_1 = require("es6-promise");
var fs = require('fs');
var parse = require('csv-parse');
var inputFile = './src/accounts/dictionary.csv';
var all_words = [];
var CreateAccount = /** @class */ (function () {
    function CreateAccount() {
    }
    CreateAccount.prototype.sendRequest = function (url, params) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            return rp({
                url: url,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                json: {
                    method: 'parity_newAccountFromPhrase',
                    params: params,
                    id: 1,
                    jsonrpc: '2.0'
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
    CreateAccount.prototype.getRandomInt = function (max) {
        return Math.floor(Math.random() * Math.floor(max));
    };
    CreateAccount.prototype.generateRandomPhrase = function () {
        var outString = '';
        for (var i = 0; i < 12; i++) {
            var index = this.getRandomInt(200);
            if (i < 11)
                outString = outString + all_words[index] + ' ';
            else
                outString = outString + all_words[index];
        }
        return outString;
    };
    CreateAccount.prototype.createAccount = function (num) {
        // let num = 2;
        if (!num) {
            num = 1;
        }
        fs
            .createReadStream(inputFile)
            .pipe(parse({ delimiter: ':' }))
            .on('data', function (line) {
            all_words.push(line[0]);
            //do something with csvrow
        })
            .on('end', function () {
            for (var i = 0; i < num; i++) {
                //do something wiht csvData
                var url = 'http://localhost:8545';
                var params = [];
                var phrases = createAccount.generateRandomPhrase();
                params.push(phrases);
                params.push('hunter2');
                // console.log(phrases);
                createAccount.sendRequest(url, params).then(function (res) {
                    console.log('successfully created account: ' + res['result']);
                });
            }
        });
    };
    return CreateAccount;
}());
var createAccount = new CreateAccount();
exports["default"] = createAccount;
