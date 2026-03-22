import autobind from 'autobind-decorator';
import {
    DefaultTooltip,
    getCanonicalMutationType,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';
import classNames from 'classnames';
import {
    TranscriptConsequenceSummary,
    VariantAnnotationSummary,
} from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { CuratedGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import { ANNOTATION_QUERY_FIELDS } from '../../util/Constants';
import headerAnnotationStyle from './HeaderAnnotation.module.scss';
import { generateOncokbLink, ONCOKB_URL } from '../pathogenicity/Oncokb';
import TranscriptSummaryTable from './TranscriptSummaryTable';
import oncokbLogo from 'oncokb-styles/dist/images/oncogenic.svg';

interface IHeaderAnnotationProps {
    annotation: VariantAnnotationSummary | undefined;
    mutation: Mutation;
    variant: string;
    oncokbGenesMap: { [hugoSymbol: string]: CuratedGene };
    oncokb: IndicatorQueryResp | undefined;
    selectedTranscript: string;
    isCanonicalTranscriptSelected?: boolean | undefined;
    allValidTranscripts: string[];
    onTranscriptSelect(transcriptId: string): void;
    isoformOverrideSource?: string;
}

interface IMutationTypeFormat {
    label?: string;
    className: string;
}

// MAIN_MUTATION_TYPE_MAP comes from react-mutation-mapper
// TODO probably should get this from cbioportal-frontend-commons or react-mutation-mapper
export const MAIN_MUTATION_TYPE_MAP: { [key: string]: IMutationTypeFormat } = {
    missense: {
        label: 'Missense',
        className: 'missense-mutation',
    },
    inframe: {
        label: 'IF',
        className: 'inframe-mutation',
    },
    truncating: {
        label: 'Truncating',
        className: 'trunc-mutation',
    },
    nonsense: {
        label: 'Nonsense',
        className: 'trunc-mutation',
    },
    nonstop: {
        label: 'Nonstop',
        className: 'trunc-mutation',
    },
    nonstart: {
        label: 'Nonstart',
        className: 'trunc-mutation',
    },
    frameshift: {
        label: 'FS',
        className: 'trunc-mutation',
    },
    frame_shift_del: {
        label: 'FS del',
        className: 'trunc-mutation',
    },
    frame_shift_ins: {
        label: 'FS ins',
        className: 'trunc-mutation',
    },
    in_frame_ins: {
        label: 'IF ins',
        className: 'inframe-mutation',
    },
    in_frame_del: {
        label: 'IF del',
        className: 'inframe-mutation',
    },
    splice_site: {
        label: 'Splice',
        className: 'splice',
    },
    fusion: {
        label: 'Fusion',
        className: 'fusion',
    },
    silent: {
        label: 'Silent',
        className: 'other-mutation',
    },
    other: {
        label: 'Other',
        className: 'other-mutation',
    },
};

export interface IHeaderAnnotationData {
    value: string | null;
    key: string;
    category: string;
}

enum styleNames {
    'missense-mutation',
    'inframe-mutation',
    'trunc-mutation',
    'fusion',
    'other-mutation',
    'gene',
    'oncogene',
    'tsg',
    'default',
    'mutation',
    'hgvsg',
}

@observer
export default class HeaderAnnotation extends React.Component<
    IHeaderAnnotationProps
> {
    static readonly defaultProps: Partial<IHeaderAnnotationProps> = {
        isoformOverrideSource: 'mskcc',
    };

    @observable private showAllTranscripts = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    public render() {
        const haveTranscriptTable = this.haveTranscriptTable(
            this.props.annotation
        );
        const selectedTranscript =
            this.props.annotation &&
            _.find(
                this.props.annotation.transcriptConsequenceSummaries,
                consequenceSummary =>
                    consequenceSummary.transcriptId ===
                    this.props.selectedTranscript
            );
        const canonicalTranscript =
            this.props.annotation &&
            this.props.annotation.transcriptConsequenceSummary;
        if (this.props.annotation) {
            let renderData:
                | IHeaderAnnotationData[]
                | null = this.getDataFromTranscriptConsequenceSummary(
                selectedTranscript || canonicalTranscript
            );
            if (renderData === null) {
                return null;
            }
            if (renderData) {
                renderData = renderData.filter(data => data.value != null); // remove null fields
            }
            const headerAnnotationList = _.map(renderData, data => {
                return this.generateBasicInfoPills(
                    data.value,
                    data.key,
                    data.category
                );
            });

            return (
                <div
                    className={
                        headerAnnotationStyle['header-annotation-container']
                    }
                >
                    <span
                        className={
                            headerAnnotationStyle['header-annotation-pills']
                        }
                    >
                        {headerAnnotationList}
                        {this.jsonButton()}
                        {haveTranscriptTable &&
                            this.transcriptsButton(this.showAllTranscripts)}
                    </span>
                    <TranscriptSummaryTable
                        annotation={this.props.annotation}
                        isOpen={this.showAllTranscripts}
                        allValidTranscripts={this.props.allValidTranscripts}
                        onTranscriptSelect={this.props.onTranscriptSelect}
                    />
                    {this.showAllTranscripts && haveTranscriptTable && (
                        <div
                            className={
                                headerAnnotationStyle['transcript-table-source']
                            }
                        >
                            <span className={'text-muted small'}>
                                Data in the table comes from&nbsp;
                                <a
                                    href={
                                        'https://useast.ensembl.org/info/docs/tools/vep/index.html'
                                    } // TODO goes to VEP variant page
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    VEP
                                </a>
                            </span>
                            .&nbsp;&nbsp;&nbsp;
                            <div
                                className={'position-absolute'}
                                style={{ left: '50%', top: 0 }}
                            >
                                {this.transcriptsButton(
                                    this.showAllTranscripts
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else {
            return null;
        }
    }

    public getDataFromTranscriptConsequenceSummary(
        transcript: TranscriptConsequenceSummary | undefined
    ): IHeaderAnnotationData[] | null {
        // no canonical transcript, return null
        if (transcript === undefined) {
            return null;
        }
        const parsedData: IHeaderAnnotationData[] = [];
        // gene
        parsedData.push({
            value: transcript.hugoGeneSymbol,
            key: 'hugoGeneSymbol',
            category: 'gene',
        });
        // oncogene
        parsedData.push({
            value: getOncogeneFromOncokbGenesMap(
                this.props.oncokbGenesMap,
                transcript.hugoGeneSymbol
            ),
            key: 'oncogene',
            category: 'oncogene',
        });
        // tsg
        parsedData.push({
            value: getTsgFromOncokbGenesMap(
                this.props.oncokbGenesMap,
                transcript.hugoGeneSymbol
            ),
            key: 'tsg',
            category: 'tsg',
        });
        // protein change
        parsedData.push({
            value: transcript.hgvspShort,
            key: 'hgvsShort',
            category: 'default',
        });
        // variant classification
        parsedData.push({
            value: transcript.variantClassification,
            key: 'variantClassification',
            category: getMutationTypeClassName(transcript),
        });
        // variant type
        parsedData.push({
            value: this.props.annotation!.variantType,
            key: 'variantType',
            category: 'mutation',
        });
        // hgvsg
        parsedData.push({
            value: this.props.variant,
            key: 'hgvsg',
            category: 'hgvsg',
        });
        // hgvsc
        parsedData.push({
            value: this.parseHgvscFromTranscriptConsequenceSummary(transcript),
            key: 'hgvsc',
            category: 'default',
        });
        // transcript id
        parsedData.push({
            value: transcript.transcriptId,
            key: 'transcript',
            category: 'default',
        });
        // ref seq
        parsedData.push({
            value: transcript.refSeq,
            key: 'refSeq',
            category: 'default',
        });
        return parsedData;
    }

    private parseHgvscFromTranscriptConsequenceSummary(
        transcript: TranscriptConsequenceSummary
    ) {
        if (transcript.hgvsc) {
            const hgvsc = transcript.hgvsc;
            const startIndex = hgvsc.indexOf('c.');
            return startIndex !== -1 ? hgvsc.substr(startIndex) : null;
        }
        return null;
    }

    private haveTranscriptTable(
        annotation: VariantAnnotationSummary | undefined
    ): boolean {
        return (
            annotation !== undefined &&
            annotation.transcriptConsequenceSummary !== undefined &&
            annotation.transcriptConsequenceSummaries !== undefined &&
            annotation.transcriptConsequenceSummaries.length > 1
        );
    }

    private transcriptsButton(isOpened: boolean) {
        return (
            <Button
                onClick={this.onButtonClick}
                aria-controls="table-content"
                bsStyle="link"
                className="btn-sm"
            >
                {isOpened && (
                    <span>
                        Close table&nbsp;
                        <i className="fa fa-chevron-circle-up" />
                    </span>
                )}
                {!isOpened && (
                    <span>
                        All transcripts&nbsp;
                        <i className="fa fa-chevron-circle-down" />
                    </span>
                )}
            </Button>
        );
    }

    private jsonButton() {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <span>
                        Click to view the raw API query response
                        <br />
                        <br />
                        Click{' '}
                        <a href="https://docs.genomenexus.org/api">here</a> for
                        more info about the API{' '}
                    </span>
                }
            >
                <a
                    href={`https://www.genomenexus.org/annotation/${
                        this.props.variant
                    }?isoformOverrideSource=${
                        this.props.isoformOverrideSource
                    }&fields=${ANNOTATION_QUERY_FIELDS.join(',')}`}
                    target="_blank"
                    style={{ paddingLeft: '8px', paddingRight: '8px' }}
                >
                    {'JSON '}
                    <i className="fa fa-external-link" />
                </a>
            </DefaultTooltip>
        );
    }

    private generateBasicInfoPills(
        value: string | null,
        key: string,
        category: string
    ) {
        if (key === 'oncogene' || key === 'tsg') {
            const oncokbUrl = generateOncokbLink(ONCOKB_URL, this.props.oncokb);
            return (
                <DefaultTooltip
                    placement="top"
                    overlay={
                        <span>
                            As categorised by&nbsp;
                            <a
                                href={oncokbUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    OncoKB™
                                    <img
                                        height={12}
                                        src={oncokbLogo}
                                        alt="oncokb"
                                    />
                                </span>
                            </a>
                        </span>
                    }
                    key={`${category}-${value}`}
                >
                    <span
                        className={classNames(
                            headerAnnotationStyle[
                                this.getStyleName(
                                    category
                                ) as keyof typeof styleNames
                            ],
                            headerAnnotationStyle[`data-pills`]
                        )}
                    >
                        <a
                            href={oncokbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {value}
                        </a>
                    </span>
                </DefaultTooltip>
            );
        }
        return (
            <span
                className={classNames(
                    headerAnnotationStyle[
                        this.getStyleName(category) as keyof typeof styleNames
                    ],
                    headerAnnotationStyle[`data-pills`]
                )}
                key={`${category}-${value}`}
            >
                {value}
            </span>
        );
    }

    private getStyleName(category: string): string {
        if (category in styleNames) {
            return category;
        } else {
            return 'default';
        }
    }

    @action.bound
    public onButtonClick() {
        this.showAllTranscripts = !this.showAllTranscripts;
    }
}

// logic is from react-mutation-mapper
function getMutationTypeClassName(
    transcript: TranscriptConsequenceSummary
): string {
    const value: IMutationTypeFormat | undefined = getMapEntry(
        transcript.consequenceTerms
    );
    if (value && value.className) {
        return value.className;
    } else {
        return MAIN_MUTATION_TYPE_MAP.other.className;
    }
}

// logic is from react-mutation-mapper
function getMapEntry(mutationType: string | undefined) {
    if (mutationType) {
        return MAIN_MUTATION_TYPE_MAP[getCanonicalMutationType(mutationType)];
    } else {
        return undefined;
    }
}

function getOncogeneFromOncokbGenesMap(
    oncokbGenesMap: { [hugoSymbol: string]: CuratedGene },
    gene?: string
): string | null {
    return gene &&
        oncokbGenesMap[gene] &&
        oncokbGenesMap[gene].oncogene === true
        ? 'Oncogene'
        : null;
}

function getTsgFromOncokbGenesMap(
    oncokbGenesMap: { [hugoSymbol: string]: CuratedGene },
    gene?: string
): string | null {
    return gene && oncokbGenesMap[gene] && oncokbGenesMap[gene].tsg === true
        ? 'TSG'
        : null;
}
