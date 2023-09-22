import {ArrSlice, checkArrSliceBounds, newArrSlice} from './arr_slice';
import { LHAssert } from './util';

// A moving average that starts from the beginning of the array.
// invariant: dst.length == a.arr.length
function rollingMovingAverage(a: ArrSlice<number>, lookback: number): number[] {
    checkArrSliceBounds(a);
    if (a.arr.length === 0 || (a.endIndex - a.startIndex) === 0) {
        return [];
    }
    let dst: number[] = new Array<number>(a.endIndex - a.startIndex);
    let dstIndex = 0;
    let subSummation: number = 0.;
    let subIndex = a.startIndex;
    // separately, compute the moving average of the head portion of the array, shorter than `lookback`, which would normally be chopped off by other moving average functions.
    for (; subIndex < a.endIndex && (subIndex - a.startIndex) < lookback; ++subIndex) {
        const subLen = subIndex - a.startIndex + 1;
        subSummation += a.arr[subIndex];
        const result = subSummation / (subLen > 0 ? subLen : 1.);
        dst[dstIndex++] = result;
    }
    // then compute the rest of the moving average
    for (; subIndex < a.endIndex; ++subIndex) {
        subSummation -= a.arr[subIndex - lookback];
        subSummation += a.arr[subIndex];
        dst[dstIndex++] = subSummation / lookback;
    }
    return dst;
}

// ma: (optional) if `a.arr`'s moving average already computed, supply it here
function rollingStdDev(a: ArrSlice<number>, lookback: number, ma?: Array<number>): Array<number> {
    checkArrSliceBounds(a);
    if (a.arr.length === 0 || (a.endIndex - a.startIndex) === 0) {
        return [];
    }
    let dst: number[] = new Array<number>(a.endIndex - a.startIndex);
    let dstIndex = 0;
    const aMovingAvg = ma != null ? ma : rollingMovingAverage(a, lookback);
    LHAssert(aMovingAvg.length === dst.length || aMovingAvg.length === a.arr.length);
    let subVariance = 0.;
    let subIndex = a.startIndex;
    for (; subIndex < a.endIndex && (subIndex - a.startIndex) < lookback; ++subIndex) {
        const subLen = subIndex - a.startIndex + 1;
        subVariance += Math.pow(a.arr[subIndex] - aMovingAvg[subIndex], 2);
        dst[dstIndex++] = Math.sqrt(subVariance / (subLen > 0 ? subLen : 1.));
    }
    for (; subIndex < a.endIndex; ++subIndex) {
        LHAssert(subIndex - lookback >= a.startIndex);
        subVariance -= Math.pow(a.arr[subIndex - lookback] - aMovingAvg[subIndex - lookback], 2);
        subVariance += Math.pow(a.arr[subIndex] - aMovingAvg[subIndex], 2);
        dst[dstIndex++] = Math.sqrt(subVariance / lookback);
    }
    return dst;
}

function rollingZscore_(a: ArrSlice<number>, lookback: number): Array<number> {
    checkArrSliceBounds(a);
    if (a.arr.length === 0 || a.endIndex === a.startIndex) {
        return [];
    }
    const aMean = rollingMovingAverage(a, lookback);
    const aStd = rollingStdDev(a, lookback);
    let dst = new Array<number>(a.endIndex - a.startIndex);
    let dstIndex = 0;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        let n = a.arr[i] - aMean[i];
        let d = aStd[i];
        const result = n / (d !== 0 ? d : 1.);
        dst[dstIndex++] = result;
    }
    return dst;
}

function rollingZscoreNaive_(a: ArrSlice<number>, lookback: number): Array<number> {
    checkArrSliceBounds(a);
    if (a.arr.length === 0 || a.endIndex === a.startIndex) {
        return [];
    }
    let dst = new Array<number>(a.endIndex - a.startIndex);
    let dstIndex = 0;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        let ss: ArrSlice<number> = {
            arr: a.arr,
            startIndex: Math.max(a.startIndex, i - lookback),
            endIndex: i + 1,
        };
        let thisStddev = stdDev(ss);
        let thisMean = mean(ss);
        let result = (a.arr[i] - thisMean) / (thisStddev !== 0 ? thisStddev : 1.);
        dst[dstIndex++] = result;
    }
    return dst;
}

export function rollingZscore(a: Array<number>, lookback: number): Array<number> {
    if (a.length === 0) {
        return [];
    }
    // return rollingZscoreNaive_(newArrSlice(a), lookback);
    return rollingZscore_(newArrSlice(a), lookback);
}

function stdDev(a: ArrSlice<number>): number {
    const a_mean = mean(a);
    const len = a.endIndex - a.startIndex;
    if (len === 0) {
        return 0.;
    }
    let variance = 0.;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        variance += Math.pow(a.arr[i] - a_mean, 2);
    }
    variance /= len;
    return Math.sqrt(variance);
}

function mean(a: ArrSlice<number>): number {
    // assert(a.endIndex <= a.arr.length)
    const len = a.endIndex - a.startIndex;
    if (a.arr.length === 0 || len === 0) {
        return 0.;
    }
    let sum = 0.;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        sum += a.arr[i];
    }
    const result = sum / len;
    return result;
}

// Min-Max Scaling, a standardization method works better than z-score for data that doesn't have a Gaussian distribution.
// It scales elements of the array into a range [-1, 1].
// MinMaxScaled(Series)[i] = (Series[i] - Min(Series)) / (Max(Series) - Min(Series))
// X_normalized = (X - X_min) / (X_max - X_min)
// X_std = (X - X.min(axis=0)) / (X.max(axis=0) - X.min(axis=0))
// X_scaled = X_std * (max - min) + min
// See: https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html
function minMaxScaler(a: ArrSlice<number>, lookback: number): Array<number> {
    // unimplemented
    return [];
}

function arrSliceMin(a: ArrSlice<number>): number {
    let maybeMin = Infinity;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        if (a.arr[i] < maybeMin) {
            maybeMin = a.arr[i];
        }
    }
    return maybeMin;
}

function arrSliceMax(a: ArrSlice<number>): number {
    let maybeMax = -Infinity;
    for (let i = a.startIndex; i < a.endIndex; ++i) {
        if (a.arr[i] > maybeMax) {
            maybeMax = a.arr[i];
        }
    }
    return maybeMax;
}

// Robust Scaling, a normalization method that is more robust to outliers.
// Z-scoring uses the mean and standard deviation; robust scaling uses the interquartile range.
// X_normalized = (X - IQR(X, 1)) / (IQR(X, 3) - IQR(X, 1))
function robustScaler(a: ArrSlice<number>): Array<number> {
    const len = a.endIndex - a.startIndex;
    let dst = new Array<number>(len);
    const [q1, q3] = arrSliceInterQuartileRange(a);
    const iqr = q3 - q1;
    for (let i = 0; i < len; ++i) {
        dst[i] = a.arr[i + a.startIndex] - q1;
        if (iqr !== 0) {
            dst[i] /= iqr;
        }
    }
    return dst;
}

export function rollingRobustScaler(a: Array<number>, lookback: number): Array<number> {
    let dst: number[] = new Array<number>(a.length);
    for (let idx = 0; idx < a.length; ++idx) {
        let [q1, q3] = arrSliceInterQuartileRange({
            arr: a,
            startIndex: Math.max(idx - lookback, 0),
            endIndex: idx + 1,
        });
        const iqr = q3 - q1;
        let rb = a[idx] - q1;
        if (iqr !== 0) {
            rb /= iqr;
        }
        dst[idx] = rb;
    }
    return dst;
}

function arrSliceInterQuartileRange(a: ArrSlice<number>): [q1: number, q3: number] {
    let arr = a.arr.slice(a.startIndex, a.endIndex).sort((a, b) => a - b);
    let q1 = arrSliceMedian({ arr, startIndex: 0, endIndex: arr.length / 2 }, true);
    let q3 = arrSliceMedian({ arr, startIndex: arr.length / 2, endIndex: arr.length }, true);
    return [q1, q3];
}

function arrSliceMedian(a: ArrSlice<number>, isAlreadySorted: boolean = false): number {
    const len = a.endIndex - a.startIndex;
    let arr = a.arr;
    if (!isAlreadySorted) {
        arr = a.arr.slice(a.startIndex, a.endIndex).sort((a, b) => a - b);
    }
    if (len % 2 === 0) {
        // if there are an even number of elements, take the average of the two middle elements
        const mid1 = arr[len / 2 - 1];
        const mid2 = arr[len / 2];
        return (mid1 + mid2) / 2.;
    } else {
        // return the middle value
        return arr[Math.floor(len / 2)];
    }
}