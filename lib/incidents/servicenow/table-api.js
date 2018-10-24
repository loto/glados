'use strict';
require('dotenv').config();
const restClient = require('../../restClient');

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

module.exports = {
    all: all
}
