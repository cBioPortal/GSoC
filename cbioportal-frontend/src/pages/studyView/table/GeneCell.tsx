import * as React from 'react';
import _ from 'lodash';
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
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Else, If, Then } from 'react-if';
import GisticAnnotation from 'shared/components/annotation/Gistic';
import MutSigAnnotation from 'shared/components/annotation/MutSig';

export type IGeneCellProps = {
    tableType: FreqColumnTypeEnum;
    selectedGenes: string[];
    hugoGeneSymbol: string;
    qValue: number;
    isCancerGene: boolean;
    oncokbAnnotated: boolean;
    isOncogene: boolean;
    isTumorSuppressorGene: boolean;
    onGeneSelect: (hugoGeneSymbol: string) => void;
};

@observer
export class GeneCell extends React.Component<IGeneCellProps, {}> {
    constructor(props: IGeneCellProps) {
        super(props);
    }

    render() {
        const geneIsSelected = _.includes(
            this.props.selectedGenes,
            this.props.hugoGeneSymbol
        );
        let iconStyle = {
            marginLeft: 2,
            marginTop: 2,
        };

        return (
            <div className={styles.geneSymbol}>
                <DefaultTooltip
                    placement="left"
                    disabled={!this.props.isCancerGene}
                    overlay={getGeneColumnCellOverlaySimple(
                        this.props.hugoGeneSymbol,
                        geneIsSelected,
                        this.props.isCancerGene,
                        this.props.oncokbAnnotated,
                        this.props.isOncogene,
                        this.props.isTumorSuppressorGene
                    )}
                    destroyTooltipOnHide={true}
                >
                    <div
                        data-test="geneNameCell"
                        className={classnames(styles.displayFlex)}
                        onClick={() => {
                            this.props.onGeneSelect(this.props.hugoGeneSymbol);
                        }}
                    >
                        <EllipsisTextTooltip
                            text={this.props.hugoGeneSymbol}
                            hideTooltip={this.props.isCancerGene}
                        />
                        <If condition={!_.isUndefined(this.props.qValue)}>
                            <span style={iconStyle}>
                                <If
                                    condition={
                                        this.props.tableType ===
                                        FreqColumnTypeEnum.MUTATION
                                    }
                                >
                                    <Then>
                                        <MutSigAnnotation
                                            qValue={this.props.qValue}
                                        />
                                    </Then>
                                    <Else>
                                        <GisticAnnotation
                                            qValue={this.props.qValue}
                                        />
                                    </Else>
                                </If>
                            </span>
                        </If>

                        <div
                            style={{ paddingTop: '3px' }}
                            className={classnames({
                                [styles.addGeneUI]: true,
                                [styles.selected]: geneIsSelected,
                            })}
                        >
                            <i className="fa fa-search"></i>
                        </div>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }
}
