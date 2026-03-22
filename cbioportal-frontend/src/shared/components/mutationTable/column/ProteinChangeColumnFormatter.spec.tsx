import { assert } from 'chai';
import ProteinChangeColumnFormatter from './ProteinChangeColumnFormatter';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import styles from './proteinChange.module.scss';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { mount, ReactWrapper } from 'enzyme';

/**
 * @author Selcuk Onur Sumer
 */
describe('ProteinChangeColumnFormatter', () => {
    const germlineMutation: Mutation = initMutation({
        proteinChange: 'Q616K',
        mutationStatus: 'Germline',
    });

    const somaticMutation: Mutation = initMutation({
        proteinChange: 'Q616L',
        mutationStatus: 'Somatic',
    });

    const mutationWithLongProteinChangeValue: Mutation = initMutation({
        proteinChange: 'this_is_a_protein_change_with_more_than_20_chars',
        mutationStatus: 'Somatic',
    });

    let germlineComponent: ReactWrapper<any, any>;
    let somaticComponent: ReactWrapper<any, any>;
    let longProteinChangeComponent: ReactWrapper<any, any>;

    beforeAll(() => {
        let data = [germlineMutation];

        // mount a single cell component (Td) for a germline mutation
        germlineComponent = mount(
            ProteinChangeColumnFormatter.renderWithMutationStatus(data)
        );

        data = [somaticMutation];

        // mount a single cell component (Td) for a somatic mutation
        somaticComponent = mount(
            ProteinChangeColumnFormatter.renderWithMutationStatus(data)
        );

        data = [mutationWithLongProteinChangeValue];
        longProteinChangeComponent = mount(
            ProteinChangeColumnFormatter.renderWithMutationStatus(data)
        );
    });

    it('renders protein change display value', () => {
        assert.isTrue(
            germlineComponent.find(`.${styles.proteinChange}`).exists(),
            'Germline mutation should have the protein change value'
        );
        assert.isTrue(
            germlineComponent
                .find(`.${styles.proteinChange}`)
                .first()
                .text()
                .indexOf('Q616K') > -1,
            'Protein change value for germline mutation is correct'
        );
        assert.isTrue(
            somaticComponent.find(`.${styles.proteinChange}`).exists(),
            'Somatic mutation should have the protein change value'
        );
        assert.isTrue(
            somaticComponent
                .find(`.${styles.proteinChange}`)
                .first()
                .text()
                .indexOf('Q616L') > -1,
            'Protein change value for somatic mutation is correct'
        );
        assert.isTrue(
            longProteinChangeComponent
                .find(`.${styles.proteinChange}`)
                .first()
                .text()
                .indexOf('this_is_a_protein_change_with_more_than_20_chars') ===
                -1,
            'Long protein change values should be truncated'
        );
    });

    it('adds tooltip for long protein change values', () => {
        assert.isFalse(
            germlineComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short values (Q616K)'
        );
        assert.isFalse(
            somaticComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short values (Q616L)'
        );
        assert.isTrue(
            longProteinChangeComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for long values'
        );
    });

    it('renders germline indicator', () => {
        assert.isTrue(
            germlineComponent.find(`.${styles.germline}`).exists(),
            'Germline mutation should have the additional germline indicator'
        );
        assert.isFalse(
            somaticComponent.find(`.${styles.germline}`).exists(),
            'Somatic mutation should not have the additional germline indicator'
        );
    });
});
