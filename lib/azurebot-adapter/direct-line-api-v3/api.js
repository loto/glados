'use strict';
const cache = require('./cache');
const restClient = require('../../rest/client');
const errors = require('../../rest/errors');
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
        if (remainingAttempts === 0) {
            cache.resetAuthenticationToken(uuid);
            throw new errors.TooManyAttemptsError(error, 'Direct Line API: authentication');
        }
        return await authenticate(uuid, remainingAttempts - 1);
    }

    // TODO: handle response.data.expires_in (1800)
    authenticationToken = response.data.token;
    cache.setAuthenticationToken(uuid, authenticationToken);
    return authenticationToken;
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
        if (remainingAttempts === 0) {
            cache.resetConversationToken(authenticationToken);
            cache.resetConversationId(authenticationToken);
            throw new errors.TooManyAttemptsError(error, 'Direct Line API: start conversation')
        }
        return await startConversation(authenticationToken, remainingAttempts - 1);
    }

    // TODO: handle response.data.expires_in (1800)
    // TODO: handle response.data.streamUrl
    conversationToken = response.data.token;
    conversationId = response.data.conversationId;
    cache.setConversationToken(authenticationToken, conversationToken);
    cache.setConversationId(authenticationToken, conversationId);
    return ({ token: conversationToken, id: conversationId });
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
        if (remainingAttempts === 0) throw new errors.TooManyAttemptsError(error, 'Direct Line API: send activity');
        return await sendActivity(uuid, conversationId, conversationToken, message, remainingAttempts - 1);
    }

    return response.data.id;
}

async function listActivities(conversationId, conversationToken, remainingAttempts = 3) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    let response;
    try {
        response = await restClient.create().get(urls.activities(conversationId), config);
    } catch (error) {
        if (remainingAttempts === 0) throw new errors.TooManyAttemptsError(error, 'Direct Line API: list activities')
        return await listActivities(conversationId, conversationToken, remainingAttempts - 1);
    }

    // TODO: use watermark
    return response.data.activities;
}

module.exports = {
    authenticate,
    startConversation,
    sendActivity,
    listActivities
}
