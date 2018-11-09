'use strict';
const baseLogger = require('pino')({ level: process.env.LOG_LEVEL });
const cacheLogger = baseLogger.child({ component: 'Direct Line API in-memory cache' });
const cache = {};

function log(uuid, message) {
    cacheLogger.debug(`${uuid} ${message}`);
}

function init(uuid) {
    if (!cache[uuid]) {
        log(uuid, 'initialized');
        cache[uuid] = {}
    }
}

function authenticationToken(uuid) {
    let token = null;
    if (cache[uuid] && cache[uuid]['authenticationToken']) {
        log(uuid, 'authentication token read');
        token = cache[uuid]['authenticationToken'];
    }
    return token;
}

function setAuthenticationToken(uuid, authenticationToken) {
    log(uuid, 'authentication token write');
    cache[uuid]['authenticationToken'] = authenticationToken;
}

function resetAuthenticationToken(uuid) {
    if (cache[uuid] && cache[uuid]['authenticationToken']) {
        log(uuid, 'authentication token reset');
        cache[uuid]['authenticationToken'] = null;
    }
}

function conversationToken(authenticationToken) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    let token = null;
    if (cache[uuid] && cache[uuid]['conversationToken']) {
        log(uuid, 'conversation token read');
        token = cache[uuid]['conversationToken'];
    }
    return token;
}

function setConversationToken(authenticationToken, conversationToken) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    log(uuid, 'conversation token write');
    cache[uuid]['conversationToken'] = conversationToken;
}

function resetConversationToken(authenticationToken) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    log(uuid, 'conversation token reset');
    cache[uuid]['conversationToken'] = null;
}

function conversationId(authenticationToken) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    let id = null;
    if (cache[uuid] && cache[uuid]['conversationId']) {
        log(uuid, 'conversation id read');
        id = cache[uuid]['conversationId'];
    }
    return id;
}

function setConversationId(authenticationToken, conversationId) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    log(uuid, 'conversation id write');
    cache[uuid]['conversationId'] = conversationId;
}

function resetConversationId(authenticationToken) {
    let uuid = uuidFromAuthenticationToken(authenticationToken);
    log(uuid, 'conversation id reset');
    cache[uuid]['conversationId'] = null;
}

function uuidFromAuthenticationToken(authenticationToken) {
    let [uuid, _data] = Object.entries(cache).find(function ([key, value]) {
        return value.authenticationToken === authenticationToken;
    });
    return uuid;
}

module.exports = {
    init,
    authenticationToken,
    setAuthenticationToken,
    resetAuthenticationToken,
    conversationToken,
    setConversationToken,
    resetConversationToken,
    conversationId,
    setConversationId,
    resetConversationId,
}
