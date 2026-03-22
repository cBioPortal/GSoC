import { getBrowserWindow, hashString } from 'cbioportal-frontend-commons';
import { getLoadConfig } from 'config/config';
import { toJS } from 'mobx';
import _ from 'lodash';
import { makeTest, urlChopper } from 'shared/api/testMaker';
import { reportValidationResult, validate } from 'shared/api/validation';
import axios from 'axios';

const endpoints = [
    // internal client endpoints
    'ClinicalDataCounts',
    'MutatedGenes',
    'CaseList',
    'ClinicalDataBin',
    'MolecularProfileSample',
    'CNAGenes',
    'StructuralVariantGenes',
    'FilteredSamples',
    'ClinicalDataDensity',
    'MutationDataCounts',
    'PatientTreatmentCounts',
    'SampleTreatmentCounts',
    'GenomicData',
    'GenericAssay',
    'ViolinPlots',
    'ClinicalEventTypeCounts',
    'AlterationEnrichments',
    // public client endpoints
    'Samples',
    'SamplesByKeyword',
    'SampleInStudy',
    'AllSamplesInStudy',
    'AllSamplesOfPatientInStudy',
];

export function proxyColumnStore(client: any, endpoint: string) {
    // TODO use isClickhouseMode() instead, for some reason when invoked here isClickhouseMode()
    //  throws an error complaining about getBrowserWindow being undefined
    if (/legacy=1/.test(getBrowserWindow().location.search)) {
        return;
    }

    const postMethodName = `${endpoint}UsingPOSTWithHttpInfo`;
    const getMethodName = `${endpoint}UsingGETWithHttpInfo`;

    const postMethod = client[postMethodName];
    const getMethod = client[getMethodName];

    if (postMethod) {
        overrideOldMethod(client, postMethodName, postMethod);
    }

    if (getMethod) {
        overrideOldMethod(client, getMethodName, getMethod);
    }
}

function overrideOldMethod(
    client: any,
    methodName: string,
    oldMethod: Function
) {
    client[methodName] = function columnStore(params: any) {
        const host = getLoadConfig()
            .apiRoot!.replace(/\/$/, '')
            .replace(/^https?:\/\//, '');

        const oldRequest = this.request;

        const matchedMethod = methodName.match(new RegExp(endpoints.join('|')));
        if (localStorage.getItem('LIVE_VALIDATE_KEY') && matchedMethod) {
            this.request = function(...origArgs: any[]) {
                const params = toJS(arguments[2]);
                const oldSuccess = arguments[7];

                arguments[7] = function(response: any) {
                    const url =
                        origArgs[1].replace(
                            /column-store\/api/,
                            'column-store'
                        ) +
                        '?' +
                        _.map(origArgs[4], (v, k) => `${k}=${v}&`).join('');

                    setTimeout(() => {
                        makeTest(params, urlChopper(url), matchedMethod[0]);
                    }, 1000);

                    const hash = hashString(
                        JSON.stringify({ data: params, url: urlChopper(url) })
                    );

                    validate(
                        axios,
                        url,
                        params,
                        matchedMethod[0],
                        hash,
                        response.body,
                        response.headers['elapsed-time']
                    ).then((result: any) => {
                        reportValidationResult(result, 'LIVE', 'verbose');
                    });

                    return oldSuccess.apply(this, arguments);
                };

                oldRequest.apply(this, arguments);
            };
        }

        params.$domain = methodName.match(
            new RegExp('PatientTreatmentCounts|SampleTreatmentCounts')
        )
            ? `//${host}`
            : `//${host}/api/column-store`;

        const promise = oldMethod.apply(this, [params]);

        this.request = oldRequest;

        return promise;
    };
}

export default proxyColumnStore;
