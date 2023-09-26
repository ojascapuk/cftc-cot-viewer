import { SocrataApi, fetchAllAvailableContracts, makeContractsTree } from "@/lib/socrata_api";
import { CFTCCommodityGroupType, CFTCReportType } from "@/common_types";
import { allCapsToTitle, allCapsToSlug, slugToTitle } from "@/lib/cftc_api_utils";
import Link from "next/link";
import { FetchAllAvailableContracts } from "@/lib/fetchAvailableContracts";
import Breadcrumbs from "@/components/breadcrumbs";

export default async function Page({
    params
}: {
    params: {
        commodityGroupName: string,
        subgroupName: string,
        commodityName: string,
        cftcCode: string,
    },
}) {
    const contractsTree = await FetchAllAvailableContracts();
    const commodityGroupNameSlug = decodeURIComponent(params.commodityGroupName);
    const subgroupNameSlug = decodeURIComponent(params.subgroupName);
    const commodityNameSlug = decodeURIComponent(params.commodityName);
    const cftcCode = decodeURIComponent(params.cftcCode);
    const [marketAndExchangeName, contractSet] = contractsTree.getContractSet(commodityGroupNameSlug, subgroupNameSlug, commodityNameSlug, cftcCode);
    return (
        <div className="flex min-h-screen flex-col mx-auto w-11/12">
            <Breadcrumbs
                commodityGroupNameSlug={commodityGroupNameSlug}
                subgroupNameSlug={subgroupNameSlug}
                commodityNameSlug={commodityNameSlug}
                cftcCode={cftcCode}
            />
            <div>
                <div>
                    <div className="my-2 text-lg">
                        {marketAndExchangeName}
                    </div>
                    {contractSet && contractSet[CFTCReportType.FinancialFutures]?.length > 0 && (
                        <Link
                            href={`/futures/${commodityGroupNameSlug}/${subgroupNameSlug}/${commodityNameSlug}/${cftcCode}/traders-in-financial-futures`}
                        >Traders in Financial Futures</Link>
                    )}
                    {contractSet && contractSet[CFTCReportType.Disaggregated]?.length > 0 && (
                        <Link
                            href={`/futures/${commodityGroupNameSlug}/${commodityNameSlug}/${commodityNameSlug}/${cftcCode}/disaggregated`}
                        >Disaggregated</Link>
                    )}
                    {contractSet && contractSet[CFTCReportType.Legacy]?.length > 0 && (
                        <Link
                            href={`/futures/${commodityGroupNameSlug}/${commodityNameSlug}/${commodityNameSlug}/${cftcCode}/legacy`}
                        >Legacy</Link>
                    )}
                </div>
            </div>
        </div>
    )
}


export async function generateStaticParams({
    params
}: {
    params: {
        commodityGroupName: string,
        subgroupName: string,
        commodityName: string,
    }
}) {
    let dst: { cftcCode: string }[] = [];
    if (params.commodityGroupName == null || params.subgroupName == null || params.commodityName == null) return dst;
    const contractsTree = await FetchAllAvailableContracts();
    const commodityGroupName = decodeURIComponent(params.commodityGroupName);
    const subgroupName = decodeURIComponent(params.subgroupName);
    const commodityName = decodeURIComponent(params.commodityName);
    const cftcCodes = contractsTree.getCftcCodes(commodityGroupName, subgroupName, commodityName);
    return cftcCodes.map((cftcCode) => ({ cftcCode }));
}
