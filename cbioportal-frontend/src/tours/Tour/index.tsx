import React, { useEffect, useState } from 'react';
import Tour from 'reactour';
import _ from 'lodash';
import {
    getGroupComparisonSteps,
    getVirtualStudySteps,
    groupComparisonId,
    virtualStudyId,
} from '../Steps';
import { TourProps, TourMapProps } from './types';
import './styles.css';

const TOUR_LOCAL_STORAGE_ID = 'web-tour';
export const setTourLocalStorage = (id: string, value: string) => {
    localStorage.setItem(TOUR_LOCAL_STORAGE_ID, id);
    localStorage.setItem(id, value);
};

export const setTourLocalStorageFromURL = () => {
    /**
     * If the url contains a query param 'web-tour', set the localStorage
     *
     * e.g. https://www.cbioportal.org/?web-tour=virtual-study-tour
     *      https://deploy-preview-4687--cbioportalfrontend.netlify.app/?web-tour=virtual-study-tour
     */
    const urlStr = (window as any).routingStore.location.search;
    if (urlStr) {
        const urlSearchParams = new URLSearchParams(urlStr);
        const webTour = urlSearchParams.get(TOUR_LOCAL_STORAGE_ID);
        if (webTour && [groupComparisonId, virtualStudyId].includes(webTour)) {
            setTourLocalStorage(webTour, '0');
        }
    }
};

export default function WebTour({
    hideEntry = true,
    isLoggedIn = false,
    studies = 0,
}: TourProps) {
    const [currentTour, setCurrentTour] = useState<string | null | undefined>(
        null
    );
    const [isOpen, setIsOpen] = useState(true);
    const [gotoStep, setGotoStep] = useState(null);
    const [lockTour, setLockTour] = useState(false);

    const [startAt, setStartAt] = useState<number>(0);
    const endTour = () => setIsOpen(false);
    const endTourWithBtn = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
    };

    useEffect(() => {
        /**
         * Two sources to determine the current tour:
         * 1. the tourType prop passed from the parent component
         * 2. the localStorage (when load to another page)
         */
        const tourContinued = localStorage.getItem(TOUR_LOCAL_STORAGE_ID);
        if (tourContinued) {
            localStorage.removeItem(TOUR_LOCAL_STORAGE_ID);
            const currentStep = localStorage.getItem(tourContinued);
            if (currentStep) {
                localStorage.removeItem(tourContinued);
                setCurrentTour(tourContinued);
                setStartAt(+currentStep);
            }
        }
    }, [currentTour]);

    const toursMap: TourMapProps = {
        [virtualStudyId]: {
            className: virtualStudyId + '-modal',
            title: 'Create a Virtual Study',
            getSteps: getVirtualStudySteps,
        },
        [groupComparisonId]: {
            className: groupComparisonId + '-modal',
            title: 'Compare User-defined Groups of Samples',
            getSteps: getGroupComparisonSteps,
        },
    };

    // click on the title to start the tour
    const handleClick = (e: any) => {
        const tourType = e.target.dataset.type;
        setCurrentTour(tourType);
        setStartAt(0);
        setIsOpen(true);
    };

    return (
        <div>
            {!hideEntry &&
                _.map(toursMap, ({ title }, tourType) => (
                    <div
                        className="interactive-tour"
                        key={tourType}
                        data-type={tourType}
                        onClick={handleClick}
                    >
                        {title}
                    </div>
                ))}
            {currentTour && (
                <Tour
                    rounded={16}
                    // closeWithMask
                    isOpen={isOpen}
                    startAt={startAt}
                    goToStep={gotoStep}
                    showNumber={false}
                    showNavigation={false}
                    showButtons={!lockTour}
                    showNavigationNumber={false}
                    onRequestClose={endTour}
                    className={toursMap[currentTour].className}
                    steps={toursMap[currentTour].getSteps({
                        isLoggedIn,
                        studies,
                        setLockTour,
                        setGotoStep,
                        endTour,
                    })}
                    lastStepNextButton={
                        <div className="finish-step-btn">
                            Finish guidance 🎉
                        </div>
                    }
                    prevButton={
                        <div className="skip-all-btn" onClick={endTourWithBtn}>
                            Skip All
                        </div>
                    }
                    nextButton={<div className="next-step-btn">Next Step</div>}
                />
            )}
        </div>
    );
}
