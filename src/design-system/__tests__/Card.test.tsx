import { render } from '@testing-library/react-native';
import { Card } from '../components/Card';

(global as any).__ExpoImportMetaRegistry = (global as any).__ExpoImportMetaRegistry || {};
(global as any).structuredClone = (global as any).structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

describe('Card Snapshot Tests', () => {
  it('renders default card correctly', () => {
    const { toJSON } = render(
      <Card>Conteúdo do card</Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders card with custom style correctly', () => {
    const { toJSON } = render(
      <Card style={{ padding: 20 }}>Card com estilo</Card>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});