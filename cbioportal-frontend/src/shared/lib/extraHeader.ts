export function setCurrentURLHeader() {
    const old_send = XMLHttpRequest.prototype.send;

    var xhrProto = XMLHttpRequest.prototype,
        origOpen = xhrProto.open;

    xhrProto.open = function(method: string, url: string) {
        this._url = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        if (this._url && /www\.cbioportal\.org\/api/.test(this._url)) {
            this.setRequestHeader(
                'X-CURRENT-URL',
                window.location.href.substr(
                    0,
                    window.location.href.indexOf('#')
                )
            );
        }
        old_send.apply(this, arguments);
    };
}
