import React from 'react';
import {FC} from 'react';
import {SafeAreaView, Dimensions, View, StyleSheet} from 'react-native';
import {
  Text,
  Appbar,
  Chip,
  Button,
  Surface,
  Icon,
  Divider,
} from 'react-native-paper';
import {useTheme} from 'react-native-paper';
import {RealTimeGraphBio} from '../BioImpedanceScreen/RealtimeGraphBio';

const DEFAULT_WIDTH = Dimensions.get('screen').width - 50;

type BioImpedanceScreenProps = {};

const EcgScreen: FC<BioImpedanceScreenProps> = () => {
  const theme = useTheme();
  const _goBack = () => {
    console.log('back');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      {/* Header */}
      <Appbar.Header
        style={[styles.header, {backgroundColor: theme.colors.background}]}>
        <View style={styles.headerLeft}>
          <Appbar.BackAction onPress={_goBack} />
        </View>
        <Appbar.Content
          title="ECG"
          mode="center-aligned"
          style={styles.headerContent}
          titleStyle={{
            fontWeight: 'bold',
            color: theme.colors.onPrimaryContainer,
          }}
        />
        <View style={styles.headerRight}>
          <Icon source="access-point" size={30} color="green" />
        </View>
      </Appbar.Header>

      {/* Divider*/}
      <Divider />
      {/* Glucose Load Chip */}
      <View style={styles.chipContainer}>
        <Chip icon="pulse" mode="outlined" style={styles.chip}>
          Glucose Load
        </Chip>
        <Chip icon="clock-time-eight" mode="outlined" style={styles.chip}>
          15 Interval
        </Chip>
      </View>

      {/* Graph Containers */}
      <View style={styles.graphsWrapper}>
        <Surface style={styles.graphContainer} elevation={2}>
          <RealTimeGraphBio
            value={10}
            title="Impedance graph"
            graphColor="#1E88E5"
          />
        </Surface>
      </View>

      {/* Control Buttons */}
      <View style={[styles.buttonContainer]}>
        <Button
          mode="contained"
          icon="play"
          style={styles.button}
          buttonColor="#4CAF50">
          Start
        </Button>
        <Button
          mode="contained"
          icon="stop"
          style={styles.button}
          buttonColor="#F44336">
          Stop
        </Button>
        <Button mode="outlined" icon="delete" style={styles.button}>
          Discard
        </Button>
        <Button
          mode="contained"
          icon="check"
          style={styles.button}
          buttonColor="#2196F3">
          Done
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '',
  },
  chipContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  chip: {
    backgroundColor: '#fff',
  },
  graphsWrapper: {
    paddingHorizontal: 16,
    gap: 16,
  },
  graphContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  graphTitle: {
    position: 'absolute',
    top: 8,
    left: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
  },
  graphPlaceholder: {
    fontSize: 16,
    color: '#757575',
  },
  graphDimensions: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  dimensionText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  button: {
    minWidth: (DEFAULT_WIDTH - 32) / 2,
    margin: 4,
  },
  header: {
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerContent: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
});

export default EcgScreen;
