var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var wittyMessagesSchema = new Schema({
    roomType: String,
    author: String,
    content: String,
    createdAt:  {type: Date, default: Date.now }
});

module.exports = mongoose.model('WittyMessages', wittyMessagesSchema);