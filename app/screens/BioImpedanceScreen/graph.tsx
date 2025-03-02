import {useRef, useEffect, useState} from 'react';
import * as echarts from 'echarts/core';
import {Dimensions, StyleSheet, View, Pressable, Text} from 'react-native';
import {LineChart} from 'echarts/charts';
import {
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  TitleComponent,
  GridComponent,
  VisualMapComponent,
} from 'echarts/components';
import {SVGRenderer, SvgChart} from '@wuba/react-native-echarts';

// Register ECharts components
echarts.use([
  VisualMapComponent,
  GridComponent,
  TitleComponent,
  SVGRenderer,
  LineChart,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
]);

// Define types for the data points
export interface DataPoint {
  time: string;
  bioImpedance: number;
  phaseAngle: number;
}

interface GraphScreenProps {
  numPoints: DataPoint[];
}

const GraphScreen: React.FC<GraphScreenProps> = ({numPoints}) => {
  const svgRef = useRef<any>(null);

  useEffect(() => {
    const option = {
      visualMap: [
        {
          show: false,
          type: 'continuous',
          seriesIndex: 1,
          min: 0,
          max: 200,
        },
        {
          show: false,
          type: 'continuous',
          seriesIndex: 1,
          dimension: 0,
          min: 0,
          max: numPoints.length - 1,
        },
      ],
      title: [
        {
          left: 'center',
          text: 'Bioimpedance Analysis (BIA) Graph',
        },
        {
          top: '50%',
          left: 'center',
          text: 'PhaseAngle Graph',
        },
      ],
      tooltip: {
        trigger: 'axis',
      },
      xAxis: [
        {
          data: numPoints.map(
            (item: DataPoint) => (item.time = new Date().toISOString()),
          ),
        },
        {
          data: numPoints.map(
            (item: DataPoint) => (item.time = new Date().toISOString()),
          ),
          gridIndex: 1,
        },
      ],
      yAxis: [
        {},
        {
          gridIndex: 1,
        },
      ],
      grid: [
        {
          bottom: '60%',
        },
        {
          top: '60%',
        },
      ],
      series: [
        {
          type: 'line',
          showSymbol: false,
          data: numPoints.map((item: DataPoint) => item.bioImpedance),
        },
        {
          type: 'line',
          showSymbol: false,
          data: numPoints.map((item: DataPoint) => item.phaseAngle),
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
      ],
    };

    let chart: echarts.ECharts | undefined;
    if (svgRef.current) {
      chart = echarts.init(svgRef.current, 'light', {
        renderer: 'svg',
        width: Dimensions.get('screen').width - 20,
        height: 500,
      });
      chart.setOption(option);
    }

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [numPoints]);

  return (
    <View style={styles.chartContainer}>
      <SvgChart ref={svgRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
});

export default GraphScreen;
