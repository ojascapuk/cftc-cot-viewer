/*
This React component, StandardizedCotOscillator, visualizes Commitment of Traders (COT) data using the ECharts library.
It supports various normalization methods to analyze trader positions over time. The component allows users to toggle settings 
for normalization methods and lookback periods, providing interactive control over the chart's data representation.

Key Features:
Imports and Setup: Includes necessary imports from React, ECharts, and utility modules.
State Management: Manages state for normalization methods, lookback period, and settings visibility.
Data Processing: Functions extractRawNetPositioning and extractZscoredPositioning extract and process data from COT reports.
Chart Configuration: The computeSeries and genEchartsOption functions configure the chart options and data series based on user selections.
User Interaction: Provides handlers for changing normalization methods and lookback periods, and toggles the settings visibility.
Rendering: Renders the ECharts component and settings UI, with conditional rendering for settings.

*** This is the lynchpin that I need to update to display diffrent custom graphs  *****
*/

'use client';
// Specifies that the component should be rendered on the client-side.

import React from 'react';
// Imports the React library.

import * as echarts from 'echarts/core';
// Imports core functionalities from the ECharts library.

import EChartsReactCore from 'echarts-for-react/lib/core';
// Imports the core ECharts component for React.

import {
  TitleComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
} from 'echarts/components';
// Imports ECharts components used in the chart.

import type {
  TitleComponentOption,
  GridComponentOption,
  TooltipComponentOption,
  ToolboxComponentOption,
  DataZoomComponentOption,
  AriaComponentOption,
} from 'echarts/components';
// Imports various options and components for ECharts.

import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
// Imports specific types for bar and line series options from ECharts.

import { BarChart, LineChart } from 'echarts/charts';
// Imports specific chart types from ECharts.

import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
// Imports renderers for ECharts.

import {
  IDisaggregatedFuturesCOTReport,
  IFinancialFuturesCOTReport,
  ILegacyFuturesCOTReport,
  ITraderCategory,
} from '@/socrata_cot_report';
// Imports interfaces for different types of COT reports and trader categories.

import {
  rollingMinMaxScaler,
  rollingMinMaxScalerOptimized,
  rollingQuantileNormalization,
  rollingRobustScaler,
  rollingZscore,
} from '@/lib/chart_math';
// Imports various functions for chart math operations.

import {
  SCREEN_2XLARGE,
  SCREEN_LARGE,
  SCREEN_MEDIUM,
  SCREEN_SMALL,
  usePrevious,
} from '@/util';
// Imports utility constants and hooks.

import { useViewportDimensions } from '@/large_chart_dims_hook';
// Imports custom hook for viewport dimensions.

import { PriceBar } from '@/common_types';
// Imports the PriceBar type.

import useLargeChartDimensions from '@/large_chart_dims_hook';
// Imports custom hook for large chart dimensions.

echarts.use([
  TitleComponent,
  LineChart,
  VisualMapComponent,
  TimelineComponent,
  TooltipComponent,
  ToolboxComponent,
  DataZoomComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  SVGRenderer,
  CanvasRenderer,
]);
// Registers the necessary ECharts components.

const defaultWeeksZoom = 50;
// Default number of weeks the zoom slider should have in width.

interface ITraderCategoryColumn {
  [name: string]: {
    data: number[];
    normalizingDivisor?: number;
  };
}
// Defines an interface for a trader category column with data and an optional normalizing divisor.

function extractRawNetPositioning<RptType extends IFinancialFuturesCOTReport | IDisaggregatedFuturesCOTReport | ILegacyFuturesCOTReport>(
  reports: readonly RptType[],
  traderCategories: ITraderCategory[]
): ITraderCategoryColumn {
  let dst: ITraderCategoryColumn = {};
  for (const traderCategory of traderCategories) {
    dst[traderCategory.shortName] = {
      data: reports.map((r) => {
        const longs = r[traderCategory.keyNames.longPositions];
        const shorts = r[traderCategory.keyNames.shortPositions];
        return (longs as number) - (shorts as number);
      }),
    };
  }
  return dst;
}
// Extracts raw net positioning data for trader categories from the reports.

function extractZscoredPositioning<RptType extends IFinancialFuturesCOTReport | IDisaggregatedFuturesCOTReport | ILegacyFuturesCOTReport>(
  reports: readonly RptType[],
  traderCategories: ITraderCategory[],
  zscoreLookback: number
): ITraderCategoryColumn {
  let dst: ITraderCategoryColumn = {};
  for (const traderCategory of traderCategories) {
    let data = reports.map((r) => {
      const longs = r[traderCategory.keyNames.longPositions];
      const shorts = r[traderCategory.keyNames.shortPositions];
      const totalOpenInt = r.open_interest_all;
      return ((longs as number) - (shorts as number)) / totalOpenInt;
    });
    data = rollingZscore(data, zscoreLookback);
    dst[traderCategory.shortName] = { data };
  }
  return dst;
}
// Extracts z-scored positioning data for trader categories from the reports.

export interface IPlottedColumn {
  name: string;
  data: number[];
}
// Defines an interface for a plotted column with a name and data.

const defaultLookback = 50;
// Default lookback period for normalization.

enum NormalizationMethod {
  None = 'none',
  StandardZscore = 'zscore',
  RobustScaler = 'robust-scaler',
  MinMaxScaler = 'min-max-scaler',
  QuantileTransformer = 'quantile-transformer',
}
// Defines an enumeration for different normalization methods.

const tooltipFormatters: Record<NormalizationMethod, (value: string | number) => string> = {
  [NormalizationMethod.None]: (value) => value.toString(),
  [NormalizationMethod.StandardZscore]: (value: string | number): string => {
    let n = value;
    if (typeof value !== 'number') {
      n = parseFloat(value);
    }
    return `${(n as number).toFixed(5)}σ`;
  },
  [NormalizationMethod.RobustScaler]: (value) => value.toString(),
  [NormalizationMethod.MinMaxScaler]: (value) => value.toString(),
  [NormalizationMethod.QuantileTransformer]: (value: string | number) => {
    let n = value;
    if (typeof value !== 'number') {
      n = parseFloat(value);
    }
    return `${(100 * (n as number)).toFixed(0)}%`;
  },
};
// Defines tooltip formatters for each normalization method.

const yAxisLabels: Record<NormalizationMethod, (label: string) => string> = {
  [NormalizationMethod.StandardZscore]: (label) => `${label} - σ (standard deviations)`,
  [NormalizationMethod.QuantileTransformer]: (label) => `${label} - %iles`,
  [NormalizationMethod.RobustScaler]: (label) => `${label} - normalized`,
  [NormalizationMethod.MinMaxScaler]: (label) => `${label} - %iles`,
  [NormalizationMethod.None]: (label) => label,
};
// Defines y-axis labels for each normalization method.

type ECOption = echarts.ComposeOption<
  BarSeriesOption | LineSeriesOption | DataZoomComponentOption | AriaComponentOption | GridComponentOption | TitleComponentOption | ToolboxComponentOption | TooltipComponentOption
>;
// Defines the type for ECharts options.

export default function StandardizedCotOscillator({
  xAxisDates,
  plottedColumns,
  title = '',
  yAxisLabel = '',
  loading = false,
  priceData,
}: {
  xAxisDates: readonly string[];
  plottedColumns: readonly IPlottedColumn[];
  title?: string;
  loading?: boolean;
  yAxisLabel?: string;
  priceData?: readonly PriceBar[];
}) {
  const echartsRef = React.useRef(null);
  let legendSelected = React.useRef<{ [name: string]: boolean } | null>(null);
  let rememberedDataZoom = React.useRef<[number, number] | null>(null);

  const [normalizationMethod, setNormalizationMethod] = React.useState(NormalizationMethod.StandardZscore);
  const [lookback, setLookback] = React.useState(defaultLookback);
  const [showSettings, setShowSettings] = React.useState(false);

  const computeSeries = React.useCallback((): BarSeriesOption[] => {
    let series: any = [];
    for (const column of plottedColumns) {
      let data: number[] = [];
      switch (normalizationMethod) {
        case NormalizationMethod.None:
          data = column.data;
          break;
        case NormalizationMethod.RobustScaler:
          data = rollingRobustScaler(column.data, lookback);
          break;
        case NormalizationMethod.StandardZscore:
          data = rollingZscore(column.data, lookback);
          break;
        case NormalizationMethod.MinMaxScaler:
          data = rollingMinMaxScalerOptimized(column.data, lookback);
          break;
        case NormalizationMethod.QuantileTransformer:
          data = rollingQuantileNormalization(column.data, lookback);
          break;
        default:
          throw new Error('unknown normalization method; this should be unreachable');
      }
      series.push({
        id: column.name,
        name: column.name,
        data,
        type: 'bar',
        tooltip: {
          valueFormatter: tooltipFormatters[normalizationMethod],
        },
      });
    }
    return series;
  }, [plottedColumns, lookback, normalizationMethod]);

  const genEchartsOption = (): ECOption => {
    let dst: ECOption = {
      aria: {
        enabled: true,
      },
      tooltip: {
        show: true,
        trigger: 'axis',
      },
      legend: {
        padding: 5,
      },
      grid: {
        containLabel: true,
      },
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
        },
      },
      dataZoom: [
        {
          id: 'cot-horizontal-zoom',
          type: 'slider',
          filterMode: 'filter',
          start: rememberedDataZoom.current != null ? rememberedDataZoom.current[0] : 0,
          end: rememberedDataZoom.current != null ? rememberedDataZoom.current[1] : defaultWeeksZoom,
        },
      ],
      xAxis: {
        type: 'category',
        data: xAxisDates,
        axisLabel: {
          formatter: (value: any) => {
            return value;
          },
        },
      },
      yAxis: {
        type: 'value',
        name: yAxisLabels[normalizationMethod](yAxisLabel),
      },
      series: computeSeries(),
    };
    return dst;
  };

  const handleNormalizationChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    setNormalizationMethod(ev.target.value as NormalizationMethod);
  };

  const handleLookbackChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setLookback(parseInt(ev.target.value));
  };

  const handleToggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div>
      <EChartsReactCore
        ref={echartsRef}
        option={genEchartsOption()}
        style={{ height: '500px', width: '100%' }}
      />
      <div>
        <button onClick={handleToggleSettings}>
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
        {showSettings && (
          <div>
            <label>
              Normalization Method:
              <select value={normalizationMethod} onChange={handleNormalizationChange}>
                {Object.values(NormalizationMethod).map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Lookback Period:
              <input
                type="number"
                value={lookback}
                onChange={handleLookbackChange}
                min="1"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

