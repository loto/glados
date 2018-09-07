require('dotenv').config();

const { RTMClient } = require('@slack/client');

// An access token (from your Slack app or custom integration - usually xoxb)
const token = process.env.BOT_TOKEN;

// The client is initialized and then started to get an active connection to the platform
const rtm = new RTMClient(token);
rtm.start();

rtm.on('message', (event) => {
    // For structure of `event`, see https://api.slack.com/events/message
    // Skip messages that are from a bot or my own user ID
    if ((event.subtype && event.subtype === 'bot_message') ||
        (!event.subtype && event.subtype === rtm.activeUserId)) {
        return;
    }

    // Log the message
    console.log(`(channel:${event.channel}) ${event.user} says: ${event.text}`);
    console.log(event);

    rtm.sendMessage('Hello there', event.channel)
        .then((res) => {
            // `res` contains information about the posted message
            console.log('Message sent: ', res.ts);
        })
        .catch(console.error);
});
