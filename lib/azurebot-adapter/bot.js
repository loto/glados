'use strict'
const api = require('./direct-line-api-v3/api');
const response = require('./response');

async function sendMessage(uuid, message) {
    let authenticationToken = await api.authenticate(uuid);
    let conversation = await api.startConversation(authenticationToken);
    let activityId = await api.sendActivity(uuid, conversation.id, conversation.token, message);
    return await getReply(conversation.id, conversation.token, activityId);
}

async function getReply(conversationId, conversationToken, activityId, remainingAttempts = 5) {
    try {
        let activities = await api.listActivities(conversationId, conversationToken);
        let lastActivity = activities[activities.length - 1];

        if (lastActivity.replyToId != activityId) throw new Error("Azure Bot: didn't reply to last message");
        return await response.format(lastActivity);
    } catch (error) {
        if (remainingAttempts === 1) throw new Error(`Azure Bot: get reply failed too many times. Last error: ${error.message}`);
        await waitFor(600);
        return await getReply(conversationId, conversationToken, activityId, remainingAttempts - 1);
    }
}

async function waitFor(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () { resolve(); }, delay);
    });
}

module.exports = {
    sendMessage
}
