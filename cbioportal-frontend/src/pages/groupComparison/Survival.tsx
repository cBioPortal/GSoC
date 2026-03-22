import * as React from 'react';
import SurvivalChart from '../resultsView/survival/SurvivalChart';
import 'react-rangeslider/lib/index.css';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import { MakeMobxView } from '../../shared/components/MobxView';
import {
    SURVIVAL_NOT_ENOUGH_GROUPS_MSG,
    SURVIVAL_TOO_MANY_GROUPS_MSG,
    GetStatisticalCautionInfo,
    GetHazardRatioCautionInfo,
} from './GroupComparisonUtils';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { blendColors } from './OverlapUtils';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { getPatientIdentifiers } from '../studyView/StudyViewUtils';
import _, { Dictionary } from 'lodash';
import SurvivalDescriptionTable from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    GroupLegendLabelComponent,
    SurvivalTabGroupLegendLabelComponent,
} from './labelComponents/GroupLegendLabelComponent';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import {
    generateSurvivalPlotTitleFromDisplayName,
    getMedian,
    getSurvivalSummaries,
    SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP,
    SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP,
    SURVIVAL_PLOT_Y_LABEL_TOOLTIP,
    generateSurvivalPlotYAxisLabelFromDisplayName,
    sortPatientSurvivals,
    calculateNumberOfPatients,
} from 'pages/resultsView/survival/SurvivalUtil';
import { observable, action, makeObservable } from 'mobx';
import survivalPlotStyle from './styles.module.scss';
import SurvivalPrefixTable, {
    SurvivalPrefixTableStore,
} from 'pages/resultsView/survival/SurvivalPrefixTable';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { calculateQValues } from 'shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import { logRankTest } from 'pages/resultsView/survival/logRankTest';
import LeftTruncationCheckbox from 'shared/components/survival/LeftTruncationCheckbox';

export interface ISurvivalProps {
    store: ComparisonStore;
}

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {
    private multipleDescriptionWarningMessageWithoutTooltip =
        'The survival data on patients from different cohorts may have been defined by ';
    private multipleDescriptionWarningMessageWithTooltip =
        'different criteria.';
    private differentDescriptionExistMessage =
        'Different descriptions of survival data were used for different studies.';

    @observable
    private selectedSurvivalPlotPrefix: string | undefined = undefined;

    constructor(props: ISurvivalProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private setSurvivalPlotPrefix(prefix: string) {
        this.selectedSurvivalPlotPrefix = prefix;
    }

    public readonly analysisGroupsComputations = remoteData({
        await: () => [
            this.props.store.activeGroups,
            this.props.store.patientsVennPartition,
            this.props.store.uidToGroup,
            this.props.store.patientToSamplesSet,
        ],
        invoke: () => {
            const orderedActiveGroupUidSet = _.reduce(
                this.props.store._activeGroupsNotOverlapRemoved.result!,
                (acc, next, index) => {
                    acc[next.uid] = index;
                    return acc;
                },
                {} as { [id: string]: number }
            );
            const partition = this.props.store.patientsVennPartition.result!;

            // ascending sort partition bases on number of groups in each parition.
            // if they are equal then sort based on the give order of groups
            partition.sort((a, b) => {
                const aUids = Object.keys(a.key).filter(uid => a.key[uid]);
                const bUids = Object.keys(b.key).filter(uid => b.key[uid]);
                if (aUids.length !== bUids.length) {
                    return aUids.length - bUids.length;
                }
                const aCount = _.sumBy(
                    aUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                const bCount = _.sumBy(
                    bUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                return aCount - bCount;
            });
            const uidToGroup = this.props.store.uidToGroup.result!;
            const analysisGroups = [];
            const patientToAnalysisGroups: {
                [patientKey: string]: string[];
            } = {};

            if (this.props.store.overlapStrategy === OverlapStrategy.INCLUDE) {
                for (const entry of partition) {
                    const partitionGroupUids = Object.keys(entry.key).filter(
                        uid => entry.key[uid]
                    );
                    // sort by give order of groups
                    partitionGroupUids.sort(
                        (a, b) =>
                            orderedActiveGroupUidSet[a] -
                            orderedActiveGroupUidSet[b]
                    );
                    if (partitionGroupUids.length > 0) {
                        const name = `Only ${partitionGroupUids
                            .map(uid => uidToGroup[uid].nameWithOrdinal)
                            .join(', ')}`;
                        const value = partitionGroupUids.join(',');
                        for (const patientKey of entry.value) {
                            patientToAnalysisGroups[patientKey] = [value];
                        }
                        analysisGroups.push({
                            name,
                            color: blendColors(
                                partitionGroupUids.map(
                                    uid => uidToGroup[uid].color
                                )
                            ),
                            value,
                            legendText: JSON.stringify(partitionGroupUids),
                        });
                    }
                }
            } else {
                const patientToSamplesSet = this.props.store.patientToSamplesSet
                    .result!;
                for (const group of this.props.store.activeGroups.result!) {
                    const name = group.nameWithOrdinal;
                    analysisGroups.push({
                        name,
                        color: group.color,
                        value: group.uid,
                        legendText: group.uid,
                    });
                    const patientIdentifiers = getPatientIdentifiers([group]);
                    for (const identifier of patientIdentifiers) {
                        const samples = patientToSamplesSet.get({
                            studyId: identifier.studyId,
                            patientId: identifier.patientId,
                        });
                        if (samples && samples.length) {
                            patientToAnalysisGroups[
                                samples[0].uniquePatientKey
                            ] = [group.uid];
                        }
                    }
                }
            }
            return Promise.resolve({
                analysisGroups,
                patientToAnalysisGroups,
            });
        },
    });

    readonly sortedGroupedSurvivals = remoteData<{
        [prefix: string]: { [analysisGroup: string]: PatientSurvival[] };
    }>({
        await: () => [
            this.analysisGroupsComputations,
            this.props.store.patientSurvivals,
        ],
        invoke: () => {
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const survivalsByPrefixByAnalysisGroup = _.mapValues(
                this.props.store.patientSurvivals.result!,
                survivals =>
                    _.reduce(
                        survivals,
                        (map, nextSurv) => {
                            if (
                                nextSurv.uniquePatientKey in
                                patientToAnalysisGroups
                            ) {
                                // only include this data if theres an analysis group (curve) to put it in
                                const groups =
                                    patientToAnalysisGroups[
                                        nextSurv.uniquePatientKey
                                    ];
                                groups.forEach(group => {
                                    map[group] = map[group] || [];
                                    map[group].push(nextSurv);
                                });
                            }
                            return map;
                        },
                        {} as { [groupValue: string]: PatientSurvival[] }
                    )
            );

            return Promise.resolve(
                _.mapValues(
                    survivalsByPrefixByAnalysisGroup,
                    survivalsByAnalysisGroup =>
                        _.mapValues(survivalsByAnalysisGroup, survivals =>
                            sortPatientSurvivals(survivals)
                        )
                )
            );
        },
    });

    readonly pValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [
            this.sortedGroupedSurvivals,
            this.analysisGroupsComputations,
        ],
        invoke: () => {
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;

            return Promise.resolve(
                _.mapValues(
                    this.sortedGroupedSurvivals.result!,
                    groupToSurvivals => {
                        let pVal = null;
                        if (analysisGroups.length > 1) {
                            pVal = logRankTest(
                                ...analysisGroups.map(
                                    group => groupToSurvivals[group.value] || []
                                )
                            );
                        }
                        return pVal;
                    }
                )
            );
        },
    });

    readonly qValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [this.pValuesByPrefix],
        invoke: () => {
            // Pair pValues with prefixes
            const zipped = _.map(
                this.pValuesByPrefix.result!,
                (pVal, prefix) => ({ pVal, prefix })
            );

            // Filter out null pvalues and sort in ascending order
            const sorted = _.sortBy(
                zipped.filter(x => x.pVal !== null),
                x => x.pVal
            );

            // Calculate q values, in same order as `sorted`
            const qValues = calculateQValues(sorted.map(x => x.pVal!));

            // make a copy - null pValues become null qValues
            const ret = _.clone(this.pValuesByPrefix.result!);
            sorted.forEach((x, index) => {
                ret[x.prefix] = qValues[index];
            });
            return Promise.resolve(ret);
        },
    });

    readonly tabUI = MakeMobxView({
        await: () => {
            if (
                this.props.store._activeGroupsNotOverlapRemoved.isComplete &&
                this.props.store._activeGroupsNotOverlapRemoved.result.length >
                    10
            ) {
                // dont bother loading data for and computing UI if its not valid situation for it
                return [this.props.store._activeGroupsNotOverlapRemoved];
            } else {
                return [
                    this.props.store._activeGroupsNotOverlapRemoved,
                    this.survivalUI,
                    this.props.store.overlapComputations,
                    this.survivalPrefixTable,
                    this.props.store.isLeftTruncationAvailable,
                ];
            }
        },
        render: () => {
            const numActiveGroups = this.props.store
                ._activeGroupsNotOverlapRemoved.result!.length;
            let content: any = [];
            if (numActiveGroups > 10) {
                content = <span>{SURVIVAL_TOO_MANY_GROUPS_MSG}</span>;
            } else if (numActiveGroups === 0) {
                content = <span>{SURVIVAL_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                var isGenieBpcStudy = this.props.store.studies.result!.find(s =>
                    s.studyId.includes('genie_bpc')
                );

                content = (
                    <>
                        <div
                            className={'tabMessageContainer'}
                            style={{ paddingBottom: 0 }}
                        >
                            <GetStatisticalCautionInfo />
                            <GetHazardRatioCautionInfo />
                            {isGenieBpcStudy &&
                                !this.props.store.isLeftTruncationAvailable
                                    .result && (
                                    <div className="alert alert-info">
                                        <i
                                            className="fa fa-md fa-info-circle"
                                            style={{
                                                verticalAlign:
                                                    'middle !important',
                                                marginRight: 6,
                                                marginBottom: 1,
                                            }}
                                        />
                                        Kaplan-Meier estimates do not account
                                        for the lead time bias introduced by the
                                        inclusion criteria for the GENIE BPC
                                        Project.
                                    </div>
                                )}
                            <OverlapExclusionIndicator
                                store={this.props.store}
                                only="patient"
                                survivalTabMode={true}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            {this.survivalPrefixTable.component && (
                                <div
                                    style={{
                                        marginRight: 15,
                                        marginTop: 15,
                                        minWidth: 475,
                                        maxWidth: 475,
                                        height: 'fit-content',
                                        overflowX: 'scroll',
                                    }}
                                >
                                    {this.survivalPrefixTable.component}
                                </div>
                            )}
                            {this.survivalUI.component}
                        </div>
                    </>
                );
            }
            return (
                <div data-test="ComparisonPageSurvivalTabDiv">{content}</div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
        showLastRenderWhenPending: true,
    });

    readonly survivalPrefixes = remoteData({
        await: () => [
            this.survivalTitleText,
            this.props.store.patientSurvivals,
            this.pValuesByPrefix,
            this.qValuesByPrefix,
            this.analysisGroupsComputations,
        ],
        invoke: () => {
            const patientSurvivals = this.props.store.patientSurvivals.result!;
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;
            const uidToAnalysisGroup = _.keyBy(analysisGroups, g => g.value);
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const pValues = this.pValuesByPrefix.result!;
            const qValues = this.qValuesByPrefix.result!;

            const survivalPrefixes = _.map(
                this.survivalTitleText.result! as Dictionary<string>,
                (displayText, prefix) => {
                    const patientSurvivalsPerGroup = _.mapValues(
                        _.keyBy(analysisGroups, group => group.name),
                        () => [] as PatientSurvival[] // initialize empty arrays
                    );

                    for (const s of patientSurvivals[prefix]) {
                        // collect patient survivals by which groups the patient is in
                        const groupUids =
                            patientToAnalysisGroups[s.uniquePatientKey] || [];
                        for (const uid of groupUids) {
                            patientSurvivalsPerGroup[
                                uidToAnalysisGroup[uid].name
                            ].push(s);
                        }
                    }
                    return {
                        prefix,
                        displayText,
                        numPatients: calculateNumberOfPatients(
                            patientSurvivals[prefix],
                            patientToAnalysisGroups
                        ),
                        numPatientsPerGroup: _.mapValues(
                            patientSurvivalsPerGroup,
                            survivals => survivals.length
                        ),
                        medianPerGroup: _.mapValues(
                            patientSurvivalsPerGroup,
                            survivals => {
                                const sorted = _.sortBy(
                                    survivals,
                                    s => s.months
                                );
                                return getMedian(
                                    sorted,
                                    getSurvivalSummaries(sorted)
                                );
                            }
                        ),
                        pValue: pValues[prefix],
                        qValue: qValues[prefix],
                    };
                }
            );

            return Promise.resolve(survivalPrefixes);
        },
    });

    readonly survivalPrefixTableDataStore = remoteData({
        await: () => [this.survivalPrefixes],
        invoke: () => {
            return Promise.resolve(
                new SurvivalPrefixTableStore(
                    () => this.survivalPrefixes.result!,
                    () => this.selectedSurvivalPlotPrefix
                )
            );
        },
    });

    readonly survivalPrefixTable = MakeMobxView({
        await: () => [
            this.survivalTitleText,
            this.analysisGroupsComputations,
            this.survivalPrefixes,
            this.survivalPrefixTableDataStore,
        ],
        render: () => {
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;
            const survivalTitleText = this.survivalTitleText.result!;

            if (Object.keys(survivalTitleText).length > 1) {
                // only show table if there's more than one prefix option
                return (
                    <SurvivalPrefixTable
                        groupNames={analysisGroups.map(g => g.name)}
                        survivalPrefixes={this.survivalPrefixes.result!}
                        getSelectedPrefix={() =>
                            this.selectedSurvivalPlotPrefix
                        }
                        setSelectedPrefix={this.setSurvivalPlotPrefix}
                        dataStore={this.survivalPrefixTableDataStore.result!}
                    />
                );
            } else {
                return null;
            }
        },
    });

    readonly survivalTitleText = remoteData({
        await: () => [
            this.props.store.survivalClinicalAttributesPrefix,
            this.props.store.survivalDescriptions,
        ],
        invoke: () =>
            Promise.resolve(
                this.props.store.survivalClinicalAttributesPrefix.result!.reduce(
                    (map, prefix) => {
                        // get survival plot titles
                        // use first display name as title
                        map[prefix] = generateSurvivalPlotTitleFromDisplayName(
                            this.props.store.survivalDescriptions.result![
                                prefix
                            ][0].displayName
                        );
                        return map;
                    },
                    {} as { [prefix: string]: string }
                )
            ),
    });

    readonly survivalYLabel = remoteData({
        await: () => [
            this.props.store.survivalClinicalAttributesPrefix,
            this.props.store.survivalDescriptions,
        ],
        invoke: () =>
            Promise.resolve(
                this.props.store.survivalClinicalAttributesPrefix.result!.reduce(
                    (map, prefix) => {
                        // get survival plot titles
                        // use first display name as title
                        map[
                            prefix
                        ] = generateSurvivalPlotYAxisLabelFromDisplayName(
                            this.props.store.survivalDescriptions.result![
                                prefix
                            ][0].displayName
                        );
                        return map;
                    },
                    {} as { [prefix: string]: string }
                )
            ),
    });

    readonly survivalUI = MakeMobxView({
        await: () => [
            this.props.store.survivalDescriptions,
            this.props.store.survivalXAxisLabelGroupByPrefix,
            this.props.store.survivalClinicalAttributesPrefix,
            this.props.store.patientSurvivals,
            this.props.store.patientSurvivalsWithoutLeftTruncation,
            this.props.store.activeStudiesClinicalAttributes,
            this.analysisGroupsComputations,
            this.props.store.overlapComputations,
            this.props.store.uidToGroup,
            this.survivalTitleText,
            this.survivalYLabel,
            this.sortedGroupedSurvivals,
            this.pValuesByPrefix,
            this.props.store.isLeftTruncationAvailable,
            this.survivalPrefixTableDataStore,
            this.survivalPrefixTable,
        ],
        render: () => {
            let content: any = null;
            let plotHeader: any = null;
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const attributeDescriptions: { [prefix: string]: string } = {};
            const survivalTitleText = this.survivalTitleText.result!;
            const survivalYLabel = this.survivalYLabel.result!;
            this.props.store.survivalClinicalAttributesPrefix.result!.forEach(
                prefix => {
                    // get attribute description
                    // if only have one description, use it as plot title description
                    // if have more than one description, don't show description in title
                    attributeDescriptions[prefix] =
                        this.props.store.survivalDescriptions.result![prefix]
                            .length === 1
                            ? this.props.store.survivalDescriptions.result![
                                  prefix
                              ][0].description
                            : '';
                }
            );

            // do not set a default plot if there is a table component and all its data filtered out by default
            const doNotSetDefaultPlot =
                this.survivalPrefixTable.component &&
                _.isEmpty(
                    this.survivalPrefixTableDataStore.result?.getSortedFilteredData()
                );

            // set default plot if applicable
            if (
                !doNotSetDefaultPlot &&
                this.selectedSurvivalPlotPrefix === undefined
            ) {
                // if the table exists pick the first one from the table's store for consistency
                if (this.survivalPrefixTable.component) {
                    this.setSurvivalPlotPrefix(
                        this.survivalPrefixTableDataStore.result!.getSortedFilteredData()[0]
                            .prefix
                    );
                }
                // if there is no table, pick the first one from the default store
                else {
                    this.setSurvivalPlotPrefix(
                        _.keys(this.props.store.patientSurvivals.result!)[0]
                    );
                }
            }

            if (this.selectedSurvivalPlotPrefix) {
                const value = this.props.store.patientSurvivals.result![
                    this.selectedSurvivalPlotPrefix
                ];
                const key = this.selectedSurvivalPlotPrefix;
                if (value.length > 0) {
                    if (
                        this.props.store.survivalDescriptions &&
                        this.props.store.survivalDescriptions.result![key]
                            .length > 1
                    ) {
                        let messageBeforeTooltip = this
                            .multipleDescriptionWarningMessageWithoutTooltip;
                        const uniqDescriptions = _.uniq(
                            _.map(
                                this.props.store.survivalDescriptions.result![
                                    key
                                ],
                                d => d.description
                            )
                        );
                        if (uniqDescriptions.length > 1) {
                            messageBeforeTooltip = `${this.differentDescriptionExistMessage} ${messageBeforeTooltip}`;
                        }

                        plotHeader = (
                            <div className={'tabMessageContainer'}>
                                <div
                                    className={'alert alert-warning'}
                                    role="alert"
                                >
                                    {messageBeforeTooltip}
                                    <DefaultTooltip
                                        placement="bottom"
                                        overlay={
                                            <SurvivalDescriptionTable
                                                survivalDescriptionData={
                                                    this.props.store
                                                        .survivalDescriptions
                                                        .result![key]
                                                }
                                            />
                                        }
                                    >
                                        <a href="javascript:void(0)">
                                            {
                                                this
                                                    .multipleDescriptionWarningMessageWithTooltip
                                            }
                                        </a>
                                    </DefaultTooltip>
                                </div>
                            </div>
                        );
                    }
                    // Currently, left truncation is only appliable for Overall Survival data
                    const showLeftTruncationCheckbox =
                        key === 'OS'
                            ? this.props.store.isLeftTruncationAvailable.result
                            : false;
                    content = (
                        <div style={{ marginBottom: 40 }}>
                            <h4 className="forceHeaderStyle h4">
                                {survivalTitleText[key]}
                            </h4>
                            <p>{attributeDescriptions[key]}</p>
                            {showLeftTruncationCheckbox && (
                                <LeftTruncationCheckbox
                                    className={
                                        survivalPlotStyle.noPaddingLeftTruncationCheckbox
                                    }
                                    onToggleSurvivalPlotLeftTruncation={
                                        this.props.store
                                            .toggleLeftTruncationSelection
                                    }
                                    isLeftTruncationChecked={
                                        this.props.store.adjustForLeftTruncation
                                    }
                                    patientSurvivalsWithoutLeftTruncation={
                                        this.props.store
                                            .patientSurvivalsWithoutLeftTruncation
                                            .result![key]
                                    }
                                    patientToAnalysisGroups={
                                        patientToAnalysisGroups
                                    }
                                    sortedGroupedSurvivals={
                                        this.sortedGroupedSurvivals.result![
                                            this.selectedSurvivalPlotPrefix
                                        ]
                                    }
                                />
                            )}
                            <div
                                data-test={'survivalTabView'}
                                className="borderedChart"
                                style={{ width: 'auto' }}
                            >
                                <SurvivalChart
                                    key={key}
                                    sortedGroupedSurvivals={
                                        this.sortedGroupedSurvivals.result![
                                            this.selectedSurvivalPlotPrefix
                                        ]
                                    }
                                    analysisGroups={analysisGroups}
                                    patientToAnalysisGroups={
                                        patientToAnalysisGroups
                                    }
                                    title={survivalTitleText[key]}
                                    xAxisLabel={
                                        this.props.store
                                            .survivalXAxisLabelGroupByPrefix
                                            .result![key]
                                    }
                                    yAxisLabel={survivalYLabel[key]}
                                    totalCasesHeader="Number of Cases, Total"
                                    statusCasesHeader="Number of Events"
                                    medianMonthsHeader={`Median Months ${survivalTitleText[key]} (95% CI)`}
                                    yLabelTooltip={
                                        SURVIVAL_PLOT_Y_LABEL_TOOLTIP
                                    }
                                    xLabelWithEventTooltip={
                                        SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP
                                    }
                                    xLabelWithoutEventTooltip={
                                        SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP
                                    }
                                    fileName={survivalTitleText[key].replace(
                                        ' ',
                                        '_'
                                    )}
                                    showCurveInTooltip={true}
                                    legendLabelComponent={
                                        this.props.store.overlapStrategy ===
                                        OverlapStrategy.INCLUDE ? (
                                            <SurvivalTabGroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        ) : (
                                            <GroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        )
                                    }
                                    styleOpts={{
                                        tooltipYOffset: -28,
                                    }}
                                    pValue={
                                        this.pValuesByPrefix.result![
                                            this.selectedSurvivalPlotPrefix
                                        ]
                                    }
                                    compactMode={false}
                                />
                            </div>
                        </div>
                    );
                } else {
                    content = (
                        <div className={'alert alert-info'}>
                            {survivalTitleText[key]} not available
                        </div>
                    );
                }
            }
            // if there is actually table data, but filtered out because of the default threshold value,
            // then display a warning message that the filter can be adjusted to see available plot types.
            else if (
                this.survivalPrefixTable.component &&
                !_.isEmpty(this.props.store.patientSurvivals.result) &&
                _.isEmpty(
                    this.survivalPrefixTableDataStore.result?.getSortedFilteredData()
                )
            ) {
                content = (
                    <div className={'tabMessageContainer'}>
                        <div className={'alert alert-warning'} role="alert">
                            The current{' '}
                            <strong>Min. # Patients per Group</strong> is{' '}
                            <strong>
                                {
                                    this.survivalPrefixTableDataStore.result
                                        ?.patientMinThreshold
                                }
                            </strong>
                            . Adjust the filter to see comparisons for groups
                            with fewer patients.
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    <div
                        className={
                            survivalPlotStyle['survivalPlotHeaderContainer']
                        }
                    >
                        <div
                            className={survivalPlotStyle['survivalPlotHeader']}
                        >
                            <ul className={'nav nav-pills'}>{plotHeader}</ul>
                        </div>
                    </div>
                    {content}
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
