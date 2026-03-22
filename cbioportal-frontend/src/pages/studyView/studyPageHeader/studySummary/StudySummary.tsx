import * as React from 'react';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { computed, observable, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import _ from 'lodash';
import styles from '../styles.module.scss';
import { StudySummaryRecord } from '../../virtualStudy/VirtualStudy';
import LoadingIndicator from '../../../../shared/components/loadingIndicator/LoadingIndicator';
import { getStudySummaryUrl } from '../../../../shared/api/urls';
import { DefaultTooltip, getNCBIlink } from 'cbioportal-frontend-commons';
import { StudyDataDownloadLink } from '../../../../shared/components/StudyDataDownloadLink/StudyDataDownloadLink';
import { serializeEvent } from '../../../../shared/lib/tracking';
import { mixedReferenceGenomeWarning } from 'shared/lib/referenceGenomeUtils';
import {
    DownloadControlOption,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

interface IStudySummaryProps {
    studies: CancerStudy[];
    hasRawDataForDownload: boolean;
    originStudies: MobxPromise<CancerStudy[]>;
    showOriginStudiesInSummaryDescription: boolean;
    isMixedReferenceGenome: boolean | undefined;
}

@observer
export default class StudySummary extends React.Component<
    IStudySummaryProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable private showMoreDescription = false;

    @computed
    get name() {
        return this.props.studies.length === 1
            ? this.props.studies[0].name
            : 'Combined Study';
    }

    @computed
    get descriptionFirstLine() {
        if (this.props.studies.length === 1) {
            let elems = [
                <span
                    dangerouslySetInnerHTML={{
                        __html: this.props.studies[0].description.split(
                            /\n+/g
                        )[0],
                    }}
                />,
            ];
            if (this.props.studies[0].pmid) {
                elems.push(
                    <a
                        target="_blank"
                        href={getNCBIlink(
                            `/pubmed/${this.props.studies[0].pmid}`
                        )}
                        style={{ marginLeft: '5px' }}
                    >
                        PubMed
                    </a>
                );
            }
            return <span>{elems}</span>;
        } else {
            return (
                <span>{`This combined study contains samples from ${this.props.studies.length} studies`}</span>
            );
        }
    }

    @computed
    get hasMoreDescription() {
        return (
            this.props.showOriginStudiesInSummaryDescription ||
            this.props.studies.length > 1 ||
            this.props.studies[0].description.split(/\n/g).length > 1
        );
    }

    @computed
    get descriptionRemainingLines() {
        if (this.props.studies.length === 1) {
            const lines = this.props.studies[0].description.split(/\n/g);
            if (lines.length > 1) {
                //slice fist line as its already shown
                return [
                    <span
                        style={{ whiteSpace: 'pre' }}
                        dangerouslySetInnerHTML={{
                            __html: lines.slice(1).join('\n'),
                        }}
                    />,
                ];
            }
        } else {
            return _.map(this.props.studies, study => {
                return (
                    <li>
                        <a
                            href={getStudySummaryUrl(study.studyId)}
                            target="_blank"
                        >
                            {study.name}
                        </a>
                    </li>
                );
            });
        }
        return [];
    }

    @computed
    get showDownload() {
        return (
            (this.props.hasRawDataForDownload ||
                getServerConfig().feature_study_export) &&
            getServerConfig().skin_hide_download_controls ===
                DownloadControlOption.SHOW_ALL
        );
    }

    render() {
        return (
            <div className={classnames(styles.summary)}>
                <h3
                    style={{
                        marginBottom: 3,
                        display: 'flex',
                        alignItems: 'baseline',
                    }}
                >
                    {this.name}
                    {this.props.isMixedReferenceGenome &&
                        mixedReferenceGenomeWarning()}
                    {this.showDownload && (
                        <DefaultTooltip
                            trigger={['hover']}
                            placement={'top'}
                            overlay={
                                <span>
                                    Download all clinical and genomic data of
                                    this study
                                </span>
                            }
                        >
                            <span
                                data-test="studySummaryRawDataDownloadIcon"
                                data-event={serializeEvent({
                                    category: 'studyPage',
                                    action: 'dataDownload',
                                    label: this.props.studies
                                        .map(s => s.studyId)
                                        .join(','),
                                })}
                                style={{ marginLeft: '10px', fontSize: '14px' }}
                            >
                                <StudyDataDownloadLink
                                    studyId={this.props.studies[0].studyId}
                                />
                            </span>
                        </DefaultTooltip>
                    )}
                </h3>
                <div className={styles.description}>
                    <div>
                        {this.descriptionFirstLine}
                        {this.hasMoreDescription && (
                            <i
                                data-tour="show-more-description-icon"
                                className={`fa fa-${
                                    this.showMoreDescription ? 'minus' : 'plus'
                                }-circle`}
                                onClick={() =>
                                    (this.showMoreDescription = !this
                                        .showMoreDescription)
                                }
                                style={{ marginLeft: '5px', cursor: 'pointer' }}
                            />
                        )}
                    </div>

                    {this.showMoreDescription && (
                        <div>
                            <ul className={styles.studyLinks}>
                                {this.descriptionRemainingLines}
                            </ul>
                            {this.props
                                .showOriginStudiesInSummaryDescription && (
                                <div>
                                    {this.props.originStudies.isComplete &&
                                        this.props.originStudies.result!
                                            .length > 0 && (
                                            <span>
                                                <span
                                                    style={{
                                                        fontWeight: 'bold',
                                                        marginBottom: '5px',
                                                        display: 'block',
                                                    }}
                                                >
                                                    This virtual study was
                                                    derived from:
                                                </span>
                                                {this.props.originStudies.result!.map(
                                                    study => (
                                                        <StudySummaryRecord
                                                            {...study}
                                                        />
                                                    )
                                                )}
                                            </span>
                                        )}
                                    <LoadingIndicator
                                        isLoading={
                                            this.props.originStudies.isPending
                                        }
                                        center={true}
                                        size={'big'}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
