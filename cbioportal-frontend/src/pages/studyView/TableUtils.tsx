import * as React from 'react';
import {
    getOncoKBCancerGeneListLinkout,
    getOncoKBReferenceInfo,
} from './oncokb/OncoKBUtils';
import styles from './table/tables.module.scss';
import classnames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ICON_FILTER_OFF, ICON_FILTER_ON } from 'shared/lib/Colors';
import {
    getFrequencyStr,
    getCNAByAlteration,
} from 'pages/studyView/StudyViewUtils';
import { GenePanelList } from 'pages/studyView/table/StudyViewGenePanelModal';
import { CSSProperties } from 'react';

export function getGeneCNAOQL(hugoGeneSymbol: string, alteration: number) {
    return [hugoGeneSymbol, getCNAByAlteration(alteration)].join(':');
}

export function getGeneFromUniqueKey(key: string) {
    return key.split(':')[0];
}

export function getGeneColumnCellOverlaySimple(
    hugoGeneSymbol: string,
    geneIsSelected: boolean,
    isCancerGene: boolean,
    oncokbAnnotated: boolean,
    isOncogene: boolean,
    isTumorSuppressorGene: boolean
) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 300,
                fontSize: 12,
            }}
        >
            <span>
                {getOncoKBReferenceInfo(
                    hugoGeneSymbol,
                    isCancerGene,
                    oncokbAnnotated,
                    isOncogene,
                    isTumorSuppressorGene
                )}
            </span>
            <strong>
                {geneIsSelected
                    ? `Click gene symbol to remove from query queue`
                    : 'Click gene symbol to queue for query'}
            </strong>
        </div>
    );
}

export function getCancerGeneToggledOverlay(cancerGeneFilterEnabled: boolean) {
    if (cancerGeneFilterEnabled) {
        return (
            <span>
                Filtered by {getOncoKBCancerGeneListLinkout()}. Click to show
                all genes.
            </span>
        );
    } else {
        return (
            <span>
                Showing all genes. Click to filter by{' '}
                {getOncoKBCancerGeneListLinkout()}.
            </span>
        );
    }
}

export function getCancerGeneFilterToggleIcon(
    isFilteredByCancerGeneList: boolean
) {
    return (
        <span
            data-test="cancer-gene-filter"
            className={classnames(styles.cancerGeneIcon, styles.displayFlex)}
            style={{
                color: isFilteredByCancerGeneList
                    ? ICON_FILTER_ON
                    : ICON_FILTER_OFF,
            }}
        >
            <i className="fa fa-filter"></i>
        </span>
    );
}

export enum FreqColumnTypeEnum {
    MUTATION = 'mutations',
    STRUCTURAL_VARIANT = 'structural variants',
    STRUCTURAL_VARIANT_PAIR = 'structural variant pairs',
    CNA = 'copy number alterations',
    VA = 'variant annotations',
    DATA = 'data',
}

export enum SelectionOperatorEnum {
    INTERSECTION = 'Intersection',
    UNION = 'Union',
}

export function getFreqColumnRender(
    type: FreqColumnTypeEnum,
    numberOfProfiledCases: number,
    numberOfAlteredCases: number,
    matchingGenePanelIds: string[],
    toggleModal?: (panelName: string) => void,
    style?: CSSProperties,
    className?: string
) {
    let tooltipContent = '# of samples';
    if (type !== 'data') {
        tooltipContent += ` with a ${type.replace(
            /s$/,
            ''
        )} in this gene that are also profiled for ${type}: ${numberOfAlteredCases.toLocaleString()}
        <br />
        # of samples profiled for ${type} in this gene: ${numberOfProfiledCases.toLocaleString()}
        `;
    }
    const addTotalProfiledOverlay = () => (
        <span
            style={{ display: 'flex', flexDirection: 'column' }}
            data-test="freq-cell-tooltip"
        >
            <span dangerouslySetInnerHTML={{ __html: tooltipContent }}>{}</span>
            <GenePanelList
                genePanelIds={matchingGenePanelIds}
                toggleModal={toggleModal!}
            />
        </span>
    );

    return (
        <DefaultTooltip
            placement="right"
            overlay={addTotalProfiledOverlay}
            destroyTooltipOnHide={true}
        >
            <span data-test="freq-cell" className={className} style={style}>
                {getFrequencyStr(
                    (numberOfAlteredCases / numberOfProfiledCases) * 100
                )}
            </span>
        </DefaultTooltip>
    );
}

export function getTooltip(type: FreqColumnTypeEnum, isPergentage: boolean) {
    let tooltipContent = `${isPergentage ? 'Percentage' : 'Number'} of samples`;
    if (type !== 'data') {
        tooltipContent += ` with one or more ${type}`;
    }
    return tooltipContent;
}
