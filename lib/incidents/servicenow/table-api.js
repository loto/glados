'use strict';
require('dotenv').config();
const qs = require('querystring');
const restClient = require('../../rest/client');

const baseUrl = `https://{{domain}}.service-now.com/api/now/table/{{table_name}}`;

async function all(tableName, accessToken, remainingAttempts = 3) {
    let domain = process.env.SERVICENOW_DOMAIN;

    let url = baseUrl.replace(/\{\{domain\}\}/, domain).replace(/\{\{table_name\}\}/, tableName);
    let config = { headers: { 'Authorization': 'Bearer ' + accessToken } };
    let response;

    try {
        response = await restClient.create().get(url, config);
        return response.data.result;
    } catch (error) {
        if (remainingAttempts === 0) throw error;
        return await all(tableName, accessToken, remainingAttempts - 1);
    }
}

async function find(tableName, accessToken, id, remainingAttempts = 3) {
    let domain = process.env.SERVICENOW_DOMAIN;

    let urlString = baseUrl.replace(/\{\{domain\}\}/, domain).replace(/\{\{table_name\}\}/, tableName);
    const url = new URL(urlString);
    url.searchParams.append('sysparm_query', encodeURI(qs.stringify({ number: id })));
    let config = { headers: { 'Authorization': 'Bearer ' + accessToken } };
    let response;

    try {
        response = await restClient.create().get(url.href, config);
        return response.data.result[0];
    } catch (error) {
        if (remainingAttempts === 0) throw error;
        return await find(tableName, accessToken, id, remainingAttempts - 1);
    }
}

module.exports = {
    all,
    find
}
