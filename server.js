const restify = require('restify');
const restifyPlugin = require('restify-plugins');

// time library
const moment = require('moment');

// terminal color
const chalk = require('chalk');

// import db's model
const DB = require('./db');
const Order = DB.Order;
const Room =  DB.Room;

// import web3 & contract
const Web3 = require('./web3')
const web3 = Web3.web3;
const myContract = Web3.myContract;

// create server
const server = restify.createServer({
  name: 'Restify Server',
  version: '1.0.0'
});

// Fix -> No 'Access-Control-Allow-Origin'
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    return next();
  }
);

server.use(restifyPlugin.bodyParser());

// Order Route
server.get('/get/all_order', find_all_order);	//這個要放在前面！！！！ 才不會誤判
server.get('/get/order/:user_id', find_order);
server.post('/post/order', new_order);
server.post('/update/order', update_order);
server.post('/delete/all_order', delete_all_order);
server.post('/delete/order', delete_order);

// Room Route
server.get('/get/all_room', find_all_room);
server.post('/post/room', new_room);
server.post('/update/room', update_room);
server.post('/delete/room', delete_room);

server.listen(8070, function () {	// port 8070
  console.log('%s listening at %s', server.name, server.url);
});

// order's function
function find_all_order (req, res, next) {
  
	Order.find({}, function(err, users) {
		if (err){
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (users.length == 0){
			console.log(chalk.red('Cannot find any user!'));
			res.send();
	  		return next();
		}else{
			console.log(chalk.green('Find all users!'));
			res.send(users);
	  		return next();
		}
	});
};

function find_order (req, res, next) {
  
	Order.find({ order_id: req.params.order_id }, function(err, user) {
		if (err){
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (user.length == 0){
			console.log(chalk.red('cannot find user!'));
			res.send('cannot find user!');
	  		return next();
		}else{
			console.log(chalk.green('Find user_id: %s!'),req.params.user_id);
			res.send(user);
	  		return next();
		}
	});
};

function new_order (req, res, next) {

	console.time("new_order_time");
	console.time("before_transaciton_time");
	console.time("transaciton_time");

	var data = {
		'user_id' : req.body.user_id,
		'room_id' : req.body.room_id,
		'checkin_date' : req.body.checkin_date,
	}
	data.room_type = parseInt(data.room_id[0]);
	data.order_id = moment().format('YYYY-MM-DD_HH:mm:ss') + '_' + data.user_id;
	data.key = data.order_id + '_' + data.checkin_date;

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);

	event_filter(req, res, next);	// 先開始監聽event

	console.timeEnd("before_transaciton_time");
	myContract.new_order(
			data.key,
			data.order_id,
			data.user_id,
			data.room_type,
			data.checkin_date,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_order.estimateGas(data.key,data.order_id,data.user_id,data.room_type,data.checkin_date) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);

	function event_filter(req, res, next){

		var new_order_event = myContract.new_order_event({},
					{
						toBlock: 'latest'
					});

		var block = web3.eth.getBlock('latest').number;

		console.log('Watching event......');
		var event_counter = 1;
		new_order_event.watch(function(error, result){
			console.log('Checking No.%s event',event_counter++);	
			if(!error && result.blockNumber > block) {
				if(web3.toAscii(result.args.key) == data.key && result.args.check){
					new_order_event.stopWatching();
					console.log(result);
					save(req, res, next);
				}
				else if(web3.toAscii(result.args.key) == data.key && !result.args.check){
					new_order_event.stopWatching();
					console.log(chalk.red('Order %s is not available!'),data.order_id);
					res.send('Order is not available!');
					console.timeEnd("new_order_time");
					return next();
				}
			}
		});
	}

	function save(req, res, next){
		var order_data = new Order({
		    order_id: data.order_id,
			name: 'leo',
			user_id: data.user_id,
			room_id: data.room_id,
			room_type: data.room_type,
			start_date: data.checkin_date,
			duration: 1
		});

		order_data.save(function(err) {
			if (err) {
				console.log(err);
				res.send(err.message);
				return next();
			}

			console.log(chalk.green('%s has been added to the database!'), data.order_id);
			res.send(data.order_id + ' has been added to the database!');
			console.timeEnd("new_order_time");
			return next();
		});
	}
};

function update_order (req, res, next) {

	console.time("transaciton_time");

	var data = {
		'old_key' : req.body.old_key,
		'order_id' : req.body.order_id,
		'user_id' : req.body.user_id,
		'room_id' : req.body.room_id,
		'checkin_date' : req.body.checkin_date
	}
	data.new_key = data.order_id + '_' + data.checkin_date;
	data.room_type = parseInt(data.room_id[0]);

	event_filter(req, res, next);	// 先開始監聽event

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);

	myContract.update_order(
			data.old_key,
			data.new_key,
			data.order_id,
			data.user_id,
			data.room_type,
			data.checkin_date,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.update_order.estimateGas(data.old_key,data.new_key,data.order_id,data.user_id,data.room_type,data.checkin_date) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);
	function event_filter(req, res, next){

		var new_order_event = myContract.new_order_event({},
					{
						toBlock: 'latest'
					});

		var block = web3.eth.getBlock('latest').number;

		console.log('Watching event......');
		var event_counter = 1;
		new_order_event.watch(function(error, result){
			console.log('Checking No.%s event',event_counter++);	
			if(!error && result.blockNumber > block) {
				if(web3.toAscii(result.args.key) == data.new_key && result.args.check){
					new_order_event.stopWatching();
					console.log(result);
					update(req, res, next);
				}
				else if(web3.toAscii(result.args.key) == data.new_key && !result.args.check){
					new_order_event.stopWatching();
					console.log(chalk.red('Order %s is not available!'),data.order_id);
					res.send('Order is not available!');
					console.timeEnd("new_order_time");
					return next();
				}
			}
		});
	}
	function update(req, res, next){

		Order.findOneAndUpdate({ order_id: data.order_id }, { room_id: data.room_id, total_room: data.checkin_date }, function(err, user) {
			if (err) {
				console.log(err);
				res.send(err.message);
				return next();
			}else if (user == null){
				console.log('Cannot find user!');
				res.send('Cannot find user!');
				return next();
			}
			else{
				console.log(chalk.green('%s has been updated!'),data.order_id);
				res.send(data.order_id + ' has been updated!');
				return next();
			}
		});
	}
};

// only data in db
function delete_all_order (req, res, next) {

	Order.remove({}, function(err) {
  		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else{
			console.log(chalk.green('All orders have been deleted!'));
			res.send('All orders have been deleted!');
			return next();
		}
	});
};

function delete_order (req, res, next) {

	console.time("transaciton_time");

	var data = {
		'order_id' : req.body.order_id,
		'checkin_date' : req.body.checkin_date
	}

	data.key = data.order_id + '_' + data.checkin_date;

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);
	myContract.delete_order(	// new_order 是 contract 裡 的一個 function
			data.key,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.delete_order.estimateGas(data.key) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);

	Order.findOneAndRemove({ order_id: data.order_id }, function(err) {
  		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else{
			console.log(chalk.green('%s has been deleted!'), data.order_id);
			res.send(data.order_id + ' has been deleted!');
			return next();
		}
	});
};

// room's function
function find_all_room (req, res, next) {
  
	Room.find({}, function(err, rooms) {
		if (err){
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (rooms.length == 0){
			console.log(chalk.red('Cannot find any user!'));
			res.send();
	  		return next();
		}else{
			console.log(chalk.green('Find all rooms!'));
			res.send(rooms);
	  		return next();
		}
	});
};

function new_room (req, res, next){

	console.time("new_room_time");
	console.time("transaciton_time");

	var data = {
		'name': req.body.name,
		'room_type': req.body.room_type,
		'total_room': req.body.total_room
	}

	var room_data = new Room({
		name: data.name,
		room_type: data.room_type,
		total_room: data.total_room
	});

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);
	myContract.edit_room(
			data.room_type,
			data.total_room,
		{
			from: web3.eth.coinbase,
			'gas': myContract.edit_room.estimateGas(data.room_type,data.total_room)
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);

	room_data.save(function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}

		console.log(chalk.green('%s has been added to the database!'), data.name);
		res.send(data.name + ' has been added to the database!');
		console.timeEnd("new_room_time");
		return next();
	});
}

function update_room (req, res, next){

	console.time("transaciton_time");

	var data = {
		'name': req.body.name,
		'room_type': req.body.room_type,
		'total_room': req.body.total_room
	}

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);
	myContract.edit_room(
			data.room_type,
			data.total_room,
		{
			from: web3.eth.coinbase,
			'gas': myContract.edit_room.estimateGas(data.room_type,data.total_room)
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);

	Room.findOneAndUpdate({ name: data.name }, { name: data.name, total_room: data.total_room }, function(err, room) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}else if (room == null){
			console.log('Cannot find room!');
			res.send('Cannot find room!');
			return next();
		}
		else{
			console.log(chalk.green('%s has been updated!'),data.name);
			res.send(data.name + ' has been updated!');
			return next();
		}
	});
}

function delete_room (req, res, next) {

	console.time("delete_room_time");
	console.time("transaciton_time");

	var data = {
		'room_type' : req.body.room_type
	}

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);

	myContract.delete_room(
			data.room_type,
		{
			from: web3.eth.coinbase,
			'gas': myContract.delete_room.estimateGas(data.key)
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.blue("Transaction_Hash: %s"), result);
				console.timeEnd("transaciton_time");
			}
			else {
				console.log(err);
			}
		}
	);

	Room.findOneAndRemove({ room_type: data.room_type }, function(err) {
  		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else{
			console.log(chalk.green('%s has been deleted!'), data.room_type);
			res.send(data.room_type + ' has been deleted!');
			console.timeEnd("delete_room_time");
			return next();
		}
	});
};

