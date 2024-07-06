/*
This code defines a React component that uses ECharts to render a bar chart displaying the number of traders long and short over time. 
It takes in report data and column definitions as props and generates the necessary series and chart options dynamically. 
The chart includes features like tooltips, legends, data zoom, and a save-as-image tool. 
The data is processed to format timestamps and handle stacking of long and short trader data.

*/

'use client';
// Specifies that the component should be rendered on the client-side.

import React from 'react';
// Imports the React library.

import * as echarts from 'echarts/core';
// Imports core functionalities from the ECharts library.

import EChartsReactCore from 'echarts-for-react/lib/core';
// Imports the core ECharts component for React.

import { BarChart, type BarSeriesOption } from 'echarts/charts';
// Imports specific types and components for bar charts from ECharts.

import type {
  TooltipComponentOption,
  TitleComponentOption,
  LegendComponentOption,
  GridComponentOption,
  ToolboxComponentOption,
  DataZoomComponentOption,
} from 'echarts/components';
// Imports various options and components for ECharts.

import {
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
// Imports ECharts components used in the chart.

import { SCREEN_LARGE, SCREEN_SMALL, formatDateYYYYMMDD } from './util';
// Imports utility functions and constants.

import { useViewportDimensions } from './large_chart_dims_hook';
// Imports custom hook for viewport dimensions.

import {
  IAnyCOTReportType,
  IDisaggregatedFuturesCOTReport,
  IFinancialFuturesCOTReport,
  ILegacyFuturesCOTReport,
} from './socrata_cot_report';
// Imports interfaces for different types of COT reports.

echarts.use([
  BarChart,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  TooltipComponent,
]);
// Registers the necessary ECharts components.

export interface INumberOfTradersColumn {
  name: string;
  n_traders_long: keyof IFinancialFuturesCOTReport | keyof IDisaggregatedFuturesCOTReport | keyof ILegacyFuturesCOTReport;
  n_traders_short: keyof IFinancialFuturesCOTReport | keyof IDisaggregatedFuturesCOTReport | keyof ILegacyFuturesCOTReport;
}
// Defines an interface for the columns in the data frame.

type Rpt = { [k in keyof IFinancialFuturesCOTReport | keyof IDisaggregatedFuturesCOTReport | keyof ILegacyFuturesCOTReport]?: any };
// Defines a type alias for a report that can contain any of the keys from the COT report interfaces.

interface FlattenedSelectedCols {
  [traderCategoryName: string]: {
    n_traders_long: Array<[string, number]>;
    n_traders_short: Array<[string, number]>;
  };
}
// Defines an interface for the flattened selected columns.

function flattenColumnsFromReports(
  cols: readonly INumberOfTradersColumn[],
  reports: readonly Rpt[]
): FlattenedSelectedCols {
  let selectedData: FlattenedSelectedCols = cols.reduce(
    (colData: FlattenedSelectedCols, col: INumberOfTradersColumn) => {
      colData[col.name] = { n_traders_long: [], n_traders_short: [] };
      return colData;
    },
    {}
  );
  // Initializes the selected data structure with empty arrays for each column.

  for (let i = 0; i < reports.length; ++i) {
    for (let j = 0; j < cols.length; ++j) {
      const col = cols[j];
      selectedData[col.name].n_traders_long.push([
        formatDateYYYYMMDD(new Date(reports[i].timestamp)),
        reports[i][col.n_traders_long] as number,
      ]);
      selectedData[col.name].n_traders_short.push([
        formatDateYYYYMMDD(new Date(reports[i].timestamp)),
        -1 * (reports[i][col.n_traders_short] as number),
      ]);
      // Populates the selected data arrays with the report values, converting timestamps to formatted dates.
    }
  }

  return selectedData;
  // Returns the populated selected data structure.
}

export default function NumberOfTradersChart({
  reports,
  cols,
  loading = false,
}: {
  reports: Array<IAnyCOTReportType>;
  cols: INumberOfTradersColumn[];
  loading?: boolean;
}) {
  type ECOption = echarts.ComposeOption<
    | LegendComponentOption
    | BarSeriesOption
    | GridComponentOption
    | ToolboxComponentOption
    | TooltipComponentOption
    | DataZoomComponentOption
  >;
  // Defines the type for ECharts options.

  const genSeries = React.useCallback((): BarSeriesOption[] => {
    const selectedData = flattenColumnsFromReports(cols, reports);
    let dst: BarSeriesOption[] = [];
    for (const col of cols) {
      dst.push({
        type: 'bar',
        name: `${col.name} Traders Long`,
        stack: col.name,
        data: selectedData[col.name].n_traders_long,
      });
      dst.push({
        type: 'bar',
        name: `${col.name} Traders Short`,
        stack: col.name,
        data: selectedData[col.name].n_traders_short,
      });
    }
    return dst;
    // Generates series data based on the selected columns and reports.
  }, [reports, cols]);

  const defaultWeeksShow = 10;
  // Sets the default number of weeks to show in the data zoom.

  const genOpt = React.useCallback((): ECOption => {
    return {
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {},
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `
          <b>${params.value[0]}</b><br />
          ${params.seriesName}: ${Math.abs(params.value[1])}
          `;
        },
      },
      legend: {
        show: true,
      },
      dataZoom: {
        show: true,
        type: 'slider',
        start: reports.length > 0 ? (100 * Math.max(0, reports.length - defaultWeeksShow)) / reports.length : 100,
      },
      xAxis: [
        {
          type: 'category',
        },
      ],
      yAxis: [
        {
          type: 'value',
        },
      ],
      series: genSeries(),
      // Generates options for the ECharts component.
    };
  }, [reports]);

  return (
    <EChartsReactCore
      option={genOpt()}
      style={{ height: '100%', width: '100%' }}
    />
    // Renders the ECharts component with the generated options.
  );
}
