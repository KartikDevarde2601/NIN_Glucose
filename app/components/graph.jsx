import {useRef, useEffect, useState} from 'react';
import * as echarts from 'echarts/core';
import {Dimensions, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
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

const GraphScreen = () => {
  const numPoints = useSelector(state => state.graph.data);

  const svgRef = useRef(null);

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
          data: numPoints.map(item => item.time),
        },
        {
          data: numPoints.map(item => item.time),
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
          data: numPoints.map(item => item.bioImpedance),
        },
        {
          type: 'line',
          showSymbol: false,
          data: numPoints.map(item => item.phaseAngle),
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
      ],
    };

    let chart;

    if (svgRef.current) {
      chart = echarts.init(svgRef.current, 'light', {
        renderer: 'svg',
        width: Dimensions.get('screen').width - 20,
        height: 550,
      });
      chart.setOption(option);
    }

    return () => {
      if (chart) {
        chart.dispose();
      }
    };
  }, [numPoints]);

  handleBackToSettingBelt = () => {
    dispatch(setsettingBelt(false));
  };

  return (
    <View style={styles.container}>
      <SvgChart ref={svgRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 550,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GraphScreen;
