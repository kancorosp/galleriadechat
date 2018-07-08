/**
 * Created by leminhtoan on 2017/11/30.
 */

// Add length prototype to object
// Object.prototype.length =  Object.keys(this).length;


var util = {
    random: function (length) {
        const crypto = require("crypto");

        return crypto.randomBytes(length).toString("hex");
    }
};


module.exports = util;