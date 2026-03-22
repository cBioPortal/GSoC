import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import styles from '../../pages/resultsView/survival/styles.module.scss';
import { truncateWithEllipsisReport } from 'cbioportal-frontend-commons';
import { Portal } from 'react-portal';

export interface ITruncatedTextSVGProps {
    x?: number;
    y?: number;
    text?: string;
    prefixTspans?: any[]; // tspans. typescript doesn't play nice though so it has to be any
    renderTruncatedText?: (truncatedText: string) => any[]; // tspans. typescript doesn't play nice though so it has to be any
    maxWidth?: number;
    suffix?: string;
    tooltip?: (datum?: any) => JSX.Element;
    tooltipPlacement?: string;
    alwaysShowTooltip?: boolean;
    dy?: any;
    dx?: any;
    textRef?: (elt: SVGTextElement | null) => void;
    //victory
    datum?: any;
    transform?: (x: number, y: number) => string;
    verticalAnchor?: string;
    textAnchor?: string;
    style?: {
        fontSize: number;
        fontFamily: string;
    };
}

@observer
export default class TruncatedTextWithTooltipSVG extends React.Component<
    ITruncatedTextSVGProps,
    {}
> {
    constructor(props: ITruncatedTextSVGProps) {
        super(props);
        makeObservable(this);
    }
    static defaultProps: Partial<ITruncatedTextSVGProps> = {
        maxWidth: 100,
        suffix: '...',
    };

    @observable mousePosition = { x: 0, y: 0 };
    @observable tooltipOpen = false;

    @computed get tooltipElt() {
        if (this.props.tooltip) {
            return this.props.tooltip(this.props.datum);
        } else {
            return <span>{this.props.text}</span>;
        }
    }

    @action.bound
    private onMouseOver() {
        this.tooltipOpen = true;
    }

    @action.bound
    private onMouseOut() {
        this.tooltipOpen = false;
    }

    @autobind private onMouseMove(e: React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    @computed get fontFamily() {
        let font = 'Arial';
        if (this.props.style && this.props.style.fontFamily) {
            font = this.props.style.fontFamily.split(', ')[0];
        }
        return font;
    }

    @computed get fontSize() {
        let size = '13px';
        if (this.props.style && this.props.style.fontSize) {
            size = this.props.style.fontSize + 'px';
        }
        return size;
    }

    @computed get textReport() {
        return truncateWithEllipsisReport(
            this.props.text || '',
            this.props.maxWidth!,
            this.fontFamily,
            this.fontSize
        );
    }

    @computed get truncatedText() {
        if (this.props.renderTruncatedText) {
            return this.props.renderTruncatedText(this.textReport.text);
        } else {
            return <tspan>{this.textReport.text}</tspan>;
        }
    }

    render() {
        const {
            text,
            maxWidth,
            datum,
            suffix,
            tooltip,
            prefixTspans,
            alwaysShowTooltip,
            renderTruncatedText,
            transform,
            tooltipPlacement,
            textRef,
            ...rest
        } = this.props;

        let transformApplied = undefined;
        if (
            transform &&
            this.props.x !== undefined &&
            this.props.y !== undefined
        ) {
            transformApplied = transform(this.props.x, this.props.y);
        }

        return (
            <>
                <text
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut}
                    onMouseMove={this.onMouseMove}
                    ref={textRef}
                    transform={transformApplied}
                    {...rest}
                >
                    {this.props.prefixTspans}
                    {this.truncatedText}
                </text>
                {(this.textReport.isTruncated ||
                    this.props.alwaysShowTooltip) &&
                    this.tooltipOpen && (
                        <Portal isOpened={true} node={document.body}>
                            <Popover
                                arrowOffsetTop={17}
                                className={classnames(
                                    'cbioportal-frontend',
                                    'cbioTooltip',
                                    styles.Tooltip
                                )}
                                positionLeft={
                                    this.mousePosition.x +
                                    (tooltipPlacement === 'left' ? -8 : 8)
                                }
                                positionTop={this.mousePosition.y - 17}
                                style={{
                                    transform:
                                        tooltipPlacement === 'left'
                                            ? 'translate(-100%,0%)'
                                            : undefined,
                                }}
                                placement={tooltipPlacement}
                            >
                                {this.tooltipElt}
                            </Popover>
                        </Portal>
                    )}
            </>
        );
    }
}
