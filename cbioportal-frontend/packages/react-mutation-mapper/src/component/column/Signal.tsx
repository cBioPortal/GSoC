import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    extendMutations,
    getVariantAnnotation,
    IExtendedSignalMutation,
    Mutation,
    RemoteData,
    formatNumberValueInSignificantDigits,
    defaultSortMethod,
    generateTumorTypeDecomposition,
    Pathogenicity,
} from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    MutationTumorTypeFrequencyTable,
    FrequencyTableColumnEnum,
    DefaultTooltip,
    FREQUENCY_COLUMNS_DEFINITION,
} from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from '../StatusHelpers';
import { observer } from 'mobx-react';
type SignalProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    mutationType?: Pathogenicity;
};

type SignalValueProps = SignalProps & {
    significantDigits?: number;
};

export function getSignalData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >,
    mutationType?: Pathogenicity // mutationType could be "germline", "somatic", or "undefined" which means both
): IExtendedSignalMutation[] {
    let signalData: IExtendedSignalMutation[] = [];
    const variantAnnotation = indexedVariantAnnotations
        ? getVariantAnnotation(mutation, indexedVariantAnnotations.result)
        : undefined;
    if (
        variantAnnotation &&
        variantAnnotation.signalAnnotation &&
        variantAnnotation.signalAnnotation.annotation &&
        variantAnnotation.signalAnnotation.annotation.length > 0
    ) {
        // if mutation is somatic OR germline, get annotation depending on mutationType
        if (variantAnnotation.signalAnnotation.annotation.length === 1) {
            if (
                (mutationType === Pathogenicity.GERMLINE &&
                    variantAnnotation.signalAnnotation.annotation[0].mutationStatus.includes(
                        'germline'
                    )) ||
                (mutationType === Pathogenicity.SOMATIC &&
                    variantAnnotation.signalAnnotation.annotation[0].mutationStatus.includes(
                        'somatic'
                    ))
            ) {
                signalData = extendMutations([
                    variantAnnotation.signalAnnotation.annotation[0],
                ]);
            }
        }
        // if mutation is both somatic AND germline, get annotation for both or get one of them depending on mutationType
        else {
            // if mutationType is undefined, get annotation for both somatic and germline
            if (mutationType === undefined) {
                signalData = extendMutations(
                    variantAnnotation.signalAnnotation.annotation
                );
            }
            // if mutationType is defined, get annotation depending on mutationType
            else {
                variantAnnotation.signalAnnotation.annotation.forEach(
                    annotation => {
                        if (
                            mutationType === Pathogenicity.GERMLINE &&
                            annotation.mutationStatus.includes('germline')
                        ) {
                            signalData = extendMutations([annotation]);
                        } else if (
                            mutationType === Pathogenicity.SOMATIC &&
                            annotation.mutationStatus.includes('somatic')
                        ) {
                            signalData = extendMutations([annotation]);
                        }
                    }
                );
            }
        }
    }
    return signalData;
}
export function signalSortMethod(
    a: IExtendedSignalMutation,
    b: IExtendedSignalMutation
) {
    return defaultSortMethod(getSortValue(a), getSortValue(b));
}
export function getSortValue(
    signalData: IExtendedSignalMutation
): number | null {
    return signalData ? signalData.germlineFrequency || null : null;
}

export function download(
    signalData: IExtendedSignalMutation,
    mutationType?: Pathogenicity
): string {
    return signalData && signalData.germlineFrequency !== null
        ? `${formatNumberValueInSignificantDigits(
              signalData.germlineFrequency,
              2
          )}`
        : '';
}

// Get germline OR somatic frequency value
export function getSingleSignalValue(
    mutation: Mutation,
    mutationType: Pathogenicity,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >,
    significantDigits?: number
) {
    const signalData = getSignalData(
        mutation,
        indexedVariantAnnotations,
        mutationType
    );
    if (
        signalData &&
        signalData.length === 1 &&
        signalData[0].tumorTypeDecomposition
    ) {
        return formatNumberValueInSignificantDigits(
            signalData[0].germlineFrequency || signalData[0].somaticFrequency,
            significantDigits || 2
        );
    } else {
        return null;
    }
}

export const SignalTable: React.FunctionComponent<SignalValueProps> = props => {
    // signal data should be either germline or somatic, so should be only one element
    const signalData = getSignalData(
        props.mutation,
        props.indexedVariantAnnotations,
        props.mutationType
    )[0];
    if (
        getSingleSignalValue(
            props.mutation,
            props.mutationType || Pathogenicity.GERMLINE,
            props.indexedVariantAnnotations
        ) !== null
    ) {
        return (
            <MutationTumorTypeFrequencyTable
                data={generateTumorTypeDecomposition(
                    signalData,
                    signalData.countsByTumorType,
                    signalData.biallelicCountsByTumorType,
                    signalData.qcPassCountsByTumorType,
                    signalData.statsByTumorType
                )}
                columns={[
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.TUMOR_TYPE
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MUTATION_STATUS
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.SAMPLE_COUNT
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.VARIANT_COUNT
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.PREVALENCE_FREQUENCY
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.BIALLELIC_RATIO
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_TMB
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MSI_SCORE
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_LST
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI
                    ],
                    FREQUENCY_COLUMNS_DEFINITION[
                        FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH
                    ],
                ]}
            />
        );
    } else {
        return null;
    }
};

@observer
export default class Signal extends React.Component<SignalProps, {}> {
    public render() {
        if (this.props.indexedVariantAnnotations) {
            let content;
            const status = this.props.indexedVariantAnnotations.status;
            if (status === 'pending') {
                content = loaderIcon();
            } else if (status === 'error') {
                content = errorIcon('Error fetching Genome Nexus annotation');
            } else {
                content = <div />;
                const signalValue = getSingleSignalValue(
                    this.props.mutation,
                    this.props.mutationType || Pathogenicity.GERMLINE,
                    this.props.indexedVariantAnnotations
                );
                if (signalValue !== null) {
                    content = (
                        <DefaultTooltip
                            placement="top"
                            overlayStyle={{
                                width: 800,
                            }}
                            overlay={
                                <SignalTable
                                    mutation={this.props.mutation}
                                    indexedVariantAnnotations={
                                        this.props.indexedVariantAnnotations
                                    }
                                    mutationType={this.props.mutationType}
                                />
                            }
                        >
                            <span>{signalValue}</span>
                        </DefaultTooltip>
                    );
                }
            }

            return content;
        } else {
            return <div />;
        }
    }
}
