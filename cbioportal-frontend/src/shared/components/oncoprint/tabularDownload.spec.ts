import { assert } from 'chai';
import { getTabularDownloadData } from './tabularDownload';

describe('getTabularDownloadData', () => {
    it('downloads counts map tracks successfully, sample mode', () => {
        assert.deepEqual(
            getTabularDownloadData(
                [],
                [
                    {
                        key: '',
                        label: 'mutation spectrum',
                        attributeId: 'MUTATION_SPECTRUM',
                        description: '',
                        data: [
                            {
                                attr_id: '',
                                sample: 'sample1',
                                uid: 'sample1',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 119,
                                    'C>G': 186,
                                    'C>T': 24,
                                    'T>A': 77,
                                    'T>C': 12,
                                    'T>G': 50,
                                },
                            },
                            {
                                attr_id: '',
                                sample: 'sample2',
                                uid: 'sample2',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 17,
                                    'C>G': 11,
                                    'C>T': 3,
                                    'T>A': 21,
                                    'T>C': 18,
                                    'T>G': 110,
                                },
                            },
                            {
                                attr_id: '',
                                sample: 'sample3',
                                uid: 'sample3',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 161,
                                    'C>G': 127,
                                    'C>T': 31,
                                    'T>A': 38,
                                    'T>C': 126,
                                    'T>G': 26,
                                },
                            },
                        ],
                        datatype: 'counts',
                        countsCategoryLabels: [
                            'C>A',
                            'C>G',
                            'C>T',
                            'T>A',
                            'T>C',
                            'T>G',
                        ],
                        countsCategoryFills: [],
                    },
                    {
                        key: '',
                        attributeId: 'other_counts',
                        label: 'other counts',
                        description: '',
                        data: [
                            {
                                attr_id: '',
                                sample: 'sample1',
                                uid: 'sample1',
                                attr_val_counts: {},
                                attr_val: {
                                    a: 82,
                                    b: 8,
                                },
                            },
                            {
                                attr_id: '',
                                sample: 'sample2',
                                uid: 'sample2',
                                attr_val_counts: {},
                                attr_val: undefined,
                                na: true,
                            },
                            {
                                attr_id: '',
                                sample: 'sample3',
                                uid: 'sample3',
                                attr_val_counts: {},
                                attr_val: {
                                    a: 134,
                                    b: 46,
                                },
                            },
                        ],
                        datatype: 'counts',
                        countsCategoryLabels: ['a', 'b'],
                        countsCategoryFills: [],
                    },
                ],
                [],
                [],
                [],
                ['sample1', 'sample2', 'sample3'],
                x => x,
                'sample',
                false
            ),
            'track_name\ttrack_type\tsample1\tsample2\tsample3\n' +
                'mutation spectrum (C>A)\tCLINICAL\t119\t17\t161\n' +
                'mutation spectrum (C>G)\tCLINICAL\t186\t11\t127\n' +
                'mutation spectrum (C>T)\tCLINICAL\t24\t3\t31\n' +
                'mutation spectrum (T>A)\tCLINICAL\t77\t21\t38\n' +
                'mutation spectrum (T>C)\tCLINICAL\t12\t18\t126\n' +
                'mutation spectrum (T>G)\tCLINICAL\t50\t110\t26\n' +
                `other counts (a)\tCLINICAL\t82\t\t134\n` +
                'other counts (b)\tCLINICAL\t8\t\t46\n'
        );
    });
    it('downloads counts map tracks successfully, patient mode', () => {
        assert.deepEqual(
            getTabularDownloadData(
                [
                    {
                        key: 'GENETICTRACK_0',
                        label: 'TP53',
                        sublabel: ': MUT',
                        oql: 'TP53: MUT',
                        info: '',
                        data: [
                            {
                                disp_mut: 'trunc_rec',
                                disp_germ: false,
                                patient: 'sample1',
                                uid: 'sample1',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [
                                    {
                                        alterationSubType: 'frameshift',
                                        alterationType: 'MUTATION_EXTENDED',
                                        entrezGeneId: 7157,
                                        hugoGeneSymbol: 'TP53',
                                        isHotspot: false,
                                        molecularProfileAlterationType:
                                            'MUTATION_EXTENDED',
                                        mutationStatus: '.',
                                        mutationType: 'Frame_Shift_Del',
                                        oncoKbOncogenic: 'Likely Oncogenic',
                                        proteinChange: 'H168Cfs*8',
                                        putativeDriver: true,
                                        driverFilter: '',
                                        driverFilterAnnotation: '',
                                        driverTiersFilter: '',
                                        driverTiersFilterAnnotation: '',
                                        eventInfo: '',
                                        value: 0,
                                        site1HugoSymbol: '',
                                        site2HugoSymbol: '',
                                    },
                                ],
                            },
                            {
                                patient: 'sample2',
                                uid: 'sample2',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [],
                            },
                            {
                                patient: 'sample3',
                                uid: 'sample3',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [],
                            },
                        ],
                    },
                    {
                        key: 'GENETICTRACK_1',
                        label: 'TP53',
                        sublabel: ': HOMDEL',
                        oql: 'TP53: HOMDEL',
                        info: '',
                        data: [
                            {
                                patient: 'sample1',
                                uid: 'sample1',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [],
                            },
                            {
                                disp_cna: 'homdel_rec',
                                patient: 'sample2',
                                uid: 'sample2',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [
                                    {
                                        alterationSubType: 'homdel',
                                        alterationType:
                                            'COPY_NUMBER_ALTERATION',
                                        entrezGeneId: 7157,
                                        hugoGeneSymbol: 'TP53',
                                        molecularProfileAlterationType:
                                            'COPY_NUMBER_ALTERATION',
                                        oncoKbOncogenic: 'Likely Oncogenic',
                                        putativeDriver: true,
                                        value: -2,
                                        proteinChange: '',
                                        driverFilter: '',
                                        driverFilterAnnotation: '',
                                        driverTiersFilter: '',
                                        driverTiersFilterAnnotation: '',
                                        mutationType: '',
                                        isHotspot: false,
                                        mutationStatus: '',
                                        eventInfo: '',
                                        site1HugoSymbol: '',
                                        site2HugoSymbol: '',
                                    },
                                ],
                            },
                            {
                                patient: 'sample3',
                                uid: 'sample3',
                                not_profiled_in: [],
                                study_id: 'study1',
                                trackLabel: 'TP53',
                                data: [],
                            },
                        ],
                    },
                ],
                [
                    {
                        key: '',
                        attributeId: 'MUTATION_SPECTRUM',
                        label: 'mutation spectrum',
                        description: '',
                        data: [
                            {
                                attr_id: '',
                                patient: 'sample1',
                                uid: 'sample1',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 119,
                                    'C>G': 186,
                                    'C>T': 24,
                                    'T>A': 77,
                                    'T>C': 12,
                                    'T>G': 50,
                                },
                            },
                            {
                                attr_id: '',
                                patient: 'sample2',
                                uid: 'sample2',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 17,
                                    'C>G': 11,
                                    'C>T': 3,
                                    'T>A': 21,
                                    'T>C': 18,
                                    'T>G': 110,
                                },
                            },
                            {
                                attr_id: '',
                                patient: 'sample3',
                                uid: 'sample3',
                                attr_val_counts: {},
                                attr_val: {
                                    'C>A': 161,
                                    'C>G': 127,
                                    'C>T': 31,
                                    'T>A': 38,
                                    'T>C': 126,
                                    'T>G': 26,
                                },
                            },
                        ],
                        datatype: 'counts',
                        countsCategoryLabels: [
                            'C>A',
                            'C>G',
                            'C>T',
                            'T>A',
                            'T>C',
                            'T>G',
                        ],
                        countsCategoryFills: [],
                    },
                    {
                        key: '',
                        attributeId: 'other_counts',
                        label: 'other counts',
                        description: '',
                        data: [
                            {
                                attr_id: '',
                                patient: 'sample1',
                                uid: 'sample1',
                                attr_val_counts: {},
                                attr_val: {
                                    a: 82,
                                    b: 8,
                                },
                            },
                            {
                                attr_id: '',
                                patient: 'sample2',
                                uid: 'sample2',
                                attr_val_counts: {},
                                attr_val: undefined,
                                na: true,
                            },
                            {
                                attr_id: '',
                                patient: 'sample3',
                                uid: 'sample3',
                                attr_val_counts: {},
                                attr_val: {
                                    a: 134,
                                    b: 46,
                                },
                            },
                        ],
                        datatype: 'counts',
                        countsCategoryLabels: ['a', 'b'],
                        countsCategoryFills: [],
                    },
                ],
                [],
                [],
                [],
                ['sample1', 'sample2', 'sample3'],
                x => x,
                'patient',
                false
            ),
            'track_name\ttrack_type\tsample1\tsample2\tsample3\n' +
                'mutation spectrum (C>A)\tCLINICAL\t119\t17\t161\n' +
                'mutation spectrum (C>G)\tCLINICAL\t186\t11\t127\n' +
                'mutation spectrum (C>T)\tCLINICAL\t24\t3\t31\n' +
                'mutation spectrum (T>A)\tCLINICAL\t77\t21\t38\n' +
                'mutation spectrum (T>C)\tCLINICAL\t12\t18\t126\n' +
                'mutation spectrum (T>G)\tCLINICAL\t50\t110\t26\n' +
                `other counts (a)\tCLINICAL\t82\t\t134\n` +
                'other counts (b)\tCLINICAL\t8\t\t46\n' +
                'TP53\tCNA\t\thomdel_rec\t\n' +
                'TP53\tMUTATIONS\tTruncating mutation\t\t\n' +
                'TP53\tMRNA\t\t\t\n' +
                'TP53\tPROTEIN\t\t\t\n' +
                'TP53\tSTRUCTURAL_VARIANT\t\t\t\n'
        );
    });
});
