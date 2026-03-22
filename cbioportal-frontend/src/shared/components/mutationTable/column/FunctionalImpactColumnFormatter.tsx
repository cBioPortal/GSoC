import * as React from 'react';
import { Circle } from 'better-react-spinkit';
import classNames from 'classnames';
import {
    DefaultTooltip,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import { MutationAssessor as MutationAssessorData } from 'genome-nexus-ts-api-client';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationAssessor from 'shared/components/annotation/genomeNexus/MutationAssessor';
import Sift from 'shared/components/annotation/genomeNexus/Sift';
import PolyPhen2 from 'shared/components/annotation/genomeNexus/PolyPhen2';
import {
    AlphaMissense,
    AlphaMissenseUrl,
} from 'shared/components/annotation/genomeNexus/AlphaMissense';
import functionalImpactStyles from 'shared/components/annotation/genomeNexus/styles/mutationAssessorColumn.module.scss';
import annotationStyles from 'shared/components/annotation/styles/annotation.module.scss';
import GenomeNexusCache, {
    GenomeNexusCacheDataType,
} from 'shared/cache/GenomeNexusMutationAssessorCache';
import _ from 'lodash';
import { shouldShowMutationAssessor } from 'shared/lib/genomeNexusAnnotationSourcesUtils';

type FunctionalImpactColumnTooltipProps = {
    active: FunctionalImpactColumnName;
};

enum FunctionalImpactColumnName {
    MUTATION_ASSESSOR = 'MUTATION_ASSESSOR',
    SIFT = 'SIFT',
    POLYPHEN2 = 'POLYPHEN2',
    ALPHAMISSENSE = 'ALPHAMISSENSE',
}

interface FunctionalImpactData {
    mutationAssessor: MutationAssessorData | undefined;
    siftScore: number | undefined;
    siftPrediction: string | undefined;
    polyPhenScore: number | undefined;
    polyPhenPrediction: string | undefined;
    alphaMissenseScore: number | undefined;
    alphaMissensePrediction: string | undefined;
}

const FunctionalImpactColumnTooltip: React.FC<FunctionalImpactColumnTooltipProps> = ({
    active: initialActive,
}) => {
    const [active, setActive] = React.useState<FunctionalImpactColumnName>(
        initialActive
    );

    const showMutationAssessor = shouldShowMutationAssessor();

    const renderHeaderIcon = (
        title: string,
        imageSrc: string,
        onMouseOver: () => void
    ) => {
        return (
            <th>
                <span
                    style={{ display: 'inline-block', width: 22 }}
                    title={title}
                    onMouseOver={onMouseOver}
                >
                    <img height={14} width={14} src={imageSrc} alt={title} />
                </span>
            </th>
        );
    };

    const renderImpactRow = (
        iconClass: string,
        impactData: string[],
        showMutationAssessor: boolean,
        key: number
    ) => {
        return (
            <tr key={key}>
                <td>
                    <span
                        className={classNames(
                            annotationStyles['annotation-item-text'],
                            iconClass
                        )}
                    >
                        <i className="fa fa-circle" aria-hidden="true"></i>
                    </span>
                </td>
                {showMutationAssessor && (
                    <td className={classNames(iconClass)}>{impactData[0]}</td>
                )}
                <td className={classNames(iconClass)}>{impactData[1]}</td>
                <td className={classNames(iconClass)}>{impactData[2]}</td>
                <td className={classNames(iconClass)}>{impactData[3]}</td>
            </tr>
        );
    };

    const legend = () => {
        // Each line in the legend table uses the same style
        const impactData = [
            {
                level: 'high',
                iconClass: functionalImpactStyles['ma-high'],
                mutationAssessor: 'high',
                sift: 'deleterious',
                polyPhen2: 'probably_damaging',
                alphaMissense: 'pathogenic',
            },
            {
                level: 'medium',
                iconClass: functionalImpactStyles['ma-medium'],
                mutationAssessor: 'medium',
                sift: '-',
                polyPhen2: '-',
                alphaMissense: '-',
            },
            {
                level: 'low',
                iconClass: functionalImpactStyles['ma-low'],
                mutationAssessor: 'low',
                sift: 'deleterious_low_confidence',
                polyPhen2: 'possibly_damaging',
                alphaMissense: 'ambiguous',
            },
            {
                level: 'neutral',
                iconClass: functionalImpactStyles['ma-neutral'],
                mutationAssessor: 'neutral',
                sift: 'tolerated_low_confidence',
                polyPhen2: 'benign',
                alphaMissense: 'benign',
            },
            {
                level: 'NA',
                iconClass: functionalImpactStyles['ma-neutral'],
                mutationAssessor: '-',
                sift: 'tolerated',
                polyPhen2: '-',
                alphaMissense: '-',
            },
        ];

        return (
            <div>
                <table className="table table-striped table-border-top">
                    <thead>
                        <tr>
                            <th>Legend</th>
                            {showMutationAssessor &&
                                renderHeaderIcon(
                                    FunctionalImpactColumnName.MUTATION_ASSESSOR,
                                    require('./mutationAssessor.png'),
                                    () =>
                                        setActive(
                                            FunctionalImpactColumnName.MUTATION_ASSESSOR
                                        )
                                )}
                            {renderHeaderIcon(
                                FunctionalImpactColumnName.SIFT,
                                require('./siftFunnel.png'),
                                () => setActive(FunctionalImpactColumnName.SIFT)
                            )}
                            {renderHeaderIcon(
                                FunctionalImpactColumnName.POLYPHEN2,
                                require('./polyPhen-2.png'),
                                () =>
                                    setActive(
                                        FunctionalImpactColumnName.POLYPHEN2
                                    )
                            )}
                            {renderHeaderIcon(
                                FunctionalImpactColumnName.ALPHAMISSENSE,
                                require('./alphaMissenseGoogleDeepmind.png'),
                                () =>
                                    setActive(
                                        FunctionalImpactColumnName.ALPHAMISSENSE
                                    )
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {impactData.map((data, index) =>
                            renderImpactRow(
                                data.iconClass,
                                [
                                    data.mutationAssessor,
                                    data.sift,
                                    data.polyPhen2,
                                    data.alphaMissense,
                                ],
                                showMutationAssessor,
                                index
                            )
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            {active === FunctionalImpactColumnName.MUTATION_ASSESSOR && (
                <div style={{ width: 530, height: 110 }}>
                    Mutation Assessor predicts the functional impact of
                    amino-acid substitutions in proteins, such as mutations
                    discovered in cancer or missense polymorphisms. The
                    functional impact is assessed based on evolutionary
                    conservation of the affected amino acid in protein homologs.
                    The method has been validated on a large set of disease
                    associated and polymorphic variants (
                    <a
                        href="https://www.ncbi.nlm.nih.gov/clinvar/"
                        target="_blank"
                    >
                        ClinVar
                    </a>
                    ).
                    <br />
                    <b>
                        Mutation Assessor V4 data is available in the portal
                        since Oct. 8, 2024.
                    </b>{' '}
                    New manuscript is in progress. Click{` `}
                    <a href="http://mutationassessor.org/r3/" target="_blank">
                        here
                    </a>
                    {` `} to see information about V3 data.
                </div>
            )}
            {active === FunctionalImpactColumnName.SIFT && (
                <div style={{ width: 530, height: 60 }}>
                    <a href={Sift.SIFT_URL} target="_blank">
                        SIFT
                    </a>{' '}
                    predicts whether an amino acid substitution affects protein
                    function based on sequence homology and the physical
                    properties of amino acids. SIFT can be applied to naturally
                    occurring nonsynonymous polymorphisms and laboratory-induced
                    missense mutations.
                </div>
            )}
            {active === FunctionalImpactColumnName.POLYPHEN2 && (
                <div style={{ width: 530, height: 60 }}>
                    <a href={PolyPhen2.POLYPHEN2_URL} target="_blank">
                        PolyPhen-2
                    </a>{' '}
                    (Polymorphism Phenotyping v2) is a tool which predicts
                    possible impact of an amino acid substitution on the
                    structure and function of a human protein using
                    straightforward physical and comparative considerations.
                </div>
            )}
            {active === FunctionalImpactColumnName.ALPHAMISSENSE && (
                <div style={{ width: 530, height: 60 }}>
                    <a href={AlphaMissenseUrl} target="_blank">
                        AlphaMissense
                    </a>{' '}
                    predicts the probability of a missense single nucleotide
                    variant being pathogenic and classifies it as either likely
                    benign, likely pathogenic, or uncertain.
                </div>
            )}
            {legend()}
        </div>
    );
};

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

export default class FunctionalImpactColumnFormatter {
    public static headerRender(name: string) {
        const arrowContent = <div className="rc-tooltip-arrow-inner" />;
        const showMutationAssessor = shouldShowMutationAssessor();
        return (
            <div>
                {name}
                <br />
                <div style={{ height: 14 }}>
                    {showMutationAssessor && (
                        <DefaultTooltip
                            overlay={
                                <FunctionalImpactColumnTooltip
                                    active={
                                        FunctionalImpactColumnName.MUTATION_ASSESSOR
                                    }
                                />
                            }
                            placement="topLeft"
                            trigger={['hover', 'focus']}
                            arrowContent={arrowContent}
                            destroyTooltipOnHide={true}
                            onPopupAlign={placeArrow}
                        >
                            <span
                                style={{ display: 'inline-block', width: 22 }}
                            >
                                <img
                                    height={14}
                                    width={14}
                                    src={require('./mutationAssessor.png')}
                                    alt="Sift"
                                />
                            </span>
                        </DefaultTooltip>
                    )}
                    <DefaultTooltip
                        overlay={
                            <FunctionalImpactColumnTooltip
                                active={FunctionalImpactColumnName.SIFT}
                            />
                        }
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={true}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{ display: 'inline-block', width: 22 }}>
                            <img
                                height={14}
                                width={14}
                                src={require('./siftFunnel.png')}
                                alt="SIFT"
                            />
                        </span>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={
                            <FunctionalImpactColumnTooltip
                                active={FunctionalImpactColumnName.POLYPHEN2}
                            />
                        }
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={true}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{ display: 'inline-block', width: 22 }}>
                            <img
                                height={14}
                                width={14}
                                src={require('./polyPhen-2.png')}
                                alt="PolyPhen-2"
                            />
                        </span>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={
                            <FunctionalImpactColumnTooltip
                                active={
                                    FunctionalImpactColumnName.ALPHAMISSENSE
                                }
                            />
                        }
                        placement="topLeft"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        destroyTooltipOnHide={true}
                        onPopupAlign={placeArrow}
                    >
                        <span style={{ display: 'inline-block', width: 22 }}>
                            <img
                                height={14}
                                width={14}
                                src={require('./alphaMissenseGoogleDeepmind.png')}
                                alt="alphaMissense"
                            />
                        </span>
                    </DefaultTooltip>
                </div>
            </div>
        );
    }

    static getData(
        data: Mutation[],
        cache?: GenomeNexusCache,
        selectedTranscriptId?: string
    ): FunctionalImpactData {
        const cacheData = this.getDataFromCache(data, cache);
        if (!cacheData?.data) {
            return {} as FunctionalImpactData;
        }

        const transcript = selectedTranscriptId
            ? cacheData?.data?.transcript_consequences?.find(
                  tc => tc.transcript_id === selectedTranscriptId
              )
            : undefined;

        return {
            mutationAssessor: shouldShowMutationAssessor()
                ? cacheData.data.mutation_assessor
                : undefined,
            siftScore: transcript?.sift_score,
            siftPrediction: transcript?.sift_prediction,
            polyPhenScore: transcript?.polyphen_score,
            polyPhenPrediction: transcript?.polyphen_prediction,
            alphaMissenseScore: transcript?.alphaMissense?.score,
            alphaMissensePrediction: transcript?.alphaMissense?.pathogenicity,
        };
    }

    public static renderFunction(
        data: Mutation[],
        genomeNexusCache: GenomeNexusCache | undefined,
        selectedTranscriptId?: string
    ) {
        const showMutationAssessor = shouldShowMutationAssessor();

        return (
            <div>
                {showMutationAssessor &&
                    FunctionalImpactColumnFormatter.makeFunctionalImpactViz(
                        data,
                        FunctionalImpactColumnName.MUTATION_ASSESSOR,
                        genomeNexusCache,
                        selectedTranscriptId
                    )}
                {FunctionalImpactColumnFormatter.makeFunctionalImpactViz(
                    data,
                    FunctionalImpactColumnName.SIFT,
                    genomeNexusCache,
                    selectedTranscriptId
                )}
                {FunctionalImpactColumnFormatter.makeFunctionalImpactViz(
                    data,
                    FunctionalImpactColumnName.POLYPHEN2,
                    genomeNexusCache,
                    selectedTranscriptId
                )}
                {FunctionalImpactColumnFormatter.makeFunctionalImpactViz(
                    data,
                    FunctionalImpactColumnName.ALPHAMISSENSE,
                    genomeNexusCache,
                    selectedTranscriptId
                )}
            </div>
        );
    }

    static download(
        data: Mutation[],
        cache: GenomeNexusCache,
        selectedTranscriptId?: string
    ): string {
        const functionalImpactData = this.getData(
            data,
            cache,
            selectedTranscriptId
        );
        if (!functionalImpactData) return '';

        const downloadData = [
            shouldShowMutationAssessor() &&
                `MutationAssessor: ${
                    functionalImpactData.mutationAssessor
                        ? `impact: ${functionalImpactData.mutationAssessor.functionalImpactPrediction}, score: ${functionalImpactData.mutationAssessor.functionalImpactScore}`
                        : 'NA'
                }`,
            `SIFT: ${
                functionalImpactData.siftScore ||
                functionalImpactData.siftPrediction
                    ? `impact: ${functionalImpactData.siftPrediction}, score: ${functionalImpactData.siftScore}`
                    : 'NA'
            }`,
            `Polyphen-2: ${
                functionalImpactData.polyPhenScore ||
                functionalImpactData.polyPhenPrediction
                    ? `impact: ${functionalImpactData.polyPhenPrediction}, score: ${functionalImpactData.polyPhenScore}`
                    : 'NA'
            }`,
            `AlphaMissense: ${
                functionalImpactData.alphaMissenseScore ||
                functionalImpactData.alphaMissensePrediction
                    ? `pathogenicity: ${functionalImpactData.alphaMissensePrediction}, score: ${functionalImpactData.alphaMissenseScore}`
                    : 'NA'
            }`,
        ];

        return downloadData.join(';');
    }

    private static getDataFromCache(
        data: Mutation[],
        cache: GenomeNexusCache | GenomeNexusCache | undefined
    ): GenomeNexusCacheDataType | null {
        if (data.length === 0 || !cache) {
            return null;
        }
        return cache.get(data[0]);
    }

    private static makeFunctionalImpactViz(
        mutation: Mutation[],
        column: FunctionalImpactColumnName,
        genomeNexusCache?: GenomeNexusCache,
        selectedTranscriptId?: string
    ) {
        let status: TableCellStatus | null = null;
        const cacheData = this.getDataFromCache(mutation, genomeNexusCache);
        if (cacheData === null) {
            status = TableCellStatus.LOADING;
        } else if (cacheData.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (cacheData.data === null) {
            status = TableCellStatus.NA;
        } else {
            const data = this.getData(
                mutation,
                genomeNexusCache,
                selectedTranscriptId
            );
            switch (column) {
                case FunctionalImpactColumnName.MUTATION_ASSESSOR:
                    return (
                        <MutationAssessor
                            mutationAssessor={data.mutationAssessor}
                        />
                    );
                case FunctionalImpactColumnName.SIFT:
                    return (
                        <Sift
                            siftScore={data.siftScore}
                            siftPrediction={data.siftPrediction}
                        />
                    );
                case FunctionalImpactColumnName.POLYPHEN2:
                    return (
                        <PolyPhen2
                            polyPhenScore={data.polyPhenScore}
                            polyPhenPrediction={data.polyPhenPrediction}
                        />
                    );
                case FunctionalImpactColumnName.ALPHAMISSENSE:
                    return (
                        <AlphaMissense
                            alphaMissenseScore={data.alphaMissenseScore}
                            alphaMissensePrediction={
                                data.alphaMissensePrediction
                            }
                        />
                    );
            }
        }

        if (status !== null) {
            // show loading circle
            if (status === TableCellStatus.LOADING) {
                return (
                    <Circle
                        size={22}
                        scaleEnd={0.5}
                        scaleStart={0.2}
                        color="#aaa"
                        className="pull-left"
                    />
                );
            } else {
                return <TableCellStatusIndicator status={status} />;
            }
        }
    }
}
