import classNames from 'classnames';
import _ from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';
import Select from 'react-select';

import { Mutation, RemoteData } from 'cbioportal-utils';
import {
    EnsemblTranscript,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';

import styles from './transcriptDropdown.module.scss';

export type TranscriptDropdownProps = {
    showDropDown: boolean;
    showOnlyAnnotatedTranscriptsInDropdown: boolean;
    activeTranscript?: string;
    transcriptsByTranscriptId: { [transcriptId: string]: EnsemblTranscript };
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    indexedVariantAnnotations: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    mutationsByTranscriptId?: { [transcriptId: string]: Mutation[] };
    onChange: (value: string) => void;
    loadingIndicator?: JSX.Element;
};

@observer
export default class TranscriptDropdown extends React.Component<
    TranscriptDropdownProps,
    {}
> {
    public render() {
        const {
            showDropDown,
            canonicalTranscript,
            showOnlyAnnotatedTranscriptsInDropdown,
            activeTranscript,
            transcriptsByTranscriptId,
            transcriptsWithProteinLength,
            transcriptsWithAnnotations,
            indexedVariantAnnotations,
            mutationsByTranscriptId,
        } = this.props;

        const canonicalTranscriptId =
            canonicalTranscript.result &&
            canonicalTranscript.result.transcriptId;

        if (!showDropDown) {
            return <span />;
        } else if (showOnlyAnnotatedTranscriptsInDropdown) {
            const isLoading =
                transcriptsWithProteinLength.isPending ||
                transcriptsWithAnnotations.isPending ||
                canonicalTranscript.isPending;
            const requiredData =
                indexedVariantAnnotations.result &&
                Object.keys(indexedVariantAnnotations.result).length > 0 &&
                canonicalTranscriptId &&
                transcriptsWithAnnotations.result &&
                transcriptsWithAnnotations.result.length > 0;

            return (
                <div className={classNames('small', styles.dropDown)}>
                    {this.loadingIndicator(isLoading)}
                    {!isLoading &&
                        requiredData &&
                        this.getDropdownTranscripts(
                            activeTranscript || canonicalTranscriptId!,
                            transcriptsWithAnnotations.result!,
                            canonicalTranscriptId!,
                            transcriptsByTranscriptId,
                            mutationsByTranscriptId
                        )}
                </div>
            );
        } else {
            // using existing annotations, show all transcripts with protein length
            const isLoading =
                transcriptsWithProteinLength.isPending ||
                canonicalTranscript.isPending;
            const requiredData =
                transcriptsWithProteinLength.result &&
                transcriptsWithProteinLength.result.length > 0 &&
                canonicalTranscriptId;
            return (
                <div className={classNames('small', styles.dropDown)}>
                    {this.loadingIndicator(isLoading)}
                    {!isLoading &&
                        requiredData &&
                        this.getDropdownTranscripts(
                            activeTranscript || canonicalTranscriptId!!,
                            transcriptsWithProteinLength.result!!,
                            canonicalTranscriptId!!,
                            transcriptsByTranscriptId
                        )}
                </div>
            );
        }
    }

    private getDropdownTranscripts(
        activeTranscript: string,
        allTranscripts: string[],
        canonicalTranscript: string,
        transcriptsByTranscriptId: {
            [transcriptId: string]: EnsemblTranscript;
        },
        mutationsByTranscriptId?: { [transcriptId: string]: Mutation[] }
    ) {
        const activeRefseqMrnaId =
            transcriptsByTranscriptId[activeTranscript].refseqMrnaId;
        return (
            <div>
                <Select
                    aria-label="Transcript Dropdown"
                    value={{
                        label: activeRefseqMrnaId
                            ? activeRefseqMrnaId
                            : activeTranscript,
                        value: activeTranscript,
                    }}
                    clearable={false}
                    // need to explicitly set deleteRemoves for clearable
                    // https://github.com/JedWatson/react-select/issues/1560
                    deleteRemoves={false}
                    options={this.sortTranscripts(allTranscripts).map(
                        (t: string) => {
                            const length =
                                transcriptsByTranscriptId[t].proteinLength;
                            const refseqMrnaId =
                                transcriptsByTranscriptId[t].refseqMrnaId;
                            const ccdsId = transcriptsByTranscriptId[t].ccdsId;
                            const nrOfMutations =
                                mutationsByTranscriptId &&
                                mutationsByTranscriptId[t] &&
                                mutationsByTranscriptId[t].length;
                            const label = `${
                                refseqMrnaId ? `${refseqMrnaId} / ` : ''
                            }${t} ${ccdsId ? `(${ccdsId})` : ''} ${
                                length ? `(${length} amino acids)` : ''
                            } ${
                                nrOfMutations
                                    ? `(${nrOfMutations} mutations)`
                                    : ''
                            } ${t === canonicalTranscript ? ' (default)' : ''}`;
                            return { label: label, value: t };
                        }
                    )}
                    onChange={(option: any) => {
                        if (option.value) {
                            this.props.onChange(option.value);
                        }
                    }}
                />
            </div>
        );
    }

    private sortTranscripts(transcripts: string[]) {
        const { canonicalTranscript, transcriptsByTranscriptId } = this.props;

        // sort transcripts for dropdown
        // canonical id first
        // then ones with refseq id
        // then protein length
        // lastly the ensembl id
        transcripts = _.orderBy(
            transcripts,
            [
                t =>
                    canonicalTranscript.result &&
                    t === canonicalTranscript.result.transcriptId,
                t =>
                    transcriptsByTranscriptId[t].hasOwnProperty('refseqMrnaId'),
                t => transcriptsByTranscriptId[t].proteinLength,
                t => t,
            ],
            ['desc', 'desc', 'desc', 'asc']
        );
        return transcripts;
    }

    private loadingIndicator(isLoading: boolean) {
        return isLoading
            ? this.props.loadingIndicator || (
                  <i className="fa fa-spinner fa-pulse fa-2x" />
              )
            : null;
    }
}
