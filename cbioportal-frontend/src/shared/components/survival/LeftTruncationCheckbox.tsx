import React from 'react';
import _ from 'lodash';
import FlexAlignedCheckbox from 'shared/components/FlexAlignedCheckbox';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { calculateNumberOfPatients } from 'pages/resultsView/survival/SurvivalUtil';

export type LeftTruncationCheckboxProps = {
    className: string;
    onToggleSurvivalPlotLeftTruncation?: () => void;
    isLeftTruncationChecked?: boolean;
    patientSurvivalsWithoutLeftTruncation?: PatientSurvival[];
    patientToAnalysisGroups: { [uniquePatientKey: string]: string[] };
    sortedGroupedSurvivals: { [group: string]: PatientSurvival[] };
};

const LeftTruncationCheckbox: React.FunctionComponent<LeftTruncationCheckboxProps> = props => {
    return (
        <div className={props.className}>
            <span onClick={props.onToggleSurvivalPlotLeftTruncation}>
                <FlexAlignedCheckbox
                    checked={!!props.isLeftTruncationChecked}
                    label={
                        <span
                            style={{
                                marginTop: -3,
                                paddingRight: 10,
                            }}
                        >
                            Adjust for left truncation
                            {props.isLeftTruncationChecked && (
                                <>
                                    {' ('}
                                    <b>
                                        {calculateNumberOfPatients(
                                            props.patientSurvivalsWithoutLeftTruncation!,
                                            props.patientToAnalysisGroups
                                        ) -
                                            calculateNumberOfPatients(
                                                _.flatMap(
                                                    props.sortedGroupedSurvivals
                                                ),
                                                props.patientToAnalysisGroups
                                            )}
                                    </b>{' '}
                                    patients excluded)
                                </>
                            )}
                            <DefaultTooltip
                                overlay={
                                    <div
                                        style={{
                                            maxWidth: 300,
                                        }}
                                    >
                                        Patients enter a study when they are
                                        profiled, which can be months or even
                                        years after the initial diagnosis. To
                                        mitigate the effects of left truncation
                                        one can enable the risk-set adjustment
                                        method as described in{' '}
                                        <a href="https://pubmed.ncbi.nlm.nih.gov/34734967/">
                                            Brown et al (2022)
                                        </a>
                                        {'. '}
                                        This involves adjusting patients at risk
                                        at time t to date of sequencing rather
                                        than date of diagnosis. Note that some
                                        patients might be excluded because they
                                        passed away before their biopsies were
                                        sequenced.
                                    </div>
                                }
                                placement="bottom"
                            >
                                <i
                                    className="fa fa-info-circle"
                                    style={Object.assign(
                                        {},
                                        {
                                            color: '#000000',
                                            cursor: 'pointer',
                                            paddingLeft: 5,
                                        }
                                    )}
                                />
                            </DefaultTooltip>
                        </span>
                    }
                    style={{ marginTop: 1, marginBottom: -3 }}
                />
            </span>
        </div>
    );
};

export default LeftTruncationCheckbox;
