const cache = {};

function log(message) {
    console.log(`${new Date().toISOString()} | AZURE CACHE > ${message}`);
}

exports.init = function (uuid) {
    if (!cache[uuid]) {
        log(`${uuid} initialized`);
        cache[uuid] = {}
    }
}

exports.authenticationToken = function (uuid) {
    if (cache[uuid] && cache[uuid]['authenticationToken']) {
        log(`${uuid} Authentication Token read`);
        return cache[uuid]['authenticationToken'];
    } else {
        return null;
    }
}

exports.setAuthenticationToken = function (uuid, authenticationToken) {
    log(`${uuid} Authentication Token write`);
    return cache[uuid]['authenticationToken'] = authenticationToken;
}

exports.conversationToken = function (authenticationToken) {
    uuid = uuidFromAuthenticationToken(authenticationToken);
    if (cache[uuid] && cache[uuid]['conversationToken']) {
        log(`${uuid} Conversation Token read`);
        return cache[uuid]['conversationToken'];
    } else {
        return null;
    }
}

exports.setConversationToken = function (authenticationToken, conversationToken) {
    uuid = uuidFromAuthenticationToken(authenticationToken);
    log(`${uuid} Conversation Token write`);
    return cache[uuid]['conversationToken'] = conversationToken;
}

exports.conversationId = function (authenticationToken) {
    uuid = uuidFromAuthenticationToken(authenticationToken);
    if (cache[uuid] && cache[uuid]['conversationId']) {
        log(`${uuid} Conversation Id read`);
        return cache[uuid]['conversationId'];
    } else {
        return null;
    }
}

exports.setConversationId = function (authenticationToken, conversationId) {
    uuid = uuidFromAuthenticationToken(authenticationToken);
    log(`${uuid} Conversation Id write`);
    return cache[uuid]['conversationId'] = conversationId;
}

function uuidFromAuthenticationToken(authenticationToken) {
    let [uuid, _data] = Object.entries(cache).find(function ([key, value]) {
        return value.authenticationToken === authenticationToken;
    });
    return uuid;
}
