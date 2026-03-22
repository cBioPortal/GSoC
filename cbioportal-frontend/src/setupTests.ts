import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

// mock global modules to prevent remote calls
jest.mock('cbioportal-ts-api-client');

// need to mock this module to prevent circular references from breaking any test that refers to LazyMobXTable
// mocking CopyDownloadQueryLinks at this level practically makes CopyDownloadQueryLinks untestable
// if we ever need to test that class, we need to refactor it to get rid of the circular references
jest.mock('shared/components/copyDownloadControls/CopyDownloadQueryLinks.tsx');

// explicitly set mock for problematic packages
jest.setMock('webpack-raphael', {});
jest.setMock('jquery-migrate', {});
jest.setMock('igv', {});
jest.setMock('react-markdown', {});
jest.setMock('axios', {});
