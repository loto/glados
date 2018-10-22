'use strict';
const api = require('./rasa-core-api/api');

exports.sendMessage = async function (uuid, message) {
    return await api.conversationsRespond(uuid, message);
}
