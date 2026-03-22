import * as React from 'react';

interface IColorPickerIconProps {
    color: string;
}

export class ColorPickerIcon extends React.Component<
    IColorPickerIconProps,
    {}
> {
    constructor(props: IColorPickerIconProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { color } = this.props;
        return (
            <svg
                width="12"
                height="12"
                className="case-label-header"
                data-test="color-picker-icon"
            >
                <rect
                    width="12"
                    height="12"
                    fill={color == undefined ? '#FFFFFF' : color}
                    stroke="#3786c2"
                    stroke-width="4"
                    cursor="pointer"
                />
                {color === '#FFFFFF' && (
                    <line
                        x1="10"
                        y1="2"
                        x2="2"
                        y2="10"
                        stroke="red"
                        stroke-width="1"
                    />
                )}
            </svg>
        );
    }
}
