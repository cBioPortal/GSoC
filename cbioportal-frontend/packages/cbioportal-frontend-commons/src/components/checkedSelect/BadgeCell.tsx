import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Option } from './CheckedSelectUtils';
import * as React from 'react';
import styles from './badgeListSelector.module.scss';

interface IBadgeCellProps {
    option: Option;
    optionLabel: JSX.Element;
    onOnlyClick?: (e: React.MouseEvent<any>) => void;
    isDriverAnnotated: boolean;
    driverAnnotationIcon?: JSX.Element;
}

export const BadgeCell: React.FC<IBadgeCellProps> = observer(
    ({
        option,
        optionLabel,
        onOnlyClick,
        isDriverAnnotated,
        driverAnnotationIcon,
    }: IBadgeCellProps) => {
        if (!onOnlyClick) {
            return optionLabel;
        }

        const onlyButton = (
            <span
                className={styles.onlyButton}
                data-test={`${option.value}_only`}
                onClick={onOnlyClick}
            >
                ONLY
            </span>
        );

        if (isDriverAnnotated) {
            return (
                <div className={styles.badgeCell} style={{ float: 'right' }}>
                    <div style={{ float: 'left' }}>{optionLabel}</div>
                    <div style={{ float: 'left' }}>
                        <div>
                            {option.value === 'VUS' ||
                            (option.value === 'driver' &&
                                !!!driverAnnotationIcon) ? (
                                <>&nbsp;</>
                            ) : (
                                driverAnnotationIcon
                            )}
                        </div>
                        <div>{onlyButton}</div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className={styles.badgeCell}>
                    {optionLabel}
                    {onlyButton}
                </div>
            );
        }
    }
);
