import * as React from 'react';
import mainStyles from './main.module.scss';
import { OTHER_BIOMARKER_HUGO_SYMBOL } from './constants';

type OncoKbCardDefaultTitleProps = {
    hugoSymbol: string;
    variant: string;
    tumorType: string;
    displayCancerTypeInTitle?: boolean;
};

export const OncoKbCardTitle: React.FunctionComponent<OncoKbCardDefaultTitleProps> = (
    props: OncoKbCardDefaultTitleProps
) => {
    const titleContent = [];
    if (
        props.hugoSymbol &&
        props.hugoSymbol !== OTHER_BIOMARKER_HUGO_SYMBOL &&
        (!props.variant || !props.variant.includes(props.hugoSymbol))
    ) {
        titleContent.push(props.hugoSymbol);
    }
    if (props.variant) {
        titleContent.push(props.variant);
    }
    if (props.tumorType && props.displayCancerTypeInTitle) {
        if (titleContent.length > 0) {
            titleContent.push('in');
        }
        titleContent.push(props.tumorType);
    }
    return (
        <div className={mainStyles['title']} data-test="oncokb-card-title">
            {<span>{titleContent.join(' ')}</span>}
        </div>
    );
};
