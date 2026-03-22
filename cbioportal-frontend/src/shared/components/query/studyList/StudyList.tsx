import * as React from 'react';
import { CancerStudy } from 'cbioportal-ts-api-client';
import styles_any from './styles.module.scss';
import classNames from 'classnames';
import FontAwesome from 'react-fontawesome';
import LabeledCheckbox from '../../labeledCheckbox/LabeledCheckbox';
import { observer, Observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import _ from 'lodash';
import { getPubMedUrl } from '../../../api/urls';
import { QueryStoreComponent } from '../QueryStore';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FilteredCancerTreeView } from '../StudyListLogic';
import {
    CancerTreeNode,
    CancerTypeWithVisibility,
} from '../CancerStudyTreeData';
import { StudyLink } from '../../StudyLink/StudyLink';
import StudyTagsTooltip, {
    IconType,
} from '../../studyTagsTooltip/StudyTagsTooltip';
import { formatStudyReferenceGenome } from 'shared/lib/referenceGenomeUtils';
import { getServerConfig } from 'config/config';

const styles = {
    ...styles_any,
    Level: (level: number) => (styles_any as any)[`Level${level}`],
};

export interface IStudyListProps {
    showSelectedStudiesOnly?: boolean;
}

@observer
export default class StudyList extends QueryStoreComponent<
    IStudyListProps,
    {}
> {
    private _view: FilteredCancerTreeView;

    get view() {
        return (
            this._view ||
            (this.props.showSelectedStudiesOnly
                ? this.logic.selectedStudiesView
                : this.logic.mainView)
        );
    }

    get logic() {
        return this.store.studyListLogic;
    }

    get rootCancerType() {
        return this.store.treeData.rootCancerType;
    }

    componentDidMount() {
        // when rendering selected studies view,
        // cache the view object so studies do not disappear immediately when deselected.
        if (this.props.showSelectedStudiesOnly) this._view = this.view;
    }

    @computed get shouldShowRefGenome() {
        return (
            getServerConfig().skin_home_page_show_reference_genome &&
            this.store.multipleReferenceGenomesPresentInAllStudies
        );
    }

    render() {
        let studyList = this.renderCancerType(this.rootCancerType);

        if (this.props.showSelectedStudiesOnly) {
            return (
                <div className={styles.SelectedStudyList}>
                    <span
                        className={styles.deselectAll}
                        onClick={() => {
                            this.view.onCheck(
                                this.store.treeData.rootCancerType,
                                false
                            );
                            this.store.showSelectedStudiesOnly = false;
                        }}
                    >
                        Deselect all
                    </span>
                    {studyList}
                </div>
            );
        }

        return studyList;
    }

    renderCancerType = (
        cancerType: CancerTypeWithVisibility,
        arrayIndex: number = 0
    ): JSX.Element | null => {
        let currentLevel = this.logic.getDepth(cancerType);
        let childCancerTypes = this.view.getChildCancerTypes(cancerType);
        let childStudies = this.view.getChildCancerStudies(cancerType);
        let childStudyIds = this.logic.cancerTypeListView
            .getDescendantCancerStudies(cancerType)
            .map(study => study.studyId);
        let heading: JSX.Element | undefined;
        let indentArrow: JSX.Element | undefined;
        if (cancerType != this.rootCancerType) {
            let liClassName = classNames(
                styles.CancerType,
                styles.Level(currentLevel)
                // this.logic.isHighlighted(cancerType) && styles.highlighted
            );

            if (currentLevel === 3)
                indentArrow = (
                    <FontAwesome
                        className={styles.indentArrow}
                        name="long-arrow-right"
                    />
                );

            heading = (
                <li className={liClassName}>
                    <CancerTreeCheckbox view={this.view} node={cancerType}>
                        {indentArrow}

                        <span>{cancerType.name}</span>
                        {!this.store.forDownloadTab && (
                            <span className={styles.SelectAll}>
                                {_.intersection(
                                    childStudyIds,
                                    this.store.selectableSelectedStudyIds
                                ).length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </span>
                        )}
                    </CancerTreeCheckbox>
                </li>
            );
        }

        let ulClassName = classNames(
            styles.StudyList,
            styles.Level(currentLevel)
        );
        return (
            <ul
                data-tour={cancerType.id}
                key={arrayIndex}
                className={ulClassName}
            >
                {heading}
                {childStudies.map(this.renderCancerStudy)}
                {childCancerTypes.map(this.renderCancerType)}
            </ul>
        );
    };

    renderCancerStudy = (study: CancerStudy, arrayIndex: number) => {
        let liClassName = classNames(
            styles.Study
            // this.logic.isHighlighted(study) && styles.highlighted
        );

        const isOverlap = study.studyId in this.store.getOverlappingStudiesMap;
        const overlapWarning = isOverlap ? (
            <DefaultTooltip
                mouseEnterDelay={0}
                placement="top"
                overlay={
                    <div>
                        This study has overlapping data with another selected
                        study.
                    </div>
                }
            >
                <i className="fa fa-exclamation-triangle"></i>
            </DefaultTooltip>
        ) : null;

        const isMixedReferenceGenome =
            _.includes(this.store.selectableSelectedStudyIds, study.studyId) &&
            this.store.isMixedReferenceGenome;
        const mixedReferenceGenomeWarning = isMixedReferenceGenome ? (
            <DefaultTooltip
                mouseEnterDelay={0}
                placement="top"
                overlay={
                    <div>
                        You are combining studies with molecular data based on
                        both GRCh37/hg19 and GRCh38/hg38. This is not fully
                        supported yet. Please double check your findings
                    </div>
                }
            >
                <span>
                    <i className="fa fa-exclamation-triangle"></i>{' '}
                    {formatStudyReferenceGenome(study.referenceGenome)}
                </span>
            </DefaultTooltip>
        ) : null;

        return (
            <li
                key={arrayIndex}
                className={liClassName}
                data-test={
                    this.store.isVirtualStudy(study.studyId)
                        ? 'VirtualStudySelect'
                        : 'StudySelect'
                }
            >
                <Observer>
                    {() => {
                        const classes = classNames({
                            [styles.StudyName]: true,
                            overlappingStudy:
                                isOverlap || isMixedReferenceGenome,
                            [styles.DeletedStudy]: this.store.isDeletedVirtualStudy(
                                study.studyId
                            ),
                            [`studyItem_${study.studyId}`]: true,
                            [styles.UnauthorizedStudy]:
                                getServerConfig()
                                    .skin_home_page_show_unauthorized_studies &&
                                study.readPermission === false,
                        });
                        return (
                            <CancerTreeCheckbox view={this.view} node={study}>
                                <span className={classes}>
                                    {study.name}
                                    {overlapWarning}
                                    {mixedReferenceGenomeWarning}
                                </span>
                            </CancerTreeCheckbox>
                        );
                    }}
                </Observer>

                <Observer>
                    {() => {
                        return (
                            <div className={styles.StudyMeta}>
                                {!this.store.isDeletedVirtualStudy(
                                    study.studyId
                                ) && this.renderSamples(study)}
                                {this.shouldShowRefGenome &&
                                    this.renderReferenceGenomeLabel(study)}
                                {this.renderStudyLinks(study)}
                            </div>
                        );
                    }}
                </Observer>
            </li>
        );
    };

    renderSamples = (study: CancerStudy) => {
        return (
            <span className={styles.StudySamples}>
                {`${study.allSampleCount} samples`}
            </span>
        );
    };

    renderStudyLinks = (study: CancerStudy) => {
        if (this.store.isDeletedVirtualStudy(study.studyId)) {
            return (
                <DefaultTooltip
                    mouseEnterDelay={0}
                    placement="top"
                    overlay={
                        <div className={styles.tooltip}>Restore study</div>
                    }
                    children={
                        <button
                            className={`btn btn-default btn-xs`}
                            onClick={() =>
                                this.store.restoreVirtualStudy(study.studyId)
                            }
                            style={{
                                lineHeight: '80%',
                            }}
                            data-test="virtualStudyRestore"
                        >
                            Restore
                        </button>
                    }
                />
            );
        } else {
            const links: {
                icon: string;
                onClick?: string | (() => void);
                tooltip?: string;
                ariaLabel?: string;
            }[] = [
                {
                    icon: 'info-circle',
                    tooltip: '',
                    ariaLabel: `View study info tooltip for ${study.name}`,
                },
            ];

            if (
                this.store.isVirtualStudy(study.studyId) &&
                !this.store.isPublicVirtualStudy(study.studyId)
            ) {
                links.push({
                    icon: 'trash',
                    tooltip: 'Delete this virtual study.',
                    onClick: () => this.store.deleteVirtualStudy(study.studyId),
                });
            } else {
                links.push({
                    icon: 'book',
                    ariaLabel: `Open ${study.name} in PubMed`,
                    onClick: study.pmid && getPubMedUrl(study.pmid),
                    tooltip: study.pmid && 'PubMed',
                });
            }

            return (
                <span className={styles.StudyLinks}>
                    {links.map((link, i) => {
                        let content = (
                            <FontAwesome
                                key={i}
                                name={link.icon}
                                className={classNames({
                                    [styles.icon]: true,
                                    [styles.iconWithTooltip]: !!link.tooltip,
                                    [styles.trashIcon]: link.icon === 'trash',
                                    [styles.infoCircleIcon]:
                                        link.icon === 'info-circle',
                                })}
                            />
                        );

                        if (link.onClick) {
                            let anchorProps: any = {
                                key: i,
                                'aria-label': link.ariaLabel,
                            };
                            if (typeof link.onClick === 'string') {
                                anchorProps.href = link.onClick;
                                anchorProps.target = '_blank';
                            } else {
                                anchorProps.onClick = link.onClick;
                            }
                            content = <a {...anchorProps}>{content}</a>;
                        }

                        if (link.tooltip) {
                            let overlay = (
                                <div
                                    className={styles.tooltip}
                                    dangerouslySetInnerHTML={{
                                        __html: link.tooltip,
                                    }}
                                />
                            );
                            content = (
                                <DefaultTooltip
                                    key={i}
                                    mouseEnterDelay={0}
                                    placement="top"
                                    overlay={overlay}
                                    children={content}
                                />
                            );
                        }
                        if (link.icon === 'info-circle') {
                            content = (
                                <StudyTagsTooltip
                                    key={i}
                                    studyDescription={
                                        this.store.isVirtualStudy(study.studyId)
                                            ? study.description.replace(
                                                  /\r?\n/g,
                                                  '<br />'
                                              )
                                            : study.description
                                    }
                                    studyId={study.studyId}
                                    isVirtualStudy={this.store.isVirtualStudy(
                                        study.studyId
                                    )}
                                    mouseEnterDelay={0}
                                    placement="top"
                                    iconType={IconType.INFO_ICON}
                                >
                                    <a
                                        role={'tooltip'}
                                        aria-label={`Display study info tooltip for ${study.name}`}
                                    >
                                        {content}
                                    </a>
                                </StudyTagsTooltip>
                            );
                        }

                        return content;
                    })}
                    {study.studyId &&
                        (study.readPermission === true ||
                            study.readPermission === undefined) && (
                            <DefaultTooltip
                                mouseEnterDelay={0}
                                placement="top"
                                overlay={
                                    <div className={styles.tooltip}>
                                        View clinical and genomic data of this
                                        study
                                    </div>
                                }
                            >
                                <span>
                                    <StudyLink
                                        studyId={study.studyId}
                                        studyName={study.name}
                                        className={classNames(
                                            styles.summaryIcon,
                                            'ci ci-pie-chart'
                                        )}
                                    />
                                </span>
                            </DefaultTooltip>
                        )}
                    {getServerConfig()
                        .skin_home_page_show_unauthorized_studies &&
                        study.studyId &&
                        study.readPermission === false && (
                            <StudyTagsTooltip
                                key={0}
                                studyDescription={
                                    this.store.isVirtualStudy(study.studyId)
                                        ? study.description.replace(
                                              /\r?\n/g,
                                              '<br />'
                                          )
                                        : study.description
                                }
                                studyId={study.studyId}
                                isVirtualStudy={this.store.isVirtualStudy(
                                    study.studyId
                                )}
                                mouseEnterDelay={0}
                                placement="top"
                                iconType={IconType.LOCK_ICON}
                            >
                                <span>
                                    <i className="fa fa-lock"></i>
                                </span>
                            </StudyTagsTooltip>
                        )}
                </span>
            );
        }
    };

    private renderReferenceGenomeLabel(study: CancerStudy) {
        return study.referenceGenome ? (
            <span> | {study.referenceGenome} </span>
        ) : null;
    }
}

export interface ICancerTreeCheckboxProps {
    view: FilteredCancerTreeView;
    node: CancerTreeNode;
}

@observer
export class CancerTreeCheckbox extends QueryStoreComponent<
    ICancerTreeCheckboxProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed.struct get checkboxProps() {
        return this.props.view.getCheckboxProps(this.props.node);
    }

    render() {
        return (
            <LabeledCheckbox
                {...this.checkboxProps}
                onChange={event => {
                    this.props.view.onCheck(
                        this.props.node,
                        (event.target as HTMLInputElement).checked
                    );
                }}
            >
                {this.props.children}
            </LabeledCheckbox>
        );
    }
}
