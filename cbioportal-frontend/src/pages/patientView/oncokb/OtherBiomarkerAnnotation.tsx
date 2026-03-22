import * as React from 'react';
import {
    OncoKB,
    OTHER_BIOMARKER_HUGO_SYMBOL,
    OtherBiomarkersQueryType,
    OTHER_BIOMARKER_NAME,
} from 'oncokb-frontend-commons';
import 'oncokb-frontend-commons/dist/styles.css';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { calculateOncoKbAvailableDataType } from 'oncokb-frontend-commons';

export const OtherBiomarkerAnnotation: React.FunctionComponent<{
    type: OtherBiomarkersQueryType;
    isPublicOncoKbInstance: boolean;
    annotation: IndicatorQueryResp;
}> = props => {
    return (
        <span className="clinical-spans">
            {OTHER_BIOMARKER_NAME[props.type]}
            <span
                style={{
                    marginLeft: 2,
                    display: 'flex',
                }}
            >
                <OncoKB
                    usingPublicOncoKbInstance={props.isPublicOncoKbInstance}
                    isCancerGene={true}
                    geneNotExist={false}
                    hugoGeneSymbol={OTHER_BIOMARKER_HUGO_SYMBOL}
                    status={'complete'}
                    availableDataTypes={calculateOncoKbAvailableDataType([
                        props.annotation,
                    ])}
                    indicator={props.annotation}
                />
            </span>
        </span>
    );
};
