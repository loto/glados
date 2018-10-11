'use strict';
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const uuidv1 = require('uuid/v1');
const cache = {};

const echobot = require('./echobot-adapter/bot');

const AGENTS = { 'echobot': echobot };
const default_agent = 'echobot';

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

fastify.post('/conversation/start', async (request, reply) => {
    reply.type('application/json').code(201)
    let uuid = uuidv1();
    cache[uuid] = default_agent;
    return { token: uuid }
})

const conversation_say_opts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                message: { type: 'string' }
            },
            required: ['token', 'message']
        }
    }
}

fastify.post('/conversation/say', conversation_say_opts, async (request, reply) => {
    if (findAgent(request.body.token)) {
        reply.type('application/json').code(200);
        return { reply: await AGENTS[cache[request.body.token]].sendMessage(request.body.token, request.body.message) };
    } else {
        reply.type('application/json').code(404);
        return { error: 'Unknown conversation token' };
    }
})

fastify.get('/agent/list', async (request, reply) => {
    reply.type('application/json').code(200)
    return { agents: Object.keys(AGENTS) }
})

const agent_select_opts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                name: { type: 'string' }
            },
            required: ['name', 'token']
        }
    }
}

fastify.post('/agent/select', agent_select_opts, async (request, reply) => {
    if (findAgent(request.body.token)) {
        if (Object.keys(AGENTS).includes(request.body.name)) {
            cache[request.body.token] = request.body.name;
            reply.type('application/json').code(200)
            return { agent: request.body.name }
        } else {
            reply.type('application/json').code(404);
            return { error: 'Unknown agent' };
        }
    } else {
        reply.type('application/json').code(404);
        return { error: 'Unknown conversation token' };
    }
})

fastify.listen(process.env.PORT, (err, address) => {
    if (err) throw err
    fastify.log.info(`server listening on ${address}`)
})

function findAgent(token) {
    let [_token, agent] = Object.entries(cache).find(function ([key, value]) {
        return key === token;
    });
    return agent;
}
