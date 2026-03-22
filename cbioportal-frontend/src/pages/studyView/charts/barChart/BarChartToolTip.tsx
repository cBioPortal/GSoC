import * as React from 'react';
import _ from 'lodash';
import { computed, makeObservable } from 'mobx';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import { formatRange } from 'pages/studyView/StudyViewUtils';
import { observer } from 'mobx-react';

export type ToolTipModel = {
    start: number | undefined;
    end: number | undefined;
    special: string | undefined;
    sampleCount: number;
};

export type BarChartToolTipProps = {
    mousePosition: { x: number; y: number };
    totalBars: number;
    currentBarIndex: number;
    model: ToolTipModel | null;
    windowWidth: number;
};

export const VERTICAL_OFFSET = 17;
export const HORIZONTAL_OFFSET = 8;

const WIDTH = 150;

@observer
export default class BarChartToolTip extends React.Component<
    BarChartToolTipProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    /**
     * When the active bar is past the middle of the plot, render on the left side of the bar
     */
    @computed
    get placement(): 'left' | 'right' {
        return this.props.totalBars < this.props.currentBarIndex * 2
            ? 'left'
            : 'right';
    }

    @computed
    get positionLeft(): number {
        if (this.placement === 'left') {
            return this.props.mousePosition.x - (HORIZONTAL_OFFSET + WIDTH);
        } else {
            return this.props.mousePosition.x + HORIZONTAL_OFFSET;
        }
    }

    @computed
    get transform(): string | undefined {
        return this.placement === 'left' ? 'translate(-100%,0%)' : undefined;
    }

    render() {
        if (!this.props.model) {
            return null;
        }

        return (
            <Popover
                arrowOffsetTop={VERTICAL_OFFSET}
                className={classnames('cbioportal-frontent', 'cbioTooltip')}
                positionLeft={this.positionLeft}
                positionTop={this.props.mousePosition.y - VERTICAL_OFFSET}
                style={{ width: WIDTH }}
                placement={this.placement}
            >
                <div>
                    <div>
                        Number of samples:{' '}
                        <strong>{this.props.model.sampleCount}</strong>
                    </div>
                    <div>
                        Range:{' '}
                        <strong>
                            {formatRange(
                                this.props.model.start,
                                this.props.model.end,
                                this.props.model.special
                            )}
                        </strong>
                    </div>
                </div>
            </Popover>
        );
    }
}
