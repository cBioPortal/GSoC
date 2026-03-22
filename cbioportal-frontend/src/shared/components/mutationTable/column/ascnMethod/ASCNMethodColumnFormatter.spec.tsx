import { mount, ReactWrapper } from 'enzyme';
import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { getDefaultASCNMethodColumnDefinition } from './ASCNMethodColumnFormatter';

describe('ASCNMethodColumnFormatter', () => {
    const mutationWithAscnData = initMutation({
        sampleId: 'sample_with_ascn_data',
        alleleSpecificCopyNumber: {
            ascnMethod: 'my_ascn_method',
        },
    });
    const mutationWithoutAscnData = initMutation({
        sampleId: 'sample_without_ascn_data',
    });

    let componentWithAscnMethodColumn: ReactWrapper<any, any>;
    let componentWithoutAscnMethodColumn: ReactWrapper<any, any>;

    beforeAll(() => {
        componentWithAscnMethodColumn = mount(
            getDefaultASCNMethodColumnDefinition().render([
                mutationWithAscnData,
            ])
        );
        componentWithoutAscnMethodColumn = mount(
            getDefaultASCNMethodColumnDefinition().render([
                mutationWithoutAscnData,
            ])
        );
    });

    it('renders default ascn method column', () => {
        assert.isTrue(
            componentWithAscnMethodColumn
                .find('span')
                .text()
                .indexOf('my_ascn_method') > -1,
            'ASCN method should be defined for mutation with ASCN method available.'
        );
        assert.isTrue(
            componentWithoutAscnMethodColumn.find('span').text().length == 0,
            'ASCN method should be an empty string if not available for a mutation'
        );
    });
});
