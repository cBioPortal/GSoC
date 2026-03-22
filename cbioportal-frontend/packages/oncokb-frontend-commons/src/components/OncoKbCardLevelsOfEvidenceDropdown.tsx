import React from 'react';

import levelStyles from './level.module.scss';
import mainStyles from './main.module.scss';
import collapsibleStyles from './collapsible.module.scss';
import { Collapse } from 'react-collapse';
import { levelIconClassNames } from '../util/OncoKbUtils';
import classnames from 'classnames';

export type LevelsOfEvidenceDropdownProps = {
    levels: string[];
    levelDes: { [level: string]: JSX.Element };
};

export const OncoKbCardLevelsOfEvidenceDropdown: React.FunctionComponent<LevelsOfEvidenceDropdownProps> = (
    props: LevelsOfEvidenceDropdownProps
) => {
    const [levelsCollapsed, updateLevelCollapse] = React.useState(true);

    function levelListItem(level: string, levelDes: JSX.Element) {
        return (
            <li key={level} className={levelStyles['levels-li']}>
                <i className={levelIconClassNames(level)} />
                {levelDes}
            </li>
        );
    }

    function generateLevelRows(): JSX.Element[] {
        const rows: JSX.Element[] = [];
        props.levels.forEach(level => {
            rows.push(levelListItem(level, props.levelDes[level]));
        });

        return rows;
    }

    return (
        <div>
            <div
                data-test="oncokb-card-levels-of-evidence-dropdown-header"
                className={collapsibleStyles['collapsible-header']}
                onClick={() => updateLevelCollapse(!levelsCollapsed)}
            >
                Levels of Evidence
                <span style={{ float: 'right' }}>
                    {levelsCollapsed ? (
                        <i
                            className={classnames(
                                'fa fa-chevron-down',
                                mainStyles['blue-icon']
                            )}
                        />
                    ) : (
                        <i
                            className={classnames(
                                'fa fa-chevron-up',
                                mainStyles['blue-icon']
                            )}
                        />
                    )}
                </span>
            </div>
            <Collapse isOpened={!levelsCollapsed}>
                <div
                    className={classnames(
                        levelStyles.levels,
                        collapsibleStyles['levels-collapse']
                    )}
                >
                    <ul
                        style={{
                            lineHeight: 8,
                            padding: 0,
                        }}
                    >
                        {generateLevelRows()}
                    </ul>
                </div>
            </Collapse>
        </div>
    );
};
