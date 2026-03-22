import * as React from 'react';
import _ from 'lodash';
import styles from './styles.module.scss';
import { If } from 'react-if';
import contrast from 'contrast';
import { computed, makeObservable, observable, toJS } from 'mobx';
import classnames from 'classnames';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';

export interface IPillTagProps {
    content: string | { uniqueChartKey: string; element: JSX.Element };
    backgroundColor: string;
    infoSection?: JSX.Element | null;
    onDelete?: () => void;
    store: StudyViewPageStore;
}

export type PillStoreEntry = {
    /**
     * Unique filter key
     */
    key: string;

    /**
     * Called in hesitate mode, when filter updates are submitted
     */
    onDeleteCallback?: () => void;
};

export type PillStore = {
    [content: string]: PillStoreEntry;
};

export class PillTag extends React.Component<IPillTagProps, {}> {
    constructor(props: IPillTagProps) {
        super(props);
        makeObservable(this);
        // TODO: when switching to autocommit: trigger submit

        const notInitializing =
            props.store.filters !== undefined &&
            !_.isEqual(toJS(props.store.filters), props.store.filtersProxy);

        if (
            notInitializing &&
            this.hesitateUpdate &&
            !this.submittedPillStoreEntry
        ) {
            this.addPillToHesitateStore();
        } else {
            // We always need to keep track of submitted filters,
            // in case user switches from auto to hesitate mode:
            this.addPillToSubmittedStore();
        }
    }

    private get hesitateUpdate() {
        return this.props.store.hesitateUpdate;
    }

    @computed
    get contentColor() {
        let _contrast = contrast(this.props.backgroundColor);
        if (_contrast === 'light') {
            return '#000';
        } else {
            return '#fff';
        }
    }

    private handleDelete() {
        if (!this.hesitateUpdate) {
            this.deleteNow();
            return;
        }
        if (this.isDeleteOfQueuedFilter()) {
            this.deleteNow();
            return;
        }
        if (this.isDeleteOfSubmittedFilter()) {
            const isDeleted = true;
            this.addPillToHesitateStore(isDeleted);
            this.forceUpdate();
            return;
        }
        if (this.isDeleteOfQueuedDelete()) {
            this.removePillFromHesitateStore();
            this.forceUpdate();
            return;
        }
    }

    private isDeleteOfSubmittedFilter() {
        return this.hesitateUpdate && !this.hesitantPillStoreEntry;
    }

    private isDeleteOfQueuedFilter() {
        return this.isQueued() && !this.hesitantPillStoreEntry.onDeleteCallback;
    }

    private isDeleteOfQueuedDelete() {
        return this.isQueued() && this.hesitantPillStoreEntry.onDeleteCallback;
    }

    private isQueued() {
        return this.hesitateUpdate && this.hesitantPillStoreEntry;
    }

    private deleteNow() {
        const key = this.pillStoreKey;
        delete this.submittedPillStore[key];
        if (this.props.onDelete) {
            this.props.onDelete();
        }
    }

    private addPillToHesitateStore(isDeleted = false) {
        const onDeleteCallback = isDeleted
            ? () => {
                  if (this.props.onDelete) {
                      this.props.onDelete();
                  }
              }
            : undefined;
        const key = this.pillStoreKey;
        this.hesitantPillStore[key] = {
            key,
            onDeleteCallback,
        };
    }

    private removePillFromHesitateStore() {
        const key = this.pillStoreKey;
        delete this.hesitantPillStore[key];
    }

    private addPillToSubmittedStore() {
        const key = this.pillStoreKey;
        this.submittedPillStore[key] = { key };
    }

    private get hesitantPillStore(): PillStore {
        return this.props.store.hesitantPillStore;
    }

    private get submittedPillStore(): PillStore {
        return this.props.store.submittedPillStore;
    }

    private get hesitantPillStoreEntry() {
        const key = this.pillStoreKey;
        return (this.hesitantPillStore as any)[key];
    }

    private get submittedPillStoreEntry() {
        const key = this.pillStoreKey;
        return (this.submittedPillStore as any)[key];
    }

    private get pillStoreKey() {
        return _.isString(this.props.content)
            ? this.props.content
            : this.props.content.uniqueChartKey;
    }

    private get contentToRender() {
        return _.isString(this.props.content)
            ? this.props.content
            : this.props.content.element;
    }

    private isDeleted() {
        return !!this.hesitantPillStoreEntry?.onDeleteCallback;
    }

    render() {
        const isPending = !!this.hesitantPillStoreEntry;

        return (
            <div
                className={classnames({
                    [styles.main]: true,
                    [styles.pending]: isPending,
                    [styles.pendingDelete]: this.isDeleted(),
                })}
                data-test="pill-tag"
                style={{
                    background: this.props.backgroundColor,
                    color: this.contentColor,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <span className={styles.content}>
                        {this.contentToRender}
                    </span>
                    {this.props.infoSection}
                </div>
                <If condition={_.isFunction(this.props.onDelete)}>
                    <span
                        data-test="pill-tag-delete"
                        className={styles.delete}
                        onClick={() => this.handleDelete()}
                    >
                        <i className="fa fa-times-circle"></i>
                    </span>
                </If>
            </div>
        );
    }
}
