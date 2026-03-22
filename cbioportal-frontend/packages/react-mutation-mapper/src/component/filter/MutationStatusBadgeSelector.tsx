import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { formatPercentValue } from 'cbioportal-utils';

import BadgeSelector, {
    BadgeSelectorOption,
    BadgeSelectorProps,
} from './BadgeSelector';

export type MutationStatusBadgeSelectorProps = BadgeSelectorProps & {
    rates?: { [mutationStatus: string]: number };
    badgeSelectorOptions?: BadgeSelectorOption[];
};

export const MUTATION_STATUS_BADGE_STYLE_OVERRIDE = {
    color: '#000',
    backgroundColor: '#FFF',
    borderColor: '#FFF',
};

export function getMutationStatusFilterOptions() {
    return [
        {
            value: 'somatic',
            label: 'Somatic Mutation Frequency',
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
        },
        {
            value: 'germline',
            label: 'Germline Mutation Frequency',
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
        },
    ];
}

@observer
export class MutationStatusBadgeSelector extends React.Component<
    MutationStatusBadgeSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<MutationStatusBadgeSelectorProps> = {
        badgeSelectorOptions: getMutationStatusFilterOptions(),
    };

    @computed
    public get options() {
        return this.props.badgeSelectorOptions!.map(option => ({
            ...option,
            badgeContent: this.props.rates
                ? `${formatPercentValue(this.props.rates[option.value])}%`
                : undefined,
        }));
    }

    public render() {
        return (
            <table>
                <BadgeSelector options={this.options} {...this.props} />
            </table>
        );
    }
}

export default MutationStatusBadgeSelector;
