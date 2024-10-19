import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { LineChart } from 'echarts/charts';
import {
    TooltipComponent,
    DataZoomComponent,
    LegendComponent,
    TitleComponent,
    GridComponent,
    VisualMapComponent,
} from 'echarts/components';
import { SVGRenderer, SvgChart } from '@wuba/react-native-echarts';

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

const MAX_POINTS = 100;
const UPDATE_INTERVAL = 100;

const GraphScreen = () => {
    const numPoints = useSelector(state => state.graph.data);
    const svgRef = useRef(null);
    const chartInstance = useRef(null);
    const [visibleData, setVisibleData] = useState([]);

    const baseOption = useMemo(() => ({
        backgroundColor: '#ffffff',
        animation: false,
        visualMap: [
            {
                show: false,
                type: 'continuous',
                seriesIndex: 1,
                min: 0,
                max: 200,
                inRange: {
                    color: ['#2196F3', '#FF6384'] // Modern blue to pink gradient
                }
            },
            {
                show: false,
                type: 'continuous',
                seriesIndex: 1,
                dimension: 0,
                min: 0,
                max: MAX_POINTS,
            },
        ],
        title: [
            {
                left: 'center',
                text: 'Bioimpedance Analysis (BIA) Graph',
                textStyle: {
                    color: '#212121',
                    fontSize: 16,
                    fontWeight: 'normal'
                }
            },
            {
                top: '50%',
                left: 'center',
                text: 'PhaseAngle Graph',
                textStyle: {
                    color: '#212121',
                    fontSize: 16,
                    fontWeight: 'normal'
                }
            },
        ],
        tooltip: {
            trigger: 'axis',
            show: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e0e0e0',
            textStyle: {
                color: '#212121'
            },
            axisPointer: {
                type: 'cross',
                lineStyle: {
                    color: '#bdbdbd',
                    width: 1
                }
            }
        },
        grid: [
            {
                bottom: '60%',
                top: '15%',
                left: '5%',
                right: '5%',
                borderColor: '#f5f5f5'
            },
            {
                top: '60%',
                bottom: '5%',
                left: '5%',
                right: '5%',
                borderColor: '#f5f5f5'
            },
        ],
        xAxis: [
            {
                axisLine: {
                    lineStyle: { color: '#e0e0e0' }
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#f5f5f5' }
                },
                axisLabel: { color: '#757575' }
            },
            {
                gridIndex: 1,
                axisLine: {
                    lineStyle: { color: '#e0e0e0' }
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#f5f5f5' }
                },
                axisLabel: { color: '#757575' }
            }
        ],
        yAxis: [
            {
                axisLine: {
                    lineStyle: { color: '#e0e0e0' }
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#f5f5f5' }
                },
                axisLabel: { color: '#757575' }
            },
            {
                gridIndex: 1,
                axisLine: {
                    lineStyle: { color: '#e0e0e0' }
                },
                splitLine: {
                    show: true,
                    lineStyle: { color: '#f5f5f5' }
                },
                axisLabel: { color: '#757575' }
            }
        ]
    }), []);

    const updateChartData = useCallback(() => {
        if (!chartInstance.current) return;

        const slicedData = numPoints.slice(-MAX_POINTS);

        const option = {
            xAxis: [
                {
                    data: slicedData.map(item => item.time),
                },
                {
                    data: slicedData.map(item => item.time),
                    gridIndex: 1,
                },
            ],
            yAxis: [
                {},
                {
                    gridIndex: 1,
                },
            ],
            series: [
                {
                    type: 'line',
                    showSymbol: false,
                    data: slicedData.map(item => item.BIA),
                    lineStyle: {
                        color: '#2196F3', // Modern blue
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(33, 150, 243, 0.25)' },
                            { offset: 1, color: 'rgba(33, 150, 243, 0.05)' }
                        ])
                    }
                },
                {
                    type: 'line',
                    showSymbol: false,
                    data: slicedData.map(item => item.PHA),
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    lineStyle: {
                        color: '#FF6384', // Modern pink/red
                        width: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(255, 99, 132, 0.25)' },
                            { offset: 1, color: 'rgba(255, 99, 132, 0.05)' }
                        ])
                    }
                },
            ],
        };

        requestAnimationFrame(() => {
            chartInstance.current.setOption(option);
        });
    }, [numPoints]);

    useEffect(() => {
        if (!svgRef.current) return;

        chartInstance.current = echarts.init(svgRef.current, 'light', {
            renderer: 'svg',
            width: Dimensions.get('screen').width - 20,
            height: 550,
        });
        
        chartInstance.current.setOption(baseOption);

        const updateTimer = setInterval(updateChartData, UPDATE_INTERVAL);

        return () => {
            clearInterval(updateTimer);
            if (chartInstance.current) {
                chartInstance.current.dispose();
            }
        };
    }, [baseOption]);

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
        backgroundColor: '#ffffff',
    },
});

export default GraphScreen;
