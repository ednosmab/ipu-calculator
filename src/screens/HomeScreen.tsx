import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { theme } from '../styles/theme';

type Props = {
    onGoToCalculator: () => void;
    onGoToCalibration: () => void;
};

export const HomeScreen = ({ onGoToCalculator, onGoToCalibration }: Props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Calculadora IPU</Text>

            <Button title="Calcular IPU" onPress={onGoToCalculator} />
            <Button title="Calibragem" onPress={onGoToCalibration} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        color: theme.colors.text,
        marginBottom: 24,
        fontWeight: 'bold',
    },
});