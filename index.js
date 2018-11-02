'use strict';
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const sessions = require('./lib/sessions');

const echobot = require('./lib/echobot-adapter/bot');
const azurebot = require('./lib/azurebot-adapter/bot');
const rasabot = require('./lib/rasabot-adapter/bot');
const incidents = require('./lib/incidents/incident');

const AGENTS = { 'echobot': echobot, 'azurebot': azurebot, 'rasabot': rasabot };
const default_agent = 'echobot';

fastify.decorate('authenticate', async (token) => {
    return await sessions.find(token);
});

fastify.decorateReply('invalidAuthentication', function () {
    this.type('application/json');
    this.code(401);
    this.send({ error: 'Invalid conversation token' });
});

fastify.post('/conversation/start', async (_request, reply) => {
    let session = await sessions.new(default_agent);
    reply.type('application/json');
    reply.code(201);
    reply.send({ token: session.token });
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

    let session = await fastify.authenticate(token);
    if (!session) reply.invalidAuthentication();

    try {
        let response = await AGENTS[session.agent_name].sendMessage(token, message)
        reply.type('application/json')
            .code(200)
            .send({ reply: response });
    } catch (error) {
        let errorCode = isNaN(error.code) ? 500 : error.code;
        reply.type('application/json')
            .code(errorCode)
            .send({ error: error.message });
    }
});

fastify.get('/agents/list', async (_request, reply) => {
    reply.type('application/json')
        .code(200)
        .send({ agents: Object.keys(AGENTS) });
});

const agent_select_opts = {
    schema: {
        body: {
            type: 'object',
            properties: {
                token: { type: 'string' },
                name: {
                    type: 'string',
                    enum: Object.keys(AGENTS)
                }
            },
            required: ['name', 'token']
        }
    }
};

fastify.post('/agent/select', agent_select_opts, async (request, reply) => {
    let name = request.body.name;
    let token = request.body.token;

    let session = await fastify.authenticate(token);
    if (!session) reply.invalidAuthentication();

    await sessions.update(token, name);
    reply.type('application/json')
        .code(200)
        .send({ agent: name });
});

fastify.get('/incidents/list', async (_request, reply) => {
    let response;
    try {
        response = await incidents.all();
        reply.type('application/json')
            .code(200)
            .send({ incidents: response });
    } catch (error) {
        let errorCode = isNaN(error.code) ? 500 : error.code;
        reply.type('application/json')
            .code(errorCode)
            .send({ error: error.message });
    }
});

fastify.get('/incidents/search', async (request, reply) => {
    let id = request.query.id;
    let response;
    try {
        response = await incidents.find(id);
        reply.type('application/json')
            .code(200)
            .send({ incident: response });
    } catch (error) {
        let errorCode = isNaN(error.code) ? 500 : error.code;
        reply.type('application/json')
            .code(errorCode)
            .send({ error: error.message });
    }
});

fastify.listen(process.env.PORT, (err, _address) => {
    if (err) throw err
});
