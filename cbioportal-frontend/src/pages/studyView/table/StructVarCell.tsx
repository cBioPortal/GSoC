import * as React from 'react';
import styles from './tables.module.scss';
import classnames from 'classnames';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import {
    FreqColumnTypeEnum,
    getGeneColumnCellOverlaySimple,
} from '../TableUtils';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Else, If, Then } from 'react-if';
import _ from 'lodash';
import { StructVarGenePair } from 'pages/studyView/StructVarUtils';
import MutSigAnnotation from 'shared/components/annotation/MutSig';
import GisticAnnotation from 'shared/components/annotation/Gistic';

export type IStructVarCellProps = {
    tableType: FreqColumnTypeEnum;
    uniqueRowId: string;
    selectedStructVars: StructVarGenePair[];
    label?: string;
    gene1SymbolOrOql: string;
    gene2SymbolOrOql: string;
    isCancerGene: boolean;
    oncokbAnnotated: boolean;
    isOncogene: boolean;
    isTumorSuppressorGene: boolean;
    hoveredStructVarRowId: string | undefined;
    onStructVarSelect?: (
        gene1HugoSymbol: string | undefined,
        gene2HugoSymbol: string | undefined
    ) => void;
    onGeneHovered?: (uniqueRowId: string, isHovered: boolean) => void;
    hideCheckbox?: boolean;
};

@observer
export class StructVarCell extends React.Component<IStructVarCellProps, {}> {
    constructor(props: IStructVarCellProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    onHover(isVisible: boolean) {
        if (this.props.onGeneHovered) {
            this.props.onGeneHovered(this.props.uniqueRowId, isVisible);
        }
    }

    @action.bound
    private onStructVarSelect() {
        if (!this.props.hideCheckbox && this.props.onStructVarSelect) {
            this.props.onStructVarSelect!(
                this.props.gene1SymbolOrOql,
                this.props.gene2SymbolOrOql
            );
        }
    }

    @computed
    get showCheckbox() {
        return (
            !this.props.hideCheckbox &&
            (this.isCheckBoxHovered || this.isCheckBoxChecked)
        );
    }

    @computed
    get isCheckBoxHovered() {
        return this.props.hoveredStructVarRowId === this.props.uniqueRowId;
    }

    @computed
    get isCheckBoxChecked() {
        return _.some(
            this.props.selectedStructVars,
            sv =>
                sv.gene1HugoSymbolOrOql === this.props.gene1SymbolOrOql &&
                sv.gene2HugoSymbolOrOql === this.props.gene2SymbolOrOql
        );
    }

    render() {
        return (
            <div className={styles.geneSymbol}>
                <div
                    data-test="structVarNameCell"
                    className={classnames(styles.displayFlex)}
                    onMouseEnter={() => this.onHover(true)}
                    onMouseLeave={() => this.onHover(false)}
                    onClick={this.onStructVarSelect}
                >
                    <If condition={this.props.label}>
                        <EllipsisTextTooltip text={this.props.label} />
                    </If>
                    <If condition={this.showCheckbox}>
                        <Then>
                            <div
                                className={classnames({
                                    [styles.addGeneUI]: true,
                                    [styles.selected]: this.isCheckBoxChecked,
                                    [styles.hover]: !this.isCheckBoxChecked,
                                })}
                            >
                                <i
                                    style={{ paddingTop: '3px' }}
                                    data-test={
                                        this.isCheckBoxChecked
                                            ? 'structVarQueryCheckboxChecked'
                                            : 'structVarQueryCheckboxUnchecked'
                                    }
                                    className="fa fa-search"
                                />
                            </div>
                        </Then>
                        <Else>
                            {/*If there is no label defined, add some whitespace so that the*/}
                            {/*the user can trigger a hover event more.*/}
                            <If condition={!this.props.label}>
                                <span>&nbsp;</span>
                            </If>
                        </Else>
                    </If>
                </div>
            </div>
        );
    }
}
