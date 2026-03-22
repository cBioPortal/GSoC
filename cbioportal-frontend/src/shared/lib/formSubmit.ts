import { buildCBioPortalPageUrl } from '../api/urls';

export default function formSubmit(
    path: string,
    params: { [s: string]: any },
    target?: string,
    method: 'get' | 'post' | 'smart' = 'post'
) {
    // method="smart" means submit with GET iff the URL wouldn't be too long

    const form = document.createElement('form');
    let computedMethod = method;
    if (method === 'smart') {
        computedMethod =
            buildCBioPortalPageUrl(path, params).length > 1800 ? 'post' : 'get'; // use POST if URL will be too large for some browsers
    }
    form.setAttribute('method', computedMethod);
    form.setAttribute('action', path);
    if (target) {
        form.setAttribute('target', target);
    }

    for (const key of Object.keys(params)) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', params[key]);
        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
}
