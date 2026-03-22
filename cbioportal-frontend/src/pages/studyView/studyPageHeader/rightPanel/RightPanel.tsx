import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import autobind from 'autobind-decorator';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'cbioportal-ts-api-client';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import classnames from 'classnames';
import { serializeEvent } from '../../../../shared/lib/tracking';
import { getOqlMessages } from '../../../../shared/lib/StoreUtils';
import { CUSTOM_CASE_LIST_ID } from '../../../../shared/components/query/QueryStore';
import { getServerConfig } from 'config/config';
import { remoteData } from 'cbioportal-frontend-commons';

export interface IRightPanelProps {
    store: StudyViewPageStore;
}

export type GeneReplacement = { alias: string; genes: Gene[] };

@observer
export default class RightPanel extends React.Component<IRightPanelProps, {}> {
    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;

    @observable geneValidationHasIssue = false;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private updateSelectedGenes(
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: {
            found: Gene[];
            suggestions: GeneReplacement[];
        },
        queryStr: string
    ) {
        this.geneValidationHasIssue =
            queryStr === '' ||
            !_.isUndefined(oql.error) ||
            genes.suggestions.length !== 0;
        this.props.store.updateSelectedGenes(oql.query, queryStr);
    }

    @computed
    get isQueryButtonDisabled() {
        return (
            this.props.store.geneQueryStr === '' ||
            this.geneValidationHasIssue ||
            !!this.oqlSubmitError
        );
    }

    @computed get isQueryLimitReached(): boolean {
        if (this.props.store.selectedSamples.isComplete) {
            return (
                this.props.store.geneQueries.length *
                    this.props.store.selectedSamples.result.length >
                getServerConfig().query_product_limit
            );
        } else {
            return false;
        }
    }

    @computed get geneLimit(): number {
        if (this.props.store.selectedSamples.isComplete) {
            return Math.floor(
                getServerConfig().query_product_limit /
                    this.props.store.selectedSamples.result.length
            );
        } else {
            // won't be used here
            return 0;
        }
    }

    @computed get oqlMessages() {
        return getOqlMessages(this.props.store.geneQueries);
    }

    @computed get oqlSubmitError() {
        if (this.props.store.isSingleNonVirtualStudyQueried) {
            if (
                this.props.store.alterationTypesInOQL.haveMutInQuery &&
                !this.props.store.defaultMutationProfile
            )
                return 'Mutation data query specified in OQL, but no mutation profile is available for the selected study.';
            if (
                this.props.store.alterationTypesInOQL.haveCnaInQuery &&
                !this.props.store.defaultCnaProfile
            )
                return 'CNA data query specified in OQL, but no CNA profile is available in the selected study.';
            if (
                this.props.store.alterationTypesInOQL.haveMrnaInQuery &&
                !this.props.store.defaultMrnaProfile
            )
                return 'mRNA expression data query specified in OQL, but no mRNA profile is available in the selected study.';
            if (
                this.props.store.alterationTypesInOQL.haveProtInQuery &&
                !this.props.store.defaultProtProfile
            )
                return 'Protein level data query specified in OQL, but no protein level profile is available in the selected study.';
        }
        if (
            this.props.store.alterationTypesInOQL.haveMrnaInQuery &&
            this.props.store.displayedStudies.isComplete &&
            this.props.store.displayedStudies.result.length > 1
        ) {
            return 'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.';
        } else if (
            this.props.store.alterationTypesInOQL.haveProtInQuery &&
            this.props.store.displayedStudies.isComplete &&
            this.props.store.displayedStudies.result.length > 1
        ) {
            return 'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.';
        }

        if (this.isQueryLimitReached) {
            return `Please limit your queries to ${this.geneLimit} genes or fewer.`;
        }
    }

    render() {
        return (
            <div className="studyViewSummaryHeader">
                <div className={styles.rightPanel}>
                    <div className={'small'}>
                        <OQLTextArea
                            inputGeneQuery={this.props.store.geneQueryStr}
                            validateInputGeneQuery={true}
                            callback={this.updateSelectedGenes}
                            location={GeneBoxType.STUDY_VIEW_PAGE}
                            error={this.oqlSubmitError}
                            messages={this.oqlMessages}
                        />
                    </div>
                    <button
                        disabled={this.isQueryButtonDisabled}
                        className={classnames(
                            'btn btn-primary btn-sm',
                            styles.submitQuery
                        )}
                        data-event={serializeEvent({
                            category: 'studyPage',
                            action: 'submitQuery',
                            label: this.props.store.queriedPhysicalStudyIds
                                .result,
                        })}
                        data-test="geneSetSubmit"
                        onClick={() => this.props.store.onSubmitQuery()}
                    >
                        <i className={'fa fa-search'}></i>
                        &nbsp; Query
                    </button>
                </div>
            </div>
        );
    }
}
