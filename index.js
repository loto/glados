require('dotenv').config();

const azureBot = require('./azure');
const { RTMClient } = require('@slack/client');

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.SLACK_BOT_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

const RequestPromise = require('request-promise-native');

const AzureHandle = '[AZURE]';

rtm.on('message', (event) => {
    // For structure of `event`, see https://api.slack.com/events/message
    // Skip messages that are from a bot or my own user ID
    if ((event.subtype && event.subtype === 'bot_message') ||
        (!event.subtype && event.subtype === rtm.activeUserId)) {
        return;
    }

    // Log the message
    // console.log(`(channel:${event.channel}) ${event.user} says: ${event.text}`);
    // console.log(event);

    if (event.text.includes(AzureHandle)) {
        // let url = process.env.LUIS_URL + event.text.replace(AzureHandle, '').trim();

        // console.log(url);

        // RequestPromise(url)
        // .then(function (jsonString) {
        //     rtm.sendMessage(jsonString, event.channel)
        //         .then((res) => {
        //             // `res` contains information about the posted message
        //             console.log('Message sent: ', res.ts);
        //         })
        //         .catch(console.error);
        // })
        //     .catch(console.error);

        let message = event.text.replace(AzureHandle, '').trim();
        azureBot.send(uuid(event), message)
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
        rtm.sendMessage('Hello there!', event.channel)
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
