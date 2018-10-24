'use strict';
const uuidv1 = require('uuid/v1');
const baseLogger = require('pino')();
const axios = require('axios');
const requestIdHeaderName = 'X-Request-ID';
const defaultTimeout = 5000;

function create() {
    let headers = {};
    headers[requestIdHeaderName] = uuidv1();

    let instance = axios.create({
        headers: headers,
        timeout: defaultTimeout
    });

    instance.interceptors.request.use(function (config) {
        const requestLogger = baseLogger.child({
            request_id: config.headers[requestIdHeaderName],
            url: config.url
        });
        requestLogger.info();
        const dataLogger = requestLogger.child({ data: config.data });
        dataLogger.debug();
        return config;
    }, function (error) {
        // error.response / error.request
        const requestLogger = baseLogger.child({
            request_id: response.config.headers[requestIdHeaderName],
            url: error.config.url,
            data: error.config.data,
            error: {
                name: error.name,
                message: error.message
            }
        });
        requestLogger.error('request');
        throw error;
    });

    instance.interceptors.response.use(function (response) {
        const requestLogger = baseLogger.child({
            response_id: response.config.headers[requestIdHeaderName],
            url: response.config.url,
            status: `${response.status} ${response.statusText}`
        });
        requestLogger.info();
        const dataLogger = requestLogger.child({ data: response.config.data });
        dataLogger.debug();
        return response;
    }, function (error) {
        // error.response / error.request
        let fields = {
            response_id: error.config.headers[requestIdHeaderName],
            url: error.config.url,
            data: error.config.data,
            error: {
                name: error.name,
                message: error.message
            }
        };
        if (error.response) { fields['status'] = `${error.response.status} ${error.response.statusText}` }
        const requestLogger = baseLogger.child(fields);
        requestLogger.error('response');
        throw error;
    });

    return instance;
}

module.exports = {
    create: create
}
