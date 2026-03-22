import _ from 'lodash';
import { observable, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from '../StatusHelpers';
import {
    CIVIC_NA_VALUE,
    ICivicEntry,
    ICivicVariantSummary,
} from 'cbioportal-utils';
import CivicCard from './CivicCard';

import civicLogoSrc from '../../images/civic-logo.png';
import civicLogoNoVariantsSrc from '../../images/civic-logo-no-variants.png';

import annotationStyles from '../column/annotation.module.scss';

export interface ICivicProps {
    civicEntry: ICivicEntry | null | undefined;
    civicStatus: 'pending' | 'error' | 'complete';
    hasCivicVariants: boolean;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export function sortValue(civicEntry: ICivicEntry | null | undefined): number {
    let score = 0;

    if (civicEntry) {
        score = 1;
    }

    return score;
}

export function download(civicEntry: ICivicEntry | null | undefined): string {
    if (!civicEntry) {
        return CIVIC_NA_VALUE;
    }

    const variants: ICivicVariantSummary[] = _.values(civicEntry.variants);
    const values: string[] = [];

    if (variants && variants.length > 0 && variants[0].evidenceCounts) {
        _.forEach(variants[0].evidenceCounts, (value, key) => {
            values.push(`${key}: ${value}`);
        });
    }

    // this indicates that we have an entry but the evidence is empty
    if (values.length === 0) {
        return CIVIC_NA_VALUE;
    }

    return values.join(', ');
}

@observer
export default class Civic extends React.Component<ICivicProps, {}> {
    @observable tooltipDataLoadComplete: boolean = false;

    constructor(props: ICivicProps) {
        super(props);

        makeObservable(this);

        this.cardContent = this.cardContent.bind(this);
    }

    public render() {
        let civicContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item']}`} />
        );

        const civicImgWidth: number = 14;
        let civicImgHeight: number = 14;
        let civicImgSrc = !this.props.hasCivicVariants
            ? civicLogoNoVariantsSrc
            : civicLogoSrc;

        if (this.props.civicStatus == 'error') {
            civicContent = errorIcon('Error fetching Civic data');
        } else if (this.props.civicEntry !== undefined) {
            if (
                this.props.civicEntry !== null &&
                this.props.civicStatus == 'complete'
            ) {
                civicContent = (
                    <span className={`${annotationStyles['annotation-item']}`}>
                        <img
                            width={civicImgWidth}
                            height={civicImgHeight}
                            src={civicImgSrc}
                            alt="Civic Variant Entry"
                        />
                    </span>
                );

                civicContent = (
                    <DefaultTooltip
                        overlay={this.cardContent.bind(
                            this,
                            this.props.civicEntry
                        )}
                        placement="right"
                        trigger={['hover', 'focus']}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={false}
                    >
                        {civicContent}
                    </DefaultTooltip>
                );
            }
        } else {
            // It's still unknown (undefined) if the current gene has a Civic entry or not.
            civicContent = loaderIcon('pull-left');
        }

        return civicContent;
    }

    private cardContent(civicEntry: ICivicEntry): JSX.Element {
        return (
            <CivicCard
                title={`CIViC Variants`}
                geneName={civicEntry.name}
                geneDescription={civicEntry.description}
                geneUrl={civicEntry.url}
                variants={civicEntry.variants}
            />
        );
    }
}
