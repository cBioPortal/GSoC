const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    postDataToUrl,
    waitForOncoprint,
    getElementByTestHandle,
} = require('../../../shared/specUtils_Async');
const _ = require('lodash');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('posting query parameters (instead of GET) to query page', function() {
    it('reads posted data (written by backend) and successfully passes params into URL, resulting in oncoprint display', async function() {
        const url = `${CBIOPORTAL_URL}`;
        await goToUrlAndSetLocalStorage(url, true);

        let query = {
            gene_list: 'CDKN2A MDM2 MDM4 TP53',
            cancer_study_list: 'study_es_0',
            case_set_id: 'study_es_0_cnaseq',
            profileFilter: '0',
            RPPA_SCORE_THRESHOLD: '2.0',
            Z_SCORE_THRESHOLD: '2.0',
            genetic_profile_ids_PROFILE_MUTATION_EXTENDED:
                'study_es_0_mutations',
            genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION:
                'study_es_0_gistic',
        };

        await postDataToUrl(`${url}/results`, query);

        // the following could only occur if code passes data written above into url
        await browser.waitUntil(async () => {
            const url = await browser.getUrl();

            // make sure param in query is passed to url and encoded
            return _.every(query, (item, key) => {
                if (key === 'gene_list') {
                    return url.includes(
                        `${key}=${encodeURIComponent(encodeURIComponent(item))}`
                    );
                } else {
                    return url.includes(`${key}=${encodeURIComponent(item)}`);
                }
            });
        });

        const postData = await browser.execute(() => {
            return window.postData;
        });

        assert(postData === null, 'postData has been set to null after read');

        await waitForOncoprint();
    });
});

describe('Post Data for StudyView Filtering with filterJson via HTTP Post', () => {
    it('Verify PatientIdentifier Filter via postData', async () => {
        const filterJsonQuery = {
            filterJson:
                '{"patientIdentifiers":[{"studyId":"lgg_ucsf_2014_test_generic_assay","patientId":"P01"}]}',
        };

        const NUMBER_OF_PATIENTS_AFTER_FILTER = 1;

        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`, true);

        await postDataToUrl(
            `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
            filterJsonQuery
        );

        await (await getElementByTestHandle('selected-patients')).waitForExist({
            timeout: 20000,
        });

        assert.equal(
            await (await getElementByTestHandle('selected-patients')).getText(),
            NUMBER_OF_PATIENTS_AFTER_FILTER
        );
    });
});
