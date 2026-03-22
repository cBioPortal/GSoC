import * as React from 'react';

interface IComparisonVsIconProps {
    width?: number;
    style?: any;
    className?: string;
}
const ComparisonVsIcon: React.FunctionComponent<IComparisonVsIconProps> = ({
    width,
    style,
    className,
}: IComparisonVsIconProps) => {
    return (
        <img
            src={require('../../rootImages/compare_vs.svg')}
            alt="Compare VS SVG"
            className={className || ''}
            style={{
                width,
                border: '1px solid black',
                padding: 2,
                ...(style || {}),
            }}
        />
    );
};

export default ComparisonVsIcon;
