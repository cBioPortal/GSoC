import { assert } from 'chai';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';
import {
    makeGenericAssayOption,
    getGenericAssayMetaPropertyOrDefault,
    COMMON_GENERIC_ASSAY_PROPERTY,
    deriveDisplayTextFromGenericAssayType,
    formatGenericAssayCompactLabelByNameAndId,
    filterGenericAssayEntitiesByGenes,
    makeGenericAssayPlotsTabOption,
    filterGenericAssayOptionsByGenes,
} from './GenericAssayCommonUtils';
import { getServerConfig } from 'config/config';
import ServerConfigDefaults from 'config/serverConfigDefaults';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { ISelectOption } from 'shared/lib/GenericAssayUtils/GenericAssaySelectionUtils';

describe('GenericAssayCommonUtils', () => {
    describe('makeGenericAssayOption()', () => {
        it('Includes entity_stable_id and description when present and unique', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1): desc_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides description when same as entity_stable_id', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'id_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1)',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides entity_stable_id when same as name', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'id_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'id_1: desc_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Hides name and description when same as entity_stable_id', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'id_1',
                    DESCRIPTION: 'id_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'id_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Shows entity_stable_id and description when name is missing in properties', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'id_1: desc_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Shows entity_stable_id and name when description is missing in properties', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1)',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });

        it('Shows entity_stable_id when name and description is missing in properties', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {},
            };

            const expect = {
                value: 'id_1',
                label: 'id_1',
            };
            assert.deepEqual(
                makeGenericAssayOption(genericAssayEntity),
                expect
            );
        });
    });

    describe('makeGenericAssayPlotsTabOption()', () => {
        it('add plotAxisLabel for plot tab options', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1): desc_1',
                plotAxisLabel: 'name_1',
            };
            assert.deepEqual(
                makeGenericAssayPlotsTabOption(genericAssayEntity),
                expect
            );
        });

        it('add plotAxisLabel for plot tab options, and use compact label in plot axis', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = {
                value: 'id_1',
                label: 'name_1 (id_1): desc_1',
                plotAxisLabel: 'name_1 (id_1)',
            };
            assert.deepEqual(
                makeGenericAssayPlotsTabOption(genericAssayEntity, true),
                expect
            );
        });
    });

    describe('getGenericAssayMetaPropertyOrDefault()', () => {
        it('property exist in meta', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'name_1';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME
                ),
                expect
            );
        });

        it('property not exist in meta, default value not given', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'NA';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME
                ),
                expect
            );
        });

        it('property not exist in meta, default value given', () => {
            const genericAssayEntity: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    DESCRIPTION: 'desc_1',
                },
            };

            const expect = 'default';
            assert.deepEqual(
                getGenericAssayMetaPropertyOrDefault(
                    genericAssayEntity,
                    COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                    'default'
                ),
                expect
            );
        });
    });

    describe('deriveDisplayTextFromGenericAssayType()', () => {
        beforeAll(() => {
            getServerConfig().generic_assay_display_text = ServerConfigDefaults.generic_assay_display_text!;
        });
        it('derive from the existing display text', () => {
            const displayText = 'Treatment Response';
            const derivedText = deriveDisplayTextFromGenericAssayType(
                GenericAssayTypeConstants.TREATMENT_RESPONSE
            );
            assert.equal(displayText, derivedText);
        });
        it('derive from the type', () => {
            const displayText = 'New Type';
            const derivedText = deriveDisplayTextFromGenericAssayType(
                'NEW_TYPE'
            );
            assert.equal(displayText, derivedText);
        });
        it('derive from the existing display text - plural', () => {
            const displayText = 'Treatment Responses';
            const derivedText = deriveDisplayTextFromGenericAssayType(
                GenericAssayTypeConstants.TREATMENT_RESPONSE,
                true
            );
            assert.equal(displayText, derivedText);
        });
        it('derive from the type - plural', () => {
            const displayText = 'New Types';
            const derivedText = deriveDisplayTextFromGenericAssayType(
                'NEW_TYPE',
                true
            );
            assert.equal(displayText, derivedText);
        });
    });

    describe('formatGenericAssayCompactLabelByNameAndId()', () => {
        it('Hides name when same as stableId', () => {
            const stableId = 'STABLE_ID';
            const name = stableId;
            assert.equal(
                formatGenericAssayCompactLabelByNameAndId(stableId, name),
                stableId
            );
        });
        it('shows name and stableId when they are unique', () => {
            const stableId = 'STABLE_ID';
            const name = 'NAME';
            assert.equal(
                formatGenericAssayCompactLabelByNameAndId(stableId, name),
                `${name} (${stableId})`
            );
        });
    });

    describe('filterGenericAssayEntitiesByGenes()', () => {
        const TARGET_GENE_LIST = ['TP53'];
        it('returns entities when it contains filtered gene', () => {
            const genericAssayEntity1: GenericAssayMeta = {
                stableId: 'tp53',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'id_1',
                },
            };
            const genericAssayEntity2: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'tp53',
                    DESCRIPTION: 'id_1',
                },
            };
            const genericAssayEntity3: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'tp53',
                },
            };
            const genericAssayEntity4: GenericAssayMeta = {
                stableId: 'tp53:WRAP53',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'description_1',
                },
            };
            const genericAssayEntity5: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'tp53;WRAP53',
                    DESCRIPTION: 'description_1',
                },
            };
            const genericAssayEntity6: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'tp53 (cg02087342)',
                },
            };
            const entityList = [
                genericAssayEntity1,
                genericAssayEntity2,
                genericAssayEntity3,
                genericAssayEntity4,
                genericAssayEntity5,
                genericAssayEntity6,
            ];
            assert.deepEqual(
                filterGenericAssayEntitiesByGenes(entityList, TARGET_GENE_LIST),
                entityList
            );
        });
        it('returns empty entity list if cannot find a match', () => {
            const genericAssayEntity1: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'description_1',
                },
            };
            assert.equal(
                filterGenericAssayEntitiesByGenes(
                    [genericAssayEntity1],
                    TARGET_GENE_LIST
                ).length,
                0
            );
            // This should be filtered out because tp53bp1 is not tp53
            // alphanumeric characters is not allowed after gene symbol
            const genericAssayEntity2: GenericAssayMeta = {
                stableId: 'id_1',
                entityType: 'GENERIC_ASSAY',
                genericEntityMetaProperties: {
                    NAME: 'name_1',
                    DESCRIPTION: 'tp53bp1',
                },
            };
            assert.equal(
                filterGenericAssayEntitiesByGenes(
                    [genericAssayEntity2],
                    TARGET_GENE_LIST
                ).length,
                0
            );
        });
    });

    describe('filterGenericAssayOptionsByGenes()', () => {
        const TARGET_GENE_LIST = ['TP53'];
        it('returns options when it contains filtered gene', () => {
            const genericAssayOption1: ISelectOption = {
                value: 'id_1',
                label: 'tp53',
            };
            const genericAssayOption2: ISelectOption = {
                value: 'tp53',
                label: 'label_1',
            };
            const genericAssayOption3: ISelectOption = {
                value: 'tp53 (cg02087342)',
                label: 'label_1',
            };
            const genericAssayOption4: ISelectOption = {
                value: 'id_1',
                label: 'tp53;WRAP53',
            };
            const optionList = [
                genericAssayOption1,
                genericAssayOption2,
                genericAssayOption3,
                genericAssayOption4,
            ];

            assert.deepEqual(
                filterGenericAssayOptionsByGenes(optionList, TARGET_GENE_LIST),
                optionList
            );
        });
        it('returns empty option list if cannot find a match', () => {
            const genericAssayOption1: ISelectOption = {
                value: 'id_1',
                label: 'label_1',
            };
            assert.equal(
                filterGenericAssayOptionsByGenes(
                    [genericAssayOption1],
                    TARGET_GENE_LIST
                ).length,
                0
            );
            // This should be filtered out because tp53bp1 is not tp53
            // alphanumeric characters is not allowed after gene symbol
            const genericAssayOption2: ISelectOption = {
                value: 'id_1',
                label: 'tp53bp1',
            };
            assert.equal(
                filterGenericAssayOptionsByGenes(
                    [genericAssayOption2],
                    TARGET_GENE_LIST
                ).length,
                0
            );
        });
    });
});
