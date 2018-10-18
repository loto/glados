'use strict';
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const sessions = require('./sessions');

const echobot = require('./echobot-adapter/bot');
const azurebot = require('./azurebot-adapter/bot');
const rasabot = require('./rasabot-adapter/bot');

const AGENTS = { 'echobot': echobot, 'azurebot': azurebot, 'rasabot': rasabot };
const default_agent = 'echobot';

fastify.post('/conversation/start', async (_request, reply) => {
    reply.type('application/json').code(201)
    let session = await sessions.new(default_agent);
    return { token: session.token }
});

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
};

fastify.post('/conversation/say', conversation_say_opts, async (request, reply) => {
    let message = request.body.message;
    let token = request.body.token;
    let session = await sessions.find(token);
    if (session) {
        reply.type('application/json').code(200);
        return { reply: await AGENTS[session.agent_name].sendMessage(token, message) };
    } else {
        reply.type('application/json').code(404);
        return { error: 'Unknown conversation token' };
    }
});

fastify.get('/agents/list', async (request, reply) => {
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
};

fastify.post('/agent/select', agent_select_opts, async (request, reply) => {
    let name = request.body.name;
    let token = request.body.token;
    let session = await sessions.find(token);
    if (session) {
        if (Object.keys(AGENTS).includes(name)) {
            await sessions.update(token, name);
            reply.type('application/json').code(200)
            return { agent: name }
        } else {
            reply.type('application/json').code(404);
            return { error: 'Unknown agent' };
        }
    } else {
        reply.type('application/json').code(404);
        return { error: 'Unknown conversation token' };
    }
});

fastify.listen(process.env.PORT, (err, _address) => {
    if (err) throw err
});
