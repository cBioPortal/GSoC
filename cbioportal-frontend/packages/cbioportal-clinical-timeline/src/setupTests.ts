// TODO update @types to fix the TS errors
//@ts-ignore
import { configure } from 'enzyme';
//@ts-ignore
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
