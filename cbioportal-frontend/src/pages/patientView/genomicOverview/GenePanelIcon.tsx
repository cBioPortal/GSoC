import convert from 'color-convert';
import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IKeyedIconData } from './GenomicOverviewUtils';

import styles from './styles.module.scss';

interface IGenePanelIconProps {
    sampleId: string;
    genePanelIconData: IKeyedIconData;
}

const GenePanelIcon: React.FunctionComponent<IGenePanelIconProps> = props => {
    const noGenePanelInfo =
        'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.';

    const genePanelId = props.genePanelIconData[props.sampleId]?.genePanelId;
    const text = props.genePanelIconData[props.sampleId]?.label;
    const color = props.genePanelIconData[props.sampleId]?.color;
    const hexAlpha = '33'; // => 20% opacity
    let hexColor: string | undefined;

    if (color) {
        hexColor = color.startsWith('#')
            ? `${color}${hexAlpha}`
            : `#${convert.keyword.hex(color as any)}${hexAlpha}`;
    }

    return (
        <DefaultTooltip
            overlay={
                genePanelId ? `Gene panel: ${genePanelId}` : noGenePanelInfo
            }
            placement="topRight"
        >
            <span
                className={styles.genePanelIcon}
                style={hexColor ? { backgroundColor: hexColor } : undefined}
            >
                {text}
            </span>
        </DefaultTooltip>
    );
};

export default GenePanelIcon;
