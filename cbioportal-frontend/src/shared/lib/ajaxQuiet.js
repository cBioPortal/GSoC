window.ajaxRequests = {};
var _send = XMLHttpRequest.prototype.send;
var lastTimeout = null;

let startTime = 0;
let activityTimeout;

export function setNetworkListener() {
    window.ajaxQuiet = true;

    var xhrProto = XMLHttpRequest.prototype,
        origOpen = xhrProto.open;

    xhrProto.open = function(method, url) {
        if (/\/api/.test(url)) {
            const dict = localStorage.dict ? JSON.parse(localStorage.dict) : {};
            dict[url] = true;
            localStorage.dict = JSON.stringify(dict);
        }

        this._url = url;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
        if (window.ajaxQuiet !== false) {
            startTime = performance.now();
            console.log('starting network activity timer');
            window.ajaxQuiet = false;
        }

        clearTimeout(activityTimeout);

        var id = Math.floor(Math.random() * 1000000000);
        window.ajaxRequests[id] = { url: this._url, started: Date.now() };
        /* Wrap onreadystaechange callback */
        var callback = this.onreadystatechange;
        this.onreadystatechange = function() {
            if (this.readyState == 4) {
                delete window.ajaxRequests[id];
            }
            if (callback) callback.apply(this, arguments);
            if (Object.keys(window.ajaxRequests).length === 0) {
                activityTimeout = setTimeout(() => {
                    window.ajaxQuiet = true;
                    console.log(
                        'ending network activity timer',
                        performance.now() - startTime - 1000
                    );
                }, 1000);
            }
        };

        _send.apply(this, arguments);
    };
}
