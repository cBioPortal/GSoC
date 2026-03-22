import * as React from 'react';
import _ from 'lodash';
import MutualExclusivityTable from './MutualExclusivityTable';
import { observer } from 'mobx-react';
import { Checkbox } from 'react-bootstrap';
import styles from './styles.module.scss';
import { computed, observable, makeObservable } from 'mobx';
import { MutualExclusivity } from '../../../shared/model/MutualExclusivity';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import Loader from '../../../shared/components/loadingIndicator/LoadingIndicator';
import {
    getTrackPairsCountText,
    getData,
    getFilteredData,
    getSampleAlteredFilteredMap,
} from './MutualExclusivityUtil';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { SampleAlteredMap } from '../ResultsViewPageStoreUtils';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';

export interface IMutualExclusivityTabProps {
    store?: ResultsViewPageStore;
    isSampleAlteredMap: MobxPromise<SampleAlteredMap>;
}

@observer
export default class MutualExclusivityTab extends React.Component<
    IMutualExclusivityTabProps,
    {}
> {
    @observable mutualExclusivityFilter: boolean = true;
    @observable coOccurenceFilter: boolean = true;
    @observable significantPairsFilter: boolean = false;

    constructor(props: IMutualExclusivityTabProps) {
        super(props);
        makeObservable(this);
        this.mutualExclusivityFilterChange = this.mutualExclusivityFilterChange.bind(
            this
        );
        this.coOccurenceFilterChange = this.coOccurenceFilterChange.bind(this);
        this.significantPairsFilterChange = this.significantPairsFilterChange.bind(
            this
        );
    }

    @computed get data(): MutualExclusivity[] {
        return getData(this.isSampleAlteredFilteredMap);
    }

    @computed get filteredData(): MutualExclusivity[] {
        return getFilteredData(
            this.data,
            this.mutualExclusivityFilter,
            this.coOccurenceFilter,
            this.significantPairsFilter
        );
    }

    @computed get isSampleAlteredFilteredMap(): SampleAlteredMap {
        return getSampleAlteredFilteredMap(
            this.props.isSampleAlteredMap.result!
        );
    }

    @computed get filteredTrackOqls(): string[] {
        return _.difference(
            Object.keys(this.props.isSampleAlteredMap.result!),
            Object.keys(this.isSampleAlteredFilteredMap)
        );
    }

    @computed get filteredTrackOqlsMessage(): string {
        if (this.filteredTrackOqls.length == 1) {
            return `${this.filteredTrackOqls[0]} is not profiled in any queried samples and therefore is excluded from this analysis.`;
        } else if (this.filteredTrackOqls.length > 1) {
            return `${this.filteredTrackOqls
                .slice(0, -1)
                .join(', ')} and ${this.filteredTrackOqls.slice(
                -1
            )} are not profiled in any queried samples and therefore are excluded from this analysis.`;
        } else {
            return '';
        }
    }

    private mutualExclusivityFilterChange() {
        this.mutualExclusivityFilter = !this.mutualExclusivityFilter;
    }

    private coOccurenceFilterChange() {
        this.coOccurenceFilter = !this.coOccurenceFilter;
    }

    private significantPairsFilterChange() {
        this.significantPairsFilter = !this.significantPairsFilter;
    }

    @computed private get notEnoughDataError() {
        if (_.size(this.props.isSampleAlteredMap.result) < 2) {
            return 'Mutual exclusivity analysis can only be performed when data from at least two genes is provided.';
        } else if (_.size(this.isSampleAlteredFilteredMap) < 2) {
            return 'Mutual exclusivity analysis can only be performed when at least two of the queried genes have been profiled in the queried samples.';
        } else {
            return null;
        }
    }

    public render() {
        if (this.props.isSampleAlteredMap.isPending) {
            return <Loader isLoading={true} />;
        } else if (this.props.isSampleAlteredMap.isComplete) {
            if (!this.notEnoughDataError) {
                return (
                    <div data-test="mutualExclusivityTabDiv">
                        {this.props.store && (
                            <div className={'tabMessageContainer'}>
                                <OqlStatusBanner
                                    className="mutex-oql-status-banner"
                                    queryContainsOql={
                                        this.props.store.queryContainsOql
                                    }
                                    tabReflectsOql={true}
                                />
                                {this.filteredTrackOqls.length > 0 && (
                                    <div
                                        className="alert alert-warning"
                                        role="alert"
                                    >
                                        {this.filteredTrackOqlsMessage}
                                    </div>
                                )}
                                <AlterationFilterWarning
                                    driverAnnotationSettings={
                                        this.props.store
                                            .driverAnnotationSettings
                                    }
                                    includeGermlineMutations={
                                        this.props.store
                                            .includeGermlineMutations
                                    }
                                    mutationsReportByGene={
                                        this.props.store.mutationsReportByGene
                                    }
                                    oqlFilteredMutationsReport={
                                        this.props.store
                                            .oqlFilteredMutationsReport
                                    }
                                    oqlFilteredMolecularDataReport={
                                        this.props.store
                                            .oqlFilteredMolecularDataReport
                                    }
                                    oqlFilteredStructuralVariantsReport={
                                        this.props.store
                                            .oqlFilteredStructuralVariantsReport
                                    }
                                />
                                <CaseFilterWarning
                                    samples={this.props.store.samples}
                                    filteredSamples={
                                        this.props.store.filteredSamples
                                    }
                                    patients={this.props.store.patients}
                                    filteredPatients={
                                        this.props.store.filteredPatients
                                    }
                                    hideUnprofiledSamples={
                                        this.props.store.hideUnprofiledSamples
                                    }
                                />
                            </div>
                        )}

                        {getTrackPairsCountText(
                            this.data,
                            _.size(this.isSampleAlteredFilteredMap)
                        )}

                        <div className={styles.Checkboxes}>
                            <Checkbox
                                checked={this.mutualExclusivityFilter}
                                onChange={this.mutualExclusivityFilterChange}
                            >
                                Mutual exclusivity
                            </Checkbox>
                            <Checkbox
                                checked={this.coOccurenceFilter}
                                onChange={this.coOccurenceFilterChange}
                            >
                                Co-occurrence
                            </Checkbox>
                            <Checkbox
                                checked={this.significantPairsFilter}
                                onChange={this.significantPairsFilterChange}
                            >
                                Significant only
                            </Checkbox>
                        </div>
                        <MutualExclusivityTable data={this.filteredData} />
                    </div>
                );
            } else {
                return (
                    <div className={'tabMessageContainer'}>
                        <div className={'alert alert-info'}>
                            {this.notEnoughDataError}
                        </div>
                        {this.filteredTrackOqls.length > 0 && (
                            <div className="alert alert-warning" role="alert">
                                {this.filteredTrackOqlsMessage}
                            </div>
                        )}
                        {this.props.store && [
                            <AlterationFilterWarning
                                driverAnnotationSettings={
                                    this.props.store.driverAnnotationSettings
                                }
                                includeGermlineMutations={
                                    this.props.store.includeGermlineMutations
                                }
                                mutationsReportByGene={
                                    this.props.store.mutationsReportByGene
                                }
                                oqlFilteredMutationsReport={
                                    this.props.store.oqlFilteredMutationsReport
                                }
                                oqlFilteredMolecularDataReport={
                                    this.props.store
                                        .oqlFilteredMolecularDataReport
                                }
                                oqlFilteredStructuralVariantsReport={
                                    this.props.store
                                        .oqlFilteredStructuralVariantsReport
                                }
                            />,
                            <CaseFilterWarning
                                samples={this.props.store.samples}
                                filteredSamples={
                                    this.props.store.filteredSamples
                                }
                                patients={this.props.store.patients}
                                filteredPatients={
                                    this.props.store.filteredPatients
                                }
                                hideUnprofiledSamples={
                                    this.props.store.hideUnprofiledSamples
                                }
                            />,
                        ]}
                    </div>
                );
            }
        } else {
            return null;
        }
    }
}
