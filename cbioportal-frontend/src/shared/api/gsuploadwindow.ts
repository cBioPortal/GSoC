// Copyright 2013 Broad Institute, Inc.  All rights reserved.

import request from 'superagent';

let jsuiRoot = 'https://gsui.genomespace.org/jsui/';

type Callback = (data: any) => void;

export function gsUploadByGet(config: {
    url: string;
    filename?: string;
    successCallback?: Callback;
    errorCallback?: Callback;
}) {
    // expect an object with url, filename (optional), successCallback(optional), errorCallback (optional)

    let gsUploadUrl = jsuiRoot + '/upload/loadUrlToGenomespace.html?uploadUrl=';
    let dest = encodeURIComponent(config.url);
    let filenameParam = '';
    if (config['filename'] != null) {
        filenameParam = '&fileName=' + config.filename;
    }

    let newWin = window.open(
        gsUploadUrl + dest + filenameParam,
        'GenomeSpace Upload',
        'height=340px,width=550px'
    );
    if (!newWin) return alert('GenomeSpace popup was blocked by the browser');
    else {
        newWin.focus();
        if (config['successCallback'] != null)
            (newWin as any).setCallbackOnGSUploadComplete =
                config['successCallback'];

        if (config['errorCallback'] != null)
            (newWin as any).setCallbackOnGSUploadError =
                config['errorCallback'];
    }
}

export function gsLocationByGet(config: {
    successCallback: Callback;
    errorCallback?: Callback;
}) {
    // expect an object with url, filename (optional), successCallback, errorCallback (optional)

    let gsUploadUrl =
        jsuiRoot + '/upload/loadUrlToGenomespace.html?getLocation=true';

    let newWin = window.open(
        gsUploadUrl,
        'GenomeSpace Upload',
        'height=360px,width=600px'
    );

    let successCallback = config['successCallback'];
    window.addEventListener(
        'message',
        function(e) {
            successCallback(e.data);
        },
        false
    );

    if (newWin) {
        newWin.focus();
    }

    if (config['errorCallback'] != null)
        (newWin as any).setCallbackOnGSUploadError = config['errorCallback'];
}

export function gsSelectFileByGet(config: {
    successCallback: Callback;
    errorCallback?: Callback;
}) {
    // expect an object with url, filename (optional), successCallback, errorCallback (optional)
    let gsUploadUrl =
        jsuiRoot + '/upload/loadUrlToGenomespace.html?getFile=true';
    let newWin = window.open(
        gsUploadUrl,
        'GenomeSpace Upload',
        'height=340px,width=550px'
    );
    if (newWin) {
        newWin.focus();

        (newWin as any).setCallbackOnGSLocationComplete =
            config['successCallback'];

        if (config['errorCallback'] != null)
            (newWin as any).setCallbackOnGSUploadError =
                config['errorCallback'];
    }
}

export async function gsUploadByPost(formData: any) {
    // expects an object with formData( the file(s)),

    function gsUploadByPostErrorHandler(err: any) {
        alert('An error occurred while posting the file to GenomeSpace');
    }

    function gsUploadByPostCompleteHandler(responseObj: any) {
        if (typeof responseObj == 'string') {
            responseObj = JSON.parse(responseObj);
        }
        let newWin = window.open(
            responseObj.completionUrl,
            'GenomeSpace Upload',
            'height=340px,width=550px'
        );
        (newWin as any).focus();
    }
    let params = {
        url: jsuiRoot + '/postToGenomeSpace', //server script to process data
        type: 'POST',
        crossDomain: true,
        success: gsUploadByPostCompleteHandler,
        error: gsUploadByPostErrorHandler,
        data: formData,
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false,
    };

    // $.ajax(params);

    let req = request
        .agent()
        .post(params.url, (err, res) =>
            err ? params.error(err) : params.success(res)
        )
        .send(params.data);
}
