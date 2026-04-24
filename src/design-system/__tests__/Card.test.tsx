import { render } from '@testing-library/react-native';
import { Card } from '../components/Card';

global.__ExpoImportMetaRegistry = global.__ExpoImportMetaRegistry || {};
global.structuredClone = global.structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

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