var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

mongoose.Promise = global.Promise;
var db_connection = mongoose.connect('mongodb://localhost/mongodb', {
  useMongoClient: true,
  /* other options */
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Mongodb is connected!');
});

// create a schema
var orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  name: { type: String, required: true},
  user_id: { type: String, required: true},
  room_id: { type: String, required: true },
  room_type: { type: String, required: true },
  start_date: { type: String, required: true },
  duration: { type: Number, required: true },
  paid: { type: Boolean, required: true, default: false },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: Date
});
orderSchema.plugin(uniqueValidator);

var Order = mongoose.model('Order', orderSchema);

// create a schema
var roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room_type: { type: String, required: true, unique: true },
  total_room: { type: Number, required: true },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: Date
});
roomSchema.plugin(uniqueValidator);

var Room = mongoose.model('Room', roomSchema);

module.exports = {
  Order,Room
}