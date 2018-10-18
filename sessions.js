'use strict';
const uuidv1 = require('uuid/v1');
let cache = [];

exports.find = async function (token) {
    let session = cache.find(function (element) {
        return element.token === token;
    });
    return session;
}

exports.new = async function (agent_name) {
    let uuid = uuidv1();
    let session = { 'token': uuid, 'agent_name': agent_name };
    cache.push(session);
    return session;
}

exports.update = async (token, new_agent_name) => {
    let session = await this.find(token);
    if (!session) throw new Error('Session not found');
    session.agent_name = new_agent_name;

    cache = cache.filter(function (value, index, array) {
        return value.token != session.token;
    });

    cache.push(session);
    return session;
}
