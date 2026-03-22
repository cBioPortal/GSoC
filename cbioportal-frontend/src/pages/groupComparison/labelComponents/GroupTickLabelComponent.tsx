import * as React from 'react';
import TruncatedTextWithTooltipSVG from '../../../shared/components/TruncatedTextWithTooltipSVG';
import { ComparisonGroup } from '../GroupComparisonUtils';
import { getTextColor, renderGroupNameWithOrdinal } from '../OverlapUtils';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';

export interface IGroupTickLabelComponentProps {
    categoryCoordToGroup: (coord: number) => ComparisonGroup;
    maxLabelWidth: number;
    text?: number; // always there, has to be optional so we dont get typeerrors when passing it as prop eg
    // tickLabelComponent={<GroupTickLabelComponent categoryCoordToGroup={this.categoryCoordToGroup} maxLabelWidth={MAX_LABEL_WIDTH}/>}
    dy?: string;
    dx?: string;
    // unused victory props
    datum?: any;
}

@observer
export default class GroupTickLabelComponent extends React.Component<
    IGroupTickLabelComponentProps
> {
    constructor(props: IGroupTickLabelComponentProps) {
        super(props);
        makeObservable(this);
    }
    @observable.ref private textElt: SVGTextElement | null = null;

    @computed get group() {
        return this.props.categoryCoordToGroup(this.props.text!);
    }

    @action.bound
    private ref(elt: any) {
        this.textElt = elt;
    }

    @computed get colorRectangle() {
        if (this.textElt) {
            const box = this.textElt.getBBox();
            const boxLength = 10;
            return (
                <rect
                    x={box.x - boxLength - 5}
                    y={box.y + (box.height - boxLength) / 2}
                    fill={this.group.color}
                    width={boxLength}
                    height={boxLength}
                />
            );
        } else {
            return null;
        }
    }

    render() {
        const {
            categoryCoordToGroup,
            dx,
            dy,
            maxLabelWidth,
            datum,
            text,
            ...rest
        } = this.props;
        return (
            <>
                {this.colorRectangle}
                <TruncatedTextWithTooltipSVG
                    text={this.group!.name}
                    textRef={this.ref}
                    prefixTspans={
                        this.group!.ordinal.length > 0
                            ? [
                                  <tspan>(</tspan>,
                                  <tspan fontWeight="bold">
                                      {this.group!.ordinal}
                                  </tspan>,
                                  <tspan>)&nbsp;</tspan>,
                              ]
                            : undefined
                    }
                    datum={this.group}
                    tooltip={(group: ComparisonGroup) => {
                        return <div>{renderGroupNameWithOrdinal(group)}</div>;
                    }}
                    maxWidth={maxLabelWidth}
                    dy={dy}
                    dx={dx}
                    {...rest}
                />
            </>
        );
    }
}
