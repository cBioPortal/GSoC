import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import {
    BadgeLabel,
    MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
    MutationStatusBadgeSelector,
    MutationStatusBadgeSelectorProps,
} from 'react-mutation-mapper';

import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { formatPercentValue } from 'cbioportal-utils';

export function getFilterOptionLabel(content: {
    title: string;
    description?: string;
}): JSX.Element | string {
    if (content.description) {
        return (
            <span>
                {content.title}
                <DefaultTooltip
                    placement="right"
                    overlay={<span>{content.description}</span>}
                >
                    <i
                        className="fa fa-info-circle"
                        style={{ marginLeft: '0.2rem' }}
                    />
                </DefaultTooltip>
            </span>
        );
    } else {
        return content.title;
    }
}

type MutationStatusSelectorProps = MutationStatusBadgeSelectorProps & {
    somaticContent: { title: string; description?: string };
    germlineContent?: { title: string; description?: string };
};

@observer
export default class MutationStatusSelector extends React.Component<
    MutationStatusSelectorProps,
    {}
> {
    constructor(props: MutationStatusSelectorProps) {
        super(props);
        makeObservable(this);
    }
    @computed
    private get mutationStatusFilterOptions() {
        const options = [
            {
                value: 'Somatic',
                label: getFilterOptionLabel(this.props.somaticContent),
                badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
                badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            },
        ];

        if (this.props.germlineContent) {
            options.push({
                value: 'Germline',
                label: getFilterOptionLabel(this.props.germlineContent),
                badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
                badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            });
        }

        return options;
    }

    private get somaticInfo() {
        return this.props.rates ? (
            <BadgeLabel
                label={getFilterOptionLabel(this.props.somaticContent)}
                badgeContent={`${formatPercentValue(
                    this.props.rates['Somatic']
                )}%`}
                badgeStyleOverride={
                    this.mutationStatusFilterOptions[0].badgeStyleOverride
                }
            />
        ) : null;
    }

    private get germlinePlaceholder() {
        return (
            <div
                data-test="germlineMutationRate"
                className="invisible"
                style={{ display: 'none' }}
            >
                %
            </div>
        );
    }

    public render() {
        // Render the actual selector only if germline content exists.
        // Otherwise just display the somatic info without a filter option.
        return this.props.germlineContent === undefined ? (
            <React.Fragment>
                {this.somaticInfo}
                {this.germlinePlaceholder}
            </React.Fragment>
        ) : (
            <MutationStatusBadgeSelector
                badgeSelectorOptions={this.mutationStatusFilterOptions}
                {...this.props}
            />
        );
    }
}
