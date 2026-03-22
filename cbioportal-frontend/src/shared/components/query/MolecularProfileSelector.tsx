import _ from 'lodash';
import * as React from 'react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import FontAwesome from 'react-fontawesome';
import styles from './styles/styles.module.scss';
import { observer } from 'mobx-react';
import { FlexRow } from '../flexbox/FlexBox';
import { QueryStoreComponent } from './QueryStore';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SectionHeader from '../sectionHeader/SectionHeader';
import { getServerConfig } from 'config/config';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import { allowExpressionCrossStudy } from 'shared/lib/allowExpressionCrossStudy';

@observer
export default class MolecularProfileSelector extends QueryStoreComponent<
    {},
    {}
> {
    private get showGSVA() {
        return getServerConfig().skin_show_gsva;
    }

    render() {
        // we pass default=false because when there is no configuration
        // we want to maintain legacy behavior of forbidding expression comparison
        // so we don't change current behavior of all portals
        const allowExpression = allowExpressionCrossStudy(
            this.store.selectedPhysicalStudies.result!,
            getServerConfig().enable_cross_study_expression,
            false
        );

        // we currently use the same logic as for expression data
        const allowProteinLevel = allowExpression;

        return (
            <FlexRow padded className={styles.MolecularProfileSelector}>
                <SectionHeader
                    className="sectionLabel"
                    promises={[this.store.molecularProfilesInSelectedStudies]}
                >
                    Select Genomic Profiles:
                </SectionHeader>
                <div
                    className={styles.group}
                    data-test="molecularProfileSelector"
                >
                    {this.renderGroup('MUTATION_EXTENDED', 'Mutation')}
                    {this.renderGroup(
                        'STRUCTURAL_VARIANT',
                        'Structural Variant'
                    )}
                    {this.renderGroup('COPY_NUMBER_ALTERATION', 'Copy Number')}
                    {this.showGSVA &&
                        this.renderGroup('GENESET_SCORE', 'GSVA scores')}

                    {allowExpression &&
                        this.renderGroup('MRNA_EXPRESSION', 'mRNA Expression')}

                    {this.renderGroup('METHYLATION', 'DNA Methylation')}
                    {this.renderGroup('METHYLATION_BINARY', 'DNA Methylation')}

                    {allowProteinLevel &&
                        this.renderGroup(
                            'PROTEIN_LEVEL',
                            'Protein/phosphoprotein level'
                        )}

                    {!!(
                        this.store.molecularProfilesInSelectedStudies
                            .isComplete &&
                        !this.store.molecularProfilesInSelectedStudies.result
                            .length
                    ) && <strong>No studies selected</strong>}
                </div>
            </FlexRow>
        );
    }

    ProfileToggle = ({
        profile,
        type,
        label,
        checked,
        isGroupToggle,
    }: {
        profile: MolecularProfile;
        type: 'radio' | 'checkbox';
        label: string;
        checked: boolean;
        isGroupToggle: boolean;
    }) => (
        <label>
            <input
                type={type}
                checked={checked}
                onChange={event =>
                    this.store.selectMolecularProfile(
                        profile,
                        (event.target as HTMLInputElement).checked
                    )
                }
                data-test={profile.molecularAlterationType}
            />
            <span
                className={
                    isGroupToggle ? styles.groupName : styles.profileName
                }
            >
                {label}
            </span>
            {!isGroupToggle && (
                <DefaultTooltip
                    mouseEnterDelay={0}
                    placement="right"
                    overlay={
                        <div className={styles.tooltip}>
                            {profile.description}
                        </div>
                    }
                >
                    <FontAwesome
                        className={styles.infoIcon}
                        name="question-circle"
                    />
                </DefaultTooltip>
            )}
        </label>
    );

    renderGroup(
        molecularAlterationType: MolecularProfile['molecularAlterationType'],
        groupLabel: string
    ) {
        let profiles = this.store.getFilteredProfiles(molecularAlterationType);

        const groupedProfiles = _.groupBy(profiles, profile => {
            const profileType = profile.molecularProfileId.replace(
                new RegExp(profile.studyId + '_'),
                ''
            );
            return profileType;
        });

        profiles = _.map(groupedProfiles, arr => arr[0]);

        if (!profiles.length) return null;

        const isGroupSelected = _.some(profiles, profile =>
            this.store.isProfileTypeSelected(
                getSuffixOfMolecularProfile(profile)
            )
        );

        let output: JSX.Element[] = [];

        if (profiles.length > 1 && !this.store.forDownloadTab)
            output.push(
                <this.ProfileToggle
                    key={'altTypeCheckbox:' + molecularAlterationType}
                    profile={profiles[0]}
                    type="checkbox"
                    label={`${groupLabel}. Select one of the profiles below:`}
                    checked={isGroupSelected}
                    isGroupToggle={true}
                />
            );

        let profileToggles = profiles.map(profile => (
            <this.ProfileToggle
                key={'profile:' + profile.molecularProfileId}
                profile={profile}
                type={
                    this.store.forDownloadTab || profiles.length > 1
                        ? 'radio'
                        : 'checkbox'
                }
                label={
                    profile.molecularAlterationType === 'STRUCTURAL_VARIANT'
                        ? groupLabel
                        : profile.name
                }
                checked={this.store.isProfileTypeSelected(
                    getSuffixOfMolecularProfile(profile)
                )}
                isGroupToggle={false}
            />
        ));

        if (this.store.forDownloadTab || profiles.length == 1)
            output.push(...profileToggles);
        else
            output.push(
                <div
                    key={'group:' + molecularAlterationType}
                    className={styles.group}
                >
                    {profileToggles}
                </div>
            );

        if (this.store.forDownloadTab) return output;

        if (isGroupSelected && molecularAlterationType == 'MRNA_EXPRESSION') {
            output.push(
                <div key={output.length} className={styles.zScore}>
                    Enter a z-score threshold{' '}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: ['&', 'plusmn;'].join(''),
                        }}
                    />
                    <input
                        type="text"
                        value={this.store.zScoreThreshold}
                        onChange={event => {
                            this.store.zScoreThreshold = (event.target as HTMLInputElement).value;
                        }}
                    />
                </div>
            );
        }

        if (isGroupSelected && molecularAlterationType == 'PROTEIN_LEVEL') {
            output.push(
                <div key={output.length} className={styles.zScore}>
                    Enter a z-score threshold{' '}
                    <span
                        dangerouslySetInnerHTML={{
                            __html: ['&', 'plusmn;'].join(''),
                        }}
                    />
                    <input
                        type="text"
                        value={this.store.rppaScoreThreshold}
                        onChange={event => {
                            this.store.rppaScoreThreshold = (event.target as HTMLInputElement).value;
                        }}
                    />
                </div>
            );
        }

        return output;
    }
}
