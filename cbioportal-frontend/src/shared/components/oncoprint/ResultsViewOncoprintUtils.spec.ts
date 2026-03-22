import { assert } from 'chai';
import { GenePanelData, MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'shared/constants';
import { makeProfiledInClinicalAttributes } from './ResultsViewOncoprintUtils';
import { SpecialAttribute } from '../../cache/ClinicalDataCache';
import { AlterationTypeText } from 'shared/constants';

describe('ResultsViewOncoprintUtils', () => {
    describe('makeProfiledInClinicalAttributes', () => {
        const molecularProfileIdToMolecularProfile = {
            mutations: {
                molecularProfileId: 'mutations',
                name: 'mutations',
                description: 'mutations profile',
                molecularAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
            } as MolecularProfile,
            discreteCna: {
                molecularProfileId: 'discreteCna',
                name: 'discrete cna',
                description: 'discrete cna profile',
                molecularAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
            } as MolecularProfile,
            linearCna: {
                molecularProfileId: 'linearCna',
                name: 'linear cna',
                description: 'linear cna profile',
                molecularAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
            } as MolecularProfile,
            mrna: {
                molecularProfileId: 'mrna',
                name: 'mrna',
                description: 'mrna profile',
                molecularAlterationType:
                    AlterationTypeConstants.MRNA_EXPRESSION,
            } as MolecularProfile,
        };

        it('does not create any if all samples profiled in every selected alteration type', () => {
            const coverageInformation = {
                sample1: {
                    byGene: {},
                    allGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
            };
            const selectedMolecularProfiles = [
                molecularProfileIdToMolecularProfile.mutations,
            ];
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    true
                ),
                [],
                'single study'
            );
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    false
                ),
                [],
                'multiple study'
            );
        });
        it('does not create any if all samples profiled in every selected alteration type, special case sample is not profiled for one gene but profiled for another', () => {
            const coverageInformation = {
                sample1: {
                    byGene: {
                        BRCA1: [
                            {
                                molecularProfileId: 'mutations',
                            } as GenePanelData,
                        ],
                    },
                    allGenes: [],
                    notProfiledByGene: {
                        KRAS: [
                            {
                                molecularProfileId: 'mutations',
                            } as GenePanelData,
                        ],
                    },
                    notProfiledAllGenes: [],
                },
            };
            const selectedMolecularProfiles = [
                molecularProfileIdToMolecularProfile.mutations,
            ];
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    true
                ),
                [],
                'single study'
            );
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    false
                ),
                [],
                'multiple study'
            );
        });
        it('creates an attribute for one selected alteration type in which not all samples profiled', () => {
            const coverageInformation = {
                sample1: {
                    byGene: {},
                    allGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
                sample2: {
                    byGene: {},
                    allGenes: [],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                },
            };
            const selectedMolecularProfiles = [
                molecularProfileIdToMolecularProfile.mutations,
            ];
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    true
                ),
                [
                    {
                        clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_mutations`,
                        datatype: 'STRING',
                        description: `Profiled in ${molecularProfileIdToMolecularProfile.mutations.name}: ${molecularProfileIdToMolecularProfile.mutations.description}`,
                        displayName: `Profiled in ${molecularProfileIdToMolecularProfile.mutations.name}`,
                        molecularProfileIds: ['mutations'],
                        patientAttribute: false,
                    },
                ] as any,
                'single study'
            );
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    false
                ),
                [
                    {
                        clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${AlterationTypeConstants.MUTATION_EXTENDED}`,
                        datatype: 'STRING',
                        description: '',
                        displayName: `Profiled for ${AlterationTypeText.MUTATION_EXTENDED}`,
                        molecularProfileIds: ['mutations'],
                        patientAttribute: false,
                    },
                ] as any,
                'multiple study'
            );
        });
        it('does not create attributes for unselected alteration types', () => {
            const coverageInformation = {
                sample1: {
                    byGene: {},
                    allGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
                sample2: {
                    byGene: {},
                    allGenes: [],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                },
            };
            const selectedMolecularProfiles = [
                molecularProfileIdToMolecularProfile.linearCna,
            ];
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    true
                ),
                [
                    {
                        clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_linearCna`,
                        datatype: 'STRING',
                        description: `Profiled in ${molecularProfileIdToMolecularProfile.linearCna.name}: ${molecularProfileIdToMolecularProfile.linearCna.description}`,
                        displayName: `Profiled in ${molecularProfileIdToMolecularProfile.linearCna.name}`,
                        molecularProfileIds: ['linearCna'],
                        patientAttribute: false,
                    },
                ] as any,
                'single study'
            );
            assert.deepEqual(
                makeProfiledInClinicalAttributes(
                    coverageInformation,
                    molecularProfileIdToMolecularProfile,
                    selectedMolecularProfiles,
                    false
                ),
                [
                    {
                        clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${AlterationTypeConstants.COPY_NUMBER_ALTERATION}`,
                        datatype: 'STRING',
                        description: '',
                        displayName: `Profiled for ${AlterationTypeText.COPY_NUMBER_ALTERATION}`,
                        molecularProfileIds: ['linearCna'],
                        patientAttribute: false,
                    },
                ] as any,
                'multiple study'
            );
        });
        it('creates multiple attributes for each selected alteration type in which not all samples profiled', () => {
            const coverageInformation = {
                sample1: {
                    byGene: {},
                    allGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                    notProfiledByGene: {
                        TP53: [{ molecularProfileId: 'mrna' } as GenePanelData],
                    },
                    notProfiledAllGenes: [],
                },
                sample2: {
                    byGene: {
                        TP53: [{ molecularProfileId: 'mrna' } as GenePanelData],
                    },
                    allGenes: [],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [
                        { molecularProfileId: 'mutations' } as GenePanelData,
                    ],
                },
            };
            const selectedMolecularProfiles = [
                molecularProfileIdToMolecularProfile.mutations,
                molecularProfileIdToMolecularProfile.mrna,
            ];
            const singleStudyAttributes = makeProfiledInClinicalAttributes(
                coverageInformation,
                molecularProfileIdToMolecularProfile,
                selectedMolecularProfiles,
                true
            );
            assert.deepEqual(
                singleStudyAttributes.find(
                    x => x.clinicalAttributeId.indexOf('mutations') > -1
                ),
                {
                    clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_mutations`,
                    datatype: 'STRING',
                    description: `Profiled in ${molecularProfileIdToMolecularProfile.mutations.name}: ${molecularProfileIdToMolecularProfile.mutations.description}`,
                    displayName: `Profiled in ${molecularProfileIdToMolecularProfile.mutations.name}`,
                    molecularProfileIds: ['mutations'],
                    patientAttribute: false,
                } as any,
                'single study, mutations attribute'
            );
            assert.deepEqual(
                singleStudyAttributes.find(
                    x => x.clinicalAttributeId.indexOf('mrna') > -1
                ),
                {
                    clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_mrna`,
                    datatype: 'STRING',
                    description: `Profiled in ${molecularProfileIdToMolecularProfile.mrna.name}: ${molecularProfileIdToMolecularProfile.mrna.description}`,
                    displayName: `Profiled in ${molecularProfileIdToMolecularProfile.mrna.name}`,
                    molecularProfileIds: ['mrna'],
                    patientAttribute: false,
                } as any,
                'single study, mrna attribute'
            );

            const multipleStudyAttributes = makeProfiledInClinicalAttributes(
                coverageInformation,
                molecularProfileIdToMolecularProfile,
                selectedMolecularProfiles,
                false
            );
            assert.deepEqual(
                multipleStudyAttributes.find(
                    x =>
                        x.clinicalAttributeId.indexOf(
                            AlterationTypeConstants.MUTATION_EXTENDED
                        ) > -1
                ),
                {
                    clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${AlterationTypeConstants.MUTATION_EXTENDED}`,
                    datatype: 'STRING',
                    description: '',
                    displayName: `Profiled for ${AlterationTypeText.MUTATION_EXTENDED}`,
                    molecularProfileIds: ['mutations'],
                    patientAttribute: false,
                } as any,
                'multiple study, mutations attribute'
            );
            assert.deepEqual(
                multipleStudyAttributes.find(
                    x =>
                        x.clinicalAttributeId.indexOf(
                            AlterationTypeConstants.MRNA_EXPRESSION
                        ) > -1
                ),
                {
                    clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${AlterationTypeConstants.MRNA_EXPRESSION}`,
                    datatype: 'STRING',
                    description: '',
                    displayName: `Profiled for ${AlterationTypeText.MRNA_EXPRESSION}`,
                    molecularProfileIds: ['mrna'],
                    patientAttribute: false,
                } as any,
                'multiple study, mrna attribute'
            );
        });
    });
});
