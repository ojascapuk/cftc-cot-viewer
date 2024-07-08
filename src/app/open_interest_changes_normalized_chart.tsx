/*
This code defines a React component that visualizes changes in open interest over time, normalized by different positioning
aggregation types (Net, Longs, Shorts). It uses a StandardizedCotOscillator component to display the chart and provides 
controls for the user to adjust the aggregation type and the number of weeks for comparison. 
The data for the chart is processed dynamically based on the selected settings.
*/


'use client';
// Specifies that the component should be rendered on the client-side.

import {
  IAnyCOTReportType,
  IDisaggregatedFuturesCOTReport,
  IFinancialFuturesCOTReport,
  ILegacyFuturesCOTReport,
} from '@/socrata_cot_report';
// Imports interfaces for different types of COT reports.

import React from 'react';
// Imports the React library.

import StandardizedCotOscillator, { IPlottedColumn } from './standardized_cot_oscillator';
// Imports the StandardizedCotOscillator component and IPlottedColumn interface.

import { formatDateYYYYMMDD } from '@/util';
// Imports a utility function to format dates.

import { PriceBar } from '@/common_types';
// Imports the PriceBar type.

type CotReportKey =
  | keyof IFinancialFuturesCOTReport
  | keyof IDisaggregatedFuturesCOTReport
  | keyof ILegacyFuturesCOTReport;
// Defines a type that can be any key from the specific COT report interfaces.

interface ITraderCategoryColumn {
  traderCategoryName: string;
  longs: CotReportKey;
  shorts: CotReportKey;
}
// Defines an interface for a trader category column with long and short positions.

const defaultWeeksLookback = 5;
// Sets the default number of weeks to look back for comparison.

enum PositioningAggregationType {
  Net,
  Longs,
  Shorts,
}
// Defines an enumeration for the types of positioning aggregation.

export default function OpenInterestChangesNormalizedChart({
  reports,
  cols,
  priceData,
}: {
  reports: { [k in CotReportKey]?: any }[];
  cols: readonly ITraderCategoryColumn[];
  priceData?: readonly PriceBar[];
}) {
  // Main component function, accepting reports, columns, and optional price data as props.

  const [weeksLookback, setWeeksLookback] = React.useState(defaultWeeksLookback);
  // State for the number of weeks to look back.

  const handleChangeWeeksLookback = (ev: React.ChangeEvent<HTMLInputElement>) => {
    let n = parseInt(ev.target.value);
    setWeeksLookback(n);
  };
  // Handler for changing the weeks lookback value.

  const [aggregationType, setAggregationType] = React.useState(PositioningAggregationType.Net);
  // State for the aggregation type.

  const handleChangeAggregationType = React.useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    setAggregationType(parseInt(ev.target.value) as PositioningAggregationType);
  }, []);
  // Handler for changing the aggregation type.

  const generateColumns = React.useCallback((): [string[], IPlottedColumn[]] => {
    let xAxisDates: string[] = [];
    let yAxisColumns: IPlottedColumn[] = cols.map(({ traderCategoryName }) => ({ name: traderCategoryName, data: [] }));

    for (let idx = 0; idx < reports.length; ++idx) {
      let earlierWeekIdx = Math.max(0, idx - weeksLookback);
      let earlierWeekReport = reports[earlierWeekIdx];
      let thisReport = reports[idx];

      for (let colIdx = 0; colIdx < yAxisColumns.length && colIdx < cols.length; ++colIdx) {
        let col = cols[colIdx];
        let entry: number;

        switch (aggregationType) {
          case PositioningAggregationType.Net:
            entry = thisReport[col.longs] - thisReport[col.shorts] - (earlierWeekReport[col.longs] - earlierWeekReport[col.shorts]);
            break;
          case PositioningAggregationType.Longs:
            entry = thisReport[col.longs] - earlierWeekReport[col.longs];
            break;
          case PositioningAggregationType.Shorts:
            entry = thisReport[col.shorts] - earlierWeekReport[col.shorts];
            break;
          default:
            throw new Error('should be unreachable');
        }
        yAxisColumns[colIdx].data.push(entry);
      }

      xAxisDates.push(formatDateYYYYMMDD(new Date(thisReport.timestamp)));
    }

    return [xAxisDates, yAxisColumns];
  }, [reports, cols, aggregationType, weeksLookback]);
  // Function to generate columns for the chart based on the reports, columns, aggregation type, and weeks lookback.

  const [xAxisDates, yAxisColumns] = generateColumns();
  // Generates the x-axis dates and y-axis columns.

  return (
    <div>
      <StandardizedCotOscillator
        xAxisDates={xAxisDates}
        yAxisColumns={yAxisColumns}
        priceData={priceData}
      />
      <div>
        <label>
          <input
            type="radio"
            value={PositioningAggregationType.Net}
            checked={aggregationType === PositioningAggregationType.Net}
            onChange={handleChangeAggregationType}
          />
          Net
        </label>
        <label>
          <input
            type="radio"
            value={PositioningAggregationType.Longs}
            checked={aggregationType === PositioningAggregationType.Longs}
            onChange={handleChangeAggregationType}
          />
          Longs
        </label>
        <label>
          <input
            type="radio"
            value={PositioningAggregationType.Shorts}
            checked={aggregationType === PositioningAggregationType.Shorts}
            onChange={handleChangeAggregationType}
          />
          Shorts
        </label>
      </div>
      <div>
        Change in position vs. {weeksLookback} weeks ago:
        <input
          type="number"
          value={weeksLookback}
          onChange={handleChangeWeeksLookback}
          min="1"
        />
        Δ
      </div>
    </div>
  );
}
// Main component rendering the chart and controls for changing the aggregation type and weeks lookback.
