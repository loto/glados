function hasSucceeded(response) {
    return (parseInt(response.status) >= 200 && parseInt(response.status) < 300);
}

function hasFailed(response) {
    return (!hasSucceeded(response));
}

module.exports = {
    hasSucceeded,
    hasFailed
}
