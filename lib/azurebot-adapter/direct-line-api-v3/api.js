'use strict';
const cache = require('./cache');
const restClient = require('../../rest/client');
const status = require('../../rest/status');
const urls = require('./urls');

async function authenticate(uuid, remainingAttempts = 3) {
    cache.init(uuid);

    let authenticationToken = cache.authenticationToken(uuid);
    if (authenticationToken) return authenticationToken;

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + process.env.AZURE_DIRECT_LINE_SECRET }
    };

    let response;
    try {
        response = await restClient.create().post(urls.authentication(), body, config);
    } catch (error) {
        if (remainingAttempts === 0) throw new Error(`Direct Line API: authentication failed too many times. Last error: ${error.message}`);
        return await authenticate(uuid, remainingAttempts - 1);
    }

    if (status.hasSucceeded(response)) {
        // TODO: handle response.data.expires_in (1800)
        authenticationToken = response.data.token;
        cache.setAuthenticationToken(uuid, authenticationToken);
        return authenticationToken;
    } else {
        cache.resetAuthenticationToken(uuid);
        throw new Error(`Direct Line API: authentication failed with ${response.status} ${response.statusText}`);
    }
}

async function startConversation(authenticationToken, remainingAttempts = 3) {
    let conversationToken = cache.conversationToken(authenticationToken);
    let conversationId = cache.conversationId(authenticationToken);
    if (conversationToken && conversationId) return ({ token: conversationToken, id: conversationId });

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + authenticationToken }
    };

    let response;
    try {
        response = await restClient.create().post(urls.conversations(), body, config);
    } catch (error) {
        if (remainingAttempts === 0) throw new Error(`Direct Line API: start conversation failed too many times. Last error: ${error.message}`);
        return await startConversation(authenticationToken, remainingAttempts - 1);
    }

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
        throw new Error(`Direct Line API: start conversation failed with ${response.status} ${response.statusText}`);
    }
}

async function sendActivity(uuid, conversationId, conversationToken, message, remainingAttempts = 3) {
    let body = { 'type': 'message', 'from': { 'id': uuid }, 'text': message };
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken, 'Content-Type': 'application/json' }
    };

    let response;
    try {
        response = await restClient.create().post(urls.activities(conversationId), body, config);
    } catch (error) {
        if (remainingAttempts === 0) throw new Error(`Direct Line API: send activity failed too many times. Last error: ${error.message}`);
        return await sendActivity(uuid, conversationId, conversationToken, message, remainingAttempts - 1);
    }

    if (status.hasSucceeded(response)) {
        return response.data.id;
    } else {
        throw new Error(`Direct Line API: send activity failed with ${response.status} ${response.statusText}`);
    }
}

async function listActivities(conversationId, conversationToken, remainingAttempts = 3) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    let response;
    try {
        response = await restClient.create().get(urls.activities(conversationId), config);
    } catch (error) {
        if (remainingAttempts === 0) throw new Error(`Direct Line API: list activities failed too many times. Last error: ${error.message}`);
        return await listActivities(conversationId, conversationToken, remainingAttempts - 1);
    }

    if (status.hasSucceeded(response)) {
        // TODO: use watermark
        return response.data.activities;
    } else {
        throw new Error(`Direct Line API: list activities failed with: ${response.status} ${response.statusText}`);
    }
}

module.exports = {
    authenticate,
    startConversation,
    sendActivity,
    listActivities
}
