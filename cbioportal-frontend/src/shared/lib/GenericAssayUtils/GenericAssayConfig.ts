import { getServerConfig } from 'config/config';
import _ from 'lodash';

export type GenericAssayConfig = {
    genericAssayConfigByType: {
        [genericAssayType: string]: GenericAssayTypeConfig;
    };
    // Add more Generic Assay global config from here
};

export const GenericAssayTypeConstants: { [s: string]: string } = {
    TREATMENT_RESPONSE: 'TREATMENT_RESPONSE',
    MUTATIONAL_SIGNATURE: 'MUTATIONAL_SIGNATURE',
    ARMLEVEL_CNA: 'ARMLEVEL_CNA',
    METHYLATION: 'METHYLATION',
};

export type GenericAssayTypeConfig = {
    // Add more Generic Assay type specific config at here
    displayTitleText?: string;
    globalConfig?: GlobalConfig;
    oncoprintTrackConfig?: OncoprintTrackConfig;
    plotsTabConfig?: PlotsTabConfig;
    selectionConfig?: SelectionConfig;
    downloadTabConfig?: DownloadTabConfig;
};

export type OncoprintTrackConfig = {
    formatNameUsingCompactLabel?: boolean;
    formatDescriptionUsingCommonLabel?: boolean;
};

export type PlotsTabConfig = {
    plotsTabUsecompactLabel?: boolean;
};

export type GlobalConfig = {
    geneRelatedGenericAssayType?: boolean;
    entityTitle?: string;
};

export type SelectionConfig = {
    placeHolderText?: string;
    formatChartNameUsingCompactLabel?: boolean;
};

export type DownloadTabConfig = {
    formatDownloadHeaderUsingCompactLabel?: boolean;
};

// We have some customizations for Gene related Generic Assay profiles (e.g. Methylation)
// One can add new GenericAssayTypes at here to enable those customization for added types
const geneRelatedGenericAssayTypes = [GenericAssayTypeConstants.METHYLATION];

const DEFAULT_GENE_RELATED_CONFIG = {
    genericAssayConfigByType: {
        // populate gene related configs
        ..._.reduce(
            geneRelatedGenericAssayTypes,
            (acc, type) => {
                acc[type] = {
                    globalConfig: {
                        geneRelatedGenericAssayType: true,
                    },
                };
                return acc;
            },
            {} as { [genericAssayType: string]: any }
        ),
    },
};

export function initializeGenericAssayServerConfig() {
    if (getServerConfig().generic_assay_display_text) {
        const typeWithTextList = getServerConfig().generic_assay_display_text.split(
            ','
        );
        _.each(typeWithTextList, typewWithText => {
            const typeAndText = typewWithText.split(':');
            if (typeAndText.length == 2) {
                const genericAssayConfigByType =
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        typeAndText[0]
                    ];
                if (!genericAssayConfigByType) {
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        typeAndText[0]
                    ] = {};
                }
                GENERIC_ASSAY_CONFIG.genericAssayConfigByType[typeAndText[0]][
                    'displayTitleText'
                ] = typeAndText[1];
            }
        });
    }
}

const DEFAULT_GENERIC_ASSAY_CONFIG: GenericAssayConfig = {
    genericAssayConfigByType: {
        [GenericAssayTypeConstants.METHYLATION]: {
            globalConfig: {
                entityTitle: 'Gene / Probe',
            },
            selectionConfig: {
                placeHolderText: 'Search for Gene / Probe...',
                formatChartNameUsingCompactLabel: true,
            },
            oncoprintTrackConfig: {
                formatDescriptionUsingCommonLabel: true,
                formatNameUsingCompactLabel: true,
            },
            plotsTabConfig: {
                plotsTabUsecompactLabel: true,
            },
            downloadTabConfig: {
                formatDownloadHeaderUsingCompactLabel: true,
            },
        },
    },
};

export const GENERIC_ASSAY_CONFIG: GenericAssayConfig = _.merge(
    DEFAULT_GENE_RELATED_CONFIG,
    DEFAULT_GENERIC_ASSAY_CONFIG
);
