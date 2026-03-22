import ClinicalDataForAttributesCache from './ClinicalDataForAttributesCache';

export default class CancerTypeCache extends ClinicalDataForAttributesCache {
    constructor() {
        super(['CANCER_TYPE_DETAILED'], 'SAMPLE', 'SUMMARY');
    }
}
