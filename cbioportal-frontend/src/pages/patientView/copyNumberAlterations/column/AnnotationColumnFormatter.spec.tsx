import AnnotationColumnFormatter from './AnnotationColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

import {
    getCivicGenes,
    getCnaCivicVariants,
    getCnaData,
    getExpectedCnaCivicEntry,
    getCnaCivicEmptyVariants,
} from 'test/CivicMockUtils';

describe('AnnotationColumnFormatter', () => {
    it('properly creates a civic entry', () => {
        let civicGenes = getCivicGenes();

        let civicVariants = getCnaCivicVariants();

        let cna = getCnaData();

        let expectedCivicEntry = getExpectedCnaCivicEntry();

        assert.deepEqual(
            AnnotationColumnFormatter.getCivicEntry(
                cna,
                civicGenes,
                civicVariants
            ),
            expectedCivicEntry,
            'Equal Civic Entry'
        );
    });

    it('properly points that Civic has variants', () => {
        let civicGenes = getCivicGenes();

        let civicVariants = getCnaCivicVariants();

        let cna = getCnaData();

        assert.deepEqual(
            AnnotationColumnFormatter.hasCivicVariants(
                cna,
                civicGenes,
                civicVariants
            ),
            true,
            'Civic has variants'
        );
    });

    it('properly points that Civic has no variants', () => {
        let civicGenes = getCivicGenes();

        let civicVariants = getCnaCivicEmptyVariants();

        let cna = getCnaData();

        assert.deepEqual(
            AnnotationColumnFormatter.hasCivicVariants(
                cna,
                civicGenes,
                civicVariants
            ),
            false,
            'Civic has no variants'
        );
    });
});
