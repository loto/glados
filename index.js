"use strict";
require('dotenv').config();

const azureBot = require('./azure/bot');
const { RTMClient } = require('@slack/client');

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_BOT_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

const AzureHandle = azureBot.config.CHAT_HANDLE;

rtm.on('message', (event) => {
    // For structure of `event`, see https://api.slack.com/events/message
    // Skip messages that are from a bot or my own user ID
    if ((event.subtype && event.subtype === 'bot_message') ||
        (!event.subtype && event.subtype === rtm.activeUserId)) {
        return;
    }

    if (event.text.includes(AzureHandle)) {
        let message = event.text.replace(AzureHandle, '').trim();
        azureBot.sendMessage(uuid(event), message)
            .then(function (replyString) {
                rtm.sendMessage(replyString, event.channel)
                    .then((res) => {
                        // `res` contains information about the posted message
                        console.log('Message sent: ', res.ts);
                    })
                    .catch(console.error);
            });
    }
    else {
        rtm.sendMessage("Hello there! Here's my default reply in slack.", event.channel)
            .then((res) => {
                // `res` contains information about the posted message
                console.log('Message sent: ', res.ts);
            })
            .catch(console.error);
    }
});

function uuid(event) {
    return `${event.team}-${event.channel}-${event.user}`;
}
