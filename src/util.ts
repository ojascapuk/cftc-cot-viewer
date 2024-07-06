/*
This code provides utility functions and types for various operations, including statistical calculations, date manipulations,
viewport dimensions, and custom assertions. It also includes a React hook for accessing the previous value of a state or prop.
*/

import { useEffect, useRef } from 'react';
// Imports React hooks useEffect and useRef.

import { LibhackCustomError } from './libhack_custom_error';
// Imports the custom error class.

export function std(arr: number[], fromIdx?: number, lookback?: number): number {
  if (fromIdx == null || fromIdx > arr.length || fromIdx < 0) {
    fromIdx = arr.length - 1;
  }
  if (lookback == null || lookback > arr.length) {
    lookback = arr.length;
  }
  const mean_ = mean(arr, fromIdx, lookback);
  let variance = 0;
  for (let idx = fromIdx; idx > 0 && idx > fromIdx - lookback; --idx) {
    variance += Math.pow(arr[idx] - mean_, 2);
  }
  if (lookback > 0) {
    variance /= lookback;
  } else {
    return 0;
  }
  return Math.sqrt(variance);
}
// Calculates the standard deviation of an array over a specified lookback period.

function mean(arr: number[], fromIdx?: number, lookback?: number): number {
  if (fromIdx == null || fromIdx > arr.length || fromIdx < 0) {
    fromIdx = arr.length - 1;
  }
  if (lookback == null || lookback > arr.length) {
    lookback = arr.length;
  } else if (lookback === 0) {
    return 0;
  } else if (lookback === 1) {
    return arr[0];
  }
  let sum = 0;
  let count = 0;
  for (let idx = fromIdx; idx > 0 && idx > fromIdx - lookback; --idx) {
    sum += arr[idx];
    count += 1;
  }
  if (count === 0) {
    return 0;
  }
  return sum / count;
}
// Calculates the mean of an array over a specified lookback period.

export function rollingMean(arr: number[], lookback: number): number[] {
  if (lookback < 0 || lookback > arr.length) {
    lookback = arr.length;
  }
  return arr.map((n: number, idx: number, thisArr: number[]): number => {
    return mean(thisArr, idx, lookback);
  });
}
// Computes the rolling mean of an array over a specified lookback period.

export function rollingStd(arr: number[], lookback: number): number[] {
  if (lookback < 0 || lookback > arr.length) {
    lookback = arr.length;
  }
  const rollingMean_ = rollingMean(arr, lookback);
  return arr.map((n: number, idx: number, thisArr: number[]): number => {
    let variance = 0;
    let count = 0;
    for (let jdx = idx; jdx > 0 && jdx > idx - lookback; --jdx) {
      variance += Math.pow(n - rollingMean_[jdx], 2);
      count += 1;
    }
    if (count === 0) {
      return 0;
    }
    return Math.sqrt(variance / count);
  });
}
// Computes the rolling standard deviation of an array over a specified lookback period.

export function rollingZscore2(arr: number[], lookback?: number): number[] {
  if (lookback == null || lookback > arr.length) {
    lookback = arr.length;
  }
  const rollingMean_ = rollingMean(arr, lookback);
  const rollingStd_ = rollingStd(arr, lookback);
  return arr.map((n: number, idx: number, thisArr: number[]): number => {
    const a = n - rollingMean_[idx];
    const b = rollingStd_[idx];
    return b > 0 ? a / b : 0;
  });
}
// Computes the rolling z-score of an array over a specified lookback period.

export function iso8601StringWithNoTimezoneOffset(d: Date): string {
  let s = d.toISOString();
  let i = s.length - 1;
  for (; i > 0; --i) {
    if (s[i] === '.') {
      break;
    }
  }
  return s.substring(0, i + 4);
}
// Returns an ISO 8601 string without the timezone offset.

export function daysDiff(a: Date, b: Date): number {
  const dayMillis = 1000 * 60 * 60 * 24;
  return (a.getTime() - b.getTime()) / dayMillis;
}
// Calculates the number of days between two dates.

export function plusDays(d: Date, nDays: number): Date {
  let dst = new Date(d.getTime());
  const dayMillis = 1000 * 60 * 60 * 24;
  dst.setTime(dst.getTime() + nDays * dayMillis);
  return dst;
}
// Adds a specified number of days to a date.

export function sameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}
// Checks if two dates are the same day.

export function asDay(d: Date): Date {
  d.setUTCHours(0);
  d.setUTCMinutes(0);
  d.setUTCSeconds(0);
  d.setUTCMilliseconds(0);
  return d;
}
// Converts a date to a UTC day (with time set to 00:00:00.000).

export function formatDateYYYYMMDD(d: Date): string {
  return (
    d.getUTCFullYear() +
    '-' +
    (d.getUTCMonth() + 1).toString().padStart(2, '0') +
    '-' +
    d.getUTCDate().toString().padStart(2, '0')
  );
}
// Formats a date as YYYY-MM-DD.

export interface ViewportDimensions {
  width: number;
  height: number;
}
// Defines an interface for viewport dimensions.

export const SCREEN_SMALL = 640;
export const SCREEN_MEDIUM = 768;
export const SCREEN_LARGE = 1024;
export const SCREEN_XLARGE = 1280;
export const SCREEN_2XLARGE = 1536;
// Defines constants for common screen sizes.

export class LibhackAssertionError extends LibhackCustomError {
  constructor(message?: string) {
    super(message);
  }
}
// Custom assertion error class extending LibhackCustomError.

export function LHAssert(pred: boolean, message?: string): void {
  if (process.env.NODE_ENV !== 'production') {
    if (pred === false) {
      throw new LibhackAssertionError(message);
    }
  }
}
// Custom assertion function that throws an error if the predicate is false.

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
// Custom hook to get the previous value of a state or prop.
