import * as React from 'react';
import { CSSProperties, useCallback, useRef } from 'react';
import styles from './styles.module.scss';

export default function FeatureInstruction(
    props: React.PropsWithChildren<{
        content: Element | string;
        style?: CSSProperties;
    }>
) {
    const divElementRef = useRef<HTMLDivElement>(null);

    const handleHover = useCallback(() => {
        $(divElementRef.current!).toggle();
    }, []);

    return (
        <div
            onMouseEnter={handleHover}
            onMouseLeave={handleHover}
            className={styles.container}
        >
            <div ref={divElementRef} style={props.style || {}}>
                <i className={'fa fa-lightbulb-o'}></i> {props.content}
            </div>
            {props.children}
        </div>
    );
}
