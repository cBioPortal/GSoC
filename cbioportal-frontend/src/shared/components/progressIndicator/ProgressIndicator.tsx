import * as React from 'react';
import { observer } from 'mobx-react';
import styles from './styles.module.scss';
import classnames from 'classnames';
import { computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import ErrorMessage from '../ErrorMessage';
import Spinner from 'react-spinkit';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import autobind from 'autobind-decorator';

export interface IProgressIndicatorItem {
    label: any;
    style?: any;
    promises?: MobxPromise<any>[]; // if `promises` is not defined, then just show pending
    hideIcon?: boolean; // dont show any icon for this item if `hideIcon` is true
}

export interface IProgressIndicatorProps {
    getItems: (elapsedSecs: number) => IProgressIndicatorItem[];
    show: boolean;
    sequential?: boolean; // if true, things further in list are not showed as loading until previous in list are completed
}

function getItemStatus(
    item: IProgressIndicatorItem
): 'complete' | 'pending' | 'error' {
    if (item.promises) {
        if (item.promises.length === 0) {
            return 'complete';
        } else {
            return getRemoteDataGroupStatus(...item.promises);
        }
    } else {
        return 'pending';
    }
}

function getDetailedErrorMessages(items: IProgressIndicatorItem[]): string[] {
    return _(
        items.map(item =>
            item.promises?.map(
                promise => (promise.error as any)?.detailedErrorMessage
            )
        )
    )
        .flatten()
        .compact()
        .value();
}

@observer
export default class ProgressIndicator extends React.Component<
    IProgressIndicatorProps,
    {}
> {
    constructor(props: IProgressIndicatorProps) {
        super(props);
        makeObservable(this);
    }
    @observable timeShown = 0;
    private timeShownInterval: any;

    componentWillMount() {
        this.timeShownInterval = setInterval(() => {
            if (this.props.show) {
                this.timeShown += 1;
            } else {
                if (this.timeShown > 0) {
                    this.timeShown = 0;
                }
            }
        }, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.timeShownInterval);
    }

    @computed get items() {
        return this.props.getItems(this.timeShown);
    }

    @computed get firstIncompleteIndex() {
        return this.items.findIndex(item => getItemStatus(item) !== 'complete');
    }

    @autobind
    private makeItem(item: IProgressIndicatorItem, index: number) {
        let icon: any = null;
        // if sequential option is true, then only show any icon if all previous items are complete
        const notInvoked =
            this.props.sequential && index > this.firstIncompleteIndex;
        // also don't show any icon if user specifies it
        const showIcon = !notInvoked && !item.hideIcon;
        if (showIcon) {
            switch (getItemStatus(item)) {
                case 'complete':
                    icon = (
                        <i
                            className={classnames(
                                'fa fa-sm fa-check',
                                styles['fa-check']
                            )}
                        />
                    );
                    break;
                case 'pending':
                    icon = (
                        <Spinner
                            name="double-bounce"
                            fadeIn={false}
                            className={styles['pulse-spinner']}
                        />
                    );
                    break;
                case 'error':
                    icon = (
                        <i
                            className={classnames(
                                'fa fa-sm fa-exclamation-triangle',
                                styles['fa-exclamation-triangle']
                            )}
                        />
                    );
                    break;
            }
        }
        return (
            <span
                className={classnames(styles['item-row'], {
                    [styles['not-invoked-item']]: notInvoked,
                })}
                style={item.style}
            >
                {item.label}
                <span style={{ marginLeft: 7 }}>{icon}</span>
            </span>
        );
    }

    render() {
        if (this.props.show) {
            const detailedErrorMessages = getDetailedErrorMessages(this.items);
            return (
                <div className={styles.container}>
                    <div className={styles['items-container']}>
                        {this.items.map(this.makeItem)}
                    </div>
                    {_.some(this.items, i => getItemStatus(i) === 'error') && (
                        <ErrorMessage
                            message={detailedErrorMessages.join('\n')}
                            disableDefaultContactMessage={
                                detailedErrorMessages.length > 0
                            }
                        />
                    )}
                </div>
            );
        } else {
            return null;
        }
    }
}
