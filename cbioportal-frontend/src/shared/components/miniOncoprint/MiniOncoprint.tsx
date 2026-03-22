import * as React from 'react';
import styles from './styles.module.scss';

interface IMiniOncoprint {
    group1Width: number;
    group2Width: number;
    group1Unprofiled: number;
    group2Unprofiled: number;
    group1Unaltered: number;
    group1Altered: number;
    group2Altered: number;
    group1Color?: string;
    group2Color?: string;
    alterationColor?: string;
    height?: number;
    width: number;
}

export const MiniOncoprint: React.SFC<IMiniOncoprint> = props => {
    const height = props.height || 2;

    return (
        <div className={styles.wrapper} style={{ width: props.width }}>
            <div className={styles.groupRow}>
                <div
                    style={{
                        width: `${props.group1Width}%`,
                        background: props.group1Color,
                    }}
                ></div>
                <div
                    style={{
                        width: `${props.group2Width}%`,
                        background: props.group2Color,
                    }}
                ></div>
            </div>
            <div className={styles.alterationRow}>
                <div
                    style={{
                        width: `${props.group1Unprofiled}%`,
                        background: 'white',
                        position: 'relative',
                    }}
                >
                    <div className={styles.strike}></div>
                </div>
                <div
                    style={{
                        width: `${props.group1Unaltered}%`,
                        background: 'transparent',
                    }}
                ></div>
                <div
                    style={{
                        width: `${props.group1Altered}%`,
                        background: '#3786C2',
                    }}
                ></div>
                <div
                    style={{
                        width: `${props.group2Altered}%`,
                        background: '#3786C2',
                    }}
                ></div>
                <div
                    style={{
                        width: `${props.group2Unprofiled}%`,
                        background: 'white',
                        position: 'absolute',
                        right: 0,
                    }}
                >
                    <div className={styles.strike}></div>
                </div>
            </div>
        </div>
    );
};
