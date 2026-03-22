import * as React from 'react';
import PdbHeaderCache from '../cache/PdbHeaderCache';
import { observer } from 'mobx-react';
import {
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import { generatePdbInfoSummary } from '../lib/PdbUtils';
import TextExpander from './TextExpander';

export interface IPdbChainInfoProps {
    pdbId: string;
    chainId: string;
    cache?: PdbHeaderCache;
    truncateText?: boolean;
    summaryFormat?: boolean;
}

@observer
export default class PdbChainInfo extends React.Component<
    IPdbChainInfoProps,
    {}
> {
    render() {
        let pdbInfo = null;
        let moleculeInfo = null;

        if (this.props.cache) {
            const cacheData = this.props.cache.get(this.props.pdbId);

            if (cacheData === null) {
                pdbInfo = (
                    <TableCellStatusIndicator
                        status={TableCellStatus.LOADING}
                    />
                );
                moleculeInfo = (
                    <TableCellStatusIndicator
                        status={TableCellStatus.LOADING}
                    />
                );
            } else if (cacheData.status === 'error') {
                pdbInfo = (
                    <TableCellStatusIndicator status={TableCellStatus.ERROR} />
                );
                moleculeInfo = (
                    <TableCellStatusIndicator status={TableCellStatus.ERROR} />
                );
            } else if (cacheData.data === null) {
                pdbInfo = (
                    <TableCellStatusIndicator status={TableCellStatus.NA} />
                );
                moleculeInfo = (
                    <TableCellStatusIndicator status={TableCellStatus.NA} />
                );
            } else {
                const summary = generatePdbInfoSummary(
                    cacheData.data,
                    this.props.chainId
                );

                pdbInfo = summary.pdbInfo;
                moleculeInfo = summary.moleculeInfo;
            }
        }

        return (
            <div className={this.props.truncateText ? 'col col-sm-12' : ''}>
                <div className={this.props.truncateText ? 'row' : ''}>
                    <div className="pull-left" style={{ paddingRight: 5 }}>
                        <span
                            style={{
                                fontWeight: this.props.summaryFormat
                                    ? 'bold'
                                    : 'normal',
                            }}
                        >
                            <span>
                                {this.props.summaryFormat ? 'pdb' : 'PDB'}
                            </span>
                            {!this.props.summaryFormat && (
                                <span style={{ paddingLeft: 5 }}>
                                    <a
                                        href={`http://www.rcsb.org/pdb/explore/explore.do?structureId=${this.props.pdbId}`}
                                        target="_blank"
                                    >
                                        <b>{this.props.pdbId}</b>
                                    </a>
                                </span>
                            )}
                            <span>:</span>
                        </span>
                    </div>
                    <div data-test="pdbChainInfoText">
                        {this.props.truncateText ? (
                            <TextExpander text={pdbInfo} />
                        ) : (
                            <span>{pdbInfo}</span>
                        )}
                    </div>
                </div>
                <div className={this.props.truncateText ? 'row' : ''}>
                    <div className="pull-left" style={{ paddingRight: 5 }}>
                        <span
                            style={{
                                fontWeight: this.props.summaryFormat
                                    ? 'bold'
                                    : 'normal',
                            }}
                        >
                            <span>
                                {this.props.summaryFormat ? 'chain' : 'Chain'}
                            </span>
                            {!this.props.summaryFormat && (
                                <span style={{ paddingLeft: 3 }}>
                                    <b>{this.props.chainId}</b>
                                </span>
                            )}
                            <span>:</span>
                        </span>
                    </div>
                    <div>
                        {this.props.truncateText ? (
                            <TextExpander text={moleculeInfo} />
                        ) : (
                            <span>{moleculeInfo}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
