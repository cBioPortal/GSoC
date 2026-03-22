import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import { CirclePicker, CirclePickerProps } from 'react-color';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ColorPickerIcon } from 'pages/groupComparison/comparisonGroupManager/ColorPickerIcon';
import {
    CLI_FEMALE_COLOR,
    CLI_NO_COLOR,
    CLI_YES_COLOR,
    DARK_GREY,
    rgbaToHex,
} from 'shared/lib/Colors';
import { COLORS } from 'pages/studyView/StudyViewUtils';
import { RGBAColor } from 'oncoprintjs';
import _ from 'lodash';

export interface IGroupCheckboxProps {
    handleClinicalTrackColorChange?: (
        value: string,
        color: RGBAColor | undefined
    ) => void;
    clinicalTrackValue: any;
    color: RGBAColor;
}

const COLOR_UNDEFINED = '#FFFFFF';

@observer
export default class ClinicalTrackColorPicker extends React.Component<
    IGroupCheckboxProps,
    {}
> {
    constructor(props: IGroupCheckboxProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleChangeComplete = (color: any, event: any) => {
        // if same color is selected, unselect it (go back to default color)
        if (color.hex === rgbaToHex(this.props.color)) {
            this.props.handleClinicalTrackColorChange &&
                this.props.handleClinicalTrackColorChange(
                    this.props.clinicalTrackValue,
                    undefined
                );
        } else {
            this.props.handleClinicalTrackColorChange &&
                this.props.handleClinicalTrackColorChange(
                    this.props.clinicalTrackValue,
                    [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a]
                );
        }
        // set changed track key
    };

    @computed get colorList() {
        let colors: string[] = COLORS.slice(0, 20);
        colors.push(CLI_YES_COLOR);
        colors.push(CLI_NO_COLOR);
        colors.push(CLI_FEMALE_COLOR);
        colors.push(DARK_GREY);
        return colors;
    }

    @computed get colorChooserElement() {
        return (
            <Popover>
                <div
                    onMouseDown={e => {
                        e.nativeEvent.stopImmediatePropagation();
                    }}
                    onClick={e => {
                        e.nativeEvent.stopImmediatePropagation();
                    }}
                >
                    <CirclePicker
                        colors={this.colorList}
                        circleSize={20}
                        circleSpacing={3}
                        onChangeComplete={this.handleChangeComplete}
                        color={rgbaToHex(this.props.color)}
                        width="140px"
                    />
                </div>
            </Popover>
        );
    }

    render() {
        return (
            <OverlayTrigger
                containerPadding={40}
                trigger="click"
                placement="bottom"
                overlay={this.colorChooserElement}
                rootClose={true}
            >
                <DefaultTooltip
                    overlay={
                        'Optional: Select color for clinical track value to be used in oncoprint. If no color is selected, the default color will be applied.'
                    }
                >
                    <span>
                        <ColorPickerIcon
                            color={
                                rgbaToHex(this.props.color) || COLOR_UNDEFINED
                            }
                        />
                    </span>
                </DefaultTooltip>
            </OverlayTrigger>
        );
    }
}
