'use strict';
const cache = require('./cache');
const restClient = require('../../rest/client');
const status = require('../../rest/status');
const urls = require('./urls');

async function authenticate(uuid) {
    cache.init(uuid);

    let authenticationToken = cache.authenticationToken(uuid);
    if (authenticationToken) return authenticationToken;

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + process.env.AZURE_DIRECT_LINE_SECRET }
    };

    let response = await restClient.create().post(urls.authentication(), body, config);
    if (status.hasSucceeded(response)) {
        // TODO: handle response.data.expires_in (1800)
        authenticationToken = response.data.token;
        cache.setAuthenticationToken(uuid, authenticationToken);
        return authenticationToken;
    } else {
        cache.resetAuthenticationToken(uuid);
        let errorMessage = `Azure Direct Line API Authentication Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

async function startConversation(authenticationToken) {
    let conversationToken = cache.conversationToken(authenticationToken);
    let conversationId = cache.conversationId(authenticationToken);
    if (conversationToken && conversationId) return ({ token: conversationToken, id: conversationId });

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + authenticationToken }
    };

    let response = await restClient.create().post(urls.conversations(), body, config);
    if (status.hasSucceeded(response)) {
        // TODO: handle response.data.expires_in (1800)
        // TODO: handle response.data.streamUrl
        conversationToken = response.data.token;
        conversationId = response.data.conversationId;
        cache.setConversationToken(authenticationToken, conversationToken);
        cache.setConversationId(authenticationToken, conversationId);
        return ({ token: conversationToken, id: conversationId });
    } else {
        cache.resetConversationToken(authenticationToken);
        cache.resetConversationId(authenticationToken);
        let errorMessage = `Azure Direct Line API Start Conversation Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

async function sendActivity(uuid, conversationId, conversationToken, message) {
    let body = { 'type': 'message', 'from': { 'id': uuid }, 'text': message };
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken, 'Content-Type': 'application/json' }
    };

    let response = await restClient.create().post(urls.activities(conversationId), body, config)
    if (status.hasSucceeded(response)) {
        return response.data.id;
    } else {
        let errorMessage = `Azure Direct Line API Send Activity Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

async function listActivities(conversationId, conversationToken) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    let response = await restClient.create().get(urls.activities(conversationId), config);
    if (status.hasSucceeded(response)) {
        // TODO: use watermark
        return response.data.activities;
    } else {
        let errorMessage = `Azure Direct Line API List Activities Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

module.exports = {
    authenticate,
    startConversation,
    sendActivity,
    listActivities
}
