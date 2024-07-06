/*
This code defines a React component that uses ECharts to render a bar chart of commitment changes over time. 
It allows the user to select different methods for aggregating positioning data and adjust the number of weeks 
over which changes are calculated. The chart updates dynamically based on these user inputs.

*/

'use client'; 
// Specifies that the component should be rendered on the client-side

import React from 'react';
// Imports the React library

import * as echarts from 'echarts/core';
// Imports core functionalities from the ECharts library

import type { BarSeriesOption } from 'echarts/charts';
import { BarChart } from 'echarts/charts';
// Imports specific types and components for bar charts from ECharts

import type {
  DatasetComponentOption,
  TitleComponentOption,
  LegendComponentOption,
  DataZoomComponentOption,
  TooltipComponentOption,
  ToolboxComponentOption,
  GraphicComponentOption,
} from 'echarts/components';
import {
  TitleComponent,
  LegendComponent,
  DatasetComponent,
  GridComponent,
  TooltipComponent,
  GridComponentOption,
  ToolboxComponent,
  DataZoomComponent,
  GraphicComponent,
} from 'echarts/components';
// Imports various options and components for ECharts

import {
  IAnyCOTReportType,
  IDisaggregatedFuturesCOTReport,
  IFinancialFuturesCOTReport,
  ILegacyFuturesCOTReport,
} from './socrata_cot_report';
// Imports interfaces for different types of COT reports

import { SCREEN_LARGE, SCREEN_SMALL, formatDateYYYYMMDD } from './util';
// Imports utility functions and constants

import useLargeChartDimensions, { useViewportDimensions } from './large_chart_dims_hook';
// Imports custom hooks for chart dimensions

import EChartsReactCore from 'echarts-for-react/lib/core';
// Imports the core ECharts component for React

echarts.use([
  BarChart,
  TitleComponent,
  GraphicComponent,
  LegendComponent,
  DataZoomComponent,
  DatasetComponent,
  GridComponent,
]);
// Registers the necessary ECharts components

export interface IDataFrameColumns<T extends IFinancialFuturesCOTReport | IDisaggregatedFuturesCOTReport | ILegacyFuturesCOTReport> {
  longs: keyof T;
  shorts: keyof T;
  name: string;
}
// Defines an interface for the columns in the data frame

const DEFAULT_N_WEEKS_DELTA = 5;
// Sets the default number of weeks for delta calculation

enum PositioningAggregationMethod {
  Net = 'Net',
  Longs = 'Longs',
  Shorts = 'Shorts',
}
// Defines an enum for the different positioning aggregation methods

export default function CommitmentChangesChart<T extends IFinancialFuturesCOTReport | IDisaggregatedFuturesCOTReport | ILegacyFuturesCOTReport>({
  dataFrame,
  cols,
}: {
  dataFrame: Array<T>;
  cols: IDataFrameColumns<T>[];
}) {
  type ECOption = echarts.ComposeOption<
    BarSeriesOption | TitleComponentOption | GraphicComponentOption | GridComponentOption | LegendComponentOption | ToolboxComponentOption | DataZoomComponentOption | TooltipComponentOption
  >;
  // Defines the type for ECharts options

  const echartsRef = React.useRef<EChartsReactCore>(null);
  // Creates a ref for the ECharts component

  const [nWeeksDelta, setNWeeksDelta] = React.useState(DEFAULT_N_WEEKS_DELTA);
  // State for the number of weeks delta

  const [posnMethod, setPosnMethod] = React.useState(PositioningAggregationMethod.Net);
  // State for the positioning aggregation method

  const genSeries = React.useCallback((): BarSeriesOption[] => {
    return cols.map(({ longs, shorts, name }, colIdx) => {
      let data: [number, number][] = [];
      for (let i = nWeeksDelta; i < dataFrame.length; ++i) {
        let thisRow = dataFrame[i];
        let prevRow = dataFrame[i - nWeeksDelta];
        switch (posnMethod) {
          case PositioningAggregationMethod.Net: {
            data.push([
              thisRow.timestamp,
              (thisRow[longs] as number) - (thisRow[shorts] as number) - ((prevRow[longs] as number) - (prevRow[shorts] as number)),
            ]);
            break;
          }
          case PositioningAggregationMethod.Longs: {
            data.push([thisRow.timestamp, (thisRow[longs] as number) - (prevRow[longs] as number)]);
            break;
          }
          case PositioningAggregationMethod.Shorts: {
            data.push([thisRow.timestamp, (thisRow[shorts] as number) - (prevRow[shorts] as number)]);
            break;
          }
        }
      }
      return {
        type: 'bar',
        name,
        data,
        xAxisIndex: colIdx,
        yAxisIndex: colIdx,
      };
    });
  }, [cols, dataFrame, nWeeksDelta, posnMethod]);
  // Generates series data based on the selected method and delta

  const genOpt = React.useCallback((): ECOption => {
    return {
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
        },
      },
      title: {
        show: true,
        text: dataFrame.length > 0 ? dataFrame.at(0)!.contract_market_name : '',
        textStyle: {
          fontSize: 10,
        },
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        show: false,
      },
      dataZoom: {
        show: true,
        type: 'slider',
        filterMode: 'filter',
        start: 80,
        xAxisIndex: cols.map((_, idx) => idx),
      },
      grid: cols.map((_, idx, arr) => ({
        left: '2%',
        top: `${idx * (95 / arr.length) + 5}%`,
        right: '2%',
        height: `${80 / arr.length}%`,
        containLabel: true,
      })),
      xAxis: cols.map((_, idx) => ({
        type: 'time',
        axisLabel: {
          formatter: (value: any) => formatDateYYYYMMDD(new Date(value)),
        },
        gridIndex: idx,
      })),
      yAxis: cols.map(({ name }, idx) => ({
        type: 'value',
        gridIndex: idx,
        name,
        nameTextStyle: {
          fontSize: 15,
          align: 'left',
          verticalAlign: 'top',
          padding: [0, 0, 5, 0],
        },
      })),
      series: genSeries(),
    };
  }, [cols, dataFrame, nWeeksDelta, posnMethod]);
  // Generates options for the ECharts component

  React.useEffect(() => {
    echartsRef.current?.getEchartsInstance().setOption({ series: genSeries() });
  }, [cols, dataFrame, nWeeksDelta, posnMethod]);
  // Updates the chart when dependencies change

  const handleOptionChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLSelectElement>) => {
      setPosnMethod(ev.target.value as PositioningAggregationMethod);
    },
    []
  );
  // Handles changes to the positioning aggregation method

  const echartsOptionRef = React.useRef(genOpt());
  // Ref for the ECharts options

  const optTypes = [PositioningAggregationMethod.Net, PositioningAggregationMethod.Longs, PositioningAggregationMethod.Shorts];
  // Array of positioning aggregation methods

  return (
    

Change in position vs. {nWeeksDelta}{' '} weeks ago: {nWeeksDelta} Δ

{ setNWeeksDelta(parseInt(ev.target.value)) }} />

{optTypes.map((option, idx) => {
        return (
           {option} 
        );
      })}

{ echartsRef.current = ref }} option={echartsOptionRef.current} theme={'dark'} style={{ height: 500, width: 'auto' }} />

  );
}
// Defines the main component, handling rendering and user interactions

function applyDelta(series: readonly number[], nDelta: number): number[] {
  let series_ = [...series.slice(nDelta)];
  for (let i = 0; i < series_.length; ++i) {
    series_[i] = series_[i] - series_[i - nDelta];
  }
  return series_;
}
// Helper function to apply delta calculations to a series
