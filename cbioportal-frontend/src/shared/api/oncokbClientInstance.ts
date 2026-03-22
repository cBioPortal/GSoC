import { OncoKbAPI } from 'oncokb-ts-api-client';
import eventBus from 'shared/events/eventBus';
import { ErrorMessages } from 'shared/errorMessages';
import { SiteError } from 'shared/model/appMisc';

const client = new OncoKbAPI();

client.addErrorHandler(err => {
    const siteError = new SiteError(
        new Error(ErrorMessages.ONCOKB_LOAD_ERROR),
        'alert'
    );

    try {
        siteError.meta = {
            stacktrace:
                err?.response?.body ||
                err?.response?.text ||
                err?.response?.responseText ||
                'n/a',
            status: err?.status || err?.response?.status || 'n/a',
            responseShape: Object.keys(err?.response || {}),
        };
    } catch (ex) {
        // fail silent
    }

    eventBus.emit('error', null, siteError);
});

export default client;
