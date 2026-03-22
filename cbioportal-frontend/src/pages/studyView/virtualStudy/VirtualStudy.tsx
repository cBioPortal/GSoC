import * as React from 'react';
import _ from 'lodash';
import styles from './styles.module.scss';
import { observer } from 'mobx-react';
import { computed, observable, action, makeObservable } from 'mobx';
import { CancerStudy, Sample } from 'cbioportal-ts-api-client';
import classnames from 'classnames';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import { If, Then, Else } from 'react-if';
import { buildCBioPortalPageUrl, getStudySummaryUrl } from 'shared/api/urls';
import { ChartMeta } from 'pages/studyView/StudyViewUtils';
import {
    getVirtualStudyDescription,
    getCurrentDate,
    StudyViewFilterWithSampleIdentifierFilters,
    StudyWithSamples,
} from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import { serializeEvent } from '../../../shared/lib/tracking';
import FontAwesome from 'react-fontawesome';

const Clipboard = require('clipboard');

export interface IVirtualStudyProps {
    studyWithSamples: StudyWithSamples[];
    selectedSamples: Sample[];
    filter: StudyViewFilterWithSampleIdentifierFilters;
    attributesMetaSet: { [id: string]: ChartMeta };
    molecularProfileNameSet: { [key: string]: string };
    caseListNameSet: { [key: string]: string };
    name?: string;
    description?: string;
    user?: string;
}

@observer
export class StudySummaryRecord extends React.Component<CancerStudy, {}> {
    @observable private showDescription = false;

    constructor(props: CancerStudy) {
        super(props);
        makeObservable(this);
    }

    render() {
        return (
            <div className={styles.studySummary}>
                <div className="panel panel-default">
                    <div className="panel-heading">
                        <span className={styles.studyName}>
                            <i
                                className={`fa fa-${
                                    this.showDescription ? 'minus' : 'plus'
                                }-circle`}
                                onClick={() =>
                                    (this.showDescription = !this
                                        .showDescription)
                                }
                            />
                            {this.props.name}
                        </span>
                        <a
                            target="_blank"
                            href={getStudySummaryUrl(this.props.studyId)}
                        >
                            <i
                                className="fa-solid fa-arrow-up-right-from-square"
                                aria-hidden="true"
                            ></i>
                        </a>
                    </div>
                    <div
                        className={styles.studyDescription}
                        style={{
                            display: this.showDescription ? 'block' : 'none',
                        }}
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: `${this.props.description.replace(
                                    /\r?\n/g,
                                    '<br/>'
                                )}`,
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

@observer
export default class VirtualStudy extends React.Component<
    IVirtualStudyProps,
    {}
> {
    @observable.ref private name: string;
    @observable.ref private customDescription: string | undefined;
    @observable.ref private dynamic: boolean = false;

    @observable private saving = false;
    @observable private sharing = false;
    @observable private copied = false;

    constructor(props: IVirtualStudyProps) {
        super(props);
        makeObservable(this);
        this.name = props.name || '';
    }

    @computed get namePlaceHolder() {
        return `Selected sample${
            this.props.selectedSamples.length > 1 ? 's' : ''
        } (${getCurrentDate()})`;
    }

    @computed get buttonsDisabled() {
        return _.isEmpty(this.namePlaceHolder) && _.isEmpty(this.name);
    }

    readonly virtualStudy = remoteData(
        {
            invoke: async () => {
                if (this.saving || this.sharing) {
                    let selectedSampleSet = _.groupBy(
                        this.props.selectedSamples,
                        (sample: Sample) => sample.studyId
                    );
                    let studies = _.reduce(
                        selectedSampleSet,
                        (
                            acc: { id: string; samples: string[] }[],
                            samples,
                            studyId
                        ) => {
                            acc.push({
                                id: studyId,
                                samples: samples.map(sample => sample.sampleId),
                            });
                            return acc;
                        },
                        []
                    );

                    let {
                        sampleIdentifiersSet,
                        ...studyViewFilter
                    } = this.props.filter;

                    let parameters = {
                        name: this.name || this.namePlaceHolder,
                        description: this.description,
                        studyViewFilter: studyViewFilter,
                        origin: this.props.studyWithSamples.map(
                            study => study.studyId
                        ),
                        studies: studies,
                        dynamic: this.dynamic,
                    };
                    return await sessionServiceClient.saveVirtualStudy(
                        parameters,
                        this.saving
                    );
                }
                return undefined;
            },
        },
        undefined
    );

    @computed get virtualStudyUrl() {
        // TODO: update path name once fully refactored
        return buildCBioPortalPageUrl({
            pathname: 'study',
            query: {
                id: this.virtualStudy.result ? this.virtualStudy.result.id : '',
            },
        });
    }

    @autobind
    private copyLinkRef(el: HTMLAnchorElement | null) {
        if (el) {
            new Clipboard(el, {
                container: document.getElementsByClassName(
                    styles.virtualStudy
                )[0],
                text: () => this.virtualStudyUrl,
            });
        }
    }

    @action.bound
    onCopyClick() {
        this.copied = true;
    }

    @action.bound
    private onTooltipVisibleChange(visible: boolean) {
        this.copied = !visible;
    }

    @computed get showSaveButton() {
        //default value of userDisplayName is anonymousUser. see my-index.ejs
        return !(
            _.isUndefined(this.props.user) ||
            _.isEmpty(this.props.user) ||
            _.isEqual(this.props.user.toLowerCase(), 'anonymoususer')
        );
    }

    @computed get attributeNamesSet() {
        return _.reduce(
            this.props.attributesMetaSet,
            (acc: { [id: string]: string }, next, key) => {
                acc[key] = next.displayName;
                return acc;
            },
            {}
        );
    }

    getDefuaultDescriptionByType(dynamic: boolean) {
        return getVirtualStudyDescription(
            this.props.description,
            this.props.studyWithSamples,
            this.props.filter,
            this.attributeNamesSet,
            this.props.molecularProfileNameSet,
            this.props.caseListNameSet,
            this.props.user,
            dynamic
        );
    }

    @computed get description() {
        const noCustomDescriptionProvided =
            this.customDescription == undefined ||
            this.customDescription ===
                this.getDefuaultDescriptionByType(!this.dynamic);
        if (noCustomDescriptionProvided) {
            return this.getDefuaultDescriptionByType(this.dynamic);
        }
        return this.customDescription || '';
    }

    render() {
        return (
            <div
                data-tour="virtual-study-summary-panel"
                className={styles.virtualStudy}
            >
                <If condition={this.virtualStudy.isError}>
                    <Then>
                        <div style={{ textAlign: 'center' }}>
                            <i
                                className="fa fa-exclamation-triangle"
                                aria-hidden="true"
                                style={{ color: 'orange' }}
                            />
                            <span style={{ marginLeft: '5px' }}>{`Failed to ${
                                this.saving ? 'save' : 'share'
                            } virtual study, please try again later.`}</span>
                        </div>
                    </Then>
                    <Else>
                        <If
                            condition={
                                this.virtualStudy.isPending ||
                                _.isUndefined(this.virtualStudy.result)
                            }
                        >
                            <Then>
                                <div>
                                    <div
                                        className={classnames(
                                            styles.virtualStudyForm,
                                            this.virtualStudy.isPending
                                                ? styles.disabled
                                                : undefined
                                        )}
                                    >
                                        <div className="form-group">
                                            <label>Title:</label>
                                            <input
                                                type="text"
                                                id={'sniglet'}
                                                className="form-control"
                                                value={this.name}
                                                placeholder={
                                                    this.namePlaceHolder ||
                                                    'Virtual study name'
                                                }
                                                onInput={event =>
                                                    (this.name =
                                                        event.currentTarget.value)
                                                }
                                            />
                                        </div>
                                        <div className={'form-group'}>
                                            <label>Description:</label>
                                            <textarea
                                                className="form-control"
                                                rows={5}
                                                placeholder="Virtual study description (Optional)"
                                                value={this.description}
                                                onChange={event =>
                                                    (this.customDescription =
                                                        event.currentTarget.value)
                                                }
                                            />
                                        </div>

                                        <div className="form-group-inline">
                                            <label>Type:</label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="option"
                                                    value="static"
                                                    checked={!this.dynamic}
                                                    onChange={_ =>
                                                        (this.dynamic = false)
                                                    }
                                                />{' '}
                                                Static
                                            </label>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="option"
                                                    value="dynamic"
                                                    checked={this.dynamic}
                                                    onChange={_ =>
                                                        (this.dynamic = true)
                                                    }
                                                />{' '}
                                                Dynamic
                                            </label>
                                            <DefaultTooltip
                                                mouseEnterDelay={0}
                                                placement="right"
                                                overlay={
                                                    <div>
                                                        <p>
                                                            <strong>
                                                                Type of Virtual
                                                                Study:
                                                            </strong>
                                                        </p>
                                                        <p>
                                                            This Virtual Study
                                                            will contain the set
                                                            of sample IDs
                                                            currently selected.
                                                            Furthermore, you can
                                                            define this Virtual
                                                            Study to be either
                                                            static or dynamic:
                                                        </p>
                                                        <ul>
                                                            <li>
                                                                <strong>
                                                                    Static
                                                                </strong>{' '}
                                                                – Sample IDs are
                                                                the ones
                                                                currently
                                                                selected and no
                                                                new samples are
                                                                added to this
                                                                Virtual Study
                                                                set, even if the
                                                                database gets
                                                                updated with new
                                                                samples that
                                                                match the same
                                                                filtering/selection
                                                                criteria as the
                                                                samples in the
                                                                current set.
                                                            </li>
                                                            <li>
                                                                <strong>
                                                                    Dynamic
                                                                </strong>{' '}
                                                                – Unlike the
                                                                Static option,
                                                                any new samples
                                                                added to the
                                                                database that
                                                                match the
                                                                criteria of this
                                                                Virtual Study
                                                                will
                                                                automatically be
                                                                included in its
                                                                sample set.
                                                            </li>
                                                        </ul>
                                                    </div>
                                                }
                                            >
                                                <FontAwesome name="question-circle" />
                                            </DefaultTooltip>
                                        </div>

                                        <div>
                                            {this.showSaveButton && (
                                                <button
                                                    data-tour="virtual-study-summary-save-btn"
                                                    className={classnames(
                                                        'btn btn-default',
                                                        styles.saveButton
                                                    )}
                                                    data-event={serializeEvent({
                                                        category: 'studyPage',
                                                        action:
                                                            'saveVirtualStudy',
                                                    })}
                                                    type="button"
                                                    disabled={
                                                        this.buttonsDisabled
                                                    }
                                                    onClick={event => {
                                                        this.saving = true;
                                                    }}
                                                >
                                                    {this.saving ? (
                                                        <i
                                                            className="fa fa-spinner fa-spin"
                                                            aria-hidden="true"
                                                        ></i>
                                                    ) : (
                                                        'Save'
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                data-tour="virtual-study-summary-share-btn"
                                                className={classnames(
                                                    'btn btn-default',
                                                    styles.saveButton
                                                )}
                                                type="button"
                                                disabled={this.buttonsDisabled}
                                                data-event={serializeEvent({
                                                    category: 'studyPage',
                                                    action: 'shareVirtualStudy',
                                                })}
                                                onClick={event => {
                                                    this.sharing = true;
                                                }}
                                            >
                                                {this.sharing ? (
                                                    <i
                                                        className="fa fa-spinner fa-spin"
                                                        aria-hidden="true"
                                                    ></i>
                                                ) : (
                                                    'Create'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {/*<span*/}
                                    {/*    style={{*/}
                                    {/*        display: 'block',*/}
                                    {/*        fontWeight: 'bold',*/}
                                    {/*    }}*/}
                                    {/*>*/}
                                    {/*    This virtual study was derived from:*/}
                                    {/*</span>*/}
                                    {/*<div className={styles.studiesSummaryInfo}>*/}
                                    {/*    {this.props.studyWithSamples.map(*/}
                                    {/*        study => (*/}
                                    {/*            <StudySummaryRecord*/}
                                    {/*                {...study}*/}
                                    {/*            />*/}
                                    {/*        )*/}
                                    {/*    )}*/}
                                    {/*</div>*/}
                                </div>
                            </Then>
                            <Else>
                                <div>
                                    <p className={'text-success'}>
                                        Success! Copy the following link to view
                                        virtual study.
                                    </p>

                                    <div className="form-group">
                                        <label
                                            className="sr-only"
                                            htmlFor="exampleInputAmount"
                                        >
                                            Amount (in dollars)
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={this.virtualStudyUrl}
                                                style={{ width: 400 }}
                                            />
                                            <div className="input-group-addon">
                                                <a
                                                    ref={this.copyLinkRef}
                                                    onClick={this.onCopyClick}
                                                >
                                                    {this.copied ? (
                                                        <FontAwesome
                                                            name={'thumbs-up'}
                                                        />
                                                    ) : (
                                                        <DefaultTooltip
                                                            placement={'top'}
                                                            overlay={
                                                                'Copy to clipboard'
                                                            }
                                                        >
                                                            <FontAwesome
                                                                name={
                                                                    'clipboard'
                                                                }
                                                            />
                                                        </DefaultTooltip>
                                                    )}
                                                </a>
                                            </div>
                                            <div className="input-group-addon">
                                                <DefaultTooltip
                                                    placement={'top'}
                                                    overlay={
                                                        'Open virtual study in a new tab'
                                                    }
                                                >
                                                    <a
                                                        onClick={event =>
                                                            window.open(
                                                                this
                                                                    .virtualStudyUrl,
                                                                '_blank'
                                                            )
                                                        }
                                                    >
                                                        <FontAwesome
                                                            name={
                                                                'external-link'
                                                            }
                                                        />
                                                    </a>
                                                </DefaultTooltip>
                                            </div>
                                        </div>
                                    </div>

                                    {/*<div*/}
                                    {/*    className={classnames(*/}
                                    {/*        'btn-group btn-group-xs',*/}
                                    {/*        styles.controls*/}
                                    {/*    )}*/}
                                    {/*>*/}
                                    {/*    {this.saving && (*/}
                                    {/*        <span*/}
                                    {/*            data-tour="virtual-study-summary-query-btn"*/}
                                    {/*            className="btn btn-default"*/}
                                    {/*            onClick={event => {*/}
                                    {/*                if (*/}
                                    {/*                    this.virtualStudy.result*/}
                                    {/*                ) {*/}
                                    {/*                    window.open(*/}
                                    {/*                        buildCBioPortalPageUrl(*/}
                                    {/*                            'results',*/}
                                    {/*                            {*/}
                                    {/*                                cancer_study_id: this*/}
                                    {/*                                    .virtualStudy*/}
                                    {/*                                    .result*/}
                                    {/*                                    .id,*/}
                                    {/*                            }*/}
                                    {/*                        ),*/}
                                    {/*                        '_blank'*/}
                                    {/*                    );*/}
                                    {/*                }*/}
                                    {/*            }}*/}
                                    {/*        >*/}
                                    {/*            Query*/}
                                    {/*        </span>*/}
                                    {/*    )}*/}
                                    {/*</div>*/}
                                </div>
                            </Else>
                        </If>
                    </Else>
                </If>
            </div>
        );
    }
}
