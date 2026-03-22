import * as React from 'react';
import { observer } from 'mobx-react';
import { MakeMobxView } from '../MobxView';
import { MobxPromise, pluralize } from 'cbioportal-frontend-commons';
import { Patient, Sample } from 'cbioportal-ts-api-client';

export interface ICaseFilterWarningProps {
    samples: MobxPromise<Sample[]>;
    filteredSamples: MobxPromise<Sample[]>;
    patients: MobxPromise<Patient[]>;
    filteredPatients: MobxPromise<Patient[]>;
    hideUnprofiledSamples: false | 'any' | 'totally';
    isPatientMode?: boolean;
    isUnaffected?: boolean;
}

@observer
export default class CaseFilterWarning extends React.Component<
    ICaseFilterWarningProps,
    {}
> {
    readonly sampleWarning = MakeMobxView({
        await: () => [
            this.props.samples,
            this.props.filteredSamples,
            this.props.patients,
            this.props.filteredPatients,
        ],
        render: () => {
            let nFiltered: number;
            if (this.props.isPatientMode) {
                const nPatients = this.props.patients.result!.length;
                const nFilteredPatients = this.props.filteredPatients.result!
                    .length;
                nFiltered = nPatients - nFilteredPatients;
            } else {
                const nSamples = this.props.samples.result!.length;
                const nFilteredSamples = this.props.filteredSamples.result!
                    .length;
                nFiltered = nSamples - nFilteredSamples;
            }
            if (nFiltered === 0) {
                return null;
            }

            const is = nFiltered === 1 ? 'is' : 'are';
            const it = nFiltered === 1 ? 'it' : 'they';

            let allOrAny;
            switch (this.props.hideUnprofiledSamples) {
                // The language is confusing here... if `hideUnprofiledSamples` is `any`, that means that we
                //  filter out samples if they are unprofiled in "any" genes or profiles. This corresponds to
                //  filtering out samples that are not profiled for "all" queried genes and profiles. If `hideUnprofiledSamples`
                //  is `totally`, that means we filter out samples if they are "totally" unprofiled - unprofiled for every gene
                //  and profile. This corresponds to filtering out samples that are not profiled in "any" queried genes.
                case 'totally':
                    allOrAny = 'any';
                    break;
                case 'any':
                default:
                    allOrAny = 'all';
                    break;
            }

            if (this.props.isUnaffected) {
                return (
                    <div className="alert alert-unaffected">
                        <i
                            className="fa fa-md fa-info-circle"
                            style={{
                                verticalAlign: 'middle !important',
                                marginRight: 6,
                                marginBottom: 1,
                            }}
                        />
                        {`${nFiltered} ${pluralize(
                            this.props.isPatientMode ? 'patient' : 'sample',
                            nFiltered
                        )}`}
                        {` that are not profiled for ${allOrAny} queried genes in ${allOrAny} queried profiles`}
                        {` ${is} included in analysis.`}
                    </div>
                );
            } else {
                return (
                    <div className="alert alert-info">
                        <img
                            src={require('../../../rootImages/funnel.svg')}
                            alt="Funnel SVG"
                            style={{
                                marginRight: 6,
                                width: 15,
                                marginTop: -2,
                            }}
                        />
                        {`${nFiltered} ${pluralize(
                            this.props.isPatientMode ? 'patient' : 'sample',
                            nFiltered
                        )}`}
                        {` ${is} excluded from analysis since ${it} ${is} not profiled`}
                        {` for ${allOrAny} queried genes in ${allOrAny} queried profiles.`}
                    </div>
                );
            }
        },
    });

    render() {
        return this.sampleWarning.component;
    }
}
