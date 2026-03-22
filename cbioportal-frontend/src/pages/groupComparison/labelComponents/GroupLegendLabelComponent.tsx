import * as React from 'react';
import TruncatedTextWithTooltipSVG from '../../../shared/components/TruncatedTextWithTooltipSVG';
import { ComparisonGroup } from '../GroupComparisonUtils';
import { renderGroupNameWithOrdinal } from '../OverlapUtils';
import { insertBetween } from '../../../shared/lib/ArrayUtils';

export interface IGroupLegendLabelComponentProps {
    maxLabelWidth: number;
    uidToGroup: { [uid: string]: ComparisonGroup };
    dy?: string;
    dx?: string;

    // always there, given by victory, but has to be optional so we don't get typeerrors when passing it as a victory label component prop
    text?: string;

    // unused props given by victory that we have to extract
    datum?: any;
}

export const GroupLegendLabelComponent: React.FunctionComponent<IGroupLegendLabelComponentProps> = (
    props: IGroupLegendLabelComponentProps
) => {
    const { uidToGroup, dx, dy, datum, text, ...rest } = props;

    const group = uidToGroup[props.text!];
    return (
        <TruncatedTextWithTooltipSVG
            text={group!.name}
            prefixTspans={
                group!.ordinal.length > 0
                    ? [
                          <tspan>(</tspan>,
                          <tspan style={{ fontWeight: 'bold' }}>
                              {group!.ordinal}
                          </tspan>,
                          <tspan>) </tspan>,
                      ]
                    : undefined
            }
            tooltip={() => {
                return <div>{renderGroupNameWithOrdinal(group)}</div>;
            }}
            maxWidth={props.maxLabelWidth}
            dy={dy}
            dx={dx}
            {...rest}
        />
    );
};

export const SurvivalTabGroupLegendLabelComponent: React.FunctionComponent<IGroupLegendLabelComponentProps> = (
    props: IGroupLegendLabelComponentProps
) => {
    const { uidToGroup, dx, dy, datum, text, ...rest } = props;

    const groupUids = JSON.parse(text!) as string[];
    const groups = groupUids.map(uid => uidToGroup[uid]);
    const groupOrdinals = groups.map(group => group.ordinal);
    const textToTruncate = `Only ${groups
        .map(group => {
            if (group.ordinal) {
                return `(${group.ordinal})`;
            } else {
                return group.name;
            }
        })
        .join(', ')}`;
    return (
        <TruncatedTextWithTooltipSVG
            text={textToTruncate}
            renderTruncatedText={(truncatedText: string) => {
                const ret = [];
                for (let i = 0; i < truncatedText.length; i++) {
                    const bold =
                        i > 0 &&
                        i < truncatedText.length - 1 &&
                        truncatedText[i - 1] === '(' &&
                        truncatedText[i + 1] === ')';
                    if (bold) {
                        ret.push(
                            <tspan style={{ fontWeight: 'bold' }}>
                                {truncatedText[i]}
                            </tspan>
                        );
                    } else {
                        ret.push(<tspan>{truncatedText[i]}</tspan>);
                    }
                }
                return ret;
            }}
            alwaysShowTooltip={true}
            tooltip={() => {
                return (
                    <div>
                        Only{' '}
                        {insertBetween(
                            <span>,&nbsp;</span>,
                            groups.map(group =>
                                renderGroupNameWithOrdinal(group)
                            )
                        )}
                    </div>
                );
            }}
            maxWidth={props.maxLabelWidth}
            dy={dy}
            dx={dx}
            {...rest}
        />
    );
};
