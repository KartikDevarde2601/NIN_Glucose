import React from 'react';
import {
  Canvas,
  Group,
  Path,
  Skia,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import {curveBumpX, scaleLinear, line, format} from 'd3';
import {useMemo, FC, memo} from 'react';
import {Dimensions, View, ViewStyle} from 'react-native';
import {Text} from 'react-native-paper';
// Import font (you need to add a font file in assets/fonts)
import fontSource from '../../assets/Roboto-Thin.ttf';

export interface DataPoint {
  time: string;
  bioImpedance: number;
  phaseAngle: number;
}

interface SimpleGraphProps {
  data: number[];
  title: string;
  graphColor: string;
  height?: number;
  width?: number;
  formatYLabel?: (value: number) => string;
  formatXLabel?: (value: number) => string;
}

// Styling constants
const AXIS_STROKE_WIDTH = 2;
const GRID_COLOR = '#e0e0e0';
const Y_AXIS_LABEL_OFFSET = 35;
const X_AXIS_LABEL_OFFSET = 15;
const DEFAULT_WIDTH = Dimensions.get('screen').width - 50;
const DEFAULT_HEIGHT = 180;

const formatDefaultYLabel = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1e6) return `${format('.2s')(value)}`;
  if (absValue >= 1e3) return `${format('.0s')(value)}`;
  return format(',.2r')(value);
};

const SimpleGraph: FC<SimpleGraphProps> = memo(
  ({
    data,
    title,
    graphColor,
    height = DEFAULT_HEIGHT,
    width = DEFAULT_WIDTH,
    formatYLabel = formatDefaultYLabel,
    formatXLabel = (v: any) => v.toString(),
  }) => {
    // Load font
    const axisFont = useFont(fontSource, 10);

    const {path, xScale, yScale, xTicks, yTicks} = useMemo(() => {
      if (!data?.length)
        return {path: null, xScale: null, yScale: null, xTicks: [], yTicks: []};

      // Create scales
      const xScale = scaleLinear()
        .domain([0, data.length - 1])
        .range([30, width - 30]);

      const minY = Math.min(...data);
      const maxY = Math.max(...data);
      const yPadding = Math.max((maxY - minY) * 0.1, 1);

      const yScale = scaleLinear()
        .domain([minY - yPadding, maxY + yPadding])
        .range([height - 20, 20])
        .nice(5);

      // Generate path
      const lineGenerator = line<number>()
        .x((_, i) => xScale(i))
        .y(d => yScale(d))
        .curve(curveBumpX);

      return {
        path: lineGenerator(data) || '',
        xScale,
        yScale,
        xTicks: xScale.domain(),
        yTicks: yScale.ticks(5),
      };
    }, [data, width, height]);

    // Axis positions
    const xAxisY = height - 20;
    const yAxisX = 30;

    if (!data?.length) {
      return (
        <View style={$graphWrapper}>
          <Text variant="titleMedium">{title}</Text>
          <View style={[$graphContainer, {height, width}]}>
            <View style={$noDataContainer}>
              <Text style={$noDataText}>No data available</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={$graphWrapper}>
        <Text variant="titleMedium">{title}</Text>
        <View style={[$graphContainer, {height, width}]}>
          <Canvas style={{width, height}}>
            <Group>
              {/* Y-axis grid lines */}
              {yTicks.map((tick, i) => (
                <Path
                  key={`y-grid-${i}`}
                  color={GRID_COLOR}
                  style="stroke"
                  strokeWidth={1}
                  path={`M${yAxisX},${yScale ? yScale(tick) : 0} L${
                    width - 30
                  },${yScale ? yScale(tick) : 0}`}
                />
              ))}

              {/* X-axis grid lines */}
              {xScale &&
                [...Array(data.length)].map((_, i) => (
                  <Path
                    key={`x-grid-${i}`}
                    color={GRID_COLOR}
                    style="stroke"
                    strokeWidth={1}
                    path={`M${xScale(i)},${xAxisY} L${xScale(i)},20`}
                  />
                ))}

              {/* Axes */}
              <Path
                color="black"
                style="stroke"
                strokeWidth={AXIS_STROKE_WIDTH}
                path={`M${yAxisX},${xAxisY} L${width - 30},${xAxisY}`}
              />
              <Path
                color="black"
                style="stroke"
                strokeWidth={AXIS_STROKE_WIDTH}
                path={`M${yAxisX},${xAxisY} L${yAxisX},20`}
              />

              {/* Y-axis labels */}
              {axisFont && (
                <Group>
                  {yTicks.map((tick, i) => {
                    const y = yScale ? yScale(tick) : 0;
                    return (
                      <SkiaText
                        key={`y-label-${i}`}
                        text={formatYLabel(tick)}
                        x={yAxisX - Y_AXIS_LABEL_OFFSET}
                        y={y + 4} // Adjust for alignment
                        color="black"
                        font={axisFont}
                      />
                    );
                  })}
                </Group>
              )}

              {/* X-axis labels */}
              {axisFont && (
                <Group>
                  {xScale &&
                    [...Array(data.length)].map((_, i) => {
                      const x = xScale(i);
                      return (
                        <SkiaText
                          key={`x-label-${i}`}
                          text={formatXLabel(i)}
                          x={x}
                          y={xAxisY + X_AXIS_LABEL_OFFSET}
                          color="black"
                          font={axisFont}
                        />
                      );
                    })}
                </Group>
              )}

              {/* Main graph line */}
              {path && (
                <Path
                  style="stroke"
                  strokeWidth={3}
                  color={graphColor}
                  path={Skia.Path.MakeFromSVGString(path)!}
                />
              )}
            </Group>
          </Canvas>
        </View>
      </View>
    );
  },
);

const $graphWrapper: ViewStyle = {
  marginVertical: 8,
  alignItems: 'center',
};

const $graphContainer: ViewStyle = {
  backgroundColor: '#f0f0f0',
  borderRadius: 8,
  overflow: 'hidden',
};

const $noDataContainer: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
};

const $noDataText = {
  color: '#666',
  fontSize: 16,
};

export default SimpleGraph;
