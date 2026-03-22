import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { observer } from 'mobx-react';
import _ from 'lodash';
import {
    IClinicalGroupMatch,
    IGenomicGroupMatch,
    IGenomicMatch,
    IDetailedTrialMatch,
    IArmMatch,
    IGenomicMatchType,
} from '../../../shared/model/MatchMiner';
import styles from './style/trialMatch.module.scss';
import { action, computed, makeObservable, observable } from 'mobx';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import SampleManager from '../SampleManager';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { getAgeRangeDisplay } from './TrialMatchTableUtils';
import TrialMatchFeedback from './TrialMatchFeedback';
import { getServerConfig } from 'config/config';
import { Button } from 'react-bootstrap';

export type ITrialMatchProps = {
    sampleManager: SampleManager | null;
    detailedTrialMatches: IDetailedTrialMatch[];
    containerWidth: number;
};

export type ISelectedTrialFeedbackFormData = {
    nctId: string;
    protocolNo: string;
};

enum ColumnKey {
    TITLE = 'Title',
    MATCHING_CRITERIA = 'Matching Criteria',
    STATUS = 'Status',
}

enum ColumnWidth {
    STATUS = 140,
}

enum AlterationType {
    MUTATION = 'Mutation',
    CNA = 'Copy Number Alteration',
    MSI = 'Microsatellite Instability',
    WILDTYPE = 'Wildtype',
}

class TrialMatchTableComponent extends LazyMobXTable<IDetailedTrialMatch> {}

@observer
export default class TrialMatchTable extends React.Component<ITrialMatchProps> {
    constructor(props: ITrialMatchProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get columnWidths() {
        return {
            [ColumnKey.STATUS]: ColumnWidth.STATUS,
            [ColumnKey.TITLE]:
                0.35 * (this.props.containerWidth - ColumnWidth.STATUS),
            [ColumnKey.MATCHING_CRITERIA]:
                0.65 * (this.props.containerWidth - ColumnWidth.STATUS),
        };
    }

    @observable selectedTrialFeedbackFormData:
        | ISelectedTrialFeedbackFormData
        | undefined;
    @observable showGeneralFeedback = false;

    private _columns = [
        {
            name: ColumnKey.TITLE,
            render: (trial: IDetailedTrialMatch) => (
                <div>
                    <If condition={trial.protocolNo.length > 0}>
                        <div>
                            <a
                                target="_blank"
                                href={
                                    'https://www.mskcc.org/cancer-care/clinical-trials/' +
                                    trial.protocolNo
                                }
                            >
                                {trial.protocolNo}
                            </a>
                        </div>
                    </If>
                    <If condition={trial.nctId.length > 0}>
                        <div>
                            <a
                                target="_blank"
                                href={
                                    'https://clinicaltrials.gov/ct2/show/' +
                                    trial.nctId
                                }
                            >
                                {trial.nctId}
                            </a>
                        </div>
                    </If>
                    <div>{trial.shortTitle}</div>
                    {trial.principalInvestigator && (
                        <div className={styles.icon}>
                            <i
                                className={`fa fa-user-md ${styles.marginRight}`}
                                aria-hidden="true"
                            ></i>
                            <If
                                condition={
                                    !_.isUndefined(
                                        trial.principalInvestigator.url
                                    )
                                }
                            >
                                <Then>
                                    <a
                                        target="_blank"
                                        href={trial.principalInvestigator.url}
                                    >
                                        {trial.principalInvestigator.full_name}
                                    </a>
                                </Then>
                                <Else>
                                    {trial.principalInvestigator.full_name}
                                </Else>
                            </If>
                            <If
                                condition={
                                    !_.isUndefined(
                                        trial.principalInvestigator.email
                                    )
                                }
                            >
                                <a
                                    href={
                                        'mailto:' +
                                        trial.principalInvestigator.email
                                    }
                                >
                                    <i
                                        className={`fa fa-envelope-o ${styles.marginLeft}`}
                                        aria-hidden="true"
                                    ></i>
                                </a>
                            </If>
                        </div>
                    )}
                </div>
            ),
            width: this.columnWidths[ColumnKey.TITLE],
        },
        {
            name: ColumnKey.MATCHING_CRITERIA,
            render: (trial: IDetailedTrialMatch) => (
                <div>
                    {trial.matches.map((armMatch: IArmMatch, index: number) => (
                        <div>
                            <div className={styles.matchInfoContainer}>
                                <div className={styles.genomicInfoContainer}>
                                    <div>
                                        {armMatch.matches.map(
                                            (
                                                clinicalGroupMatch: IClinicalGroupMatch,
                                                cgIndex: number
                                            ) => (
                                                <div
                                                    className={
                                                        styles.criteriaContainer
                                                    }
                                                >
                                                    <If
                                                        condition={
                                                            clinicalGroupMatch.matches ||
                                                            clinicalGroupMatch.notMatches
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.firstLeft
                                                            }
                                                        >
                                                            {clinicalGroupMatch.matches &&
                                                                this.getGenomicMatch(
                                                                    clinicalGroupMatch.matches
                                                                )}
                                                            {clinicalGroupMatch.notMatches &&
                                                                this.getGenomicNotMatch(
                                                                    clinicalGroupMatch.notMatches
                                                                )}
                                                        </div>
                                                    </If>
                                                    {this.getClinicalMatch(
                                                        clinicalGroupMatch
                                                    )}
                                                    <If
                                                        condition={
                                                            cgIndex <
                                                            armMatch.matches
                                                                .length -
                                                                1
                                                        }
                                                    >
                                                        <hr
                                                            className={
                                                                styles.criteriaHr
                                                            }
                                                        />
                                                    </If>
                                                </div>
                                            )
                                        )}
                                    </div>
                                    <div style={{ marginTop: 5 }}>
                                        <span>
                                            Matched Samples:{' '}
                                            {this.getSampleIdIcons(
                                                armMatch.sampleIds
                                            )}
                                        </span>
                                    </div>
                                    <If
                                        condition={
                                            armMatch.armDescription !== ''
                                        }
                                    >
                                        <div style={{ width: '75%' }}>
                                            <span>
                                                Arm: {armMatch.armDescription}
                                            </span>
                                        </div>
                                    </If>
                                    <If condition={armMatch.drugs.length > 0}>
                                        <div>
                                            <span>
                                                <img
                                                    src={require('../../../globalStyles/images/drug.png')}
                                                    style={{
                                                        width: 18,
                                                        marginTop: -5,
                                                        marginRight: 5,
                                                    }}
                                                    alt="drug icon"
                                                />
                                                <b>
                                                    {armMatch.drugs
                                                        .map(
                                                            (
                                                                drugCombination: string[]
                                                            ) =>
                                                                drugCombination.join(
                                                                    ' + '
                                                                )
                                                        )
                                                        .join(', ')}
                                                </b>
                                            </span>
                                        </div>
                                    </If>
                                </div>
                            </div>
                            <If condition={index < trial.matches.length - 1}>
                                <hr className={styles.criteriaHr} />
                            </If>
                        </div>
                    ))}
                </div>
            ),
            width: this.columnWidths[ColumnKey.MATCHING_CRITERIA],
        },
        {
            name: ColumnKey.STATUS,
            render: (trial: IDetailedTrialMatch) => (
                <div className={styles.statusContainer}>
                    <a
                        target="_blank"
                        href={
                            'https://www.mskcc.org/cancer-care/clinical-trials/' +
                            trial.protocolNo
                        }
                    >
                        <span className={styles.statusBackground}>
                            {trial.status}
                        </span>
                    </a>
                    <span className={styles.feedback}>
                        <Button
                            type="button"
                            className={
                                'btn btn-default btn-sm btn-xs ' +
                                styles.feedbackButton
                            }
                            onClick={() =>
                                this.openCloseFeedbackForm({
                                    nctId: trial.nctId,
                                    protocolNo: trial.protocolNo,
                                })
                            }
                        >
                            Feedback
                        </Button>
                    </span>
                </div>
            ),
            sortBy: (trial: IDetailedTrialMatch) => trial.status,
            width: this.columnWidths[ColumnKey.STATUS],
        },
    ];

    public getSampleIdIcons(sampleIds: string[]) {
        let sortedSampleIds = sampleIds;
        if (sampleIds.length > 1) {
            const sampleOrder = this.props.sampleManager!.getSampleIdsInOrder();
            sortedSampleIds = sampleOrder.filter((sampleId: string) =>
                sampleIds.includes(sampleId)
            );
        }
        return (
            <React.Fragment>
                {sortedSampleIds.map((sampleId: string) => (
                    <span className={styles.genomicSpan}>
                        {this.props.sampleManager!.getComponentForSample(
                            sampleId,
                            1,
                            ''
                        )}
                    </span>
                ))}
            </React.Fragment>
        );
    }

    public getClinicalMatch(clinicalGroupMatch: IClinicalGroupMatch) {
        return (
            <div
                className={styles.firstRight}
                style={
                    clinicalGroupMatch.matches || clinicalGroupMatch.notMatches
                        ? {}
                        : { width: '100%' }
                }
            >
                <span className={styles.secondLeft}>
                    {getAgeRangeDisplay(clinicalGroupMatch.trialAgeNumerical)}
                </span>
                <span className={styles.secondRight}>
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.positive.join(
                        ', '
                    )}
                    {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative
                        .length > 0 && (
                        <span>
                            <b> except </b>
                            <If
                                condition={
                                    clinicalGroupMatch
                                        .trialOncotreePrimaryDiagnosis.negative
                                        .length < 4
                                }
                            >
                                <Then>
                                    <span>
                                        {clinicalGroupMatch.trialOncotreePrimaryDiagnosis.negative
                                            .join(', ')
                                            .replace(/,(?!.*,)/gim, ' and')}
                                    </span>
                                </Then>
                                <Else>
                                    <DefaultTooltip
                                        placement="bottomLeft"
                                        trigger={['hover', 'focus']}
                                        overlay={this.tooltipClinicalContent(
                                            clinicalGroupMatch
                                                .trialOncotreePrimaryDiagnosis
                                                .negative
                                        )}
                                        destroyTooltipOnHide={true}
                                        onPopupAlign={placeArrowBottomLeft}
                                    >
                                        <span>
                                            {clinicalGroupMatch
                                                .trialOncotreePrimaryDiagnosis
                                                .negative.length +
                                                ` cancer types`}
                                        </span>
                                    </DefaultTooltip>
                                </Else>
                            </If>
                        </span>
                    )}
                </span>
            </div>
        );
    }

    @action
    public openCloseFeedbackForm(data?: ISelectedTrialFeedbackFormData) {
        this.selectedTrialFeedbackFormData = data;
    }

    public getGenomicMatch(matches: IGenomicMatchType) {
        return (
            <React.Fragment>
                {matches.MUTATION.map(
                    (genomicGroupMatch: IGenomicGroupMatch) => (
                        <div>
                            <span style={{ marginRight: 5 }}>
                                <b>
                                    {
                                        genomicGroupMatch.patientGenomic!
                                            .trueHugoSymbol
                                    }{' '}
                                </b>
                                {genomicGroupMatch.patientGenomic!.trueProteinChange.join(
                                    ', '
                                )}
                            </span>
                            <DefaultTooltip
                                placement="bottomLeft"
                                trigger={['hover', 'focus']}
                                overlay={this.tooltipGenomicContent(
                                    genomicGroupMatch.genomicAlteration
                                )}
                                destroyTooltipOnHide={false}
                                onPopupAlign={placeArrowBottomLeft}
                            >
                                <i
                                    className={
                                        'fa fa-info-circle ' + styles.icon
                                    }
                                ></i>
                            </DefaultTooltip>
                        </div>
                    )
                )}
                {matches.MSI.length > 0 && (
                    <div>
                        Tumor is <b>MSI-H</b>
                    </div>
                )}
                {matches.CNA.map((genomicGroupMatch: IGenomicGroupMatch) => (
                    <div>
                        {this.getGenomicAlteration(
                            genomicGroupMatch.genomicAlteration
                        )}
                    </div>
                ))}
                {matches.WILDTYPE.map(
                    (genomicGroupMatch: IGenomicGroupMatch) => (
                        <div>
                            {this.getGenomicAlteration(
                                genomicGroupMatch.genomicAlteration
                            )}
                        </div>
                    )
                )}
            </React.Fragment>
        );
    }

    public getGenomicNotMatch(notMatches: IGenomicMatchType) {
        let mutationAndCnagenemicAlterations: string[] = [];
        if (notMatches.MUTATION.length > 0) {
            mutationAndCnagenemicAlterations =
                notMatches.MUTATION[0].genomicAlteration;
        }
        if (notMatches.CNA.length > 0) {
            mutationAndCnagenemicAlterations = mutationAndCnagenemicAlterations.concat(
                notMatches.CNA[0].genomicAlteration
            );
        }
        return (
            <React.Fragment>
                {mutationAndCnagenemicAlterations.length > 0 && (
                    <div>
                        <span className={styles.genomicSpan}>
                            {this.getDescriptionForNotMatches(
                                mutationAndCnagenemicAlterations,
                                3,
                                AlterationType.MUTATION
                            )}
                        </span>
                        <DefaultTooltip
                            placement="bottomLeft"
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(
                                mutationAndCnagenemicAlterations
                            )}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}
                        >
                            <i
                                className={'fa fa-info-circle ' + styles.icon}
                            ></i>
                        </DefaultTooltip>
                    </div>
                )}
                {notMatches.MSI.length > 0 && (
                    <div>
                        Tumor is <b>not MSI-H</b>
                    </div>
                )}
                {notMatches.WILDTYPE.length > 0 && (
                    <div>
                        <span className={styles.genomicSpan}>
                            {this.getDescriptionForNotMatches(
                                notMatches.WILDTYPE[0].genomicAlteration,
                                3,
                                AlterationType.WILDTYPE
                            )}
                        </span>
                        <DefaultTooltip
                            placement="bottomLeft"
                            trigger={['hover', 'focus']}
                            overlay={this.tooltipGenomicContent(
                                notMatches.WILDTYPE[0].genomicAlteration
                            )}
                            destroyTooltipOnHide={false}
                            onPopupAlign={placeArrowBottomLeft}
                        >
                            <i
                                className={'fa fa-info-circle ' + styles.icon}
                            ></i>
                        </DefaultTooltip>
                    </div>
                )}
            </React.Fragment>
        );
    }

    public getGenomicAlteration(data: string[]) {
        const filteredData = data.map((e: string) => e.split(' '));
        return (
            <div>
                {filteredData.map((e: string[]) => (
                    <div>
                        <b>{e[0]}</b> {e[1]}
                    </div>
                ))}
            </div>
        );
    }

    public tooltipGenomicContent(data: string[]) {
        return (
            <div className={styles.tooltip}>
                <div>
                    Genomic selection{' '}
                    {data.length > 1 ? 'criteria' : 'criterion'} specified in
                    the trial:
                </div>
                {data.map((e: string) => (
                    <div className={styles.genomicSpan}>
                        <If condition={e.includes('!')}>
                            <Then>
                                <b>Not </b>
                                {e.replace(/!/g, '')}
                            </Then>
                            <Else>{e}</Else>
                        </If>
                    </div>
                ))}
            </div>
        );
    }

    public tooltipClinicalContent(data: string[]) {
        return (
            <div className={styles.tooltip}>
                <ul className={styles.alterationUl}>
                    {data.map((cancerType: string) => (
                        <li>{cancerType}</li>
                    ))}
                </ul>
            </div>
        );
    }

    public getDescriptionForNotMatches(
        genomicAlteration: string[],
        threshold: number,
        type: string
    ) {
        const hugoSymbolSet = new Set(
            [...genomicAlteration].map((s: string) => s.split(' ')[0])
        );
        let genomicAlterationContent = '';
        if (type === AlterationType.MUTATION) {
            if (hugoSymbolSet.size === 1) {
                genomicAlterationContent =
                    [...hugoSymbolSet].join(', ') +
                    ' ' +
                    [...genomicAlteration]
                        .map((s: string) => s.split(' ')[1].replace(/!/g, ''))
                        .join(', ');
                return `Negative for ${genomicAlterationContent}`;
            } else if (hugoSymbolSet.size <= threshold) {
                genomicAlterationContent = [...hugoSymbolSet].join(', ');
            } else {
                genomicAlterationContent = `${hugoSymbolSet.size} genes`;
            }
            return `Negative for alterations in ${genomicAlterationContent}`;
        } else if (type === AlterationType.WILDTYPE) {
            if (hugoSymbolSet.size <= threshold) {
                genomicAlterationContent = [...hugoSymbolSet].join(', ');
            } else {
                genomicAlterationContent = `${hugoSymbolSet.size} genes`;
            }
            return `Tumor doesn't have ${genomicAlterationContent} defined by the trial`;
        }
        return '';
    }

    render() {
        return (
            <div>
                <p style={{ marginBottom: '0' }}>
                    Curated genomic and clinical criteria from open clinical
                    trials at Memorial Sloan Kettering. Please{' '}
                    <a href="mailto:team@oncokb.org">contact us</a> or submit{' '}
                    <a onClick={() => (this.showGeneralFeedback = true)}>
                        feedback form
                    </a>{' '}
                    if you have any questions.
                </p>
                {!_.isUndefined(this.showGeneralFeedback) && (
                    <TrialMatchFeedback
                        show={this.showGeneralFeedback}
                        onHide={() => (this.showGeneralFeedback = false)}
                        title="OncoKB Matched Trials General Feedback"
                        userDisplayName={getServerConfig().user_display_name}
                    />
                )}
                {this.selectedTrialFeedbackFormData && (
                    <TrialMatchFeedback
                        show={!!this.selectedTrialFeedbackFormData}
                        data={this.selectedTrialFeedbackFormData}
                        onHide={() => this.openCloseFeedbackForm()}
                        isTrialFeedback={true}
                        title="OncoKB Matched Trial Feedback"
                        userDisplayName={getServerConfig().user_display_name}
                    />
                )}
                <TrialMatchTableComponent
                    data={this.props.detailedTrialMatches}
                    columns={this._columns}
                    showCopyDownload={false}
                />
                <div className={styles.powered}>
                    Powered by{' '}
                    <a href="https://oncokb.org/" target="_blank">
                        OncoKB
                    </a>{' '}
                    &{' '}
                    <a href="https://matchminer.org/" target="_blank">
                        MatchMiner
                    </a>
                </div>
            </div>
        );
    }
}
