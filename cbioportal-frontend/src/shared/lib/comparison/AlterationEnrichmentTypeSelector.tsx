import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable, toJS } from 'mobx';
import autobind from 'autobind-decorator';
import 'rc-tooltip/assets/bootstrap_white.css';
import _ from 'lodash';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import {
    amplificationGroup,
    cnaGroup,
    CopyNumberEnrichmentEventType,
    deletionGroup,
    doEnrichmentEventTypeMapsMatch,
    EnrichmentEventType,
    frameshiftDeletionGroup,
    frameshiftGroup,
    frameshiftInsertionGroup,
    inframeDeletionGroup,
    inframeGroup,
    inframeInsertionGroup,
    missenseGroup,
    MutationEnrichmentEventType,
    mutationGroup,
    nonsenseGroup,
    nonstartGroup,
    nonstopGroup,
    otherGroup,
    spliceGroup,
    StructuralVariantEnrichmentEventType,
    truncationGroup,
} from 'shared/lib/comparison/ComparisonStoreUtils';

export interface IAlterationEnrichmentTypeSelectorProps {
    updateSelectedEnrichmentEventTypes: (t: EnrichmentEventType[]) => void;
    store: ComparisonStore;
    showMutations?: boolean;
    showStructuralVariants?: boolean;
    showCnas?: boolean;
    classNames?: string;
}

enum checkbox {
    mutations = 'mutations',
    missense = 'missense',
    inframe = 'inframe',
    inframedeletion = 'inframedeletion',
    inframeinsertion = 'inframeinsertion',
    truncating = 'truncating',
    nonsense = 'nonsense',
    frameshift = 'frameshift',
    frameshiftinsertion = 'frameshiftinsertion',
    frameshiftdeletion = 'frameshiftdeletion',
    nonstart = 'nonstart',
    nonstop = 'nonstop',
    splice = 'splice',
    other = 'other',
    structvar = 'structvar',
    cna = 'cna',
    amplification = 'amplification',
    deletion = 'deletion',
}

@observer
export default class AlterationEnrichmentTypeSelector extends React.Component<
    IAlterationEnrichmentTypeSelectorProps,
    {}
> {
    constructor(props: IAlterationEnrichmentTypeSelectorProps, context: any) {
        super(props, context);
        makeObservable(this);
    }

    private currentSelectedMutations: {
        [key in MutationEnrichmentEventType]?: boolean;
    };
    private currentSelectedCopyNumber: {
        [key in CopyNumberEnrichmentEventType]?: boolean;
    };

    @observable private isStructuralVariantSelected?: boolean;

    componentWillMount() {
        this.currentSelectedMutations = observable(
            toJS(this.props.store.selectedMutationEnrichmentEventTypes)
        );
        this.currentSelectedCopyNumber = observable(
            toJS(this.props.store.selectedCopyNumberEnrichmentEventTypes)
        );
        this.isStructuralVariantSelected = this.props.store.isStructuralVariantEnrichmentSelected;
    }

    @computed get isAnyMutationsSelected() {
        return this.isAnySelectedMut(mutationGroup);
    }

    @computed get isAnyMissenseSelected() {
        return this.isAnySelectedMut(missenseGroup);
    }

    @computed get isAnyInframeSelected() {
        return this.isAnySelectedMut(inframeGroup);
    }

    @computed get isAnyInframeDeletionsSelected() {
        return this.isAnySelectedMut(inframeDeletionGroup);
    }

    @computed get isAnyInframeInsertionsSelected() {
        return this.isAnySelectedMut(inframeInsertionGroup);
    }

    @computed get isAnyTruncationsSelected() {
        return this.isAnySelectedMut(truncationGroup);
    }

    @computed get isAnyNonsenseSelected() {
        return this.isAnySelectedMut(nonsenseGroup);
    }

    @computed get isAnyFrameshiftSelected() {
        return this.isAnySelectedMut(frameshiftGroup);
    }

    @computed get isAnyFrameshiftInsertionsSelected() {
        return this.isAnySelectedMut(frameshiftInsertionGroup);
    }

    @computed get isAnyFrameshiftDeletionsSelected() {
        return this.isAnySelectedMut(frameshiftDeletionGroup);
    }

    @computed get isAnyNonStartSelected() {
        return this.isAnySelectedMut(nonstartGroup);
    }

    @computed get isAnyNonStopSelected() {
        return this.isAnySelectedMut(nonstopGroup);
    }

    @computed get isAnySpliceSelected() {
        return this.isAnySelectedMut(spliceGroup);
    }

    @computed get isAnyOtherSelected() {
        return this.isAnySelectedMut(otherGroup);
    }

    @computed get isAnyCopyNumberSelected() {
        return this.isAnySelectedCna(cnaGroup);
    }

    @computed get isAnyAmplificationsSelected() {
        return this.isAnySelectedCna(amplificationGroup);
    }

    @computed get isAnyDeletionsSelected() {
        return this.isAnySelectedCna(deletionGroup);
    }

    private isAnySelectedMut(group: MutationEnrichmentEventType[]): boolean {
        return _.some(group, type => this.currentSelectedMutations[type]);
    }

    private isAnySelectedCna(group: CopyNumberEnrichmentEventType[]): boolean {
        return _.some(group, type => this.currentSelectedCopyNumber[type]);
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        console.log((event.target as HTMLInputElement).value);
        switch ((event.target as HTMLInputElement).value) {
            case checkbox.mutations:
                this.toggleMutGroup(
                    mutationGroup,
                    !this.isAnyMutationsSelected
                );
                break;
            case checkbox.missense:
                this.toggleMutGroup(missenseGroup, !this.isAnyMissenseSelected);
                break;
            case checkbox.inframe:
                this.toggleMutGroup(inframeGroup, !this.isAnyInframeSelected);
                break;
            case checkbox.inframedeletion:
                this.toggleMutGroup(
                    inframeDeletionGroup,
                    !this.isAnyInframeDeletionsSelected
                );
                break;
            case checkbox.inframeinsertion:
                this.toggleMutGroup(
                    inframeInsertionGroup,
                    !this.isAnyInframeInsertionsSelected
                );
                break;
            case checkbox.truncating:
                this.toggleMutGroup(
                    truncationGroup,
                    !this.isAnyTruncationsSelected
                );
                break;
            case checkbox.nonsense:
                this.toggleMutGroup(nonsenseGroup, !this.isAnyNonsenseSelected);
                break;
            case checkbox.frameshift:
                this.toggleMutGroup(
                    frameshiftGroup,
                    !this.isAnyFrameshiftSelected
                );
                break;
            case checkbox.frameshiftinsertion:
                this.toggleMutGroup(
                    frameshiftInsertionGroup,
                    !this.isAnyFrameshiftInsertionsSelected
                );
                break;
            case checkbox.frameshiftdeletion:
                this.toggleMutGroup(
                    frameshiftDeletionGroup,
                    !this.isAnyFrameshiftDeletionsSelected
                );
                break;
            case checkbox.nonstart:
                this.toggleMutGroup(nonstartGroup, !this.isAnyNonStartSelected);
                break;
            case checkbox.nonstop:
                this.toggleMutGroup(nonstopGroup, !this.isAnyNonStopSelected);
                break;
            case checkbox.splice:
                this.toggleMutGroup(spliceGroup, !this.isAnySpliceSelected);
                break;
            case checkbox.other:
                this.toggleMutGroup(otherGroup, !this.isAnyOtherSelected);
                break;
            case checkbox.structvar:
                this.isStructuralVariantSelected = !this
                    .isStructuralVariantSelected;
                break;
            case checkbox.cna:
                this.toggleCnaGroup(cnaGroup, !this.isAnyCopyNumberSelected);
                break;
            case checkbox.amplification:
                this.toggleCnaGroup(
                    amplificationGroup,
                    !this.isAnyAmplificationsSelected
                );
                break;
            case checkbox.deletion:
                this.toggleCnaGroup(
                    deletionGroup,
                    !this.isAnyDeletionsSelected
                );
                break;
        }
    }

    @action
    private toggleCnaGroup(
        group: CopyNumberEnrichmentEventType[],
        value: boolean
    ) {
        _.forEach(group, type => {
            this.currentSelectedCopyNumber[type] = value;
        });
    }

    @action
    private toggleMutGroup(
        group: MutationEnrichmentEventType[],
        value: boolean
    ) {
        _.forEach(group, type => {
            this.currentSelectedMutations[type] = value;
        });
    }

    @autobind
    private updateSelectedAlterations(
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) {
        const selectedMutations = _(this.currentSelectedMutations)
            .pickBy()
            .keys()
            .value();
        const selectedCopyNumber = _(this.currentSelectedCopyNumber)
            .pickBy()
            .keys()
            .value();
        const selectedTypes: EnrichmentEventType[] = selectedMutations.concat(
            selectedCopyNumber
        ) as EnrichmentEventType[];

        if (this.isStructuralVariantSelected) {
            selectedTypes.push(
                StructuralVariantEnrichmentEventType.structural_variant
            );
        }
        this.props.updateSelectedEnrichmentEventTypes(selectedTypes);
    }

    @computed get hasSelectionChanged() {
        return (
            !doEnrichmentEventTypeMapsMatch(
                toJS(this.currentSelectedMutations),
                toJS(this.props.store.selectedMutationEnrichmentEventTypes)
            ) ||
            !doEnrichmentEventTypeMapsMatch(
                toJS(this.currentSelectedCopyNumber),
                toJS(this.props.store.selectedCopyNumberEnrichmentEventTypes)
            ) ||
            !_.isEqual(
                this.isStructuralVariantSelected,
                this.props.store.isStructuralVariantEnrichmentSelected
            )
        );
    }

    render() {
        return (
            <div
                className={this.props.classNames}
                data-test={'AlterationTypeSelectorMenu'}
            >
                <h5>Alteration Types</h5>

                {this.props.showMutations && (
                    <div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="Mutations"
                                    type="checkbox"
                                    value={checkbox.mutations}
                                    checked={this.isAnyMutationsSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                <b>Mutations</b>
                            </label>
                        </div>

                        {/*-+=+ MISSENSE +-+-*/}
                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="Missense"
                                    type="checkbox"
                                    value={checkbox.missense}
                                    checked={this.isAnyMissenseSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Missense
                            </label>
                        </div>

                        {/*-+=+ INFRAME +-+-*/}
                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="InFrame"
                                    type="checkbox"
                                    value={checkbox.inframe}
                                    checked={this.isAnyInframeSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Inframe
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="InframeInsertion"
                                    type="checkbox"
                                    value={checkbox.inframeinsertion}
                                    checked={
                                        this.isAnyInframeInsertionsSelected
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Inframe Insertion
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="InframeDeletion"
                                    type="checkbox"
                                    value={checkbox.inframedeletion}
                                    checked={this.isAnyInframeDeletionsSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Inframe Deletion
                            </label>
                        </div>

                        {/*-+=+ TRUNCATING +-+-*/}
                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="Truncating"
                                    type="checkbox"
                                    value={checkbox.truncating}
                                    checked={this.isAnyTruncationsSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Truncating
                            </label>
                        </div>

                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="Nonsense"
                                    type="checkbox"
                                    value={checkbox.nonsense}
                                    checked={this.isAnyNonsenseSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Nonsense
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="Frameshift"
                                    type="checkbox"
                                    value={checkbox.frameshift}
                                    checked={this.isAnyFrameshiftSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Frameshift
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '60px' }}
                        >
                            <label>
                                <input
                                    data-test="FrameshiftInsertion"
                                    type="checkbox"
                                    value={checkbox.frameshiftinsertion}
                                    checked={
                                        this.isAnyFrameshiftInsertionsSelected
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Frameshift Insertion
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '60px' }}
                        >
                            <label>
                                <input
                                    data-test="FrameshiftDeletion"
                                    type="checkbox"
                                    value={checkbox.frameshiftdeletion}
                                    checked={
                                        this.isAnyFrameshiftDeletionsSelected
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Frameshift Deletion
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="Nonstart"
                                    type="checkbox"
                                    value={checkbox.nonstart}
                                    checked={this.isAnyNonStartSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Nonstart
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="Nonstop"
                                    type="checkbox"
                                    value={checkbox.nonstop}
                                    checked={this.isAnyNonStopSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Nonstop
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '40px' }}
                        >
                            <label>
                                <input
                                    data-test="Splice"
                                    type="checkbox"
                                    value={checkbox.splice}
                                    checked={this.isAnySpliceSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Splice
                            </label>
                        </div>

                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="Other"
                                    type="checkbox"
                                    value={checkbox.other}
                                    checked={this.isAnyOtherSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Other
                            </label>
                        </div>
                    </div>
                )}
                {this.props.showStructuralVariants && (
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="StructuralVariants"
                                type="checkbox"
                                value={checkbox.structvar}
                                checked={this.isStructuralVariantSelected}
                                onClick={this.onInputClick}
                            />{' '}
                            <b>Structural Variants / Fusions</b>
                        </label>
                    </div>
                )}

                {this.props.showCnas && (
                    <div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="CheckCopynumberAlterations"
                                    type="checkbox"
                                    value={checkbox.cna}
                                    checked={this.isAnyCopyNumberSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                <b>Copy Number Alterations</b>
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="Amplification"
                                    type="checkbox"
                                    value={checkbox.amplification}
                                    checked={this.isAnyAmplificationsSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Amplification
                            </label>
                        </div>
                        <div
                            className="checkbox"
                            style={{ marginLeft: '20px' }}
                        >
                            <label>
                                <input
                                    data-test="DeepDeletion"
                                    type="checkbox"
                                    value={checkbox.deletion}
                                    checked={this.isAnyDeletionsSelected}
                                    onClick={this.onInputClick}
                                />{' '}
                                Deletion
                            </label>
                        </div>
                    </div>
                )}

                <div>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', pointerEvents: 'all' }}
                        data-test="buttonSelectAlterations"
                        type="button"
                        onClick={this.updateSelectedAlterations}
                        disabled={!this.hasSelectionChanged}
                    >
                        Select
                    </button>
                </div>
            </div>
        );
    }
}
