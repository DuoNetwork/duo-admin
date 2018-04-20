"use strict";
exports.__esModule = true;
var Web3 = require('web3');
// const provider = 'https://mainnet.infura.io/Ky03pelFIxoZdAUsr82w';
var provider = 'https://kovan.infura.io/WSDscoNUvMiL1M7TvMNP ';
var web3 = new Web3(new Web3.providers.HttpProvider(provider));
var CustodianABI = require('./ABI/Custodian.json'); //Custodian Contract ABI
var addressCustodianContract = '0x8bf0bee757bbab37a8eb55fa6befb63437a3bb1b';
var custodianContract = new web3.eth.Contract(CustodianABI['abi'], addressCustodianContract);
var ContractReader = /** @class */ (function () {
    function ContractReader() {
    }
    ContractReader.prototype.read = function (name) {
        switch (name) {
            case "lastPrice":
                custodianContract.methods.lastPrice
                    .call({ from: "0x00D8d0660b243452fC2f996A892D3083A903576F" })
                    .then(function (res) {
                    console.log(res);
                });
                break;
        }
    };
    return ContractReader;
}());
var contractRead = new ContractReader();
exports["default"] = contractRead;
