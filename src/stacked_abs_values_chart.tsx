/*
This code defines a React component that uses ECharts to render a stacked area chart displaying absolute values over time.
It takes in report data and column definitions as props and generates the necessary series and chart options dynamically. 
The chart includes features like tooltips, legends, data zoom, and a save-as-image tool. 
The data is processed to format timestamps and handle stacking of values. The component also adjusts its dimensions based
on the viewport size to ensure responsiveness.

*/

'use client';
// Specifies that the component should be rendered on the client-side.

import React from 'react';
// Imports the React library.

import * as echarts from 'echarts/core';
// Imports core functionalities from the ECharts library.

import EChartsReactCore from 'echarts-for-react/lib/core';
// Imports the core ECharts component for React.

import { LineChart, type LineSeriesOption } from 'echarts/charts';
// Imports specific types and components for line charts from ECharts.

import type {
  TooltipComponentOption,
  TitleComponentOption,
  LegendComponentOption,
  DataZoomComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  ToolboxComponentOption,
} from 'echarts/components';
// Imports various options and components for ECharts.

import {
  DataZoomComponent,
  DataZoomSliderComponent,
  DatasetComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
// Imports ECharts components used in the chart.

import { SCREEN_LARGE, SCREEN_SMALL, formatDateYYYYMMDD } from './util';
// Imports utility functions and constants.

import useLargeChartDimensions, { useViewportDimensions } from './large_chart_dims_hook';
// Imports custom hooks for chart dimensions and viewport dimensions.

import {
  IFinancialFuturesCOTReport,
  IAnyCOTReportType,
  IDisaggregatedFuturesCOTReport,
  ILegacyFuturesCOTReport,
} from './socrata_cot_report';
// Imports interfaces for different types of COT reports.

echarts.use([
  TitleComponent,
  LineChart,
  DatasetComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  DataZoomSliderComponent,
  ToolboxComponent,
]);
// Registers the necessary ECharts components.

export interface IDataFrameColumns {
  column: keyof IFinancialFuturesCOTReport | keyof IDisaggregatedFuturesCOTReport | keyof ILegacyFuturesCOTReport;
  name: string;
}
// Defines an interface for the columns in the data frame.

type ECOption = echarts.ComposeOption<
  LineSeriesOption | TitleComponentOption | TooltipComponentOption | DataZoomComponentOption | ToolboxComponentOption | GridComponentOption
>;
// Defines the type for ECharts options.

export default function StackedAbsValuesChart({
  cols,
  data,
}: {
  data: IAnyCOTReportType[];
  cols: IDataFrameColumns[];
}) {
  const generateOptions = (): ECOption => {
    const series: LineSeriesOption[] = cols.map(({ name, column }) => {
      return {
        type: 'line',
        name,
        encode: {
          x: 'timestamp',
          y: column as string,
        },
        smooth: true,
        areaStyle: {},
        stack: 'Total',
        lineStyle: { width: 0 },
        showSymbol: false,
        emphasis: { focus: 'series' },
      };
    });
    // Maps the columns to series data for the chart.

    return {
      title: {},
      tooltip: {
        trigger: 'axis',
        show: true,
        axisPointer: { type: 'cross' },
      },
      toolbox: {
        show: true,
        feature: { saveAsImage: {} },
      },
      legend: { show: true },
      grid: { containLabel: true },
      dataset: {
        source: data,
        dimensions: Object.keys(data.at(0) ?? {}),
      },
      dataZoom: [
        {
          id: 'cot-abs-vals-stacked-area-chart',
          type: 'slider',
          filterMode: 'filter',
          start: 80,
        },
      ],
      xAxis: [
        {
          type: 'time',
          axisLabel: {
            formatter: (value: any) => {
              let d = new Date(value);
              return formatDateYYYYMMDD(d);
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
        },
      ],
      series,
    };
    // Generates options for the ECharts component.
  };

  const { eChartsWidth, eChartsHeight } = useLargeChartDimensions();
  // Uses custom hook to get the dimensions for the chart.

  return (
    <EChartsReactCore
      option={generateOptions()}
      style={{ height: eChartsHeight, width: eChartsWidth }}
    />
    // Renders the ECharts component with the generated options.
  );
}
