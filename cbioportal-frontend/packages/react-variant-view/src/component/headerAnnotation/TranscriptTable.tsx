import _ from 'lodash';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Table } from 'react-bootstrap';
import { Collapse } from 'react-collapse';
import { ITranscript } from './TranscriptSummaryTable';
import './TranscriptSummaryTable.module.scss';

interface ITranscriptTableProps {
    canonicalTranscript: ITranscript;
    otherTranscripts?: ITranscript[];
    isOpen: boolean;
    allValidTranscripts: string[];
    onTranscriptSelect(transcriptId: string): void;
}

@observer
class TranscriptTable extends React.Component<ITranscriptTableProps> {
    public render() {
        if (_.isEmpty(this.props.otherTranscripts)) {
            return (
                <Collapse isOpened={this.props.isOpen}>
                    <div className="table-content" id="table-content">
                        <Table responsive={true} striped={true} hover={true}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Transcript</th>
                                    <th>Hugo Gene Symbol</th>
                                    <th>Hgvs Short</th>
                                    <th>Ref Seq</th>
                                    <th>Variant Classification</th>
                                    <th>Hgvsc</th>
                                    <th>Consequence Terms</th>
                                    <th>Exon</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>
                                        {
                                            this.props.canonicalTranscript
                                                .transcript
                                        }
                                    </td>
                                    <td>
                                        {
                                            this.props.canonicalTranscript
                                                .hugoGeneSymbol
                                        }
                                    </td>
                                    <td>
                                        {
                                            this.props.canonicalTranscript
                                                .hgvsShort
                                        }
                                    </td>
                                    <td>
                                        {this.props.canonicalTranscript.refSeq}
                                    </td>
                                    <td>
                                        {
                                            this.props.canonicalTranscript
                                                .variantClassification
                                        }
                                    </td>
                                    <td>
                                        {this.props.canonicalTranscript.hgvsc}
                                    </td>
                                    <td>
                                        {
                                            this.props.canonicalTranscript
                                                .consequenceTerms
                                        }
                                    </td>
                                    <td>
                                        {this.props.canonicalTranscript.exon}
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </Collapse>
            );
        } else {
            const allTranscripts = _.concat(
                this.props.canonicalTranscript,
                this.props.otherTranscripts!
            );
            return (
                <Collapse isOpened={this.props.isOpen}>
                    <div className="table-content" id="table-content">
                        <Table responsive={true} striped={true} hover={true}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Transcript</th>
                                    <th>Hugo Gene Symbol</th>
                                    <th>Hgvs Short</th>
                                    <th>Ref Seq</th>
                                    <th>Variant Classification</th>
                                    <th>Hgvsc</th>
                                    <th>Consequence Terms</th>
                                    <th>Exon</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTranscripts.map((transcript, index) => {
                                    return (
                                        <tr key={transcript.transcript}>
                                            <td>{index + 1}</td>
                                            {this.props.allValidTranscripts.includes(
                                                transcript.transcript!
                                            ) ? (
                                                <td>
                                                    <div>
                                                        {transcript.transcript}
                                                    </div>
                                                </td>
                                            ) : (
                                                <td>{transcript.transcript}</td>
                                            )}
                                            <td>{transcript.hugoGeneSymbol}</td>
                                            <td>{transcript.hgvsShort}</td>
                                            <td>{transcript.refSeq}</td>
                                            <td>
                                                {
                                                    transcript.variantClassification
                                                }
                                            </td>
                                            <td>{transcript.hgvsc}</td>
                                            <td>
                                                {transcript.consequenceTerms}
                                            </td>
                                            <td>{transcript.exon}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Collapse>
            );
        }
    }
}

export default TranscriptTable;
