import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ResultCard } from '../components/ResultCard';
import { useCalibration } from '../hooks/useCalibration';
import { theme } from '../styles/theme';

type Props = {
    goBack: () => void;
    goToCalculator: () => void;
};

export const CalibrationScreen = ({ goBack, goToCalculator }: Props) => {
    const {
        pesoDesejado,
        valorMaquina,
        pesoReal,
        setPesoDesejado,
        setValorMaquina,
        setPesoReal,
        result,
        error,
        calculate,
        clear,
    } = useCalibration();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Calibragem de Vazão</Text>

            <View style={styles.content}>
                {result !== null && <ResultCard result={result} />}

                <InputField
                    label="Peso desejado"
                    value={pesoDesejado}
                    onChange={setPesoDesejado}
                />

                <InputField
                    label="Valor da máquina"
                    value={valorMaquina}
                    onChange={setValorMaquina}
                />

                <InputField
                    label="Peso real"
                    value={pesoReal}
                    onChange={setPesoReal}
                />

                {error && <Text style={styles.error}>Valores inválidos</Text>}

                <View style={styles.buttonGroup}>
                    <Button title="Calcular" onPress={calculate} />
                    <View style={{ height: 12 }} />
                    <Button title="Limpar" onPress={clear} />
                </View>
            </View>

            <View style={styles.bottomMenu}>
                <Button
                    title="Voltar"
                    onPress={goBack}
                    icon={<Ionicons name="arrow-back" size={20} color="#000" />}
                    style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                    title="Calcular IPU"
                    onPress={goToCalculator}
                    style={{ flex: 1, marginLeft: 8 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: 20,
        justifyContent: 'space-between',
        paddingTop: 40,
        paddingBottom: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    bottomMenu: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 28,
        color: theme.colors.text,
        marginBottom: 24,
        fontWeight: 'bold',
    },
    error: {
        color: theme.colors.error,
        marginBottom: 10,
    },
    buttonGroup: {
        marginTop: 8,
    },
});