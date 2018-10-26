'use strict';
const baseLogger = require('pino')();
const oauthApi = require('./oauth-api');
const tableApi = require('./table-api');

const session = { accessToken: null, refreshToken: null };
let accessTokenTimer, refreshTokenTimer;

async function all(tableName) {
    await authenticate();
    let incidents = await tableApi.all(tableName, session.accessToken);
    return incidents;
}

async function find(tableName, id) {
    await authenticate();
    let incident = await tableApi.find(tableName, session.accessToken, id);
    return incident;
}

async function authenticate() {
    if (!session.access_token) {
        if (!session.refresh_token) {
            let response = await oauthApi.getTokens();

            accessTokenTimer = setTimeout(expireAccessToken, response.expires_in * 1000);
            refreshTokenTimer = setTimeout(expireRefreshToken, 86400 * 1000);

            session.accessToken = response.access_token;
            session.refreshToken = response.refresh_token;
        } else {
            let response = await oauthApi.renewToken(session.refreshToken);

            if (accessTokenTimer) clearTimeout(accessTokenTimer);
            accessTokenTimer = setTimeout(expireAccessToken, response.expires_in * 1000);
            session.accessToken = response.access_token;
        }
    }
}

function expireAccessToken() {
    baseLogger.info('access_token expired');
    session.access_token = null;
    accessTokenTimer = null;
}

function expireRefreshToken() {
    baseLogger.info('refresh_token expired');
    session.refreshToken = null;
    refreshTokenTimer = null;
}

module.exports = {
    all: all,
    find: find
}
