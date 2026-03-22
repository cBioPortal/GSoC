import _ from 'lodash';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {
    CancerStudy,
    TypeOfCancer as CancerType,
} from 'cbioportal-ts-api-client';
import { FlexCol, FlexRow } from '../flexbox/FlexBox';
import styles from './styles/styles.module.scss';
import classNames from 'classnames';
import StudyList from './studyList/StudyList';
import { observer, Observer } from 'mobx-react';
import {
    action,
    computed,
    IReactionDisposer,
    reaction,
    makeObservable,
    when,
} from 'mobx';
import { expr } from 'mobx-utils';
import memoize from 'memoize-weak-decorator';
import { If, Then, Else } from 'react-if';
import { QueryStore } from './QueryStore';
import SectionHeader from '../sectionHeader/SectionHeader';
import { Modal } from 'react-bootstrap';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from '../../../config/config';
import { PAN_CAN_SIGNATURE } from './StudyListLogic';
import QuickSelectButtons from './QuickSelectButtons';
import { StudySelectorStats } from 'shared/components/query/StudySelectorStats';
import WindowStore from 'shared/components/window/WindowStore';
import { StudySearch } from 'shared/components/query/StudySearch';
import {
    DataTypeFilter,
    IFilterDef,
} from 'shared/components/query/DataTypeFilter';
import {
    getSampleCountsPerFilter,
    getStudyCountPerFilter,
} from 'shared/components/query/filteredSearch/StudySearchControls';
import {
    DEFAULT_STUDY_FILTER_OPTIONS,
    getResourceFilterOptions,
} from './QueryStoreUtils';
const MIN_LIST_HEIGHT = 200;

export interface ICancerStudySelectorProps {
    style?: React.CSSProperties;
    queryStore: QueryStore;
    forkedMode: boolean;
    aboveStudyListBlurb?: JSX.Element;
}

@observer
export default class CancerStudySelector extends React.Component<
    ICancerStudySelectorProps,
    {}
> {
    @computed get studiesDataComplete(): boolean {
        return (
            this.store.cancerTypes.isComplete &&
            this.store.cancerStudies.isComplete &&
            this.store.userVirtualStudies.isComplete &&
            this.store.resourceDefinitions.isComplete
        );
    }

    private handlers = {
        onSummaryClick: () => {
            this.store.openSummary();
        },
        onCheckAllFiltered: () => {
            this.logic.mainView.toggleAllFiltered();
        },
        onClearFilter: () => {
            this.store.setSearchText('');
        },
    };

    public store: QueryStore;

    private studyFilterOptionsReaction: IReactionDisposer;

    constructor(props: ICancerStudySelectorProps) {
        super(props);
        makeObservable(this);
        this.store = this.props.queryStore;
    }

    get logic() {
        return this.store.studyListLogic;
    }

    @memoize
    getCancerTypeListClickHandler<T>(node: CancerType) {
        return (event: React.MouseEvent<T>) =>
            this.store.selectCancerType(node as CancerType, event.ctrlKey);
    }

    CancerTypeList = observer(() => {
        let cancerTypes = this.logic.cancerTypeListView.getChildCancerTypes(
            this.store.treeData.rootCancerType
        );
        return (
            <ul className={styles.cancerTypeList}>
                {cancerTypes.map((cancerType, arrayIndex) => (
                    <this.CancerTypeListItem
                        key={arrayIndex}
                        cancerType={cancerType}
                    />
                ))}
            </ul>
        );
    });

    CancerTypeListItem = observer(
        ({ cancerType }: { cancerType: CancerType }) => {
            let numStudies = expr(
                () =>
                    this.logic.cancerTypeListView.getDescendantCancerStudies(
                        cancerType
                    ).length
            );
            let selected = _.includes(
                this.store.selectedCancerTypeIds,
                cancerType.cancerTypeId
            );
            let highlighted = this.logic.isHighlighted(cancerType);
            let liClassName = classNames({
                [styles.selectable]: true,
                [styles.selected]: selected,
                [styles.matchingNodeText]:
                    !!this.store.searchText && highlighted,
                [styles.nonMatchingNodeText]:
                    !!this.store.searchText && !highlighted,
                [styles.containsSelectedStudies]: expr(() =>
                    this.logic.cancerTypeContainsSelectedStudies(cancerType)
                ),
            });

            return (
                <li
                    className={liClassName}
                    onMouseDown={this.getCancerTypeListClickHandler(cancerType)}
                >
                    <span className={styles.cancerTypeListItemLabel}>
                        {cancerType.name}
                    </span>
                    <span className={styles.cancerTypeListItemCount}>
                        {numStudies}
                    </span>
                </li>
            );
        }
    );

    @action.bound
    selectTCGAPanAtlas() {
        this.logic.mainView.selectAllMatchingStudies(PAN_CAN_SIGNATURE);
    }

    @action.bound
    selectMatchingStudies(matches: string[]) {
        if (matches) {
            // if there is only one item and it has wildcard markers (*) then pass single string
            // otherwise pass array of exactly matching studyIds
            if (matches.length === 1 && /^\*.*\*$/.test(matches[0])) {
                // match wildcard of one
                this.logic.mainView.selectAllMatchingStudies(
                    matches[0].replace(/\*/g, '')
                );
            } else {
                this.logic.mainView.selectAllMatchingStudies(matches);
            }
        }
    }

    @action.bound
    toggleFilter(id: string) {
        let option = this.store.studyFilterOptions.find(o => o.id === id);
        if (option) {
            option.checked = !option.checked;
        }
    }

    private computeCountsForFilterOptions(
        options: IFilterDef[],
        countsFn: (options: IFilterDef[], studies: CancerStudy[]) => number[]
    ) {
        const shownStudies = this.logic.mainView.getSelectionReport()
            .shownStudies;
        const studyForCalculation =
            shownStudies.length < this.store.cancerStudies.result.length
                ? shownStudies
                : this.store.cancerStudies.result;
        return countsFn(options, studyForCalculation);
    }

    @computed get showSamplesPerFilterType() {
        return this.computeCountsForFilterOptions(
            this.store.studyFilterOptions,
            getSampleCountsPerFilter
        );
    }

    @computed get showStudiesPerFilterType() {
        return this.computeCountsForFilterOptions(
            this.store.studyFilterOptions,
            getStudyCountPerFilter
        );
    }

    @computed get showStudiesPerBaseFilterType() {
        return this.computeCountsForFilterOptions(
            this.baseStudyFilterOptions,
            getStudyCountPerFilter
        );
    }

    @computed get baseStudyFilterOptions() {
        const resourceFilterOptions = getResourceFilterOptions(
            this.store.resourceDefinitions.result
        );
        return [...DEFAULT_STUDY_FILTER_OPTIONS, ...resourceFilterOptions];
    }

    private windowSizeDisposer: IReactionDisposer;

    componentDidMount(): void {
        let resizeTimeout: any;
        this.windowSizeDisposer = reaction(
            () => {
                return WindowStore.size;
            },
            () => {
                if (this.props.forkedMode) {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => this.setListHeight(), 200);
                }
            },
            { fireImmediately: true }
        );

        this.studyFilterOptionsReaction = when(
            () => this.store.resourceDefinitions.isComplete,
            () => {
                const filterOptions = this.baseStudyFilterOptions.filter(
                    (_, i) => this.showStudiesPerBaseFilterType[i] > 0
                );
                this.store.setStudyFilterOptions(filterOptions);
            }
        );
    }

    componentWillUnmount(): void {
        this.windowSizeDisposer();
        this.studyFilterOptionsReaction();
    }

    setListHeight() {
        const $el = $(ReactDOM.findDOMNode(this) as HTMLDivElement);
        var h = WindowStore.size.height - $el.offset()!.top;
        h = h < MIN_LIST_HEIGHT ? MIN_LIST_HEIGHT : h; // impose limit
        $el.css('height', h - 75);
    }

    render() {
        const {
            shownStudies,
            shownAndSelectedStudies,
        } = this.logic.mainView.getSelectionReport();

        // TO DO shownStudies can be filtered based on the DataTypeFIlter
        const quickSetButtons = this.logic.mainView.quickSelectButtons(
            getServerConfig().skin_quick_select_buttons
        );

        return (
            <FlexCol
                overflow
                data-test="studyList"
                className={styles.CancerStudySelector}
            >
                <FlexRow overflow className={styles.CancerStudySelectorHeader}>
                    <SectionHeader
                        promises={[
                            this.store.cancerTypes,
                            this.store.cancerStudies,
                        ]}
                    >
                        Select Studies for Visualization & Analysis:
                    </SectionHeader>

                    {this.store.selectableStudiesSet.isComplete && (
                        <div>
                            <StudySelectorStats store={this.store} />
                        </div>
                    )}

                    <Observer>
                        {() => {
                            let searchTextOptions = ServerConfigHelpers.skin_example_study_queries(
                                getServerConfig()!.skin_example_study_queries ||
                                    ''
                            );
                            if (
                                this.store.searchText &&
                                searchTextOptions.indexOf(
                                    this.store.searchText
                                ) < 0
                            )
                                searchTextOptions = [
                                    this.store.searchText,
                                ].concat(searchTextOptions as string[]);
                            let searchTimeout: number | null = null;

                            return (
                                <div>
                                    <div
                                        data-tour="data-type-filter"
                                        data-test="data-type-filter-test"
                                        style={{
                                            display: 'inline-block',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <DataTypeFilter
                                            dataFilter={
                                                this.store.dataTypeFilters
                                            }
                                            isChecked={false}
                                            buttonText={'Data type'}
                                            dataFilterActive={
                                                this.store.resourceDefinitions
                                                    .isComplete
                                                    ? this.store
                                                          .studyFilterOptions
                                                    : []
                                            }
                                            store={this.store}
                                            samplePerFilter={
                                                this.store.resourceDefinitions
                                                    .isComplete
                                                    ? this
                                                          .showSamplesPerFilterType
                                                    : []
                                            }
                                            studyPerFilter={
                                                this.store.resourceDefinitions
                                                    .isComplete
                                                    ? this
                                                          .showStudiesPerFilterType
                                                    : []
                                            }
                                            toggleFilter={this.toggleFilter}
                                            isLoading={
                                                !this.store.resourceDefinitions
                                                    .isComplete
                                            }
                                        />
                                    </div>
                                    <div
                                        data-tour="cancer-study-search-box"
                                        style={{
                                            display: 'inline-block',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {this.store.queryParser && (
                                            <StudySearch
                                                parser={this.store.queryParser}
                                                query={this.store.searchClauses}
                                                onSearch={query =>
                                                    (this.store.searchClauses = query)
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        }}
                    </Observer>
                </FlexRow>

                <If condition={this.studiesDataComplete}>
                    <FlexRow className={styles.cancerStudySelectorBody}>
                        <If condition={this.store.maxTreeDepth > 0}>
                            <Then>
                                <div
                                    className={styles.cancerTypeListContainer}
                                    tabIndex={0}
                                >
                                    <this.CancerTypeList />
                                </div>
                            </Then>
                        </If>
                        <div
                            data-tour="cancer-study-list-container"
                            className={styles.cancerStudyListContainer}
                            data-test="cancerTypeListContainer"
                        >
                            <div className={styles.queryHelp}>
                                <a
                                    href={
                                        'https://docs.cbioportal.org/user-guide/by-page/#homepage'
                                    }
                                    target={'_blank'}
                                >
                                    Help <i className={'fa fa-book'}></i>
                                </a>
                            </div>

                            <div
                                className="checkbox"
                                style={{ marginLeft: 19 }}
                            >
                                <If condition={shownStudies.length > 0}>
                                    <If
                                        condition={
                                            !this.logic.mainView.isFiltered &&
                                            !_.isEmpty(quickSetButtons)
                                        }
                                    >
                                        <Then>
                                            <div className={styles.quickSelect}>
                                                <QuickSelectButtons
                                                    onSelect={
                                                        this
                                                            .selectMatchingStudies
                                                    }
                                                    buttonsConfig={
                                                        quickSetButtons
                                                    }
                                                />
                                            </div>
                                        </Then>
                                        <Else>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    data-test="selectAllStudies"
                                                    style={{ top: -2 }}
                                                    onClick={
                                                        this.handlers
                                                            .onCheckAllFiltered
                                                    }
                                                    checked={
                                                        shownAndSelectedStudies.length ===
                                                        shownStudies.length
                                                    }
                                                />
                                                <strong>
                                                    {shownAndSelectedStudies.length ===
                                                    shownStudies.length
                                                        ? `Deselect all listed studies ${
                                                              shownStudies.length <
                                                              this.store
                                                                  .cancerStudies
                                                                  .result.length
                                                                  ? 'matching filter'
                                                                  : ''
                                                          } (${
                                                              shownStudies.length
                                                          })`
                                                        : `Select all listed studies ${
                                                              shownStudies.length <
                                                              this.store
                                                                  .cancerStudies
                                                                  .result.length
                                                                  ? 'matching filter'
                                                                  : ''
                                                          }  (${
                                                              shownStudies.length
                                                          })`}
                                                </strong>
                                            </label>
                                        </Else>
                                    </If>
                                </If>
                                <If
                                    condition={
                                        this.store.cancerStudies.isComplete &&
                                        this.store.cancerTypes.isComplete &&
                                        shownStudies.length === 0
                                    }
                                >
                                    <p>
                                        There are no studies matching your
                                        filter.
                                    </p>
                                </If>
                            </div>

                            {this.props.aboveStudyListBlurb}
                            <StudyList />
                        </div>
                    </FlexRow>
                </If>

                <Modal
                    className={classNames(
                        styles.SelectedStudiesWindow,
                        'cbioportal-frontend'
                    )}
                    show={this.store.showSelectedStudiesOnly}
                    onHide={() => (this.store.showSelectedStudiesOnly = false)}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Selected Studies</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StudyList showSelectedStudiesOnly />
                    </Modal.Body>
                </Modal>
            </FlexCol>
        );
    }
}
