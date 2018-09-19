"use strict";
const api = require('./api');

exports.config = Object.freeze({
    CHAT_HANDLE: '[AZURE]'
});

exports.sendMessage = async function (uuid, message) {
    let authenticationToken = await api.authenticate(uuid);
    let conversation = await api.startConversation(authenticationToken);
    let activityId = await api.sendActivity(uuid, conversation.id, conversation.token, message);
    // TODO: use retries with delay instead
    await waitFor(1500);
    let activities = await api.listActivities(conversation.id, conversation.token);
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
    console.log(`${new Date().toISOString()} | AZURE BOT > ${message}`);
}
