import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { CategorizedConfigItems } from '../../../config/IAppConfig';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

@observer
export default class QuickSelectButtons extends React.Component<
    {
        buttonsConfig: CategorizedConfigItems;
        onSelect: (studyIds: string[]) => void;
    },
    {}
> {
    render() {
        return (
            <div>
                Quick select:&nbsp;
                {_.map(this.props.buttonsConfig, (values, name) => {
                    const [buttonText, tooltipText] = name.split('|');

                    const buttonEl = (
                        <button
                            className={'btn btn-default btn-xs'}
                            onClick={() => this.props.onSelect(values)}
                        >
                            {buttonText}
                        </button>
                    );

                    const tooltipEl = (
                        <span
                            style={{ display: 'inline-block', width: '300px' }}
                        >
                            {tooltipText || ''}
                        </span>
                    );

                    return tooltipText ? (
                        <DefaultTooltip overlay={tooltipEl}>
                            {buttonEl}
                        </DefaultTooltip>
                    ) : (
                        buttonEl
                    );
                })}
            </div>
        );
    }
}
