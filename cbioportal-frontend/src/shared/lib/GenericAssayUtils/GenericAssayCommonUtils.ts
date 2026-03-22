import client from 'shared/api/cbioportalClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {
    GenericAssayMetaFilter,
    GenericAssayMeta,
    GenericAssayDataMultipleStudyFilter,
    GenericAssayFilter,
} from 'cbioportal-ts-api-client';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { IDataQueryFilter } from '../StoreUtils';
import {
    doesOptionMatchSearchText,
    ISelectOption,
} from './GenericAssaySelectionUtils';
import {
    GENERIC_ASSAY_CONFIG,
    GenericAssayTypeConstants,
} from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import * as Pluralize from 'pluralize';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';

export const NOT_APPLICABLE_VALUE = 'NA';
export const COMMON_GENERIC_ASSAY_PROPERTY = {
    NAME: 'NAME',
    DESCRIPTION: 'DESCRIPTION',
    URL: 'URL',
};

export const RESERVED_CATEGORY_ORDER_DICT: {
    [genericAssayType: string]: string[];
} = {
    // Add more generic assay types here to change category order in plots tab
    [GenericAssayTypeConstants.ARMLEVEL_CNA]: [
        'Loss',
        'Unchanged',
        'Gain',
        'NA',
    ],
};

export enum GenericAssayDataType {
    LIMIT_VALUE = 'LIMIT-VALUE',
    CATEGORICAL = 'CATEGORICAL',
    BINARY = 'BINARY',
}

export async function fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType(
    molecularProfiles: MolecularProfile[]
) {
    // TODO: use AlterationTypeContants here instead of string for GENERIC_ASSAY
    // we removed it because importing from page store was causing circular dependency
    const genericAssayProfiles = molecularProfiles.filter(
        profile => profile.molecularAlterationType === 'GENERIC_ASSAY'
    );

    const genericAssayProfilesGroupedByGenericAssayType = _.groupBy(
        genericAssayProfiles,
        'genericAssayType'
    );
    const genericAssayTypes = _.keys(
        genericAssayProfilesGroupedByGenericAssayType
    );

    const genericAssayMetaGroupedByGenericAssayType: {
        [genericAssayType: string]: GenericAssayMeta[];
    } = {};

    await Promise.all(
        genericAssayTypes.map(genericAssayType =>
            fetchGenericAssayMetaByProfileIds(
                _.map(
                    genericAssayProfilesGroupedByGenericAssayType[
                        genericAssayType
                    ],
                    profile => profile.molecularProfileId
                )
            ).then(genericAssayMeta => {
                genericAssayMetaGroupedByGenericAssayType[
                    genericAssayType
                ] = genericAssayMeta;
            })
        )
    );
    return genericAssayMetaGroupedByGenericAssayType;
}

export async function fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId(
    molecularProfiles: MolecularProfile[]
) {
    const genericAssayProfiles = molecularProfiles.filter(profile => {
        return profile.molecularAlterationType === 'GENERIC_ASSAY';
    });

    // Group profiles by suffix — profiles with the same suffix across
    // different studies share the same entity set (e.g.
    // "study_a_methylation_hm450" and "study_b_methylation_hm450" both share the suffix "methylation_hm450").
    const profilesGroupedBySuffix = _.groupBy(
        genericAssayProfiles,
        getSuffixOfMolecularProfile
    );

    // One API call per unique suffix instead of one per profile
    const metaBySuffix: { [suffix: string]: GenericAssayMeta[] } = {};
    await Promise.all(
        _.map(profilesGroupedBySuffix, (profiles, suffix) =>
            fetchGenericAssayMetaByProfileIds(
                profiles.map(p => p.molecularProfileId)
            ).then(meta => {
                metaBySuffix[suffix] = meta;
            })
        )
    );

    // Map results back to individual profile IDs
    const genericAssayMetaGroupByMolecularProfileId: {
        [molecularProfileId: string]: GenericAssayMeta[];
    } = {};
    for (const profile of genericAssayProfiles) {
        const suffix = getSuffixOfMolecularProfile(profile);
        genericAssayMetaGroupByMolecularProfileId[
            profile.molecularProfileId
        ] = metaBySuffix[suffix] || [];
    }

    return genericAssayMetaGroupByMolecularProfileId;
}

export async function fetchGenericAssayMetaGroupedByMolecularProfileIdSuffix(
    genericAssayProfiles: MolecularProfile[]
) {
    const genericAssayProfilesGroupedByProfileIdSuffix = _.groupBy(
        genericAssayProfiles,
        getSuffixOfMolecularProfile
    );
    const profileSuffixes = _.keys(
        genericAssayProfilesGroupedByProfileIdSuffix
    );

    const genericAssayMetaGroupedByProfileIdSuffix: {
        [profileIdSuffix: string]: GenericAssayMeta[];
    } = {};

    await Promise.all(
        profileSuffixes.map(profileSuffix =>
            fetchGenericAssayMetaByProfileIds(
                _.map(
                    genericAssayProfilesGroupedByProfileIdSuffix[profileSuffix],
                    profile => profile.molecularProfileId
                )
            ).then(genericAssayMeta => {
                genericAssayMetaGroupedByProfileIdSuffix[
                    profileSuffix
                ] = genericAssayMeta;
            })
        )
    );
    return genericAssayMetaGroupedByProfileIdSuffix;
}

export function fetchGenericAssayMetaByProfileIds(
    genericAssayProfileIds: string[]
) {
    if (genericAssayProfileIds.length > 0) {
        return client.fetchGenericAssayMetaUsingPOST({
            genericAssayMetaFilter: {
                molecularProfileIds: genericAssayProfileIds,
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter,
        });
    }
    return Promise.resolve([]);
}

export function fetchGenericAssayMetaByEntityIds(entityIds: string[]) {
    if (entityIds.length > 0) {
        return client.fetchGenericAssayMetaUsingPOST({
            genericAssayMetaFilter: {
                genericAssayStableIds: entityIds,
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both molecularProfileIds and genericAssayStableIds;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayMetaFilter,
        });
    }
    return Promise.resolve([]);
}

export async function fetchGenericAssayData(
    entityIdsByProfile: { [molecularProfileId: string]: string[] },
    sampleFilterByProfile: { [molecularProfileId: string]: IDataQueryFilter }
) {
    const params: {
        molecularProfileId: string;
        genericAssayFilter: GenericAssayFilter;
    }[] = _.map(entityIdsByProfile, (entityIds, profileId) => {
        return {
            molecularProfileId: profileId,
            genericAssayFilter: {
                genericAssayStableIds: entityIds,
                ...sampleFilterByProfile[profileId],
                // the Swagger-generated type expected by the client method below
                // incorrectly requires both samples and a sample list;
                // use 'as' to tell TypeScript that this object really does fit.
            } as GenericAssayFilter,
        };
    });
    const dataPromises = params.map(param => {
        // do not request data by using empty sample list
        if (
            _.isEmpty(param.genericAssayFilter.sampleIds) &&
            !param.genericAssayFilter.sampleListId
        ) {
            return Promise.resolve([]);
        } else {
            return client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                param
            );
        }
    });
    const results = await Promise.all(dataPromises);
    return results;
}

export function fetchGenericAssayDataByStableIdsAndMolecularIds(
    stableIds: string[],
    molecularProfileIds: string[]
) {
    return client.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST({
        genericAssayDataMultipleStudyFilter: {
            genericAssayStableIds: stableIds,
            molecularProfileIds: molecularProfileIds,
        } as GenericAssayDataMultipleStudyFilter,
    });
}

export function makeGenericAssayOption(meta: GenericAssayMeta) {
    const label = formatGenericAssayCommonLabel(meta);
    return {
        value: meta.stableId,
        label: label,
    };
}

export function makeGenericAssayPlotsTabOption(
    meta: GenericAssayMeta,
    shouldUseCompactLabelForPlotAxis?: boolean
) {
    const label = formatGenericAssayCommonLabel(meta);
    const entityName = getGenericAssayMetaPropertyOrDefault(
        meta,
        COMMON_GENERIC_ASSAY_PROPERTY.NAME,
        meta.stableId
    );
    return {
        value: meta.stableId,
        label: label,
        plotAxisLabel: shouldUseCompactLabelForPlotAxis
            ? formatGenericAssayCompactLabelByNameAndId(
                  meta.stableId,
                  entityName
              )
            : entityName,
    };
}

export function formatGenericAssayCommonLabel(meta: GenericAssayMeta) {
    // Note: name and desc are optional fields for generic assay entities
    // When not provided in the data file, these fields are assigned the
    // value of the entity_stable_id. The code below hides fields when
    // indentical to the entity_stable_id.
    const name = getGenericAssayMetaPropertyOrDefault(
        meta,
        COMMON_GENERIC_ASSAY_PROPERTY.NAME,
        meta.stableId
    );
    const description = getGenericAssayMetaPropertyOrDefault(
        meta,
        COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION,
        meta.stableId
    );
    const uniqueName = name !== meta.stableId;
    const uniqueDesc = description !== meta.stableId && description !== name;
    // set stableId as default label
    let label = meta.stableId;
    if (!uniqueName && !uniqueDesc) {
        label = meta.stableId;
    } else if (!uniqueName) {
        label = `${meta.stableId}: ${description}`;
    } else if (!uniqueDesc) {
        label = `${name} (${meta.stableId})`;
    } else {
        label = `${name} (${meta.stableId}): ${description}`;
    }
    return label;
}

export function formatGenericAssayCompactLabelByNameAndId(
    stableId: string,
    name: string
) {
    const uniqueName = name !== stableId;
    let label = stableId;
    if (uniqueName) {
        label = `${name} (${stableId})`;
    }
    return label;
}

export function getGenericAssayPropertyOrDefault(
    genericAssayProperties: {},
    property: string,
    defaultValue: string = NOT_APPLICABLE_VALUE
): string {
    if (property in genericAssayProperties) {
        return (genericAssayProperties as {
            [property: string]: string;
        })[property];
    } else {
        return defaultValue;
    }
}

export function getGenericAssayMetaPropertyOrDefault(
    meta: GenericAssayMeta,
    property: string,
    defaultValue: string = NOT_APPLICABLE_VALUE
): string {
    return getGenericAssayPropertyOrDefault(
        meta.genericEntityMetaProperties,
        property,
        defaultValue
    );
}

export function getGenericAssayCategoryFromName(
    name: string,
    defaultValue: string
) {
    // TODO: should we add additional property 'CATEGORY' in data file
    // currently, category can be derived from name
    // name format: ENTITY_NAME (CATEGORY)
    // we can get category between '(' and ')'
    const regExpName = /\(([^)]+)\)/;
    const matchFound = regExpName.exec(name);
    return matchFound != null ? matchFound![1] : 'No category';
}

export function getCategoryOrderByGenericAssayType(genericAssayType: string) {
    // return category order for reserved generic assay type
    // return undefined for other types
    return genericAssayType in RESERVED_CATEGORY_ORDER_DICT
        ? RESERVED_CATEGORY_ORDER_DICT[genericAssayType]
        : undefined;
}

export function constructGeneRegex(hugoGeneSymbol: string) {
    // Match whole gene symbol text and case-insensitive, non-alphanumeric characters is allowed after gene symbol
    // Sometimes, gene symbol might appear in description text
    // If it shows in description text, we might want to find if it's before a blank space
    return new RegExp(`^(${hugoGeneSymbol}|${hugoGeneSymbol}\\W+.*)$`, 'i');
}

export function filterGenericAssayEntitiesByGenes(
    genericAssayEntities: GenericAssayMeta[],
    hugoGeneSymbols: string[]
) {
    // filter logic is: stableId, name or description
    // filter out others entities and only keep matching entities
    return _.filter(genericAssayEntities, meta => {
        const entityName = getGenericAssayMetaPropertyOrDefault(
            meta,
            COMMON_GENERIC_ASSAY_PROPERTY.NAME,
            ''
        );
        const entityDescription = getGenericAssayMetaPropertyOrDefault(
            meta,
            COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION,
            ''
        );
        return _.some(hugoGeneSymbols, hugoGeneSymbol => {
            const regex = constructGeneRegex(hugoGeneSymbol);
            return (
                regex.test(meta.stableId) ||
                regex.test(entityName) ||
                regex.test(entityDescription)
            );
        });
    });
}

export function filterGenericAssayOptionsByGenes(
    options: ISelectOption[],
    hugoGeneSymbols: string[]
) {
    return _.filter(options, option =>
        _.some(hugoGeneSymbols, hugoGeneSymbol => {
            const regex = constructGeneRegex(hugoGeneSymbol);
            return regex.test(option.label) || regex.test(option.value);
        })
    );
}

export function deriveDisplayTextFromGenericAssayType(
    genericAssayType: string,
    plural?: boolean
) {
    let derivedDisplayText = '';
    if (
        genericAssayType in GENERIC_ASSAY_CONFIG.genericAssayConfigByType &&
        GENERIC_ASSAY_CONFIG.genericAssayConfigByType[genericAssayType]
            .displayTitleText
    ) {
        derivedDisplayText = GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
            genericAssayType
        ].displayTitleText!;
    } else {
        const textArray = genericAssayType.split('_');
        const capitalizeTextArray = textArray.map(text =>
            _.capitalize(text.toLowerCase())
        );
        derivedDisplayText = capitalizeTextArray.join(' ');
    }

    if (plural) {
        return Pluralize.plural(derivedDisplayText);
    }
    return derivedDisplayText;
}

export function getSortedGenericAssayTabSpecs(
    genericAssayEnrichmentProfilesGroupedByGenericAssayType: {
        [key: string]: MolecularProfile[];
    } = {}
): { genericAssayType: string; linkText: string }[] {
    const genericAssayTabSpecs: {
        genericAssayType: string;
        linkText: string;
    }[] = _.keys(genericAssayEnrichmentProfilesGroupedByGenericAssayType).map(
        genericAssayType => ({
            genericAssayType,
            linkText: deriveDisplayTextFromGenericAssayType(genericAssayType),
        })
    );

    return _.sortBy(genericAssayTabSpecs, specs => specs.linkText);
}

export function getSortedGenericAssayAllTabSpecs(
    genericAssayAllEnrichmentProfilesGroupedByGenericAssayType: {
        [key: string]: MolecularProfile[];
    } = {}
): { genericAssayType: string; linkText: string }[] {
    const genericAssayAllTabSpecs: {
        genericAssayType: string;
        linkText: string;
    }[] = _.keys(
        genericAssayAllEnrichmentProfilesGroupedByGenericAssayType
    ).map(genericAssayType => ({
        genericAssayType,
        linkText: deriveDisplayTextFromGenericAssayType(genericAssayType),
    }));
    return _.sortBy(genericAssayAllTabSpecs, specs => specs.linkText);
}
