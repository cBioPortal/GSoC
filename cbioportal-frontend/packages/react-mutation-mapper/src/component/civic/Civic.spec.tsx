import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';
// import {getExpectedCivicEntry, getExpectedCnaCivicEntry} from "test/CivicMockUtils";
import Civic, { ICivicProps, sortValue } from './Civic';

export function getExpectedCivicEntry() {
    return {
        name: 'PIK3CA',
        description:
            "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
        url: 'https://civicdb.org/genes/37/summary',
        variants: {
            E545K: {
                id: 104,
                name: 'E545K',
                geneId: 37,
                description:
                    'PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.',
                url: 'https://civicdb.org/variants/104/summary',
                evidenceCounts: { Prognostic: 1, Predictive: 14 },
                evidences: [],
            },
        },
    };
}

export function getExpectedCnaCivicEntry() {
    return {
        name: 'RAF1',
        description: '',
        url: 'https://civicdb.org/genes/4767/summary',
        variants: {
            RAF1: {
                id: 591,
                name: 'AMPLIFICATION',
                geneId: 4767,
                description: '',
                url: 'https://civicdb.org/variants/591/summary',
                evidenceCounts: { Predictive: 1 },
                evidences: [],
            },
        },
    };
}

describe('Civic with no data', () => {
    it('displays a load spinner when there is no civic data', () => {
        const props = {
            civicEntry: undefined,
            civicStatus: 'complete',
            hasCivicVariants: true,
        } as ICivicProps;

        const component = render(<Civic {...props} />);
        const loader = component.container.getElementsByClassName('fa-spinner');

        assert.equal(loader.length, 1, 'Spinner component should exist');
    });
});

describe('Civic with data with variants', () => {
    it('displays the correct Civic icon', () => {
        const props: ICivicProps = {
            civicEntry: getExpectedCivicEntry(),
            civicStatus: 'complete',
            hasCivicVariants: true,
        } as any;

        const component = render(<Civic {...props} />);
        const civicIcon = component.container.getElementsByTagName('img');
        const civicIconItem = civicIcon.item(0)!;

        assert.isNotNull(civicIcon, 'Civic icon should exist');

        assert.equal(
            civicIconItem.getAttribute('width'),
            '14',
            'Civic icon width should be equal to 14'
        );

        assert.equal(
            civicIconItem.getAttribute('height'),
            '14',
            'Civic icon height should be equal to 14'
        );

        assert.equal(
            civicIconItem.getAttribute('src'),
            require('../../images/civic-logo.png'),
            'Civic icon should be civic-logo.png'
        );
    });
});

describe('Civic with data with no variants', () => {
    it('displays the correct Civic icon', () => {
        const props: ICivicProps = {
            civicEntry: getExpectedCnaCivicEntry(),
            civicStatus: 'complete',
            hasCivicVariants: false,
        } as any;

        const component = render(<Civic {...props} />);
        const civicIcon = component.container.getElementsByTagName('img');
        const civicIconItem = civicIcon.item(0)!;

        assert.isNotNull(civicIcon, 'Civic icon should exist');

        assert.equal(
            civicIconItem.getAttribute('width'),
            '14',
            'Civic icon width should be equal to 14'
        );

        assert.equal(
            civicIconItem.getAttribute('height'),
            '14',
            'Civic icon height should be equal to 14'
        );

        assert.equal(
            civicIconItem.getAttribute('src'),
            require('../../images/civic-logo-no-variants.png'),
            'Civic icon should be civic-logo-no-variants.png'
        );
    });
});

describe('Counts correctly', () => {
    it('Gives 1 point per entry', () => {
        const value = sortValue(getExpectedCnaCivicEntry() as any);

        assert.equal(value, 1, 'Correctly gives 1 point for an entry');
    });

    it('Gives 0 points if the entry is undefined', () => {
        const value = sortValue(undefined);

        assert.equal(
            value,
            0,
            'Correctly gives 0 points if the entry is undefined'
        );
    });

    it('Gives 0 points if the entry is null', () => {
        const value = sortValue(null);

        assert.equal(value, 0, 'Correctly gives 0 points if the entry is null');
    });
});
