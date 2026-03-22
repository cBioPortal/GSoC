import { useState } from 'react';
import ReactTour from 'reactour';
import * as React from 'react';

export function WrappedTour() {
    // Declare a new state variable, which we'll call "count"
    const [show, setShow] = useState(true);

    if (show) {
        return (
            <ReactTour
                steps={[
                    {
                        selector: '#groupManagementButton',
                        content: () => (
                            <>
                                <h3>Group Comparison is here!</h3>
                                <a
                                    href={'/tutorials#group-comparison'}
                                    target={'_blank'}
                                >
                                    Click here
                                </a>{' '}
                                to learn how to create custom groups of samples
                                and open comparison sessions.
                            </>
                        ),
                    },
                ]}
                isOpen={true}
                showButtons={false}
                showNavigation={false}
                showNavigationNumber={false}
                showNumber={false}
                disableInteraction={true}
                onRequestClose={() => setShow(false)}
                rounded={5}
            />
        );
    } else {
        return null;
    }
}
