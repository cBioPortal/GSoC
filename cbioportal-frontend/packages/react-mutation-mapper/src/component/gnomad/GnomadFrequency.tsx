import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { GnomadSummary } from '../../model/GnomadSummary';
import GnomadFrequencyTable from './GnomadFrequencyTable';
import {
    getGnomadData,
    getGnomadDataSortedByFrequency,
    getGnomadUrl,
    sortGnomadDataByFrequency,
} from '../../util/GnomadUtils';

export type GnomadFrequencyProps = {
    myVariantInfo?: MyVariantInfo;
    annotation?: VariantAnnotation;
};

export const GnomadFrequencyValue: React.FunctionComponent<{
    gnomadData?: { [key: string]: GnomadSummary };
}> = props => {
    if (props.gnomadData) {
        // The column will show the total frequency
        // Column will show 0 if the total frequency is 0, still has the tooltip to show the gnomad table (since gnomad data is still available)
        if (props.gnomadData['Total'].alleleFrequency === 0) {
            return <span>0</span>;
        } else {
            // show frequency as number with 4 significant digits
            return (
                <span>
                    {props.gnomadData['Total'].alleleFrequency.toLocaleString(
                        undefined,
                        {
                            maximumSignificantDigits: 2,
                            minimumSignificantDigits: 2,
                        }
                    )}
                </span>
            );
        }
    } else {
        return (
            <span
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden',
                }}
            >
                &nbsp;
            </span>
        );
    }
};

export const GnomadFrequencyBreakdown: React.FunctionComponent<GnomadFrequencyProps & {
    gnomadData?: { [key: string]: GnomadSummary };
    hideDisclaimer?: boolean;
}> = props => {
    const myVariantInfo = props.myVariantInfo;
    let content = <span>Variant has no data in gnomAD.</span>;

    // Checking if gnomad data is valid
    if (
        myVariantInfo &&
        (myVariantInfo.gnomadExome || myVariantInfo.gnomadGenome)
    ) {
        const gnomadUrl = getGnomadUrl(props.annotation, myVariantInfo);
        const sorted = props.gnomadData
            ? sortGnomadDataByFrequency(props.gnomadData)
            : getGnomadDataSortedByFrequency(myVariantInfo);

        if (sorted) {
            content = (
                <GnomadFrequencyTable
                    data={sorted}
                    gnomadUrl={gnomadUrl}
                    hideDisclaimer={props.hideDisclaimer}
                />
            );
        }
    }

    return content;
};

@observer
export default class GnomadFrequency extends React.Component<
    GnomadFrequencyProps,
    {}
> {
    public render() {
        const gnomadData = getGnomadData(this.props.myVariantInfo);

        return (
            <DefaultTooltip
                overlay={() => (
                    <GnomadFrequencyBreakdown
                        {...this.props}
                        gnomadData={gnomadData}
                    />
                )}
                placement="topRight"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                <span>
                    <GnomadFrequencyValue gnomadData={gnomadData} />
                </span>
            </DefaultTooltip>
        );
    }
}
