import React, { useState } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import classnames from 'classnames';
import { IndicatorQueryResp, MutationEffectResp } from 'oncokb-ts-api-client';
import Tooltip from 'rc-tooltip';
import { OncoKbCardDataType } from 'cbioportal-utils';

import {
    annotationIconClassNames,
    calcHighestIndicatorLevel,
    normalizeLevel,
} from '../util/OncoKbUtils';
import { OncoKbCardLevelsOfEvidenceDropdown } from './OncoKbCardLevelsOfEvidenceDropdown';
import OncoKBSuggestAnnotationLinkout from './OncoKBSuggestAnnotationLinkout';
import OncoKbHelper from './OncoKbHelper';
import { OncoKbTreatmentTable } from './OncoKbTreatmentTable';
import { BiologicalContent } from './oncokbCard/BiologicalContent';
import { ImplicationContent } from './oncokbCard/ImplicationContent';

import tabsStyles from './tabs.module.scss';
import mainStyles from './main.module.scss';
import OncogenicIcon from './icon/OncogenicIcon';
import LevelIcon from './icon/LevelIcon';

const OncoKbMedicalDisclaimer = (
    <p className={mainStyles.disclaimer}>
        The information above is intended for research purposes only and should
        not be used as a substitute for professional diagnosis and treatment.
    </p>
);

const ONCOKB_DATA_ACCESS_PAGE_LINK =
    'https://docs.cbioportal.org/2.4-integration-with-other-webservices/oncokb-data-access';

const publicInstanceDisclaimerOverLay = (
    <div>
        <p>
            This cBioPortal instance is not linked to an OncoKB™ license, and
            therefore some OncoKB content is not available including
            therapeutic, diagnostic and prognostic implications. To obtain a
            license, please follow{' '}
            <a href={ONCOKB_DATA_ACCESS_PAGE_LINK} target={'_blank'}>
                these instructions
            </a>
            .
        </p>
        {OncoKbMedicalDisclaimer}
    </div>
);

const DATA_TYPE_TO_TITLE = {
    [OncoKbCardDataType.BIOLOGICAL]: 'Biological Effect',
    [OncoKbCardDataType.TXS]: 'Therapeutic Implications',
    [OncoKbCardDataType.TXR]: 'Therapeutic Implications',
    [OncoKbCardDataType.DX]: 'Diagnostic Implications',
    [OncoKbCardDataType.PX]: 'Prognostic Implications',
};

export type OncoKbCardBodyProps = {
    type: OncoKbCardDataType;
    geneNotExist: boolean;
    isCancerGene: boolean;
    hugoSymbol: string;
    indicator?: IndicatorQueryResp;
    usingPublicOncoKbInstance: boolean;
    displayHighestLevelInTabTitle?: boolean;
};

const TabContentWrapper: React.FunctionComponent<{}> = props => {
    return <div className={mainStyles['tab-content']}>{props.children}</div>;
};

const TabTitle: React.FunctionComponent<{
    type: OncoKbCardDataType;
    indicator?: IndicatorQueryResp;
    displayHighestLevelInTabTitle?: boolean;
}> = props => {
    const title = DATA_TYPE_TO_TITLE[props.type];
    const icon = props.displayHighestLevelInTabTitle ? (
        props.type === OncoKbCardDataType.BIOLOGICAL ? (
            <OncogenicIcon
                oncogenicity={props.indicator?.oncogenic || ''}
                showDescription={true}
            />
        ) : (
            <LevelIcon
                level={
                    normalizeLevel(
                        calcHighestIndicatorLevel(props.type, props.indicator)
                    ) || ''
                }
                showDescription={true}
            />
        )
    ) : null;

    return icon ? (
        <span style={{ display: 'flex' }}>
            {icon} {title}
        </span>
    ) : (
        <span>{title}</span>
    );
};

export const OncoKbCardBody: React.FunctionComponent<OncoKbCardBodyProps> = props => {
    let defaultTabActiveKey: OncoKbCardDataType | undefined;
    // Do not assign a default key if the data type specified through the property does not have any content
    // When the content is not available, we do not render the tab.
    if (dataTypeHasContent(props.type)) {
        defaultTabActiveKey = props.type;
        // Both TXS and TXR are therapeutic implication data type which will be shown in the same tab. We use TXS as the tab key when rendering
        if (
            [OncoKbCardDataType.TXS, OncoKbCardDataType.TXR].includes(
                defaultTabActiveKey
            )
        ) {
            defaultTabActiveKey = OncoKbCardDataType.TXS;
        }
    }

    const [activateTabKey, setActivateTabKey] = useState(defaultTabActiveKey);
    const [levelsOfEvidence, setLevelsOfEvidence] = useState(
        getLevelsOfEvidence(activateTabKey)
    );

    function updateActivateTabKey(newKey: any) {
        setActivateTabKey(newKey);
        setLevelsOfEvidence(getLevelsOfEvidence(newKey));
    }

    function hasMutationEffectInfo(mutationEffect?: MutationEffectResp) {
        return (
            mutationEffect &&
            (mutationEffect.description ||
                mutationEffect.citations.abstracts.length > 0 ||
                mutationEffect.citations.pmids.length > 0)
        );
    }

    function dataTypeHasContent(type: OncoKbCardDataType) {
        switch (type) {
            case OncoKbCardDataType.BIOLOGICAL:
                return hasMutationEffectInfo(props.indicator?.mutationEffect);
            case OncoKbCardDataType.TXS:
            case OncoKbCardDataType.TXR:
                return (
                    !!props.indicator?.highestSensitiveLevel ||
                    !!props.indicator?.highestResistanceLevel
                );
            case OncoKbCardDataType.DX:
                return !!props.indicator?.highestDiagnosticImplicationLevel;
            case OncoKbCardDataType.PX:
                return !!props.indicator?.highestPrognosticImplicationLevel;
            default:
                return false;
        }
    }

    function getBody(type: OncoKbCardDataType, indicator: IndicatorQueryResp) {
        const tabs = [];
        if (dataTypeHasContent(OncoKbCardDataType.BIOLOGICAL)) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.BIOLOGICAL}
                    title={
                        <TabTitle
                            type={OncoKbCardDataType.BIOLOGICAL}
                            indicator={props.indicator}
                            displayHighestLevelInTabTitle={
                                props.displayHighestLevelInTabTitle
                            }
                        />
                    }
                >
                    <TabContentWrapper>
                        <BiologicalContent
                            mutationEffectCitations={
                                indicator.mutationEffect.citations
                            }
                            biologicalSummary={
                                indicator.mutationEffect.description
                            }
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.TXS)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.TXS}
                    title={
                        <TabTitle
                            type={OncoKbCardDataType.TXS}
                            indicator={props.indicator}
                            displayHighestLevelInTabTitle={
                                props.displayHighestLevelInTabTitle
                            }
                        />
                    }
                >
                    <TabContentWrapper>
                        <div
                            style={{
                                marginTop: 10,
                            }}
                        >
                            <OncoKbTreatmentTable
                                variant={indicator.query.alteration || ''}
                                treatments={indicator.treatments!}
                            />
                        </div>
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.DX)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.DX}
                    title={
                        <TabTitle
                            type={OncoKbCardDataType.DX}
                            indicator={props.indicator}
                            displayHighestLevelInTabTitle={
                                props.displayHighestLevelInTabTitle
                            }
                        />
                    }
                >
                    <TabContentWrapper>
                        <ImplicationContent
                            variant={indicator.query.alteration}
                            summary={indicator.diagnosticSummary}
                            implications={indicator.diagnosticImplications}
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.PX)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.PX}
                    title={
                        <TabTitle
                            type={OncoKbCardDataType.PX}
                            indicator={props.indicator}
                            displayHighestLevelInTabTitle={
                                props.displayHighestLevelInTabTitle
                            }
                        />
                    }
                >
                    <TabContentWrapper>
                        <ImplicationContent
                            variant={indicator.query.alteration}
                            summary={indicator.prognosticSummary}
                            implications={indicator.prognosticImplications}
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        return (
            <div style={{ padding: '10px' }}>
                <p>{indicator.geneSummary}</p>
                <p>{indicator.variantSummary}</p>
                {props.usingPublicOncoKbInstance ? (
                    <p className={mainStyles.disclaimer}>
                        Therapeutic, diagnostic and prognostic implications are
                        not available in this instance of cBioPortal.{' '}
                        <Tooltip
                            overlayStyle={{
                                maxWidth: 400,
                            }}
                            overlay={publicInstanceDisclaimerOverLay}
                        >
                            <i className={'fa fa-info-circle'} />
                        </Tooltip>
                    </p>
                ) : (
                    <p>{indicator.tumorTypeSummary}</p>
                )}
                {tabs.length > 0 && (
                    <Tabs
                        defaultActiveKey={defaultTabActiveKey}
                        className={classnames('oncokb-card-tabs')}
                        onSelect={updateActivateTabKey}
                    >
                        {tabs}
                    </Tabs>
                )}
            </div>
        );
    }

    function getLevelsOfEvidence(activateTabKey?: OncoKbCardDataType) {
        switch (activateTabKey) {
            case OncoKbCardDataType.TXS:
            case OncoKbCardDataType.TXR:
                return {
                    levels: OncoKbHelper.TX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(activateTabKey),
                };
            case OncoKbCardDataType.DX:
                return {
                    levels: OncoKbHelper.DX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(OncoKbCardDataType.DX),
                };
            case OncoKbCardDataType.PX:
                return {
                    levels: OncoKbHelper.PX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(OncoKbCardDataType.PX),
                };
            default:
                return {
                    levels: [],
                    levelDes: {},
                };
        }
    }

    const UNKNOWN = 'Unknown';

    function getOncogenicity() {
        let oncogenicity = props.indicator?.oncogenic;
        if (!oncogenicity || oncogenicity === UNKNOWN) {
            oncogenicity = 'Unknown Oncogenic Effect';
        }
        return oncogenicity;
    }

    function getMutationEffect() {
        let mutationEffect = props.indicator?.mutationEffect.knownEffect;
        if (!mutationEffect || mutationEffect === UNKNOWN) {
            mutationEffect = 'Unknown Biological Effect';
        }
        return mutationEffect;
    }

    return (
        <>
            {!props.geneNotExist && (
                <div>
                    {props.indicator && (
                        <>
                            <div className={mainStyles['biological-info']}>
                                <div style={{ flexGrow: 1 }}>
                                    {getOncogenicity()}
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    {getMutationEffect()}
                                </div>
                            </div>
                            <div
                                className={mainStyles['oncokb-card']}
                                data-test="oncokb-card"
                            >
                                {getBody(props.type, props.indicator)}
                            </div>
                        </>
                    )}
                    {!props.usingPublicOncoKbInstance && (
                        <>
                            {/*Use tab pane style for the disclaimer to keep the consistency since the info is attached right under the tab pane*/}
                            <div className={tabsStyles['tab-pane']}>
                                {OncoKbMedicalDisclaimer}
                            </div>
                            {levelsOfEvidence &&
                                levelsOfEvidence.levels.length > 0 && (
                                    <OncoKbCardLevelsOfEvidenceDropdown
                                        levels={levelsOfEvidence.levels}
                                        levelDes={levelsOfEvidence.levelDes}
                                    />
                                )}
                        </>
                    )}
                </div>
            )}
            {!props.isCancerGene && (
                <div
                    className={mainStyles['additional-info']}
                    data-test={'oncokb-card-additional-info'}
                >
                    There is currently no information about this gene in OncoKB.
                </div>
            )}
            {props.geneNotExist && props.isCancerGene && (
                <div className={mainStyles['additional-info']}>
                    <OncoKBSuggestAnnotationLinkout gene={props.hugoSymbol!} />
                </div>
            )}
        </>
    );
};
