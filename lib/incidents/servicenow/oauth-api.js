'use strict';
require('dotenv').config();
const restClient = require('../../rest/client');
const querystring = require('querystring');
const errors = require('../../rest/errors');

const baseUrl = `https://{{domain}}.service-now.com/oauth_token.do`;

async function getTokens(remainingAttempts = 3) {
    let domain = process.env.SERVICENOW_DOMAIN;
    let login = process.env.SERVICENOW_LOGIN;
    let password = process.env.SERVICENOW_PASSWORD
    let client_id = process.env.SERVICENOW_CLIENT_ID;
    let client_secret = process.env.SERVICENOW_CLIENT_SECRET;

    let url = baseUrl.replace(/\{\{domain\}\}/, domain);
    let body = querystring.stringify({
        grant_type: 'password',
        username: login,
        password: password,
        client_id: client_id,
        client_secret: client_secret
    });
    let response;
    try {
        response = await restClient.create().post(url, body);
    } catch (error) {
        if (remainingAttempts === 0) throw error;
        return await getTokens(remainingAttempts - 1);
    }

    await checkResponse(response.data);
    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
    };
}

async function renewToken(refreshToken, remainingAttempts = 3) {
    let domain = process.env.SERVICENOW_DOMAIN;
    let client_id = process.env.SERVICENOW_CLIENT_ID;
    let client_secret = process.env.SERVICENOW_CLIENT_SECRET;

    let url = baseUrl.replace(/\{\{domain\}\}/, domain);
    let body = querystring.stringify({
        grant_type: 'refresh_token',
        client_id: client_id,
        client_secret: client_secret,
        refresh_token: refreshToken
    });
    let response;

    try {
        response = await restClient.create().post(url, body);
    } catch (error) {
        if (remainingAttempts === 0) throw error;
        return await renewToken(refreshToken, remainingAttempts - 1);
    }

    await checkResponse(response.data);
    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
    };
}

async function checkResponse(data) {
    if (!data.access_token || !data.refresh_token || !data.expires_in) {
        throw new errors.RestError('401', 'Authentication error');
    }
}

module.exports = {
    getTokens: getTokens,
    renewToken: renewToken
}
