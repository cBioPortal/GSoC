import _ from 'lodash';
import * as React from 'react';
import styles from './styles/styles.module.scss';
import { QueryStore, QueryStoreComponent } from './QueryStore';
import { observer } from 'mobx-react';
import { FlexRow } from '../flexbox/FlexBox';
import SectionHeader from '../sectionHeader/SectionHeader';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { MakeMobxView } from '../MobxView';
import { remoteData } from 'cbioportal-frontend-commons';
import { getMolecularProfileOptions } from './QueryStoreUtils';

@observer
export default class DataTypePrioritySelector extends QueryStoreComponent<
    {},
    {}
> {
    readonly molecularProfileCategorySet = remoteData({
        await: () => [this.store.validProfileIdSetForSelectedStudies],
        invoke: () => {
            return Promise.resolve(
                getMolecularProfileOptions(
                    this.store.validProfileIdSetForSelectedStudies.result
                )
            );
        },
        default: [],
    });

    readonly flexRowContent = MakeMobxView({
        await: () => [this.molecularProfileCategorySet],
        render: () => {
            return (
                <div style={{ display: 'flex' }}>
                    {this.molecularProfileCategorySet.result.map(option => {
                        return (
                            <DataTypePriorityCheckBox
                                label={option.label}
                                id={option.id}
                                profileTypes={option.profileTypes}
                                store={this.store}
                            />
                        );
                    })}
                </div>
            );
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => (
            <span key="error">
                Error loading profiles for selected studies.
            </span>
        ),
    });

    render() {
        if (!this.store.isVirtualStudyQuery) return null;

        return (
            <FlexRow
                padded
                className={styles.DataTypePrioritySelector}
                data-test="dataTypePrioritySelector"
            >
                <SectionHeader className="sectionLabel">
                    Select Molecular Profiles:
                </SectionHeader>
                <FlexRow>{this.flexRowContent.component}</FlexRow>
            </FlexRow>
        );
    }
}

export const DataTypePriorityCheckBox = observer(
    (props: {
        label: string;
        id: string;
        profileTypes: string[];
        store: QueryStore;
    }) => {
        // as long as a profile type matches any selected profile
        // we consider it selected
        let isSelected = props.profileTypes.some(profileType => {
            return props.store.isProfileTypeSelected(profileType);
        });

        return (
            <label className={styles.DataTypePriorityLabel}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={event => {
                        props.store.setProfileTypes(
                            props.profileTypes,
                            event.currentTarget.checked
                        );
                    }}
                    data-test={props.id}
                />
                {props.label}
            </label>
        );
    }
);
