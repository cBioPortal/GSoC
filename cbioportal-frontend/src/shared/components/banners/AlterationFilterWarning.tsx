import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { MakeMobxView } from '../MobxView';
import classnames from 'classnames';
import { DriverAnnotationSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { FilteredAndAnnotatedMutationsReport } from 'shared/lib/comparison/AnalysisStoreUtils';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';

export interface IAlterationFilterWarningProps {
    driverAnnotationSettings: DriverAnnotationSettings;
    includeGermlineMutations: boolean;
    mutationsReportByGene: MobxPromise<{
        [hugeGeneSymbol: string]: FilteredAndAnnotatedMutationsReport<
            AnnotatedMutation
        >;
    }>;
    oqlFilteredMutationsReport: MobxPromise<{
        data: (AnnotatedMutation & ExtendedAlteration)[];
        vus: (AnnotatedMutation & ExtendedAlteration)[];
        germline: (AnnotatedMutation & ExtendedAlteration)[];
        vusAndGermline: (AnnotatedMutation & ExtendedAlteration)[];
    }>;
    oqlFilteredMolecularDataReport: MobxPromise<{
        data: (AnnotatedNumericGeneMolecularData & ExtendedAlteration)[];
        vus: (AnnotatedNumericGeneMolecularData & ExtendedAlteration)[];
    }>;
    oqlFilteredStructuralVariantsReport: MobxPromise<{
        data: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        vus: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        germline: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        vusAndGermline: (AnnotatedStructuralVariant & ExtendedAlteration)[];
    }>;
    isUnaffected?: boolean;
    mutationsTabModeSettings?: {
        // if set, then we show in "mutations tab mode" - different text, different source of exclude state, and toggleable exclude state
        excludeVUS: boolean;
        excludeGermline: boolean;
        toggleExcludeVUS: () => void;
        toggleExcludeGermline: () => void;
        hugoGeneSymbol: string;
    };
}

function getVusDescription(
    types: { mutation: boolean; cna: boolean; structuralVariant: boolean },
    plural: boolean
) {
    const descriptions = [];
    if (types.mutation) {
        descriptions.push(`mutation${plural ? 's' : ''}`);
    }
    if (types.structuralVariant) {
        descriptions.push(`structural variant${plural ? 's' : ''}`);
    }
    if (types.cna) {
        descriptions.push(`copy number alteration${plural ? 's' : ''}`);
    }
    return `${descriptions.join(' and ')} of unknown significance`;
}

@observer
export default class AlterationFilterWarning extends React.Component<
    IAlterationFilterWarningProps,
    {}
> {
    constructor(props: IAlterationFilterWarningProps) {
        super(props);
        makeObservable(this);
    }
    @computed get excludeVUS() {
        if (this.props.mutationsTabModeSettings) {
            return this.props.mutationsTabModeSettings.excludeVUS;
        } else {
            return !this.props.driverAnnotationSettings.includeVUS;
        }
    }

    @computed get excludeGermline() {
        if (this.props.mutationsTabModeSettings) {
            return this.props.mutationsTabModeSettings.excludeGermline;
        } else {
            return !this.props.includeGermlineMutations;
        }
    }

    @computed get vusToggleable() {
        return (
            this.props.mutationsTabModeSettings &&
            !this.props.driverAnnotationSettings.includeVUS
        );
    }

    @computed get germlineToggleable() {
        return (
            this.props.mutationsTabModeSettings &&
            !this.props.includeGermlineMutations
        );
    }

    readonly vusWarning = MakeMobxView({
        await: () => {
            if (this.props.mutationsTabModeSettings) {
                return [this.props.mutationsReportByGene];
            } else {
                return [
                    this.props.oqlFilteredMutationsReport,
                    this.props.oqlFilteredMolecularDataReport,
                    this.props.oqlFilteredStructuralVariantsReport,
                ];
            }
        },
        render: () => {
            let vusCount = 0;
            const vusTypes = {
                mutation: false,
                cna: false,
                structuralVariant: false,
            };
            if (this.props.mutationsTabModeSettings) {
                const report = this.props.mutationsReportByGene.result![
                    this.props.mutationsTabModeSettings.hugoGeneSymbol
                ];
                vusCount = report.vus.length + report.vusAndGermline.length;
                if (vusCount > 0) {
                    vusTypes.mutation = true;
                }
            } else {
                const mutationReport = this.props.oqlFilteredMutationsReport
                    .result!;
                const mutationVusCount =
                    mutationReport.vus.length +
                    mutationReport.vusAndGermline.length;
                const cnaVusCount = this.props.oqlFilteredMolecularDataReport
                    .result!.vus.length;
                const structuralVariantVusCount = this.props
                    .oqlFilteredStructuralVariantsReport.result!.vus.length;
                vusCount =
                    mutationVusCount + cnaVusCount + structuralVariantVusCount;
                if (mutationVusCount > 0) {
                    vusTypes.mutation = true;
                }
                if (cnaVusCount > 0) {
                    vusTypes.cna = true;
                }
                if (structuralVariantVusCount > 0) {
                    vusTypes.structuralVariant = true;
                }
            }

            if (vusCount > 0) {
                const is = vusCount === 1 ? 'is' : 'are';
                const does = vusCount === 1 ? 'does' : 'do';
                const anAlteration =
                    vusCount === 1 ? 'an alteration' : 'alterations';
                if (this.props.isUnaffected && this.excludeVUS) {
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
                            {`${vusCount} ${getVusDescription(
                                vusTypes,
                                vusCount !== 1
                            )} ${is} included in analysis.`}
                        </div>
                    );
                } else if (this.excludeVUS || this.vusToggleable) {
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
                            {this.excludeVUS
                                ? `${vusCount} ${getVusDescription(
                                      vusTypes,
                                      vusCount !== 1
                                  )} ${
                                      this.props.mutationsTabModeSettings
                                          ? `${is} hidden below.`
                                          : `${does} not count as ${anAlteration} for this analysis.`
                                  }`
                                : `${vusCount} ${getVusDescription(
                                      vusTypes,
                                      vusCount !== 1
                                  )} ${is} ${
                                      this.props.mutationsTabModeSettings
                                          ? 'shown below.'
                                          : 'included in analysis.'
                                  }`}
                            {this.vusToggleable && (
                                <button
                                    onClick={
                                        this.props.mutationsTabModeSettings!
                                            .toggleExcludeVUS
                                    }
                                    className="btn btn-default btn-xs"
                                    style={{ marginLeft: 5 }}
                                >
                                    {this.excludeVUS
                                        ? this.props.mutationsTabModeSettings
                                            ? 'Show'
                                            : 'Include'
                                        : this.props.mutationsTabModeSettings
                                        ? 'Hide'
                                        : 'Exclude'}
                                </button>
                            )}
                        </div>
                    );
                }
            } else {
                return null;
            }
        },
    });

    readonly germlineWarning = MakeMobxView({
        await: () => {
            if (this.props.mutationsTabModeSettings) {
                return [this.props.mutationsReportByGene];
            } else {
                return [this.props.oqlFilteredMutationsReport];
            }
        },
        render: () => {
            let report;
            if (this.props.mutationsTabModeSettings) {
                report = this.props.mutationsReportByGene.result![
                    this.props.mutationsTabModeSettings.hugoGeneSymbol
                ];
            } else {
                report = this.props.oqlFilteredMutationsReport.result!;
            }

            const germlineCount =
                report.germline.length + report.vusAndGermline.length;

            if (germlineCount > 0) {
                const is = germlineCount === 1 ? 'is' : 'are';
                const does = germlineCount === 1 ? 'does' : 'do';
                const anAlteration =
                    germlineCount === 1 ? 'an alteration' : 'alterations';
                if (this.props.isUnaffected && this.excludeGermline) {
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
                            {`${germlineCount} germline mutations ${is} included in analysis.`}
                        </div>
                    );
                } else if (this.excludeGermline || this.germlineToggleable) {
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
                            {this.excludeGermline
                                ? `${germlineCount} germline mutations ${
                                      this.props.mutationsTabModeSettings
                                          ? `${is} hidden below.`
                                          : `${does} not count as ${anAlteration} for this analysis.`
                                  }`
                                : `${germlineCount} germline mutations ${is} ${
                                      this.props.mutationsTabModeSettings
                                          ? 'shown below.'
                                          : 'included in analysis.'
                                  }`}
                            {this.germlineToggleable && (
                                <button
                                    onClick={
                                        this.props.mutationsTabModeSettings!
                                            .toggleExcludeGermline
                                    }
                                    className="btn btn-default btn-xs"
                                    style={{ marginLeft: 5 }}
                                >
                                    {this.excludeGermline
                                        ? this.props.mutationsTabModeSettings
                                            ? 'Show'
                                            : 'Include'
                                        : this.props.mutationsTabModeSettings
                                        ? 'Hide'
                                        : 'Exclude'}
                                </button>
                            )}
                        </div>
                    );
                }
            } else {
                return null;
            }
        },
    });

    render() {
        return (
            <>
                {this.vusWarning.component}
                {this.germlineWarning.component}
            </>
        );
    }
}
