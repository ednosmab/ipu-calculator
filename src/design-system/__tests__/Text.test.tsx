import { render } from '@testing-library/react-native';
import { Text } from '../components/Text';

global.__ExpoImportMetaRegistry = global.__ExpoImportMetaRegistry || {};
global.structuredClone = global.structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

describe('Text Snapshot Tests', () => {
  it('renders body text correctly', () => {
    const { toJSON } = render(<Text>Corpo texto</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders bold text correctly', () => {
    const { toJSON } = render(<Text weight="bold">Texto negrito</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders large text correctly', () => {
    const { toJSON } = render(<Text size="lg">Texto grande</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders small text correctly', () => {
    const { toJSON } = render(<Text size="sm">Texto pequeno</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders muted text correctly', () => {
    const { toJSON } = render(<Text muted>Texto muted</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders error text correctly', () => {
    const { toJSON } = render(<Text color="error">Texto erro</Text>);
    expect(toJSON()).toMatchSnapshot();
  });
});