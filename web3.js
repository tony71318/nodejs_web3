const Web3 = require('web3');

/*
* connect to ethereum node
*/ 
const ethereumUri = 'http://localhost:8545';
const address = '0x0C9448292fB3812C207985e3569646f6dbAD9137'; // user

let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(ethereumUri));

if(!web3.isConnected()){
    throw new Error('Unable to connect to ethereum node at ' + ethereumUri);
}else{
    console.log('Connected to ehterum node at ' + ethereumUri);
}

// creation of contract object
var MyContract = web3.eth.contract([ { "constant": false, "inputs": [ { "name": "key", "type": "bytes" }, { "name": "order_id", "type": "bytes" }, { "name": "user_id", "type": "bytes" }, { "name": "room_type", "type": "uint256" }, { "name": "date", "type": "bytes" } ], "name": "new_order", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [ { "name": "", "type": "uint256" } ], "name": "rooms", "outputs": [ { "name": "id", "type": "uint256", "value": "0" }, { "name": "total_room", "type": "uint256", "value": "0" } ], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "owner_2", "outputs": [ { "name": "", "type": "address", "value": "0x0000000000000000000000000000000000000000" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "old_key", "type": "bytes" }, { "name": "new_key", "type": "bytes" }, { "name": "order_id", "type": "bytes" }, { "name": "user_id", "type": "bytes" }, { "name": "room_type", "type": "uint256" }, { "name": "date", "type": "bytes" } ], "name": "update_order", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "room_type", "type": "uint256" } ], "name": "delete_room", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "key", "type": "bytes" } ], "name": "delete_order", "outputs": [], "payable": false, "type": "function" }, { "constant": true, "inputs": [], "name": "owner", "outputs": [ { "name": "", "type": "address", "value": "0x291837238f171047afb414152c2c58d6cf887481" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "room_type", "type": "uint256" }, { "name": "total_room", "type": "uint256" } ], "name": "edit_room", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "room_type", "type": "uint256" }, { "name": "date", "type": "bytes" } ], "name": "check", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "key", "type": "bytes" } ], "name": "order_detail", "outputs": [ { "name": "", "type": "bytes" }, { "name": "", "type": "bytes" }, { "name": "", "type": "uint256" }, { "name": "", "type": "bytes" } ], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "payable": false, "type": "function" }, { "constant": false, "inputs": [ { "name": "newOwner", "type": "address" } ], "name": "addOwnership", "outputs": [], "payable": false, "type": "function" }, { "inputs": [], "payable": false, "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "key", "type": "bytes" }, { "indexed": false, "name": "order_id", "type": "bytes" }, { "indexed": false, "name": "check", "type": "bool" } ], "name": "new_order_event", "type": "event" } ])

var myContractAddress ='0x2c78533BeF42E90f77772f20BBd4d217F0854Db6';	//ethereum 中 contract 的 address

var myContract = MyContract.at(myContractAddress);	// initiate contract for an address

module.exports = {
	web3, myContract
}

