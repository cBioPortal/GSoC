import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import { MolecularProfile, CancerStudy } from 'cbioportal-ts-api-client';
import autobind from 'autobind-decorator';
import MolecularProfileSelector from '../../../shared/components/MolecularProfileSelector';
import _ from 'lodash';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import FontAwesome from 'react-fontawesome';

export interface IEnrichmentsDataSetDropdownProps {
    dataSets: MolecularProfile[];
    onChange: (studyMolecularProfileMap: {
        [id: string]: MolecularProfile;
    }) => void;
    selectedProfileByStudyId: {
        [id: string]: Pick<MolecularProfile, 'molecularProfileId'>;
    };
    studies: CancerStudy[];
    alwaysShow?: boolean;
    showDescription?: boolean;
}

@observer
export default class EnrichmentsDataSetDropdown extends React.Component<
    IEnrichmentsDataSetDropdownProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @autobind
    private change(selectedStudyId: string, o: any) {
        let updatedStudyMolecularProfileMap = _.mapValues(
            this.props.selectedProfileByStudyId,
            (molecularProfile, studyId) => {
                if (selectedStudyId === studyId) {
                    return this.molecularProfileMap[o.value];
                }
                return this.molecularProfileMap[
                    molecularProfile.molecularProfileId
                ];
            }
        );
        // only update if the options are changed
        if (
            !_.isEqual(
                this.props.selectedProfileByStudyId,
                updatedStudyMolecularProfileMap
            )
        ) {
            this.props.onChange(updatedStudyMolecularProfileMap);
        }
    }

    @computed private get studiesMap() {
        return _.keyBy(this.props.studies, x => x.studyId);
    }

    @computed private get molecularProfileMap() {
        return _.keyBy(this.props.dataSets, x => x.molecularProfileId);
    }

    @computed private get showEnrichmentsDataSetDropdown() {
        let molecularProfilesMap = _.groupBy(
            this.props.dataSets,
            profile => profile.studyId
        );
        return _.some(
            molecularProfilesMap,
            molecularProfiles => molecularProfiles.length > 1
        );
    }

    public render() {
        if (this.showEnrichmentsDataSetDropdown || !!this.props.alwaysShow) {
            let studyProfilesMap = _.groupBy(
                this.props.dataSets,
                x => x.studyId
            );
            const includeStudyName = Object.keys(studyProfilesMap).length > 1;
            return _.map(studyProfilesMap, (molecularProfiles, studyId) => {
                const selectedProfile = _.find(
                    molecularProfiles,
                    profile =>
                        profile.molecularProfileId ===
                        this.props.selectedProfileByStudyId[studyId]
                            .molecularProfileId
                )!;
                return (
                    <div className={styles.DataSet}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <strong>
                                {includeStudyName
                                    ? this.studiesMap[studyId].name + ' '
                                    : ''}
                                Data Set:
                            </strong>
                            <div
                                style={{
                                    display: 'inline-block',
                                    marginLeft: 5,
                                    width: 400,
                                }}
                            >
                                <MolecularProfileSelector
                                    value={
                                        this.props.selectedProfileByStudyId[
                                            studyId
                                        ].molecularProfileId
                                    }
                                    molecularProfiles={molecularProfiles}
                                    onChange={(o: any) =>
                                        this.change(studyId, o)
                                    }
                                />
                            </div>
                            {this.props.showDescription &&
                                selectedProfile.description && (
                                    <DefaultTooltip
                                        mouseEnterDelay={0}
                                        placement="right"
                                        overlay={
                                            <div
                                                className={
                                                    styles.ProfileTooltip
                                                }
                                            >
                                                {selectedProfile.description}
                                            </div>
                                        }
                                    >
                                        <FontAwesome
                                            className={styles.ProfileInfoIcon}
                                            name="info-circle"
                                        />
                                    </DefaultTooltip>
                                )}
                        </div>
                    </div>
                );
            });
        }
        return null;
    }
}
