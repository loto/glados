"use strict";
const azureDirectLineApiAuthenticationUrl = 'https://directline.botframework.com/v3/directline/tokens/generate';
const azureDirectLineApiConversationUrl = 'https://directline.botframework.com/v3/directline/conversations';

module.exports.config = Object.freeze({
    CHAT_HANDLE: '[AZURE]'
});

const cache = require('./cache');
const axios = require('axios');

exports.sendMessage = async function (uuid, message) {
    cache.init(uuid);
    let authenticationToken = await authenticate(uuid);
    let conversation = await startConversation(authenticationToken);
    let activityId = await sendActivity(uuid, conversation.id, conversation.token, message);
    // TODO: use retries with delay instead
    await waitFor(1500);
    let activities = await listActivities(conversation.id, conversation.token);
    let lastActivity = activities[activities.length - 1];

    if (lastActivity.replyToId == activityId) {
        log(`Reply: ${lastActivity.text}`);
        return lastActivity.text;
    } else {
        let errorMessage = "Chatbot didn't reply yet.";
        throw new Error(errorMessage);
    }
}

async function authenticate(uuid) {
    let authenticationToken = cache.authenticationToken(uuid);
    if (authenticationToken) return authenticationToken;

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + process.env.AZURE_DIRECT_LINE_SECRET }
    };

    log(`Requesting Authentication Token...`);

    let response = await axios.post(azureDirectLineApiAuthenticationUrl, body, config);
    if (isSuccessful(response.status)) {
        let errorMessage = `Azure Direct Line API Authentication Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    } else {
        // TODO: handle response.data.expires_in (1800)
        authenticationToken = response.data.token;
        cache.setAuthenticationToken(uuid, authenticationToken);
        return authenticationToken;
    }
}

async function startConversation(authenticationToken) {
    let conversationToken = cache.conversationToken(authenticationToken);
    let conversationId = cache.conversationId(authenticationToken);
    if (conversationToken && conversationId) return({ token: conversationToken, id: conversationId });

    let body = {};
    let config = {
        headers: { 'Authorization': 'Bearer ' + authenticationToken }
    };

    log(`Requesting Conversation Token...`);

    let response = await axios.post(azureDirectLineApiConversationUrl, body, config);
    if (isSuccessful(response.status)) {
        let errorMessage = `Azure Direct Line API Start Conversation Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    } else {
        // TODO: handle response.data.expires_in (1800)
        // TODO: handle response.data.streamUrl
        conversationToken = response.data.token;
        conversationId = response.data.conversationId;
        cache.setConversationToken(authenticationToken, conversationToken);
        cache.setConversationId(authenticationToken, conversationId);
        return({ token: conversationToken, id: conversationId });
    }
}

async function sendActivity(uuid, conversationId, conversationToken, message) {
    let body = { 'type': 'message', 'from': { 'id': uuid }, 'text': message };
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken, 'Content-Type': 'application/json' }
    };

    log(`Sending Activity...`);

    let response = await axios.post(`${azureDirectLineApiConversationUrl}/${conversationId}/activities`, body, config)
    if (isSuccessful(response.status)) {
        let errorMessage = `Azure Direct Line API Send Activity Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    } else {
        return response.data.id;
    }
}

async function waitFor(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () { resolve(); }, delay);
    });
}

async function listActivities(conversationId, conversationToken) {
    let config = {
        headers: { 'Authorization': 'Bearer ' + conversationToken }
    };

    log(`Listing Activities...`);

    let response = await axios.get(`${azureDirectLineApiConversationUrl}/${conversationId}/activities`, config);
    if (isSuccessful(response.status)) {
        let errorMessage = `Azure Direct Line API List Activities Process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    } else {
        // TODO: use watermark
        return response.data.activities;
    }
}

function isSuccessful(statusCode) {
    [200, 201].includes(statusCode);
}

function log(message) {
    console.log(`${new Date().toISOString()} | AZURE BOT > ${message}`);
}
