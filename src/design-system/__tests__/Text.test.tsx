import { render } from '@testing-library/react-native';
import { Text } from '../components/Text';

(global as any).__ExpoImportMetaRegistry = (global as any).__ExpoImportMetaRegistry || {};
(global as any).structuredClone = (global as any).structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

describe('Text Snapshot Tests', () => {
  it('renders body text correctly', () => {
    const { toJSON } = render(<Text>Corpo texto</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders bold text correctly', () => {
    const { toJSON } = render(<Text weight="bold">Texto negrito</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders large weight text correctly', () => {
    const { toJSON } = render(<Text weight="bold">Texto em negrito</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders small variant text correctly', () => {
    const { toJSON } = render(<Text variant="label">Texto de rótulo</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders muted text correctly', () => {
    const { toJSON } = render(<Text variant="helper">Texto de ajuda</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders error text correctly', () => {
    const { toJSON } = render(<Text variant="error">Texto erro</Text>);
    expect(toJSON()).toMatchSnapshot();
  });
});