import {
    CopyDownloadControls,
    ICopyDownloadData,
} from './CopyDownloadControls';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import sinon from 'sinon';

describe('CopyDownloadControls', () => {
    const completeData: ICopyDownloadData = {
        status: 'complete',
        text: 'This is your complete & shiny download data!',
    };

    const incompleteData: ICopyDownloadData = {
        status: 'incomplete',
        text: 'This data is incomplete, because sometimes shift happens!',
    };

    it('downloads the complete data without any error messages', done => {
        const resolvedPromiseWithCompleteData = Promise.resolve(completeData);
        const downloadData = () => resolvedPromiseWithCompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;
        const downloadStub = sinon.stub(instance, 'download');

        instance.handleDownload();

        resolvedPromiseWithCompleteData
            .then(() => {
                assert.isTrue(
                    downloadStub.calledWith(
                        'This is your complete & shiny download data!'
                    )
                );
                assert.isFalse(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('downloads the incomplete data, and shows a warning message', done => {
        const resolvedPromiseWithIncompleteData = Promise.resolve(
            incompleteData
        );
        const downloadData = () => resolvedPromiseWithIncompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;
        const downloadStub = sinon.stub(instance, 'download');

        instance.handleDownload();

        resolvedPromiseWithIncompleteData
            .then(() => {
                assert.isTrue(
                    downloadStub.calledWith(
                        'This data is incomplete, because sometimes shift happens!'
                    )
                );
                assert.isTrue(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('copies the complete data without any error messages', done => {
        const resolvedPromiseWithCompleteData = Promise.resolve(completeData);
        const downloadData = () => resolvedPromiseWithCompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.initCopyProcess();

        resolvedPromiseWithCompleteData
            .then(() => {
                assert.equal(
                    instance.getText(),
                    'This is your complete & shiny download data!'
                );
                assert.isTrue(instance.copyingData);
                assert.isFalse(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });

    it('copies the incomplete data, and shows a warning message', done => {
        const resolvedPromiseWithIncompleteData = Promise.resolve(
            incompleteData
        );
        const downloadData = () => resolvedPromiseWithIncompleteData;
        const component: ReactWrapper<any, any> = mount(
            <CopyDownloadControls downloadData={downloadData} />
        );
        const instance = component.instance() as CopyDownloadControls;

        instance.initCopyProcess();

        resolvedPromiseWithIncompleteData
            .then(() => {
                assert.equal(
                    instance.getText(),
                    'This data is incomplete, because sometimes shift happens!'
                );
                assert.isTrue(instance.copyingData);
                assert.isTrue(instance.showErrorMessage);
                done();
            })
            .catch(done);
    });
});
