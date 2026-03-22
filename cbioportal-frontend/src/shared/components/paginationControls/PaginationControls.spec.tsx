import PaginationControls from './PaginationControls';
import React from 'react';
import { assert, default as chai, expect } from 'chai';
import { mount } from 'enzyme';
import chaiEnzyme from 'chai-enzyme';
import styles from './paginationControls.module.scss';
import { Button } from 'react-bootstrap';

chai.use(chaiEnzyme());

describe('PaginationControls', () => {
    describe.skip("'Show more' button", () => {
        it('on click, increases the itemsPerPage until everything is shown, in proper increments, then disables', () => {
            let itemsPerPage = 1;
            let paginationControls = mount(
                <PaginationControls
                    showMoreButton={true}
                    totalItems={100}
                    itemsPerPage={itemsPerPage}
                    itemsPerPageOptions={[1, 2, 3, 4, 40]}
                    onChangeItemsPerPage={(x: number) => {
                        itemsPerPage = x;
                    }}
                />
            );
            let button = paginationControls.find('#showMoreButton');
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 2);
            paginationControls.setProps({ itemsPerPage });
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 3);
            paginationControls.setProps({ itemsPerPage });
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 4);
            paginationControls.setProps({ itemsPerPage });
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 40);
            paginationControls.setProps({ itemsPerPage });
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 80);
            paginationControls.setProps({ itemsPerPage });
            expect(button).not.to.have.attr('disabled');
            button.simulate('click');
            assert.equal(itemsPerPage, 120);
            paginationControls.setProps({ itemsPerPage });
            expect(button).to.have.attr('disabled');
        });

        it('is hidden if everything is shown initially', () => {
            let paginationControls = mount(
                <PaginationControls
                    showMoreButton={true}
                    totalItems={1}
                    itemsPerPage={2}
                    itemsPerPageOptions={[1, 2, 3, 4]}
                />
            );
            expect(paginationControls.find(Button), 'no buttons exist').to.not
                .exist;

            paginationControls = mount(
                <PaginationControls
                    showMoreButton={true}
                    totalItems={3}
                    itemsPerPage={2}
                    itemsPerPageOptions={[1, 2, 3, 4]}
                />
            );
            expect(
                paginationControls.find(Button),
                'buttons should exist if theres more than one page'
            ).to.have.lengthOf(1);
        });

        it('shows functional reset button if its showing more than minimum per page', () => {
            let itemsPerPage = 1;
            let paginationControls = mount(
                <PaginationControls
                    showMoreButton={true}
                    totalItems={100}
                    itemsPerPage={itemsPerPage}
                    itemsPerPageOptions={[1, 2, 3, 4, 40]}
                    onChangeItemsPerPage={(x: number) => {
                        itemsPerPage = x;
                    }}
                />
            );
            let showMore = paginationControls.find('#showMoreButton');
            let reset = paginationControls.find('#resetItemsPerPageButton');
            expect(showMore).not.to.have.attr('disabled');
            expect(reset).to.have.className(styles['hidden-button']);

            showMore.simulate('click');
            assert.equal(itemsPerPage, 2, 'show more worked');
            paginationControls.setProps({ itemsPerPage });
            reset = paginationControls.find('#resetItemsPerPageButton');
            assert.equal(reset.length, 1, 'reset button shown now');
            reset.simulate('click');
            assert.equal(itemsPerPage, 1, 'reset button worked');

            paginationControls = mount(
                <PaginationControls
                    showMoreButton={true}
                    totalItems={100}
                    itemsPerPage={3}
                    itemsPerPageOptions={[1, 2, 3, 4, 40]}
                    onChangeItemsPerPage={(x: number) => {
                        itemsPerPage = x;
                    }}
                />
            );
            expect(reset).not.to.have.className(styles['hidden-button']);
        });
    });
});
