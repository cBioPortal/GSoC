import { assert } from 'chai';
import { AlterationTypeConstants } from 'shared/constants';

describe('PlotsTab', () => {
    describe('controls', () => {
        describe('gene lock', () => {
            it('genes can be freely selected when gene lock is off', () => {});
            it('when gene lock is selected, both axes gene selection should be the one from the axis where lock was clicked', () => {});
            it('genes are locked to be the same when gene lock is on and gene selection is changed in either axis', () => {});
        });

        describe('apply log scale', () => {
            it('should show log scale selector if and only if profile is of [TODO: what type???] type', () => {});
        });

        describe('utilities menu', () => {
            describe('view section', () => {
                it('should appear if and only if the same gene is selected in both axes', () => {});
            });
        });

        describe('genetic profile menu', () => {
            it('in each axis it should show the genetic profile controls when the genetic profile radio is selected', () => {});
        });

        describe('clinical attributes menu', () => {
            it('in each axis it should show the clinical attribute selector when the clinical attribute radio is selected', () => {});
        });
    });
});
