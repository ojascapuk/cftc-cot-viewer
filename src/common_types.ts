/*
This code defines several TypeScript types, interfaces, and enumerations related to financial and commodity data.
The PriceBar interface represents a price data point with a timestamp and closing price. PriceFeedSource is a union type indicating 
the source of price data. CFTCCommodityCode, CFTCSubgroupName, and CFTCContractMarketCode are type aliases for strings representing various 
CFTC-related identifiers. The IPriceFeed interface defines the structure for a price feed object, 
including optional transformation functions. Finally, CFTCReportType and CFTCCommodityGroupType are enums 
representing different report and commodity group types, respectively.


*/
export interface PriceBar {
    timestamp: Date;
    close: number;
}
// Defines an interface for a PriceBar, which includes a timestamp and a closing price.

export type PriceFeedSource = 'FRED' | 'unknown';
// Defines a type for the source of the price feed, which can be either 'FRED' or 'unknown'.

export type CFTCCommodityCode = string;
// Defines a type alias for CFTC Commodity Code as a string.

export type CFTCSubgroupName = string;
// Defines a type alias for CFTC Subgroup Name as a string.

export interface IPriceFeed {
    source: PriceFeedSource;
    name: string;
    symbol: string;
    transforms?: Function[];
}
// Defines an interface for a price feed, which includes the source, name, symbol, and optionally, an array of transformation functions.

export enum CFTCReportType {
    FinancialFutures,
    Disaggregated,
    Legacy,
}
// Defines an enumeration for different types of CFTC reports.

export enum CFTCCommodityGroupType {
    Financial = 'FINANCIAL INSTRUMENTS',
    NaturalResources = 'NATURAL RESOURCES',
    Agriculture = 'AGRICULTURE',
}
// Defines an enumeration for different types of CFTC commodity groups.

export type CFTCContractMarketCode = string;
// Defines a type alias for CFTC Contract Market Code as a string.

