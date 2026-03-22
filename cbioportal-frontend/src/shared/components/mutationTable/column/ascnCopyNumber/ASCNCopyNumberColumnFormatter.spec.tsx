import { ReactWrapper, mount } from 'enzyme';
import { expect } from 'chai';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import { initClinicalData } from 'test/ClinicalDataMockUtils';
import { CLINICAL_ATTRIBUTE_ID_ENUM } from 'shared/constants';
import SampleManager from 'pages/patientView/SampleManager';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { getDefaultASCNCopyNumberColumnDefinition } from './ASCNCopyNumberColumnFormatter';

/* Test design
    This column formatter renders a complex element which includes a hoverover tooltip popup.
    The rendered elements in a single table cell include:
        - a number (the # of samples with the variant) of copy number icon svg elements which vary by:
            - fill-color : selected from the set {
                        ASCN_AMP = #ff0000 (red) [2]
                        ASCN_GAIN #e15b5b (a salmon-ish color close to web color 'IndianRed') [1]
                        ASCN_LIGHTGREY #bcbcbc (close to web color 'Silver') [0]
                        ASCN_HETLOSS #2a5eea (a medium blue color close to web color 'DodgerBlue') [-1]
                        ASCN_HOMDEL #0000ff (blue) [-2]
                        ASCN_BLACK #000000 (black) [anything else]
                    } based on the value of mutation attribute alleleSpecificCopyNumber.ascnIntegerCopyNumber (e.g. [1])
            - text : showing the value of mutation attribute alleleSpecificCopyNumber.TotalCopyNumber
            - optional "WGD" suprascript, evident when the sample represented has clinical
                    attribute 'ASCN_WGD' containing a value "WGD" (and not "NO_WGD")
        - a hoverover tooltip showing one line per sample having the variant, each line with
            - a sample number icon using black SVG circle with superimposed white numeral
            - a text label (e.g. "diploid") corresponding to the ASCNCopyNumberValueEnum
            - text indication of presence/absence of WGD clinical attribute
            - text reporting of TOTAL_COPY_NUMBER and MINOR_COPY_NUMBER mutation attribute values

    test cases explore various expected combinations of the above elements:
        - cases involving only a single sample:
            - without any set ASCN mutation attriubutes
            - with NO_WGD and ASCNCopyNumberValueEnum from each of {'-2','-1','0','1','2','999','NA'}
            - with WGD and ASCNCopyNumberValueEnum from each of {see_above}
            - with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '2'
            - with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '2'
        - cases involving two samples:
            - without any set ASCN mutation attriubutes
            - sample1 NO_WGD, ASCNCopyNumberValueEnum from each of {see_above}; sample2 NO_WGD, ASCN_AMP
            - sample1 NO_WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCNCopyNumberValueEnum from each of {see_above}
            - sample1 NO_WGD, ASCN_HETLOSS; sample2 WGD, ASCN_GAIN
            - sample1 WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCN_GAIN
            - sample1 WGD, ASCN_LIGHTGREY [0]; sample2 WGD, ASCN_BLACK [999]
            - sample1 and sample 2 with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '-1'
            - sample1 and sample 2 with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '-1'
        - cases involving three samples:
            - sample1 WGD, ASCN_AMP; sample2 NO_WGD, ASCN_LIGHTGREY; sample3 WGD, ASCN_HOMDEL

    Note: all tests will test the appropriate presence of a populated tooltip popup
    Also, the first single sample test case, and second two sample test case will omit the
    samplemanager and still expect a populated tooltip to be output. Sub elementes in the tool tip
    are not tested for correctness.
*/

function createMockMutation(
    sampleId: string,
    integerCopyNumberVal?: string,
    totalCopyNumberVal?: string
) {
    if (integerCopyNumberVal) {
        return initMutation({
            sampleId: sampleId,
            alleleSpecificCopyNumber: {
                ascnMethod: 'mock_ascn_method',
                ascnIntegerCopyNumber: integerCopyNumberVal,
                minorCopyNumber: 1,
                totalCopyNumber: totalCopyNumberVal,
            },
        });
    }
    return initMutation({
        sampleId: sampleId,
    });
}

function expectElementPropertiesMatch(
    wrapper: ReactWrapper<any, any>,
    expectedWGD: string, // whole genome duplication attribute
    expectedTCN: string, // totalCopyNumberValue attribute
    expectedMCN: string, // minorCopyNumberValue attribute
    expectedACNV: string // ascnCopyNumberValue attribute
) {
    expect(wrapper.length).to.equal(1); // exactly one copy number element was found
    expect(wrapper.first().prop('wgdValue')).to.equal(expectedWGD);
    expect(wrapper.first().prop('totalCopyNumberValue')).to.equal(expectedTCN);
    expect(wrapper.first().prop('minorCopyNumberValue')).to.equal(expectedMCN);
    expect(wrapper.first().prop('ascnCopyNumberValue')).to.equal(expectedACNV);
}

describe('ASCNCopyNumberColumnFormatter', () => {
    /* mock sample ids */
    const sample1Id: string = 'sample_1_with_ascn_data';
    const sample2Id: string = 'sample_2_with_ascn_data';
    const sample3Id: string = 'sample_3_with_ascn_data';
    const sample6Id: string = 'sample_6_without_ascn_data';
    const sample7Id: string = 'sample_7_without_ascn_data';
    const sample1Ids: string[] = [sample1Id];
    const sample12Ids: string[] = [sample1Id, sample2Id];
    const sample123Ids: string[] = [sample1Id, sample2Id, sample3Id];
    const sample6Ids: string[] = [sample6Id];
    const sample7Ids: string[] = [sample7Id];
    const sample67Ids: string[] = [sample6Id, sample7Id];
    /* mock mutation data */
    const mutation_s1Amp = createMockMutation(sample1Id, '2', '1');
    const mutation_s1Amp_TCN2 = createMockMutation(sample1Id, '2', '2');
    const mutation_s1Gain = createMockMutation(sample1Id, '1', '1');
    const mutation_s1Diploid = createMockMutation(sample1Id, '0', '1');
    const mutation_s1Hetloss = createMockMutation(sample1Id, '-1', '1');
    const mutation_s1Hetloss_TCN2 = createMockMutation(sample1Id, '-1', '2');
    const mutation_s1Homdel = createMockMutation(sample1Id, '-2', '1');
    const mutation_s1Other = createMockMutation(sample1Id, '999', '1');
    const mutation_s1NA = createMockMutation(sample1Id, 'NA', '1');
    const mutation_s2Amp = createMockMutation(sample2Id, '2', '1');
    const mutation_s2Gain = createMockMutation(sample2Id, '1', '1');
    const mutation_s2Diploid = createMockMutation(sample2Id, '0', '1');
    const mutation_s2Hetloss = createMockMutation(sample2Id, '-1', '1');
    const mutation_s2Hetloss_TCN2 = createMockMutation(sample2Id, '-1', '2');
    const mutation_s2Homdel = createMockMutation(sample2Id, '-2', '1');
    const mutation_s2Other = createMockMutation(sample2Id, '999', '1');
    const mutation_s2NA = createMockMutation(sample2Id, 'NA', '1');
    const mutation_s3Amp = createMockMutation(sample3Id, '2', '1');
    const mutation_s3Gain = createMockMutation(sample3Id, '1', '1');
    const mutation_s3Diploid = createMockMutation(sample3Id, '0', '1');
    const mutation_s3Hetloss = createMockMutation(sample3Id, '-1', '1');
    const mutation_s3Homdel = createMockMutation(sample3Id, '-2', '1');
    const mutation_s3Other = createMockMutation(sample3Id, '999', '1');
    const mutation_s3NA = createMockMutation(sample3Id, 'NA', '1');
    const mutation_s6 = createMockMutation(sample6Id);
    const mutation_s7 = createMockMutation(sample7Id);

    const mutations_s1Amp: Mutation[] = [mutation_s1Amp];
    const mutations_s1Amp_TCN1: Mutation[] = [mutation_s1Amp];
    const mutations_s1Amp_TCN2: Mutation[] = [mutation_s1Amp_TCN2];
    const mutations_s1Gain: Mutation[] = [mutation_s1Gain];
    const mutations_s1Diploid: Mutation[] = [mutation_s1Diploid];
    const mutations_s1Hetloss: Mutation[] = [mutation_s1Hetloss];
    const mutations_s1Homdel: Mutation[] = [mutation_s1Homdel];
    const mutations_s1Other: Mutation[] = [mutation_s1Other];
    const mutations_s1NA: Mutation[] = [mutation_s1NA];
    const mutations_s6: Mutation[] = [mutation_s6];
    const mutations_s1Amp_s2Amp: Mutation[] = [mutation_s1Amp, mutation_s2Amp];
    const mutations_s1Gain_s2Amp: Mutation[] = [
        mutation_s1Gain,
        mutation_s2Amp,
    ];
    const mutations_s1Diploid_s2Amp: Mutation[] = [
        mutation_s1Diploid,
        mutation_s2Amp,
    ];
    const mutations_s1Hetloss_s2Amp: Mutation[] = [
        mutation_s1Hetloss,
        mutation_s2Amp,
    ];
    const mutations_s1Homdel_s2Amp: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Amp,
    ];
    const mutations_s1Other_s2Amp: Mutation[] = [
        mutation_s1Other,
        mutation_s2Amp,
    ];
    const mutations_s1NA_s2Amp: Mutation[] = [mutation_s1NA, mutation_s2Amp];
    const mutations_s1Homdel_s2Gain: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Gain,
    ];
    const mutations_s1Homdel_s2Diploid: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Diploid,
    ];
    const mutations_s1Homdel_s2Hetloss: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Hetloss,
    ];
    const mutations_s1Homdel_s2Homdel: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Homdel,
    ];
    const mutations_s1Homdel_s2Other: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2Other,
    ];
    const mutations_s1Homdel_s2NA: Mutation[] = [
        mutation_s1Homdel,
        mutation_s2NA,
    ];
    const mutations_s1Hetloss_s2Gain: Mutation[] = [
        mutation_s1Hetloss,
        mutation_s2Gain,
    ];
    const mutations_s1Diploid_s2Other: Mutation[] = [
        mutation_s1Diploid,
        mutation_s2Other,
    ];
    const mutations_s1Hetloss_s2Hetloss_TCN2: Mutation[] = [
        mutation_s1Hetloss,
        mutation_s2Hetloss_TCN2,
    ];
    const mutations_s1Hetloss_TCN2_s2Hetloss: Mutation[] = [
        mutation_s1Hetloss_TCN2,
        mutation_s2Hetloss,
    ];
    const mutations_s1Hetloss_TCN2_s2Hetloss_TCN2: Mutation[] = [
        mutation_s1Hetloss_TCN2,
        mutation_s2Hetloss_TCN2,
    ];
    const mutations_s1Amp_s2Diploid_s2Homdel: Mutation[] = [
        mutation_s1Amp,
        mutation_s2Diploid,
        mutation_s3Homdel,
    ];
    const mutations_s6_s7: Mutation[] = [mutation_s6, mutation_s7];

    /* mock clinical attributes */
    const clinicalDataSampleIdForSample1: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sample1Id,
    });
    const clinicalDataSampleIdForSample2: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sample2Id,
    });
    const clinicalDataSampleIdForSample3: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sample3Id,
    });
    const clinicalDataSampleIdForSample6: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sample6Id,
    });
    const clinicalDataSampleIdForSample7: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sample6Id,
    });
    const clinicalDataWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD,
        value: 'WGD',
    });
    const clinicalDataNoWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD,
        value: 'NO_WGD',
    });

    function mockCompleteClinicalDataMapPromise(sampleIdToClinicalDataMap: {
        [sampleId: string]: ClinicalData[];
    }): MobxPromise<{ [sampleId: string]: ClinicalData[] }> {
        return {
            result: sampleIdToClinicalDataMap,
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };
    }

    function mockPendingClinicalDataMapPromise(): MobxPromise<{
        [sampleId: string]: ClinicalData[];
    }> {
        return {
            result: {},
            status: 'pending' as 'pending',
            peekStatus: 'pending',
            isPending: true,
            isError: false,
            isComplete: false,
            error: undefined,
        };
    }

    function mockErrorClinicalDataMapPromise(): MobxPromise<{
        [sampleId: string]: ClinicalData[];
    }> {
        return {
            result: {},
            status: 'error' as 'error',
            peekStatus: 'error',
            isPending: false,
            isError: true,
            isComplete: false,
            error: new Error('MockError'),
        };
    }

    const s1NoWgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataNoWgd],
    });
    const s1WgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataWgd],
    });
    const s2NoWgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataNoWgd],
    });
    const s2WgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataWgd],
    });
    const s3NoWgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample3Id]: [clinicalDataSampleIdForSample3, clinicalDataNoWgd],
    });
    const s3WgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample3Id]: [clinicalDataSampleIdForSample3, clinicalDataWgd],
    });
    const s1NoWgds2NoWgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataNoWgd],
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataNoWgd],
    });
    const s1NoWgds2WgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataNoWgd],
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataWgd],
    });
    const s1Wgds2NoWgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataWgd],
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataNoWgd],
    });
    const s1Wgds2WgdClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataWgd],
        [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataWgd],
    });
    const s1Wgds2NoWgds3WgdClinicalDataMap = mockCompleteClinicalDataMapPromise(
        {
            [sample1Id]: [clinicalDataSampleIdForSample1, clinicalDataWgd],
            [sample2Id]: [clinicalDataSampleIdForSample2, clinicalDataNoWgd],
            [sample3Id]: [clinicalDataSampleIdForSample3, clinicalDataWgd],
        }
    );
    const s6ClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample6Id]: [clinicalDataSampleIdForSample6],
    });
    const s7ClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample7Id]: [clinicalDataSampleIdForSample7],
    });
    const s6s7ClinicalDataMap = mockCompleteClinicalDataMapPromise({
        [sample6Id]: [clinicalDataSampleIdForSample6],
        [sample7Id]: [clinicalDataSampleIdForSample7],
    });
    const s1NoWgdClinicalDataMapPending = mockPendingClinicalDataMapPromise();
    const s1NoWgdClinicalDataMapError = mockErrorClinicalDataMapPromise();

    /* test column definitions */
    let nullSampleManager = new SampleManager([], []);
    let s1NoWgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample1Ids,
        s1NoWgdClinicalDataMap,
        nullSampleManager
    );
    let s1WgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample1Ids,
        s1WgdClinicalDataMap,
        nullSampleManager
    );
    let s1NoWgds2NoWgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample12Ids,
        s1NoWgds2NoWgdClinicalDataMap,
        nullSampleManager
    );
    let s1NoWgds2WgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample12Ids,
        s1NoWgds2WgdClinicalDataMap,
        nullSampleManager
    );
    let s1Wgds2NoWgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample12Ids,
        s1Wgds2NoWgdClinicalDataMap,
        nullSampleManager
    );
    let s1Wgds2WgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample12Ids,
        s1Wgds2WgdClinicalDataMap,
        nullSampleManager
    );
    let s1Wgds2NoWgds3WgdColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample123Ids,
        s1Wgds2NoWgds3WgdClinicalDataMap,
        nullSampleManager
    );
    let s6ColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample6Ids,
        s6ClinicalDataMap,
        nullSampleManager
    );
    let s7ColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample7Ids,
        s7ClinicalDataMap,
        nullSampleManager
    );
    let s6s7ColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample67Ids,
        s6s7ClinicalDataMap,
        nullSampleManager
    );
    let s1NoWgdPendingColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample1Ids,
        s1NoWgdClinicalDataMapPending,
        nullSampleManager
    );
    let s1NoWgdErrorColDef = getDefaultASCNCopyNumberColumnDefinition(
        sample1Ids,
        s1NoWgdClinicalDataMapError,
        nullSampleManager
    );

    // Single sample tests - without any set ASCN mutation attriubutes
    it('renders default (no ASCN data) sample6', () => {
        const cellWrapper = mount(s6ColDef.render(mutations_s6));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample6Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NA', '-1', '-1', '-1');
    });

    // Single sample tests - with NO_WGD and ASCNCopyNumberValueEnum from each of {'-2','-1','0','1','2','999','NA'}
    it('renders sample1 NoWgd Amp', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Amp));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '2');
    });

    it('renders sample1 NoWgd Gain', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Gain));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '1');
    });
    it('renders sample1 NoWgd Diploid', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Diploid));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '0');
    });
    it('renders sample1 NoWgd Hetloss', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Hetloss));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-1');
    });
    it('renders sample1 NoWgd Homdel', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Homdel));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
    });
    it('renders sample1 NoWgd Other (999)', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Other));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '999');
    });
    it('renders sample1 NoWgd NA', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1NA));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', 'NA');
    });
    // Single sample tests - with WGD and ASCNCopyNumberValueEnum from each of {see_above}
    it('renders sample1 Wgd Amp', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Amp));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '2');
    });
    it('renders sample1 Wgd Gain', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Gain));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '1');
    });
    it('renders sample1 Wgd Diploid', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Diploid));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '0');
    });
    it('renders sample1 Wgd Hetloss', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Hetloss));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '-1');
    });
    it('renders sample1 Wgd Homdel', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Homdel));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '-2');
    });
    it('renders sample1 Wgd Other (999)', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Other));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '999');
    });
    it('renders sample1 Wgd NA', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1NA));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', 'NA');
    });
    // Single sample tests - with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '2'
    it('renders sample1 NoWgd Amp totalCopy1', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Amp_TCN1));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Amp totalCopy2', () => {
        const cellWrapper = mount(s1NoWgdColDef.render(mutations_s1Amp_TCN2));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '2', '1', '2');
    });
    // Single sample tests - with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '2'
    it('renders sample1 Wgd Amp totalCopy1', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Amp_TCN1));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '2');
    });
    it('renders sample1 Wgd Amp totalCopy2', () => {
        const cellWrapper = mount(s1WgdColDef.render(mutations_s1Amp_TCN2));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(1); // one sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '2', '1', '2');
    });
    // Two sample tests - without any set ASCN mutation attriubutes
    it('renders default (no ASCN data) sample6,sample7', () => {
        const cellWrapper = mount(s6s7ColDef.render(mutations_s6_s7));
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s6Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample6Id
        );
        expectElementPropertiesMatch(s6Wrapper, 'NA', '-1', '-1', '-1'); // unset
        const s7Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample7Id
        );
        expectElementPropertiesMatch(s7Wrapper, 'NA', '-1', '-1', '-1'); // unset
    });
    // Two sample tests - sample1 NO_WGD, ASCNCopyNumberValueEnum from each of {see_above}; sample2 NO_WGD, ASCN_AMP
    it('renders sample1 NoWgd Amp, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Amp_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Gain, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Gain_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Diploid, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Diploid_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '0');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Hetloss, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Hetloss_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Other(999), sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Other_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '999');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd NA, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1NA_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', 'NA');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    // Two sample tests - sample1 NO_WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCNCopyNumberValueEnum from each of {see_above}
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Amp', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Amp)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '2');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Gain', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Gain)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '1');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Diploid', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Diploid)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '0');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Hetloss', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Hetloss)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '-1');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Homdel', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Homdel)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '-2');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd Other(999)', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2Other)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '999');
    });
    it('renders sample1 NoWgd Homdel, sample2 NoWgd NA', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Homdel_s2NA)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', 'NA');
    });
    // Two sample tests - sample1 NO_WGD, ASCN_HETLOSS; sample2 WGD, ASCN_GAIN
    it('renders sample1 NoWgd Hetloss, sample2 Wgd Gain', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Hetloss_s2Gain)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '1');
    });
    // Two sample tests - sample1 WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCN_GAIN
    it('renders sample1 Wgd Homdel, sample2 NoWgd Gain', () => {
        const cellWrapper = mount(
            s1Wgds2NoWgdColDef.render(mutations_s1Homdel_s2Gain)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '-2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '1');
    });
    // Two sample tests - sample1 WGD, ASCN_LIGHTGREY [0]; sample2 WGD, ASCN_BLACK [999]
    it('renders sample1 Wgd Diploid, sample2 Wgd Other(999)', () => {
        const cellWrapper = mount(
            s1Wgds2WgdColDef.render(mutations_s1Diploid_s2Other)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '0');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'WGD', '1', '1', '999');
    });
    // Two sample tests - sample1 and sample 2 with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '-1'
    it('renders sample1 NoWgd Hetloss, sample2 NoWgd Hetloss totalCopy2', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Hetloss_s2Hetloss_TCN2)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '1', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '2', '1', '-1');
    });
    it('renders sample1 NoWgd Hetloss totalCopy2, sample2 NoWgd Hetloss', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Hetloss_TCN2_s2Hetloss)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '2', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '-1');
    });
    it('renders sample1 NoWgd Hetloss totalCopy2, sample2 NoWgd Hetloss totalCopy2', () => {
        const cellWrapper = mount(
            s1NoWgds2NoWgdColDef.render(mutations_s1Hetloss_TCN2_s2Hetloss_TCN2)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'NO_WGD', '2', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '2', '1', '-1');
    });
    // Two sample tests - sample1 and sample 2 with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValueEnum of '-1'
    it('renders sample1 Wgd Hetloss, sample2 Wgd Hetloss totalCopy2', () => {
        const cellWrapper = mount(
            s1Wgds2WgdColDef.render(mutations_s1Hetloss_s2Hetloss_TCN2)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'WGD', '2', '1', '-1');
    });
    it('renders sample1 Wgd Hetloss totalCopy2, sample2 Wgd Hetloss', () => {
        const cellWrapper = mount(
            s1Wgds2WgdColDef.render(mutations_s1Hetloss_TCN2_s2Hetloss)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '2', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'WGD', '1', '1', '-1');
    });
    it('renders sample1 Wgd Hetloss totalCopy2, sample2 Wgd Hetloss totalCopy2', () => {
        const cellWrapper = mount(
            s1Wgds2WgdColDef.render(mutations_s1Hetloss_TCN2_s2Hetloss_TCN2)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(2); // two sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '2', '1', '-1');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'WGD', '2', '1', '-1');
    });

    // Three sample test - sample1 WGD, ASCN_AMP; sample2 NO_WGD, ASCN_LIGHTGREY; sample3 WGD, ASCN_HOMDEL
    it('renders sample1 Wgd Amp, sample2 NoWgd Diploid, sample3 Wgd Homdel', () => {
        const cellWrapper = mount(
            s1Wgds2NoWgds3WgdColDef.render(mutations_s1Amp_s2Diploid_s2Homdel)
        );
        const elementsWrapper = cellWrapper.find('ASCNCopyNumberElement');
        expect(elementsWrapper.length).to.equal(3); // three sample
        const s1Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample1Id
        );
        expectElementPropertiesMatch(s1Wrapper, 'WGD', '1', '1', '2');
        const s2Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample2Id
        );
        expectElementPropertiesMatch(s2Wrapper, 'NO_WGD', '1', '1', '0');
        const s3Wrapper = elementsWrapper.filterWhere(
            e => e.prop('sampleId') === sample3Id
        );
        expectElementPropertiesMatch(s3Wrapper, 'WGD', '1', '1', '-2');
    });

    // sample test with pending clinical data
    it('renders pending indicator when clinical data not yet available', () => {
        const cellWrapper = mount(s1NoWgdPendingColDef.render(mutations_s1Amp));
        const elementsWrapper = cellWrapper.find('.fa-spinner');
        expect(elementsWrapper.length).to.equal(1); // one pending icon
    });

    // sample test with error clinical data
    it('renders pending indicator when clinical data promise is in error state', () => {
        const cellWrapper = mount(s1NoWgdErrorColDef.render(mutations_s1Amp));
        const elementsWrapper = cellWrapper.find('.fa-exclamation-triangle');
        expect(elementsWrapper.length).to.equal(1); // one error icon
    });
});
