'use strict'
const baseLogger = require('pino')();
const botLogger = baseLogger.child({ component: 'Azure Bot' });;
const api = require('./api');

exports.sendMessage = async function (uuid, message) {
    let authenticationToken = await api.authenticate(uuid);
    let conversation = await api.startConversation(authenticationToken);
    let activityId = await api.sendActivity(uuid, conversation.id, conversation.token, message);
    return await getReplyWithDelayedRetries(conversation.id, conversation.token, activityId, 4);
}

async function getReplyWithDelayedRetries(conversationId, conversationToken, activityId, n) {
    try {
        return await getReply(conversationId, conversationToken, activityId);
    } catch (error) {
        if (n === 1) throw error;
        await waitFor(500);
        return await getReplyWithDelayedRetries(conversationId, conversationToken, activityId, n - 1);
    }
};

async function getReply(conversationId, conversationToken, activityId) {
    let activities = await api.listActivities(conversationId, conversationToken);
    let lastActivity = activities[activities.length - 1];

    if (lastActivity.replyToId == activityId) {
        log(`Reply: ${lastActivity.text}`);
        return lastActivity.text;
    } else {
        let errorMessage = "Chatbot didn't reply yet.";
        throw new Error(errorMessage);
    }
}

async function waitFor(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () { resolve(); }, delay);
    });
}

function log(message) {
    botLogger.info(message);
}
