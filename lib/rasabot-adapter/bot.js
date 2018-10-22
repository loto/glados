'use strict';
const api = require('./api');

exports.sendMessage = async function (uuid, message) {
    return await api.conversationsRespond(uuid, message);
}
