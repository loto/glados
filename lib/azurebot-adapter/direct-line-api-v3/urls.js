const base = 'https://directline.botframework.com/v3/directline';

function authentication() {
    return `${base}/tokens/generate`;
}

function conversations() {
    return `${base}/conversations`;
}

function activities(conversationId) {
    return `${conversations()}/${conversationId}/activities`;
}

module.exports = {
    authentication,
    conversations,
    activities
}
