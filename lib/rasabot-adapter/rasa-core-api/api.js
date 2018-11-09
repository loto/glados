'use strict';
const baseUrl = 'http://localhost:5005';

const baseLogger = require('pino')({ level: process.env.LOG_LEVEL });
const apiLogger = baseLogger.child({ component: 'Rasa bot api' });;
const axios = require('axios');

exports.conversationsRespond = async function (uuid, message) {
    let body = { 'query': message };
    let config = {};

    log(`Sending Message...`);

    let response = await axios.post(`${baseUrl}/conversations/${uuid}/respond`, body, config)
    if (isSuccessful(response.status)) {
        return response.data[0].text;
    } else {
        let errorMessage = `Rasa bot api conversations respond process returned: ${response.status} ${response.status}`;
        throw new Error(errorMessage);
    }
}

function isSuccessful(statusCode) {
    return [200, 201].includes(statusCode);
}

function log(message) {
    apiLogger.info(message);
}
