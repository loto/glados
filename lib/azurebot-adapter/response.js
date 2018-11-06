async function format(activity) {
    let response = {};

    if (activity.text) response['text'] = activity.text;

    if (activity.attachments && activity.attachments.length > 0) {
        let attachments = new Array();

        activity.attachments.forEach((attachment) => {
            let card = { elements: new Array() };
            attachment.content.body.forEach((element) => {
                card.elements.push({ type: element.type, text: element.text });
            });
            attachments.push(card);
        });

        response['attachments'] = attachments;
    }

    return response;
}

module.exports = {
    format
}
