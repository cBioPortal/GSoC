import * as React from 'react';
import _ from 'lodash';
import {
    buildCivicEntry,
    ICivicEntry,
    ICivicGeneIndex,
    ICivicGeneSummary,
    ICivicVariantIndex,
    ICivicVariantSummary,
    IOncoKbData,
    OncoKbCardDataType,
    RemoteData,
} from 'cbioportal-utils';
import {
    generateQueryVariantId,
    calculateOncoKbAvailableDataType,
} from 'oncokb-frontend-commons';
import {
    civicSortValue,
    DEFAULT_ANNOTATION_DATA,
    GenericAnnotation,
    IAnnotation,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from 'react-mutation-mapper';
import { oncoKbAnnotationSortValue } from 'oncokb-frontend-commons';
import { CancerStudy, DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import { IAnnotationColumnProps } from 'shared/components/mutationTable/column/AnnotationColumnFormatter';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import { getAlterationString } from 'shared/lib/CopyNumberUtils';
import { getCivicCNAVariants } from 'shared/lib/CivicUtils';
import AnnotationHeader from 'shared/components/mutationTable/column/annotation/AnnotationHeader';
import { ICopyNumberTableWrapperProps } from '../CopyNumberTableWrapper';

/**
 * @author Selcuk Onur Sumer
 */
export default class AnnotationColumnFormatter {
    public static getData(
        copyNumberData: DiscreteCopyNumberData[] | undefined,
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string },
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>,
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ) {
        let value: IAnnotation;

        if (copyNumberData) {
            let oncoKbIndicator: IndicatorQueryResp | undefined = undefined;
            let oncoKbStatus: IAnnotation['oncoKbStatus'] = 'complete';
            let hugoGeneSymbol = copyNumberData[0].gene.hugoGeneSymbol;

            let oncoKbGeneExist = false;
            let isOncoKbCancerGene = false;
            if (
                oncoKbCancerGenes &&
                !(oncoKbCancerGenes.result instanceof Error)
            ) {
                oncoKbGeneExist =
                    _.find(
                        oncoKbCancerGenes.result,
                        (gene: CancerGene) =>
                            gene.oncokbAnnotated &&
                            gene.entrezGeneId === copyNumberData[0].entrezGeneId
                    ) !== undefined;
                isOncoKbCancerGene =
                    _.find(
                        oncoKbCancerGenes.result,
                        (gene: CancerGene) =>
                            gene.entrezGeneId === copyNumberData[0].entrezGeneId
                    ) !== undefined;
            }

            // Always show oncogenicity icon even when the indicatorMapResult is empty.
            // We want to show an icon for genes that haven't been annotated by OncoKB
            let oncoKbAvailableDataTypes: OncoKbCardDataType[] = [
                OncoKbCardDataType.BIOLOGICAL,
            ];

            // oncoKbData may exist but it might be an instance of Error, in that case we flag the status as error
            if (oncoKbData && oncoKbData.result instanceof Error) {
                oncoKbStatus = 'error';
            } else if (oncoKbGeneExist) {
                // actually, oncoKbData.result shouldn't be an instance of Error in this case (we already check it above),
                // but we need to check it again in order to avoid TS errors/warnings
                if (
                    oncoKbData &&
                    oncoKbData.result &&
                    !(oncoKbData.result instanceof Error) &&
                    oncoKbData.status === 'complete'
                ) {
                    oncoKbIndicator = AnnotationColumnFormatter.getIndicatorData(
                        copyNumberData,
                        oncoKbData.result,
                        uniqueSampleKeyToTumorType,
                        studyIdToStudy
                    );
                    oncoKbAvailableDataTypes = _.uniq([
                        ...oncoKbAvailableDataTypes,
                        ...calculateOncoKbAvailableDataType(
                            _.values(oncoKbData.result.indicatorMap)
                        ),
                    ]);
                }
                oncoKbStatus = oncoKbData ? oncoKbData.status : 'pending';
            }

            value = {
                hugoGeneSymbol,
                oncoKbStatus,
                oncoKbIndicator,
                oncoKbAvailableDataTypes,
                oncoKbGeneExist,
                isOncoKbCancerGene,
                usingPublicOncoKbInstance:
                    usingPublicOncoKbInstance === undefined
                        ? USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB
                        : usingPublicOncoKbInstance,
                civicEntry:
                    civicGenes &&
                    civicGenes.result &&
                    civicVariants &&
                    civicVariants.result
                        ? AnnotationColumnFormatter.getCivicEntry(
                              copyNumberData,
                              civicGenes.result,
                              civicVariants.result
                          )
                        : undefined,
                civicStatus:
                    civicGenes &&
                    civicGenes.status &&
                    civicVariants &&
                    civicVariants.status
                        ? AnnotationColumnFormatter.getCivicStatus(
                              civicGenes.status,
                              civicVariants.status
                          )
                        : 'pending',
                hasCivicVariants:
                    civicGenes &&
                    civicGenes.result &&
                    civicVariants &&
                    civicVariants.result
                        ? AnnotationColumnFormatter.hasCivicVariants(
                              copyNumberData,
                              civicGenes.result,
                              civicVariants.result
                          )
                        : true,
                hotspotStatus: 'complete',
                isHotspot: false,
                is3dHotspot: false,
            };
        } else {
            value = DEFAULT_ANNOTATION_DATA;
        }

        return value;
    }

    /**
     * Returns an ICivicEntry if the civicGenes and civicVariants have information about the gene and the mutation (variant) specified. Otherwise it returns
     * an empty object.
     */
    public static getCivicEntry(
        copyNumberData: DiscreteCopyNumberData[],
        civicGenes: ICivicGeneIndex,
        civicVariants: ICivicVariantIndex
    ): ICivicEntry | null {
        let civicEntry = null;
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants: {
            [name: string]: ICivicVariantSummary;
        } = getCivicCNAVariants(copyNumberData, geneSymbol, civicVariants);
        let geneSummary: ICivicGeneSummary = civicGenes[geneSymbol];
        //geneEntry must exists, and only return data for genes with variants or it has a description provided by the Civic API
        if (
            geneSummary &&
            (!_.isEmpty(geneVariants) || geneSummary.description !== '')
        ) {
            civicEntry = buildCivicEntry(geneSummary, geneVariants);
        }

        return civicEntry;
    }

    public static getCivicStatus(
        civicGenesStatus: 'pending' | 'error' | 'complete',
        civicVariantsStatus: 'pending' | 'error' | 'complete'
    ): 'pending' | 'error' | 'complete' {
        if (civicGenesStatus === 'error' || civicVariantsStatus === 'error') {
            return 'error';
        }
        if (
            civicGenesStatus === 'complete' &&
            civicVariantsStatus === 'complete'
        ) {
            return 'complete';
        }

        return 'pending';
    }

    public static hasCivicVariants(
        copyNumberData: DiscreteCopyNumberData[],
        civicGenes: ICivicGeneIndex,
        civicVariants: ICivicVariantIndex
    ): boolean {
        let geneSymbol: string = copyNumberData[0].gene.hugoGeneSymbol;
        let geneVariants: {
            [name: string]: ICivicVariantSummary;
        } = getCivicCNAVariants(copyNumberData, geneSymbol, civicVariants);
        let geneSummary: ICivicGeneSummary = civicGenes[geneSymbol];

        if (geneSummary && _.isEmpty(geneVariants)) {
            return false;
        }

        return true;
    }

    public static getIndicatorData(
        copyNumberData: DiscreteCopyNumberData[],
        oncoKbData: IOncoKbData,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string },
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ): IndicatorQueryResp | undefined {
        if (
            uniqueSampleKeyToTumorType === null ||
            oncoKbData.indicatorMap === null
        ) {
            return undefined;
        }

        const id = generateQueryVariantId(
            copyNumberData[0].gene.entrezGeneId,
            uniqueSampleKeyToTumorType![copyNumberData[0].uniqueSampleKey],
            getAlterationString(copyNumberData[0].alteration)
        );

        if (oncoKbData.indicatorMap[id]) {
            let indicator = oncoKbData.indicatorMap[id];
            if (indicator.query.tumorType === null && studyIdToStudy) {
                const studyMetaData = studyIdToStudy[copyNumberData[0].studyId];
                if (studyMetaData.cancerTypeId !== 'mixed') {
                    indicator.query.tumorType = studyMetaData.cancerType.name;
                }
            }
            return indicator;
        } else {
            return undefined;
        }
    }

    public static sortValue(
        data: DiscreteCopyNumberData[],
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string },
        civicGenes?: RemoteData<ICivicGeneIndex | undefined>,
        civicVariants?: RemoteData<ICivicVariantIndex | undefined>
    ): number[] {
        const annotationData: IAnnotation = AnnotationColumnFormatter.getData(
            data,
            oncoKbCancerGenes,
            oncoKbData,
            usingPublicOncoKbInstance,
            uniqueSampleKeyToTumorType,
            civicGenes,
            civicVariants
        );

        return _.flatten([
            oncoKbAnnotationSortValue(annotationData.oncoKbIndicator),
            civicSortValue(annotationData.civicEntry),
            annotationData.isOncoKbCancerGene ? 1 : 0,
        ]);
    }

    public static renderFunction(
        data: DiscreteCopyNumberData[],
        columnProps: IAnnotationColumnProps
    ) {
        const annotation: IAnnotation = AnnotationColumnFormatter.getData(
            data,
            columnProps.oncoKbCancerGenes,
            columnProps.oncoKbData,
            columnProps.usingPublicOncoKbInstance,
            columnProps.uniqueSampleKeyToTumorType,
            columnProps.civicGenes,
            columnProps.civicVariants,
            columnProps.studyIdToStudy
        );

        return <GenericAnnotation {...columnProps} annotation={annotation} />;
    }

    public static headerRender(
        name: string,
        width: number,
        mergeOncoKbIcons?: boolean,
        onOncoKbIconToggle?: (mergeIcons: boolean) => void
    ) {
        return (
            <AnnotationHeader
                name={name}
                width={width}
                mergeOncoKbIcons={mergeOncoKbIcons}
                onOncoKbIconToggle={onOncoKbIconToggle}
            />
        );
    }
}
