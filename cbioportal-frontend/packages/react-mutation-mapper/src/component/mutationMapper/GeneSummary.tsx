import { observer } from 'mobx-react';
import * as React from 'react';
import { getNCBIlink } from 'cbioportal-frontend-commons';
import { Mutation, RemoteData } from 'cbioportal-utils';
import {
    EnsemblTranscript,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';

import { getUrl } from '../../util/DataFetcherUtils';
import TranscriptDropdown from './TranscriptDropdown';
import styles from './geneSummary.module.scss';

export type GeneSummaryProps = {
    hugoGeneSymbol: string;
    uniprotId?: string;
    transcriptSummaryUrlTemplate?: string;
    showDropDown: boolean;
    showOnlyAnnotatedTranscriptsInDropdown: boolean;
    compactStyle?: boolean; // compactStyle = false: "RefSeq: NM_000546 Ensembl: ENST00000269305...", compactStyle = true: "NM_000546 | ENST00000269305..."
    transcriptsByTranscriptId: { [transcriptId: string]: EnsemblTranscript };
    activeTranscript?: string;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    indexedVariantAnnotations: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    mutationsByTranscriptId?: { [transcriptId: string]: Mutation[] };
    onTranscriptChange: (transcriptId: string) => void;
    loadingIndicator?: JSX.Element;
};

const GeneSummaryInfo: React.FunctionComponent<GeneSummaryProps> = ({
    uniprotId,
    showDropDown,
    canonicalTranscript,
    compactStyle,
    activeTranscript,
    transcriptsByTranscriptId,
    transcriptSummaryUrlTemplate,
}) => {
    const canonicalTranscriptId =
        canonicalTranscript.result && canonicalTranscript.result.transcriptId;
    const transcript =
        activeTranscript && activeTranscript === canonicalTranscriptId
            ? (canonicalTranscript.result as EnsemblTranscript)
            : transcriptsByTranscriptId[activeTranscript!];
    const refseqMrnaId = transcript && transcript.refseqMrnaId;
    const ccdsId = transcript && transcript.ccdsId;

    const refSeq = refseqMrnaId ? (
        <a href={getNCBIlink(`/nuccore/${refseqMrnaId}`)} target="_blank">
            {refseqMrnaId}
        </a>
    ) : (
        '-'
    );
    const ensembl = showDropDown
        ? activeTranscript && (
              <a
                  href={getUrl(transcriptSummaryUrlTemplate!, {
                      transcriptId: activeTranscript,
                  })}
                  target="_blank"
              >
                  {activeTranscript}
              </a>
          )
        : canonicalTranscriptId && (
              // down't show drop down, only the canonical transcript
              <a
                  href={getUrl(transcriptSummaryUrlTemplate!, {
                      transcriptId: canonicalTranscriptId,
                  })}
                  target="_blank"
              >
                  {canonicalTranscriptId}
              </a>
          );
    const ccds = ccdsId ? (
        <a
            href={getNCBIlink({
                pathname: '/CCDS/CcdsBrowse.cgi',
                query: {
                    REQUEST: 'CCDS',
                    DATA: ccdsId,
                },
            })}
            target="_blank"
        >
            {ccdsId}
        </a>
    ) : (
        '-'
    );

    const uniprot = uniprotId ? (
        <a
            href={`https://www.uniprot.org/uniprot/${uniprotId}`}
            target="_blank"
        >
            {uniprotId}
        </a>
    ) : (
        '-'
    );

    const compactGeneSummaryInfo = (
        <div>
            <span data-test="compactGeneSummaryRefSeq">{refSeq}</span>
            {` | `}
            {ensembl}
            <br />
            <span data-test="compactGeneSummaryCCDS">{ccds}</span>
            {` | `}
            <span data-test="compactGeneSummaryUniProt">{uniprot}</span>
        </div>
    );

    const geneSummaryInfo = (
        <div>
            <div>
                <span data-test="GeneSummaryRefSeq">
                    {'RefSeq: '}
                    {refSeq}
                </span>
            </div>
            <div>
                <span>Ensembl: </span>
                {ensembl}
            </div>
            <div>
                <span data-test="GeneSummaryCCDS">
                    {'CCDS: '}
                    {ccds}
                </span>
            </div>
            <div>
                <span data-test="GeneSummaryUniProt">
                    {'UniProt: '}
                    {uniprot}
                </span>
            </div>
        </div>
    );
    return compactStyle ? compactGeneSummaryInfo : geneSummaryInfo;
};

@observer
export default class GeneSummary extends React.Component<GeneSummaryProps, {}> {
    public static defaultProps: Partial<GeneSummaryProps> = {
        transcriptSummaryUrlTemplate:
            'http://grch37.ensembl.org/homo_sapiens/Transcript/Summary?t=<%= transcriptId %>',
        compactStyle: false,
    };

    public render() {
        const {
            hugoGeneSymbol,
            showDropDown,
            showOnlyAnnotatedTranscriptsInDropdown,
            canonicalTranscript,
            activeTranscript,
            transcriptsByTranscriptId,
            transcriptsWithAnnotations,
            transcriptsWithProteinLength,
            indexedVariantAnnotations,
            mutationsByTranscriptId,
            onTranscriptChange,
            loadingIndicator,
        } = this.props;

        return (
            <div
                className={
                    this.props.compactStyle
                        ? styles.geneSummaryCompact
                        : styles.geneSummary
                }
            >
                {!this.props.compactStyle && (
                    <h4 className={styles.hugoSymbol}>{hugoGeneSymbol}</h4>
                )}
                <TranscriptDropdown
                    showDropDown={showDropDown}
                    showOnlyAnnotatedTranscriptsInDropdown={
                        showOnlyAnnotatedTranscriptsInDropdown
                    }
                    activeTranscript={activeTranscript}
                    transcriptsByTranscriptId={transcriptsByTranscriptId}
                    canonicalTranscript={canonicalTranscript}
                    transcriptsWithProteinLength={transcriptsWithProteinLength}
                    transcriptsWithAnnotations={transcriptsWithAnnotations}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    mutationsByTranscriptId={mutationsByTranscriptId}
                    onChange={onTranscriptChange}
                    loadingIndicator={loadingIndicator}
                />
                <GeneSummaryInfo {...this.props} />
            </div>
        );
    }
}
