import * as React from 'react';
import _ from 'lodash';
import {
    civicSortValue,
    DEFAULT_ANNOTATION_DATA,
    GenericAnnotation,
    IAnnotation,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from 'react-mutation-mapper';
import { oncoKbAnnotationSortValue } from 'oncokb-frontend-commons';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { IAnnotationColumnProps } from 'shared/components/mutationTable/column/AnnotationColumnFormatter';
import { CancerGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import { RemoteData, IOncoKbData, OncoKbCardDataType } from 'cbioportal-utils';
import {
    deriveStructuralVariantType,
    calculateOncoKbAvailableDataType,
    generateQueryStructuralVariantId,
} from 'oncokb-frontend-commons';
import AnnotationHeader from 'shared/components/mutationTable/column/annotation/AnnotationHeader';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { IStructuralVariantTableWrapperProps } from '../StructuralVariantTableWrapper';

export default class AnnotationColumnFormatter {
    public static getData(
        structuralVariantData: StructuralVariant[] | undefined,
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string },
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ) {
        let value: IAnnotation;

        if (structuralVariantData) {
            let oncoKbIndicator: IndicatorQueryResp | undefined = undefined;
            let oncoKbStatus: IAnnotation['oncoKbStatus'] = 'complete';

            let oncoKbGeneExist = false;
            let isOncoKbCancerGene = false;
            let isSite1GeneOncoKbAnnotated = false;
            let isSite1oncoKbCancerGene = false;
            let isSite2GeneOncoKbAnnotated = false;
            let isSite2oncoKbCancerGene = false;
            if (
                oncoKbCancerGenes &&
                !(oncoKbCancerGenes instanceof Error) &&
                !(oncoKbCancerGenes.result instanceof Error)
            ) {
                const oncoKbCancerGeneSetByEntrezGeneId = _.keyBy(
                    oncoKbCancerGenes.result,
                    gene => gene.entrezGeneId
                );
                isSite1oncoKbCancerGene =
                    oncoKbCancerGeneSetByEntrezGeneId[
                        structuralVariantData[0].site1EntrezGeneId
                    ] !== undefined;
                isSite2oncoKbCancerGene =
                    oncoKbCancerGeneSetByEntrezGeneId[
                        structuralVariantData[0].site2EntrezGeneId
                    ] !== undefined;
                isSite1GeneOncoKbAnnotated =
                    isSite1oncoKbCancerGene &&
                    oncoKbCancerGeneSetByEntrezGeneId[
                        structuralVariantData[0].site1EntrezGeneId
                    ].oncokbAnnotated;
                isSite2GeneOncoKbAnnotated =
                    isSite2oncoKbCancerGene &&
                    oncoKbCancerGeneSetByEntrezGeneId[
                        structuralVariantData[0].site2EntrezGeneId
                    ].oncokbAnnotated;
                oncoKbGeneExist =
                    isSite1GeneOncoKbAnnotated || isSite2GeneOncoKbAnnotated;
                isOncoKbCancerGene =
                    isSite1oncoKbCancerGene || isSite2oncoKbCancerGene;
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
                    oncoKbData.isComplete
                ) {
                    oncoKbIndicator = this.getIndicatorData(
                        structuralVariantData,
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

            const site1HugoSymbol = structuralVariantData[0].site1HugoSymbol;
            const site2HugoSymbol = structuralVariantData[0].site2HugoSymbol;
            let hugoGeneSymbol = site1HugoSymbol;
            if (oncoKbGeneExist) {
                hugoGeneSymbol = isSite1GeneOncoKbAnnotated
                    ? site1HugoSymbol
                    : site2HugoSymbol;
            } else if (isOncoKbCancerGene) {
                hugoGeneSymbol = isSite1oncoKbCancerGene
                    ? site1HugoSymbol
                    : site2HugoSymbol;
            }

            value = {
                hugoGeneSymbol,
                oncoKbStatus,
                oncoKbIndicator,
                oncoKbGeneExist,
                isOncoKbCancerGene,
                usingPublicOncoKbInstance:
                    usingPublicOncoKbInstance === undefined
                        ? USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB
                        : usingPublicOncoKbInstance,
                civicEntry: undefined,
                civicStatus: 'complete',
                hasCivicVariants: false,
                hotspotStatus: 'complete',
                isHotspot: false,
                is3dHotspot: false,
                oncoKbAvailableDataTypes,
            };
        } else {
            value = DEFAULT_ANNOTATION_DATA;
        }

        return value;
    }

    public static getIndicatorData(
        structuralVariantData: StructuralVariant[],
        oncoKbData: IOncoKbData,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string },
        studyIdToStudy?: { [studyId: string]: CancerStudy }
    ): IndicatorQueryResp | undefined {
        if (!uniqueSampleKeyToTumorType || !oncoKbData.indicatorMap) {
            return undefined;
        }

        const id = generateQueryStructuralVariantId(
            structuralVariantData[0].site1EntrezGeneId,
            structuralVariantData[0].site2EntrezGeneId,
            uniqueSampleKeyToTumorType[
                structuralVariantData[0].uniqueSampleKey
            ],
            deriveStructuralVariantType(structuralVariantData[0])
        );

        if (oncoKbData.indicatorMap[id]) {
            let indicator = oncoKbData.indicatorMap[id];
            if (indicator.query.tumorType === null && studyIdToStudy) {
                const studyMetaData =
                    studyIdToStudy[structuralVariantData[0].studyId];
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
        data: StructuralVariant[],
        oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>,
        usingPublicOncoKbInstance?: boolean,
        oncoKbData?: RemoteData<IOncoKbData | Error | undefined>,
        uniqueSampleKeyToTumorType?: { [sampleId: string]: string }
    ): number[] {
        const annotationData: IAnnotation = this.getData(
            data,
            oncoKbCancerGenes,
            oncoKbData,
            usingPublicOncoKbInstance,
            uniqueSampleKeyToTumorType
        );

        return _.flatten([
            oncoKbAnnotationSortValue(annotationData.oncoKbIndicator),
            civicSortValue(annotationData.civicEntry),
            annotationData.isOncoKbCancerGene ? 1 : 0,
        ]);
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

    public static renderFunction(
        data: StructuralVariant[],
        columnProps: IAnnotationColumnProps
    ) {
        const annotation: IAnnotation = this.getData(
            data,
            columnProps.oncoKbCancerGenes,
            columnProps.oncoKbData,
            columnProps.usingPublicOncoKbInstance,
            columnProps.uniqueSampleKeyToTumorType,
            columnProps.studyIdToStudy
        );

        return <GenericAnnotation {...columnProps} annotation={annotation} />;
    }
}
