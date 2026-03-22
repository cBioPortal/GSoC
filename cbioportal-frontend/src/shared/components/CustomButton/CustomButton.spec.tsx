import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomButton } from './CustomButton';
import { CustomButtonConfig } from './CustomButtonConfig';
import { ICustomButtonProps, CustomButtonUrlParameters } from './ICustomButton';

jest.mock('cbioportal-frontend-commons', () => ({
    DefaultTooltip: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

describe('CustomButton Component', () => {
    const testData = 'test data';
    const testDataLengthString = testData.length.toString();
    const testUrlFormat =
        'http://example.com?study={studyName}&-DataLength={dataLength}';
    const testStudyName = 'Test Study';
    const navigatorClipboardOriginal = navigator.clipboard;

    // we used to use window.location to navigate, then changed to window.open
    const windowLocationOriginal = window.location;
    const windowOpenOriginal = window.open;
    const windowOpenMock = jest.fn();

    const mockJson: string = `
[
    {
        "id": "test",
        "name": "Test Tool",
        "tooltip": "This button shows that the Test Tool is working",
        "image_src": "https://frontend.cbioportal.org/reactapp/images/369b022222badf37b2b0c284f4ae2284.png",
        "url_format": "https://eu.httpbin.org/anything?-StudyName={studyName}&-ImportDataLength={dataLength}"
    }
]    
    `;

    const mockProps: ICustomButtonProps = {
        toolConfig: {
            name: 'Test',
            id: 'test-tool',
            url_format: testUrlFormat,
            tooltip: 'Test Tooltip',
            image_src: 'test-icon.png',
        },
        baseTooltipProps: {},
        overlayClassName: '',
        downloadDataAsync: () => Promise.resolve(testData),
        urlFormatOverrides: {},
    };

    beforeEach(() => {
        (window as any).groupComparisonPage = {
            store: {
                displayedStudies: {
                    result: [{ name: testStudyName }],
                },
            },
        };

        // mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockResolvedValueOnce(''),
            },
        });

        // Mock window.location.href
        delete (window as any).location;
        (window as any).location = {
            href: '',
            assign: jest.fn().mockImplementation(url => {
                (window as any).location.href = url;
            }),
        };

        // Mock window.open
        (window as any).open = windowOpenMock;
    });

    afterEach(() => {
        delete (window as any).groupComparisonPage;
        Object.assign(navigator, navigatorClipboardOriginal);
        window.location = windowLocationOriginal;
        window.open = windowOpenOriginal;
    });

    it('parses json correctly and creates Config objects', () => {
        const config = CustomButtonConfig.parseCustomButtonConfigs(mockJson);
        expect(config.length).toBe(1);
        expect(config[0].id).toBe('test');
        // TECH: compiler doesn't know that config[0] is valid, so we add a spurious optional chaining operator
        expect(config[0]?.isAvailable?.()).toBe(true);
    });

    it('renders correctly', () => {
        render(<CustomButton {...mockProps} />);
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('returns the correct study name from getSingleStudyName', () => {
        const component = new CustomButton(mockProps);
        expect(component.getSingleStudyName()).toBe('Test Study');
    });

    it('calls handleClick on button click', () => {
        const handleClickSpy = jest.spyOn(
            CustomButton.prototype,
            'handleClick'
        );
        const { getByRole } = render(<CustomButton {...mockProps} />);
        const button = getByRole('button');
        fireEvent.click(button);
        expect(handleClickSpy).toHaveBeenCalled();
    });

    it('copies data to clipboard and calls openCustomUrl', async () => {
        const openCustomUrlSpy = jest.spyOn(
            CustomButton.prototype,
            'openCustomUrl'
        );
        const { getByRole } = render(<CustomButton {...mockProps} />);
        const button = getByRole('button');

        fireEvent.click(button);

        await waitFor(() =>
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testData)
        );

        await waitFor(() => expect(openCustomUrlSpy).toHaveBeenCalled());

        expect(openCustomUrlSpy).toHaveBeenCalledWith({
            dataLength: testDataLengthString,
        });
    });

    it('formats URL correctly and redirects', () => {
        const component = new CustomButton(mockProps);
        const urlParametersLaunch: CustomButtonUrlParameters = {
            studyName: testStudyName,
            dataLength: testDataLengthString,
        };

        // LOW: should manually assemble using actual test property values
        const expectedUrl =
            'http://example.com?study=Test%20Study&-DataLength=9';

        component.openCustomUrl(urlParametersLaunch);

        expect(windowOpenMock).toHaveBeenCalledWith(expectedUrl, '_blank');
    });
});
