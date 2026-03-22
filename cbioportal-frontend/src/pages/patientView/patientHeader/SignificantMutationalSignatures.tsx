import * as React from 'react';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { IMutationalSignature } from '../../../shared/model/MutationalSignature';
import '../../../shared/components/simpleTable/styles.scss';
import {
    SampleProgressBar,
    getSignificantMutationalSignatures,
    getColorByMutationalSignatureCategory,
} from '../../../shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import _ from 'lodash';
import { ProgressBar } from 'react-bootstrap';

interface ISignificantMutationalSignaturesProps {
    data: { [version: string]: IMutationalSignature[] };
    sampleId: string;
    version: string;
}

export default class SignificantMutationalSignatures extends React.Component<
    ISignificantMutationalSignaturesProps,
    {}
> {
    public render() {
        const significantMutationalSignaturesForSample: IMutationalSignature[] = getSignificantMutationalSignatures(
            this.props.data[this.props.version],
            this.props.sampleId
        );

        if (_.isEmpty(significantMutationalSignaturesForSample)) {
            return null;
        } else {
            return (
                <DefaultTooltip
                    placement="bottomLeft"
                    trigger={['hover', 'focus']}
                    overlay={this.makeTooltipContent(
                        significantMutationalSignaturesForSample
                    )}
                    destroyTooltipOnHide={false}
                    onPopupAlign={placeArrowBottomLeft}
                >
                    {this.makeProgressBar(
                        significantMutationalSignaturesForSample
                    )}
                </DefaultTooltip>
            );
        }
    }

    private makeTooltipContent(
        significantMutationalSignaturesForSample: IMutationalSignature[]
    ) {
        const dataToShow =
            significantMutationalSignaturesForSample.length <= 5
                ? significantMutationalSignaturesForSample
                : significantMutationalSignaturesForSample.slice(0, 10);
        const numberSignatures =
            significantMutationalSignaturesForSample.length <= 5
                ? significantMutationalSignaturesForSample.length
                : 10;
        return (
            <div
                style={{ maxWidth: 250 }}
                data-test="SignificantMutationalSignaturesTooltip"
            >
                <div>
                    {significantMutationalSignaturesForSample.length <= 5 ? (
                        <h5>Significant signatures</h5>
                    ) : (
                        <h5>Top {numberSignatures} signatures</h5>
                    )}
                    {_.map(dataToShow, significantSignature => (
                        <div>
                            <a href={significantSignature.meta?.url || '#'}>
                                {significantSignature.meta?.name || 'NA'}
                            </a>
                            <span>: </span>
                            <span>
                                {significantSignature.meta?.description || 'NA'}
                            </span>
                        </div>
                    ))}
                </div>
                <hr style={{ marginTop: 10, marginBottom: 10 }} />
                <table>
                    <th>Significant Mutational Signatures</th>
                    <th>Exposure</th>
                    {dataToShow.map(significantSignature => (
                        <tr>
                            <td style={{ paddingTop: 3 }}>
                                {significantSignature.meta?.name || 'NA'}
                            </td>
                            <td style={{ paddingTop: 3 }}>
                                <SampleProgressBar
                                    contribution={significantSignature.value.toString()}
                                    color={getColorByMutationalSignatureCategory(
                                        significantSignature.meta?.category ||
                                            'NA'
                                    )}
                                />
                            </td>
                        </tr>
                    ))}
                </table>
            </div>
        );
    }

    private makeProgressBar(
        significantMutationalSignaturesForSample: IMutationalSignature[]
    ) {
        const sumByCategory: { [color: string]: number } = _.reduce(
            significantMutationalSignaturesForSample,
            (acc, significantSignature) => {
                const color = getColorByMutationalSignatureCategory(
                    significantSignature.meta?.category
                );
                if (color in acc) {
                    acc[color] += significantSignature.value;
                } else {
                    acc[color] = significantSignature.value;
                }
                return acc;
            },
            {} as { [color: string]: number }
        );
        const stackedProgressBars = _.map(sumByCategory, (sum, color) => {
            return (
                <ProgressBar
                    style={{ backgroundColor: color }}
                    now={Math.floor(sum * 100)}
                    key={color}
                />
            );
        });

        return (
            <span style={{ padding: '0px 13px', height: 20, width: 100 }}>
                <ProgressBar
                    style={{ height: 10, marginTop: 4, marginBottom: 0 }}
                >
                    {stackedProgressBars}
                </ProgressBar>
            </span>
        );
    }
}
