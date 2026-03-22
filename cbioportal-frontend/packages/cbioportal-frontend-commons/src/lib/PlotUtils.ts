import _ from 'lodash';
import { action } from 'mobx';

import Timeout = NodeJS.Timeout;

import {
    getTextDiagonal,
    getTextHeight,
    getTextWidth,
} from './TextTruncationUtils';

export function calcPlotHorizontalPadding(
    label: string | string[],
    tickFontFamily: string,
    tickFontSize: number
) {
    const content = getLabelContent(label);
    const fontSize = `${tickFontSize}px`;

    return getTextWidth(content, tickFontFamily, fontSize);
}

export function calcPlotDiagonalPadding(
    label: string | string[],
    tickFontFamily: string,
    tickFontSize: number,
    tiltAngle: number = 40
) {
    const content = getLabelContent(label);
    const fontSize = `${tickFontSize}px`;
    const textHeight = getTextHeight(content, tickFontFamily, fontSize);
    const textWidth = getTextWidth(content, tickFontFamily, fontSize);
    const textDiagonal = getTextDiagonal(textHeight, textWidth);

    return 10 + textDiagonal * Math.sin((Math.PI * tiltAngle) / 180);
}

export function calcPlotBottomPadding(
    tickFontFamily: string,
    tickFontSize: number,
    tickLabels: Array<string | string[]>,
    tiltAngle: number = 50,
    maxPadding: number = 200,
    minPadding: number = 10 // used when tickLabels is empty
) {
    const padding =
        _.max(
            tickLabels.map((label: string | string[]) =>
                calcPlotDiagonalPadding(
                    label,
                    tickFontFamily,
                    tickFontSize,
                    tiltAngle
                )
            )
        ) || minPadding;

    return padding > maxPadding ? maxPadding : padding;
}

export function calcPlotLeftPadding(
    tickFontFamily: string,
    tickFontSize: number,
    tickLabels: Array<string | string[]>,
    maxPadding: number = 200,
    minPadding: number = 10 // used when tickLabels is empty
) {
    const padding =
        _.max(
            tickLabels.map((label: string | string[]) =>
                calcPlotHorizontalPadding(label, tickFontFamily, tickFontSize)
            )
        ) || minPadding;

    return padding > maxPadding ? maxPadding : padding;
}

function getLabelContent(label: string | string[]) {
    return _.isArray(label) ? label.join() : label;
}

export function makeTooltipMouseEvents(self: {
    tooltipModel: any;
    pointHovered: boolean;
}) {
    let disappearTimeout: Timeout | null = null;
    const disappearDelayMs = 250;

    return [
        {
            target: 'data',
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: 'data',
                            mutation: action((props: any) => {
                                self.tooltipModel = props;
                                self.pointHovered = true;

                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                    disappearTimeout = null;
                                }

                                return { active: true };
                            }),
                        },
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: 'data',
                            mutation: action(() => {
                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                }

                                disappearTimeout = global.setTimeout(
                                    action(() => {
                                        self.pointHovered = false;
                                    }),
                                    disappearDelayMs
                                );

                                return { active: false };
                            }),
                        },
                    ];
                },
            },
        },
    ];
}
