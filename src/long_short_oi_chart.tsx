/*  
This code defines a React component that uses ECharts to render a chart displaying long and short open interest (OI) data over time. 
The chart is configured with various features like tooltips, legends, and data zoom sliders. 
The data for the chart is passed as props to the component, 
and the options for the chart are generated dynamically based on this data. The component handles both long and 
short data series and displays them in a visually organized manner.
*/

'use client';
// Specifies that the component should be rendered on the client-side

import React from 'react';
// Imports the React library

import * as echarts from 'echarts/core';
// Imports core functionalities from the ECharts library

import EChartsReactCore from 'echarts-for-react/lib/core';
// Imports the core ECharts component for React

import type { LineSeriesOption } from 'echarts/charts';
import { LineChart } from 'echarts/charts';
// Imports specific types and components for line charts from ECharts

import type {
  TooltipComponentOption,
  TitleComponentOption,
  LegendComponentOption,
  DataZoomComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  ToolboxComponentOption,
} from 'echarts/components';
import {
  DataZoomComponent,
  DataZoomSliderComponent,
  DatasetComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
// Imports various options and components for ECharts

import {
  LHAssert,
  SCREEN_LARGE,
  SCREEN_SMALL,
  formatDateYYYYMMDD,
} from './util';
// Imports utility functions and constants

import {
  IFinancialFuturesCOTReport,
  IAnyCOTReportType,
  IDisaggregatedFuturesCOTReport,
  ILegacyFuturesCOTReport,
} from './socrata_cot_report';
// Imports interfaces for different types of COT reports

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
// Registers the necessary ECharts components

export interface IDataFrameColumns {
  column:
    | keyof IFinancialFuturesCOTReport
    | keyof IDisaggregatedFuturesCOTReport
    | keyof ILegacyFuturesCOTReport;
  name: string;
}
// Defines an interface for the columns in the data frame

type ECOption = echarts.ComposeOption<
  LineSeriesOption | TitleComponentOption | TooltipComponentOption | DataZoomComponentOption | ToolboxComponentOption | GridComponentOption
>;
// Defines the type for ECharts options

export default function LongShortOIChart({
  longCols,
  shortCols,
  data,
}: {
  data: IAnyCOTReportType[];
  longCols: IDataFrameColumns[];
  shortCols: IDataFrameColumns[];
}) {
  const generateOptions = (): ECOption => {
    const longSeries: LineSeriesOption[] = longCols.map(
      ({ name, column }) => {
        return {
          type: 'line',
          name,
          encode: {
            x: 'timestamp',
            y: column as string,
          },
          smooth: true,
          areaStyle: {},
          stack: 'total_longs',
          lineStyle: { width: 0 },
          showSymbol: false,
          emphasis: { focus: 'series' },
          xAxisIndex: 0,
          yAxisIndex: 0,
        };
      }
    );
    // Maps the long columns to series data for the chart

    const shortSeries: LineSeriesOption[] = shortCols.map(
      ({ name, column }) => {
        return {
          type: 'line',
          name,
          encode: {
            x: 'timestamp',
            y: column as string,
          },
          smooth: true,
          areaStyle: {},
          stack: 'total_shorts',
          lineStyle: { width: 0 },
          showSymbol: false,
          emphasis: { focus: 'series' },
          xAxisIndex: 1,
          yAxisIndex: 1,
        };
      }
    );
    // Maps the short columns to series data for the chart

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
      grid: [
        { containLabel: true, top: '5%', bottom: '55%' },
        { containLabel: true, top: '55%', bottom: '5%' },
      ],
      dataset: {
        source: data,
        dimensions: Object.keys(data.at(0) ?? {}),
      },
      dataZoom: [
        {
          type: 'slider',
          filterMode: 'filter',
          start: (100 * Math.max(data.length - defaultDataZoomWeeks, 0)) / data.length,
          xAxisIndex: [0, 1],
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
          gridIndex: 0,
        },
        {
          type: 'time',
          axisLabel: {
            formatter: (value: any) => {
              let d = new Date(value);
              return formatDateYYYYMMDD(d);
            },
          },
          gridIndex: 1,
        },
      ],
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          scale: true,
          name: 'Longs',
          nameTextStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            align: 'left',
            verticalAlign: 'top',
          },
        },
        {
          type: 'value',
          gridIndex: 1,
          scale: true,
          name: 'Shorts',
          nameTextStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            align: 'left',
            verticalAlign: 'top',
          },
        },
      ],
      series: [...longSeries, ...shortSeries],
    };
  };
  // Generates options for the ECharts component

  const defaultDataZoomWeeks = 20;
  // Sets the default number of weeks for the data zoom feature

  return (
    <EChartsReactCore
      option={generateOptions()}
      style={{ height: '100%', width: '100%' }}
    />
  );
  // Renders the ECharts component with the generated options
}
