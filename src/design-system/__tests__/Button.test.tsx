import { render } from '@testing-library/react-native';
import { Button } from '../components/Button';

global.__ExpoImportMetaRegistry = global.__ExpoImportMetaRegistry || {};
global.structuredClone = global.structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

describe('Button Snapshot Tests', () => {
  it('renders primary button correctly', () => {
    const { toJSON } = render(
      <Button title="Calcular" onPress={() => {}} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders secondary button correctly', () => {
    const { toJSON } = render(
      <Button title="Cancelar" onPress={() => {}} variant="secondary" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders small button correctly', () => {
    const { toJSON } = render(
      <Button title="Small" onPress={() => {}} size="sm" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders large button correctly', () => {
    const { toJSON } = render(
      <Button title="Large" onPress={() => {}} size="lg" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders disabled button correctly', () => {
    const { toJSON } = render(
      <Button title="Disabled" onPress={() => {}} disabled />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders loading button correctly', () => {
    const { toJSON } = render(
      <Button title="Loading" onPress={() => {}} loading />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});