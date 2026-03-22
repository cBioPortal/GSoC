import * as React from 'react';
import { Observer } from 'mobx-react';

interface ScrollWrapperProps {
    children: React.ReactNode;
    plotElementWidth: number;
    assignDummyScrollPaneRef: (el: HTMLDivElement) => void;
    scrollPane: HTMLDivElement;
}

function ScrollWrapper(props: ScrollWrapperProps) {
    const isPlotWideEnoughToScroll =
        props.scrollPane &&
        props.scrollPane.clientWidth < props.plotElementWidth;

    return (
        <>
            {isPlotWideEnoughToScroll && (
                <Observer>
                    {() => (
                        <div
                            className="dummyScrollDiv scrollbarAlwaysVisible"
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: props.plotElementWidth,
                                overflow: 'scroll',
                                marginTop: 35,
                                marginBottom: -25, // reduce excessive padding caused by the marginTop
                                zIndex: 1, // make sure it receives mouse even though marginBottom pulls the plot on top of it
                            }}
                            ref={props.assignDummyScrollPaneRef}
                        >
                            <div
                                style={{
                                    minWidth: props.plotElementWidth - 8, // subtract 8 due to the pseudo-scrollbar element adding bulk
                                    height: 1,
                                }}
                            />
                        </div>
                    )}
                </Observer>
            )}
            {props.children}
        </>
    );
}

export default ScrollWrapper;
