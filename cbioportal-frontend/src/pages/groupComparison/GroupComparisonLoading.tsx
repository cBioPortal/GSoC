import * as React from 'react';
import { observer } from 'mobx-react';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import { AppStore } from '../../AppStore';
import { computed, observable, makeObservable } from 'mobx';
import { getStudySummaryUrl } from '../../shared/api/urls';

export interface IGroupComparisonLoadingProps {
    routing: any;
    appStore: AppStore;
}

export type GroupComparisonLoadingParams = {
    phase: LoadingPhase;
    clinicalAttributeName: string;
    origin: string;
};

export enum LoadingPhase {
    DOWNLOADING_GROUPS = 'downloading',
    CREATING_SESSION = 'creating_session',
}

@observer
export default class GroupComparisonLoading extends React.Component<
    IGroupComparisonLoadingProps,
    {}
> {
    @observable studyViewWindowClosed = false;
    private pingedFromStudyView = false;
    private studyViewInterval: any;

    constructor(props: IGroupComparisonLoadingProps) {
        super(props);

        makeObservable(this);

        (window as any).ping = () => {
            this.pingedFromStudyView = true;
        };

        this.studyViewInterval = setInterval(() => {
            if (!this.pingedFromStudyView) {
                this.studyViewWindowClosed = true;
                clearInterval(this.studyViewInterval);
            }
            this.pingedFromStudyView = false;
        }, 2000);
    }

    componentWillUnmount() {
        clearInterval(this.studyViewInterval);
    }

    render() {
        const query = (window as any).routingStore.query as Partial<
            GroupComparisonLoadingParams
        >;
        if (this.studyViewWindowClosed) {
            return (
                <div
                    style={{
                        position: 'absolute',
                        width: 300,
                        left: '50%',
                        top: 200,
                        transform: 'translate(-50%, 0)',
                    }}
                >
                    <div className="alert alert-error">
                        <i
                            className="fa fa-md fa-exclamation-triangle"
                            style={{ marginRight: 7 }}
                        />
                        Sorry - please don't close the Study Summary window
                        until the comparison page has finished loading.
                        <br />
                        <br />
                        <a href={getStudySummaryUrl(query.origin!.split(','))}>
                            Back to Study Summary
                        </a>
                    </div>
                </div>
            );
        } else {
            const ret: JSX.Element[] = [];
            switch (query.phase) {
                case LoadingPhase.DOWNLOADING_GROUPS:
                    if (query.clinicalAttributeName) {
                        ret.push(
                            <div>
                                Loading each subgroup of{' '}
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    {query.clinicalAttributeName}...
                                </span>
                            </div>
                        );
                    } else {
                        ret.push(<div>Creating groups...</div>);
                    }
                    break;
                case LoadingPhase.CREATING_SESSION:
                    ret.push(<div>Groups loaded.</div>);
                    ret.push(<div>Creating comparison session...</div>);
                    break;
                default:
                    ret.push(
                        <div>Redirecting you to the Comparison page...</div>
                    );
            }
            return (
                <LoadingIndicator center={true} isLoading={true} size="big">
                    <div style={{ marginTop: 20 }}>{ret}</div>
                </LoadingIndicator>
            );
        }
    }
}
