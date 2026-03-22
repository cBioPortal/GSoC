import _ from 'lodash';
import { assert } from 'chai';

import { PfamDomainRange } from 'genome-nexus-ts-api-client';
import { generatePfamDomainColorMap } from './PfamUtils';

let domains: PfamDomainRange[];

beforeAll(() => {
    domains = [
        {
            pfamDomainId: 'PF0002',
            pfamDomainStart: 7,
            pfamDomainEnd: 9,
        },
        {
            pfamDomainId: 'PF0002',
            pfamDomainStart: 23,
            pfamDomainEnd: 29,
        },
        {
            pfamDomainId: 'PF0001',
            pfamDomainStart: 2,
            pfamDomainEnd: 5,
        },
        {
            pfamDomainId: 'PF0001',
            pfamDomainStart: 61,
            pfamDomainEnd: 89,
        },
        {
            pfamDomainId: 'PF0004',
            pfamDomainStart: 31,
            pfamDomainEnd: 41,
        },
        {
            pfamDomainId: 'PF0003',
            pfamDomainStart: 13,
            pfamDomainEnd: 17,
        },
    ];
});

describe('PfamUtils', () => {
    it('assigns colors for PFAM domains in the correct order', () => {
        const colorMap = generatePfamDomainColorMap(domains);

        assert.equal(
            _.keys(colorMap).length,
            4,
            'number of colors should be equal to the number of unique domains'
        );

        assert.equal(colorMap['PF0001'], '#2dcf00');
        assert.equal(colorMap['PF0002'], '#ff5353');
        assert.equal(colorMap['PF0003'], '#5b5bff');
        assert.equal(colorMap['PF0004'], '#ebd61d');
    });
});
