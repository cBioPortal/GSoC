import { assert } from 'chai';
import _ from 'lodash';
import {
    DEFAULT_GROUP_NAME_WITH_USER_INPUT,
    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT,
    CodeEnum,
    getData,
    getLine,
    getLines,
    InputLine,
    LineTypeEnum,
    ValidationResult,
    validateLines,
} from './CustomCaseSelectionUtils';
import { ClinicalDataTypeEnum } from '../../StudyViewUtils';
import { Sample } from 'cbioportal-ts-api-client';

describe('CustomCaseSelectionUtils', () => {
    describe('getData', () => {
        const s1 = ({
            studyId: 's1',
            sampleId: 'c1',
            patientId: 'p1',
            copyNumberSegmentPresent: false,
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            uniquePatientKey: 's1_p1',
            uniqueSampleKey: 's1_c1',
        } as unknown) as Sample;

        const s2 = ({
            studyId: 's1',
            sampleId: 'c2',
            patientId: 'p2',
            copyNumberSegmentPresent: false,
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            uniquePatientKey: 's1_p2',
            uniqueSampleKey: 's1_c2',
        } as unknown) as Sample;

        it("group name should be Selected when it's not specified by user", () => {
            const sampleIdentifiersWithData = getData(
                [
                    {
                        line: 's1:c1',
                        studyId: 's1',
                        caseId: 'c1',
                    },
                ],
                's1',
                ClinicalDataTypeEnum.SAMPLE,
                [s1],
                false
            );
            assert.isTrue(sampleIdentifiersWithData.length === 1);
            assert.isTrue(
                sampleIdentifiersWithData[0].value ===
                    DEFAULT_GROUP_NAME_WITHOUT_USER_INPUT
            );
        });

        it("group name should be NA when it's specified by user", () => {
            const sampleIdentifiersWithData = getData(
                [
                    { line: 's1:c1', studyId: 's1', caseId: 'c1' },
                    {
                        line: 's1:c2',
                        studyId: 's1',
                        caseId: 'c2',
                        value: 'Group1',
                    },
                ],
                's1',
                ClinicalDataTypeEnum.SAMPLE,
                [s1, s2],
                true
            );
            assert.isTrue(sampleIdentifiersWithData.length === 2);
            assert.isTrue(
                sampleIdentifiersWithData[0].value ===
                    DEFAULT_GROUP_NAME_WITH_USER_INPUT
            );
            assert.isTrue(sampleIdentifiersWithData[1].value === 'Group1');
        });
    });

    describe('getLine', () => {
        it('study id should be properly assigned', () => {
            const result = getLine('test:test1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
        });
        it('case id should be properly assigned', () => {
            const result = getLine('test');
            assert.equal(result.caseId, 'test');
        });
        it('group name should be properly assigned when separate by space', () => {
            const result = getLine('test:test1 group1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
            assert.equal(result.value, 'group1');
        });
        it('group name should be properly assigned when separate by tab', () => {
            const result = getLine('test:test1\tgroup1');
            assert.equal(result.studyId, 'test');
            assert.equal(result.caseId, 'test1');
            assert.equal(result.value, 'group1');
        });
    });

    describe('getLines', () => {
        it('proper number of lines should be returned - 1', () => {
            const line = 'test\n';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('proper number of lines should be returned - 2', () => {
            const line = 'test\n\n';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('proper number of lines should be returned - 3', () => {
            const line = 'test';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
        });

        it('study id should be undefined', () => {
            const line = 'c1';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0].studyId === undefined);
            assert.isTrue(result[0].caseId === 'c1');
        });

        it('parse case id properly', () => {
            const line = 's1:c1';
            const result = getLines(line);
            assert.isTrue(result.length === 1);
            assert.isTrue(result[0].studyId === 's1');
            assert.isTrue(result[0].caseId === 'c1');
        });
    });

    describe('validateLines', () => {
        const st1 = (_.map(new Array(10), (item, index) => {
            return {
                studyId: 'chol_nus_2012',
                sampleId: 's' + index,
                patientId: 'p' + index,
                copyNumberSegmentPresent: false,
                sampleType: 'Primary Solid Tumor',
                sequenced: true,
                uniquePatientKey: 'chol_nus_2012_p' + index,
                uniqueSampleKey: 'chol_nus_2012_s' + index,
            };
        }) as unknown) as Sample[];

        const st2 = (_.map(new Array(5), (item, index) => {
            return {
                studyId: 'lgg_tcga',
                sampleId: 's' + index,
                patientId: 'p' + index,
                copyNumberSegmentPresent: false,
                sampleType: 'Primary Solid Tumor',
                sequenced: true,
                uniquePatientKey: 'lgg_tcga_p' + index,
                uniqueSampleKey: 'lgg_tcga_s' + index,
            };
        }) as unknown) as Sample[];

        it('In multiple studies, study id needs to be specified', () => {
            const lines: InputLine[] = [
                {
                    line: 'chol_nus_2012:s1',
                    studyId: 'chol_nus_2012',
                    caseId: 's1',
                },
                {
                    line: 'lgg_tcga:s1',
                    studyId: 'lgg_tcga',
                    caseId: 's1',
                },
                {
                    line: 's1',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1.concat(st2),
                false,
                ['chol_nus_2012', 'lgg_tcga']
            );

            assert.isTrue(result.warning.length !== 0);
            assert.isTrue(
                _.keyBy(result.warning, 'code')[CodeEnum.INVALID_CASE_ID] !==
                    undefined
            );
        });

        it('Give error for unknown study ids', () => {
            const lines: InputLine[] = [
                {
                    line: 'chol_nus_2012:s1',
                    studyId: 'chol_nus_2012',
                    caseId: 's1',
                },
                {
                    line: 'lgg_tcga:s1',
                    studyId: 'lgg_tcga',
                    caseId: 's1',
                },
                {
                    line: 'test:s1',
                    studyId: 'test',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1.concat(st2),
                false,
                ['chol_nus_2012', 'lgg_tcga']
            );
            assert.isTrue(result.error.length !== 0);
            assert.isTrue(
                _.keyBy(result.error, 'code')[CodeEnum.STUDY_NOT_SELECTED] !==
                    undefined
            );
        });

        it('In single study, study id does not need to be specified', () => {
            const lines: InputLine[] = [
                {
                    line: 's1',
                    caseId: 's1',
                },
            ];
            const result: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1,
                true,
                ['chol_nus_2012']
            );
            assert.isTrue(result.error.length === 0);
        });

        describe('The warning message should be given when case is invalid', () => {
            it('Check when study id is not specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1test',
                        caseId: 's1test',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.SAMPLE,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
            it('Check when study id is specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1test',
                        studyId: 'chol_nus_2012',
                        caseId: 's1test',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.SAMPLE,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
        });

        describe('The warning message should be given when case id is sample but asking for validation on patient', () => {
            it('Check when study id is not specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1',
                        caseId: 's1',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.PATIENT,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
            it('Check when study id is specified', function() {
                const lines: InputLine[] = [
                    {
                        line: 's1',
                        studyId: 'chol_nus_2012',
                        caseId: 's1',
                    },
                ];
                const result: ValidationResult = validateLines(
                    lines,
                    ClinicalDataTypeEnum.PATIENT,
                    st1,
                    true,
                    ['chol_nus_2012']
                );
                assert.isTrue(result.warning.length === 1);
                assert.equal(result.warning[0].code, CodeEnum.INVALID_CASE_ID);
            });
        });

        it('For duplicate cases, give POTENTIAL_OVERLAP warning when the case is in different group', () => {
            const lines: InputLine[] = [
                {
                    line: 's1',
                    caseId: 's1',
                    value: 't1',
                },
                {
                    line: 's1',
                    caseId: 's1',
                    value: 't2',
                },
            ];
            const noGroupNameResult: ValidationResult = validateLines(
                lines,
                ClinicalDataTypeEnum.SAMPLE,
                st1,
                true,
                ['chol_nus_2012']
            );
            assert.isTrue(noGroupNameResult.warning.length === 1);
            assert.isTrue(noGroupNameResult.error.length === 0);
            assert.equal(
                noGroupNameResult.warning[0].code,
                CodeEnum.POTENTIAL_OVERLAP
            );
        });
    });
});
