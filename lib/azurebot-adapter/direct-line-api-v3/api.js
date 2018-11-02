'use strict';
const azureDirectLineApiAuthenticationUrl = 'https://directline.botframework.com/v3/directline/tokens/generate';
const azureDirectLineApiConversationUrl = 'https://directline.botframework.com/v3/directline/conversations';

const baseLogger = require('pino')();
const apiLogger = baseLogger.child({ component: 'Direct Line API' });;
const cache = require('./cache');
const axios = require('axios');

exports.authenticate = async function (uuid) {
    cache.init(uuid);

    let authenticationToken = cache.authenticationToken(uuid);
    if (authenticationToken) return authenticationToken;

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + process.env.AZURE_DIRECT_LINE_SECRET }
    };

    log(`Requesting Authentication Token...`);

    let response = await axios.post(azureDirectLineApiAuthenticationUrl, body, config);
    if (isSuccessful(response.status)) {
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

exports.startConversation = async function (authenticationToken) {
    let conversationToken = cache.conversationToken(authenticationToken);
    let conversationId = cache.conversationId(authenticationToken);
    if (conversationToken && conversationId) return ({ token: conversationToken, id: conversationId });

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + authenticationToken }
    };

    log(`Requesting Conversation Token...`);

    let response = await axios.post(azureDirectLineApiConversationUrl, body, config);
    if (isSuccessful(response.status)) {
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

exports.sendActivity = async function (uuid, conversationId, conversationToken, message) {
    let body = { 'type': 'message', 'from': { 'id': uuid }, 'text': message };
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken, 'Content-Type': 'application/json' }
    };

    log(`Sending Activity...`);

    let response = await axios.post(`${azureDirectLineApiConversationUrl}/${conversationId}/activities`, body, config)
    if (isSuccessful(response.status)) {
        return response.data.id;
    } else {
        let errorMessage = `Azure Direct Line API Send Activity Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

exports.listActivities = async function (conversationId, conversationToken) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    log(`Listing Activities...`);

    let response = await axios.get(`${azureDirectLineApiConversationUrl}/${conversationId}/activities`, config);
    if (isSuccessful(response.status)) {
        // TODO: use watermark
        return response.data.activities;
    } else {
        let errorMessage = `Azure Direct Line API List Activities Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

function isSuccessful(statusCode) {
    return [200, 201].includes(statusCode);
}

function log(message) {
    apiLogger.info(message);
}
