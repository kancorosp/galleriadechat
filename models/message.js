var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var messageSchema = new Schema({
    userId: String,
    roomType: String,
    username: String,
    content: String,
    date:  { type: Date, default: Date.now },
    isWitty: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);