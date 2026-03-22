import React from 'react';
import { GetSteps } from 'tours/Tour/types';
import { setTourLocalStorage } from 'tours/Tour';

export const virtualStudyId = 'virtual-study-tour';

const getSteps: GetSteps = ({
    isLoggedIn,
    studies,
    setLockTour,
    setGotoStep,
    endTour,
}) => [
    // Step 0: Type “glioma” in the search box
    {
        selector: '[data-tour="cancer-study-search-box"] input',
        content: () => (
            <div className="step">
                <p className="title">Search for the studies</p>
                Use the search box to find the studies of interest.
                For example, type in <strong>'glioma'</strong>, and then click the next step.
            </div>
        ),
        action: (node: Element) => {
            // auto-fill “glioma” in the search box
            setLockTour(false);
            node.setAttribute('value', 'glioma');
            node.dispatchEvent(new Event('input', { bubbles: true }));
        },
    },
    // Step 1: Select two studies
    {
        selector: '[data-tour="cancer-study-list-container"]',
        content: () => (
            <div className="step">
                <p className="title">Select two studies</p>
                Select two studies of interest.
            </div>
        ),
        action: () => {
            // only when user selected more than one study, the tour will continue
            setLockTour(true);
            if (studies > 1) {
                setLockTour(false);
            }
        },
    },
    // Step 2: Click the “Explore Selected Studies” button
    {
        selector: '[data-tour="explore-studies-button"]',
        content: () => (
            <div className="step">
                <p className="title">Click the Explore button</p>
                Click <strong>“Explore Selected Studies”</strong> button.
            </div>
        ),
        action: () => {
            // before loading to the Study Summary page, record the current step
            setTourLocalStorage(virtualStudyId, '3')
            // hide the next step button, user should click the button to continue
            setLockTour(true);
        },
    },
    // Step 3: Click the “+” icon
    {
        selector: '[data-tour="show-more-description-icon"]',
        content: () => (
            <div className="step">
                <p className="title">See list of studies</p>
                Click on the <strong>“+”</strong> icon to see the list of studies.
            </div>
        ),
    },
    // Step 4: Select samples in the Mutated Genes table
    {
        selector: '[data-tour="mutated-genes-table"]',
        content: () => (
            <div className="step">
                <p className="title">Select samples</p>
                In the Mutated Genes table, Click the check box in the{' '}
                <strong>“#”</strong> column to select samples with one more
                mutation, and then click the <strong>“Select Samples”</strong>{' '}
                button at the bottom of the table.
            </div>
        ),
        action: () => {
            // only when user selected at least one study, the tour will continue
            setLockTour(true);
            if (studies > 0) {
                setLockTour(false);
            }
        },
    },
    // tack onto last step where we describe what they are seeing.
    {
        selector: '',
        content: () => (
            <div className="step">
                <p className="title">Share/save your virtual study</p>
                We are now ready to create our virtual study. Let's create a
                virtual study and share/save it.
            </div>
        ),
    },
    // Step 6: Click the bookmark icon
    {
        selector: '[data-tour="action-button-bookmark"]',
        content: () => (
            <div className="step">
                <p className="title">Click the bookmark icon</p>
                Click the <strong>bookmark</strong> icon to create and share
                your virtual study.
            </div>
        ),
        action: (node: any) => {
            // only after user clicked the bookmark icon, the tour will continue
            if (node) {
                setLockTour(true);
                const handleClick = () => {
                    setTimeout(() => {
                        setGotoStep(7);
                    }, 400);
                    node.removeEventListener('click', handleClick);
                };
                node.addEventListener('click', handleClick);
            }
        },
    },
    ...getRestSteps({ isLoggedIn, studies, setLockTour, setGotoStep, endTour }),
];

const getRestSteps: GetSteps = props =>
    props.isLoggedIn ? getLoggedInSteps(props) : getNotLoggedInSteps(props);

const getNotLoggedInSteps: GetSteps = ({
    setLockTour,
    setGotoStep,
    endTour,
}) => [
    // Step 7: Click on the Share button
    {
        selector: '[data-tour="virtual-study-summary-panel"]',
        content: () => (
            <div className="step">
                <p className="title">Click on the Share button</p>
                <p>1. Enter a name for your virtual study (optional).</p>
                <p>
                    2. Text box pre-filled with a description of the studies
                    contributing samples and filters applied to the samples. You can edit this text
                </p>
                <p>
                    3. Check the list of studies contributing to samples with
                    links to the study summary for each.
                </p>
                <p>
                    Click on the Share button for the next step.
                </p>
            </div>
        ),
        action: () => {
            // only after user clicked the share button, the tour will continue
            setGotoStep(null);
            const shareButton = document.querySelector(
                '[data-tour="virtual-study-summary-share-btn"]'
            );
            if (shareButton) {
                const handleClick = () => {
                    setTimeout(() => {
                        setGotoStep(8);
                    }, 1000);
                    shareButton.removeEventListener('click', handleClick);
                };
                shareButton.addEventListener('click', handleClick);
            }
        },
    },
    // Step 8: Show the share link
    {
        selector: '[data-tour="virtual-study-summary-panel"]',
        content: () => (
            <div className="step">
                <p className="title">Share your virtual study</p>
                Click on the link to open your virtual study, or click{' '}
                <strong>“Copy”</strong> to copy the URL to your clipboard.
            </div>
        ),
        action: (node: any) => {
            // clear the gotoStep
            // after user clicked the panel, the tour ends
            setGotoStep(null);
            setLockTour(false);
            if (node) {
                const handleClick = () => {
                    endTour();
                    node.removeEventListener('click', handleClick);
                };
                node.addEventListener('click', handleClick);
            }
        },
    },
];

const getLoggedInSteps: GetSteps = ({ setLockTour, setGotoStep, endTour }) => [
    // Step 7: Click on the Save button
    {
        selector: '[data-tour="virtual-study-summary-panel"]',
        content: () => (
            <div className="step">
                <p className="title">Click on the Save button</p>
                <p>1. Enter a name for your virtual study (optional).</p>
                2. Text box pre-filled with a description of the studies
                contributing samples and filters applied to the samples. You can
                edit this text
                <p>
                    3. Check the list of studies contributing to samples with
                    links to the study summary for each.
                </p>
                <p>
                    Click on the Save button for the next step.
                </p>
            </div>
        ),
        action: () => {
            // only after user clicked the save button, the tour will continue
            setGotoStep(null);
            const shareButton = document.querySelector(
                '[data-tour="virtual-study-summary-save-btn"]'
            );
            if (shareButton) {
                const handleClick = () => {
                    setTimeout(() => {
                        setGotoStep(8);
                    }, 400);
                    shareButton.removeEventListener('click', handleClick);
                };
                shareButton.addEventListener('click', handleClick);
            }
        },
    },
    // Step 8: Show the share link
    {
        selector: '[data-tour="virtual-study-summary-panel"]',
        content: () => (
            <div className="step">
                <p className="title">Already saved</p>
                Click on the link to open your virtual study, or click{' '}
                <strong>“Copy”</strong> to copy the URL to your clipboard.
                <p>
                    When you save a study, it is added to the homepage, at the
                    top of the study list under <strong>“My Virtual Studies”</strong>. Clicking
                    <strong>“Query”</strong> brings you to the query selector with your new
                    virtual study pre-selected.
                </p>
                <p>
                    Do you want to find it?
                </p>
                <div className="btn-class">
                    <button className='skip-all-btn' onClick={() => endTour()}>Finish guidance</button>
                    <button
                        className='next-step-btn'
                        onClick={() => {
                            setTourLocalStorage(virtualStudyId, '9')
                            // load to the homepage
                            window.location.href = '/';
                        }}
                    >
                        Help me find it
                    </button>
                </div>
            </div>
        ),
        action: (node: any) => {
            // hide the original next step button
            setLockTour(true);

            const queryButton = document.querySelector(
                '[data-tour="virtual-study-summary-query-btn"]'
            );
            if (queryButton) {
                const handleClick = () => {
                    setTourLocalStorage(virtualStudyId, '9')
                    queryButton.removeEventListener('click', handleClick);
                };
                queryButton.addEventListener('click', handleClick);
                return;
            }

            if (node) {
                // after user clicked the panel, clear the gotoStep, the tour ends
                const handleClick = () => {
                    setLockTour(false);
                    setGotoStep(null);
                    endTour();
                    node.removeEventListener('click', handleClick);
                };
                node.addEventListener('click', handleClick);
            }
        },
    },
    // Step 9: In homepage, Show the new virtual study pre-selected
    {
        selector: '[data-tour="my_virtual_studies_list"]',
        content: () => (
            <div className="step">
                <p className="title">My Virtual Studies</p>
                Your study is added to the homepage, at the top of the study
                list under <strong>“My Virtual Studies”</strong>.
            </div>
        ),
        action: () => {
            setLockTour(false);
            // end the tour if user clicked the screen
            const searchBox = document.querySelector('[data-tour="cancer-study-search-box"] input');

            if (searchBox && (searchBox as any).value !== '') {
                searchBox.setAttribute('value', '');
                searchBox.dispatchEvent(new Event('input', { bubbles: true }));
            }

            setLockTour(false);
            setGotoStep(null);
            const handleClick = () => {
                endTour();
                document.removeEventListener('click', handleClick);
            };
            document.addEventListener('click', handleClick);
        },
    },
];

export default getSteps;
