import * as React from 'react';
import {
    MUT_COLOR_MISSENSE,
    MUT_COLOR_TRUNC,
    MUT_COLOR_INFRAME,
    STRUCTURAL_VARIANT_COLOR,
    MUT_COLOR_SPLICE,
    MUT_COLOR_OTHER,
} from 'cbioportal-frontend-commons';

type DefaultLollipopPlotLegendProps = {
    missenseColor?: string;
    truncatingColor?: string;
    inframeColor?: string;
    spliceColor?: string;
    fusionColor?: string;
    otherColor?: string;
};

export default class DefaultLollipopPlotLegend extends React.Component<
    DefaultLollipopPlotLegendProps
> {
    public static defaultProps: DefaultLollipopPlotLegendProps = {
        missenseColor: MUT_COLOR_MISSENSE,
        truncatingColor: MUT_COLOR_TRUNC,
        inframeColor: MUT_COLOR_INFRAME,
        spliceColor: MUT_COLOR_SPLICE,
        fusionColor: STRUCTURAL_VARIANT_COLOR,
        otherColor: MUT_COLOR_OTHER,
    };

    public render() {
        return (
            <div style={{ maxWidth: 700, marginTop: 5 }}>
                <strong style={{ color: '#2153AA' }}>Color Codes</strong>
                <p>
                    Mutation diagram circles are colored with respect to the
                    corresponding mutation types. In case of different mutation
                    types at a single position, color of the circle is
                    determined with respect to the most frequent mutation type.
                </p>
                <br />
                <div>
                    Mutation types and corresponding color codes are as follows:
                    <ul>
                        <li>
                            <strong style={{ color: this.props.missenseColor }}>
                                Missense Mutations
                            </strong>
                        </li>
                        <li>
                            <strong
                                style={{ color: this.props.truncatingColor }}
                            >
                                Truncating Mutations
                            </strong>
                            : Nonsense, Nonstop, Frameshift deletion, Frameshift
                            insertion, Splice site
                        </li>
                        <li>
                            <strong style={{ color: this.props.inframeColor }}>
                                Inframe Mutations
                            </strong>
                            : Inframe deletion, Inframe insertion
                        </li>
                        <li>
                            <strong style={{ color: this.props.spliceColor }}>
                                Splice Mutations
                            </strong>
                        </li>
                        <li>
                            <strong style={{ color: this.props.fusionColor }}>
                                Fusion Mutations
                            </strong>
                        </li>
                        <li>
                            <strong style={{ color: this.props.otherColor }}>
                                Other Mutations
                            </strong>
                            : All other types of mutations
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
