import React from 'react';
import { setTourLocalStorage } from 'tours/Tour';
import { GetSteps } from 'tours/Tour/types';

export const groupComparisonId = 'group-comparison-tour';

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
    // Step 1: Click on “View study summary” button
    {
        selector: '[data-tour="cancer-study-list-container"]',
        content: () => (
            <div className="step">
                <p className="title">Click the button</p>
                Click on <div className='ci ci-pie-chart'/> button next to
                the study of interest, such as <strong>Merged Cohort of LGG and GBM (TCGA, Cell 2016)</strong>.
            </div>
        ),
        action: () => {
            // before loading to the Study View page, record the current step
            setTourLocalStorage(groupComparisonId, '2');
            // hide the next step button, user should click the button to continue
            setLockTour(true);
        },
    },
    // Step 2:  Select more than one sample in the Mutated Genes table
    // TODO: must have overlap
    {
        selector: '[data-tour="mutated-genes-table"]',
        content: () => (
            <div className="step">
                <p className="title">Select two samples</p>
                <p>We define groups by applying filters in study view. </p>
                <p>In the Mutated Genes table, Click the check box in the {' '}
                <strong>“#”</strong> column to select samples with {' '}
                <strong>e.g. IDH1 or TP53 mutations</strong>.
                </p>
            </div>
        ),
        action: (node: any) => {
            // when user selected more than one sample, the compare button will show up
            setLockTour(true);
            if (node) {
                const findCompareBtn = () => {
                    const compareBtn = document.querySelector('[data-tour="mutated-genes-table-compare-btn"]');
                    if (compareBtn) {
                        setGotoStep(3);
                        document.removeEventListener('click', findCompareBtn);
                    }
                };
                document.addEventListener('click', findCompareBtn);
            }
        },
    },
    // Step 3:  Click the “Compare” button
    {
        selector: '[data-tour="mutated-genes-table-compare-btn"]',
        content: () => (
            <div className="step">
                <p className="title">Click the Compare button</p>
                Click the <strong>“Compare”</strong> button.
            </div>
        ),
        action: (node: any) => {
            // only after user clicked the button, the tour will continue
            setLockTour(true);
            if (node) {
                const handleClick = () => {
                    // before loading to the Group Comparison page, record the current step
                    setTourLocalStorage(groupComparisonId, '4');
                    node.removeEventListener('click', handleClick);
                };
                node.addEventListener('click', handleClick);
            }
        },
    },
    ...getIntroductionTabsSteps({ isLoggedIn, studies, setLockTour, setGotoStep, endTour }),
];

const getIntroductionTabsSteps: GetSteps = ({
    isLoggedIn,
    studies,
    setLockTour,
    setGotoStep,
    endTour,
}) => [
    // Step 4: Show the header of the page
    {
        selector: '[data-tour="single-study-group-comparison-header"]',
        content: () => (
            <div className="step">
                <p className="title">The original study</p>
                Click to return to the study view.
            </div>
        ),
    },
    // Step 5: Show the attribute
    {
        selector: '[data-tour="single-study-group-comparison-attribute"]',
        content: () => (
            <div className="step">
                <p className="title">The attribute</p>
                The attribute used to create the groups.
            </div>
        ),
    },
    // Step 6: Show the available groups
    {
        selector: '[data-tour="single-study-group-comparison-groups"]',
        content: () => (
            <div className="step">
                <p className="title">The available groups</p>
                Click on a group name to include or exclude it from analysis. 
                Click the <strong>“x”</strong> to remove the group from the comparison session. 
                Groups can also be reordered by dragging the group name.
            </div>
        ),
    },
    // Step 7: Intro to the Overlap tab
    // TODO: check if there is overlap
    {
        selector: '.mainTabs',
        content: () => (
            <div className="step">
                <p className="title">The Overlap tab</p>
                The Overlap tab shows which samples or patients may overlap among the selected groups. 
                In this example, we can see that there is no overlap in samples or patients. 
                In the next example, we will look at how overlapping samples/patients are managed.
                <div className="btn-class">
                    <button className='skip-all-btn' onClick={() => endTour()}>Finish guidance</button>
                    <button
                        className='next-step-btn'
                        onClick={() => {
                            const btn = document.querySelector('a.tabAnchor_survival');
                            // @ts-ignore
                            if (btn) btn.click();
                            setGotoStep(8);
                        }}
                    >Next Tab</button>
                </div>
            </div>
        ),
        action: () => {
            setLockTour(true);
        }
    },
    // Step 8: Intro to the Survival tab
    {
        selector: '[data-tour="mainColumn"]',
        content: () => (
            <div className="step">
                <p className="title">The Survival tab</p>
                The Survival tab shows a Kaplan-Meier plot of Overall 
                Survival or Disease/Progression-free Survival based on the selected groups. 
                This tab will only be visible when the original study contains survival data.
                <div className="btn-class">
                    <button className='skip-all-btn' onClick={() => endTour()}>Finish guidance</button>
                    <button
                        className='next-step-btn'
                        onClick={() => {
                            const btn = document.querySelector('a.tabAnchor_clinical');
                            // @ts-ignore
                            if (btn) btn.click();
                            setGotoStep(9);
                        }}
                    >Next Tab</button>
                </div>
            </div>
        ),
        action: () => {
            setLockTour(true);
        },
    },
     // Step 9: Intro to the Clinical tab
     {
        selector: '[data-tour="mainColumn"]',
        content: () => (
            <div className="step">
                <p className="title">The Clinical tab</p>
                The Clinical tab shows all the same clinical attributes that are present in Study View. 
                Select a clinical attribute in the table (Supervised DNA Methylation Cluster is selected here) 
                and a plot will appear to the right with the distribution of that clinical attribute across the selected groups.
                <div className="btn-class">
                    <button className='skip-all-btn' onClick={() => endTour()}>Finish guidance</button>
                    <button
                        className='next-step-btn'
                        onClick={() => {
                            const btn = document.querySelector('a.tabAnchor_alterations');
                            // @ts-ignore
                            if (btn) btn.click();
                            setGotoStep(10);
                        }}
                    >Next Tab</button> 
                </div>
            </div>
        ),
        action: () => {
            setLockTour(true);
        },
    },
    // Step 10: Intro to the Genomic Alterations tab
    {
        selector: '[data-tour="mainColumn"]',
        content: () => (
            <div className="step">
                <p className="title">The Genomic Alterations tab</p>
                The Genomic Alterations tab compares the frequency of mutations in genes across the selected groups. 
                The visible plots change depending on how many groups are selected. 
            </div>
        ),
        action: () => {
            setLockTour(false);
        },
    },
];

export default getSteps;
