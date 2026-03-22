import { render } from '@testing-library/react';
import React from 'react';
import { expect } from 'chai';

import CivicCard from './CivicCard';

export function getCivicVariantData() {
    return {
        id: 0,
        name: 'variantdata',
        description: 'descr',
        url: 'http://',
        evidenceCounts: {
            predictiveCount: 1,
        },
    };
}

describe('CivicCard', () => {
    const props = {
        title: 'fooTitle',
        geneName: 'fooGeneName',
        geneDescription: 'fooGeneDesc',
        geneUrl: 'http://fooGeneURL',
        variants: {},
    };

    const props2 = {
        title: 'fooTitle',
        geneName: 'fooGeneName',
        geneDescription: 'fooGeneDesc',
        geneUrl: 'http://fooGeneURL',
        variants: {
            var1: getCivicVariantData(),
            var2: getCivicVariantData(),
        },
    };

    it('should render civic-card', () => {
        const component = render(<CivicCard {...props} />);
        expect(
            component.container.getElementsByClassName('civic-card').length
        ).to.be.equal(1);
    });

    it('should not have variant', () => {
        const component = render(<CivicCard {...props} />);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-header'
            ).length
        ).to.be.equal(0);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-name'
            ).length
        ).to.be.equal(0);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-entry-types'
            ).length
        ).to.be.equal(0);
    });

    it('should have two variants', () => {
        const component = render(<CivicCard {...props2} />);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-header'
            ).length
        ).to.be.equal(2);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-name'
            ).length
        ).to.be.equal(2);
        expect(
            component.container.getElementsByClassName(
                'civic-card-variant-entry-types'
            ).length
        ).to.be.equal(2);
    });
});
