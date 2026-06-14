import { NextResponse } from "next/server";
import { db } from "@/lib/db";










export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};
    const campaignWhere: any = {};

    if (dateFrom) {
      const parsedFrom = new Date(dateFrom);
      if (!isNaN(parsedFrom.getTime())) {
        campaignWhere.createdAt = { ...campaignWhere.createdAt, gte: parsedFrom };
        where.campaign = { ...where.campaign, createdAt: { ...where.campaign?.createdAt, gte: parsedFrom } };
      }
    }
    if (dateTo) {
      const parsedTo = new Date(dateTo);
      if (!isNaN(parsedTo.getTime())) {
        campaignWhere.createdAt = { ...campaignWhere.createdAt, lte: parsedTo };
        where.campaign = { ...where.campaign, createdAt: { ...where.campaign?.createdAt, lte: parsedTo } };
      }
    }

    
    const [totalCampaigns, overallStats] = await Promise.all([
      db.campaign.count({ where: campaignWhere }),
      db.campaignStats.aggregate({
        where,
        _sum: {
          totalSent: true,
          totalDelivered: true,
          totalFailed: true,
          totalOpened: true,
          totalRead: true,
          totalClicked: true,
          totalOrdersAttributed: true,
          attributedRevenueInr: true
        }
      })
    ]);

    const sumSent = overallStats._sum.totalSent || 0;
    const sumDelivered = overallStats._sum.totalDelivered || 0;
    const sumOpened = overallStats._sum.totalOpened || 0;
    const sumRead = overallStats._sum.totalRead || 0;
    const sumClicked = overallStats._sum.totalClicked || 0;
    const totalAttributedRevenue = overallStats._sum.attributedRevenueInr || 0;

    
    const overallDeliveryRate = sumSent > 0 
      ? parseFloat(((sumDelivered / sumSent) * 100).toFixed(1)) 
      : 0.0;

    const overallOpenRate = sumDelivered > 0 
      ? parseFloat(((sumOpened / sumDelivered) * 100).toFixed(1)) 
      : 0.0;

    const overallClickRate = sumRead > 0 
      ? parseFloat(((sumClicked / sumRead) * 100).toFixed(1)) 
      : (sumOpened > 0 ? parseFloat(((sumClicked / sumOpened) * 100).toFixed(1)) : 0.0);

    
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = startOfThisMonth;

    
    const [
      campaignsThisMonth,
      statsThisMonth,
      campaignsLastMonth,
      statsLastMonth,
      campaignsByChannel,
      revenueByStatus
    ] = await Promise.all([
      
      db.campaign.count({
        where: {
          createdAt: { gte: startOfThisMonth }
        }
      }),
      
      db.campaignStats.aggregate({
        where: {
          campaign: {
            createdAt: { gte: startOfThisMonth }
          }
        },
        _sum: {
          totalSent: true,
          totalDelivered: true,
          totalRead: true,
          totalClicked: true,
          attributedRevenueInr: true
        }
      }),
      
      db.campaign.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          }
        }
      }),
      
      db.campaignStats.aggregate({
        where: {
          campaign: {
            createdAt: {
              gte: startOfLastMonth,
              lt: endOfLastMonth
            }
          }
        },
        _sum: {
          totalSent: true,
          totalDelivered: true,
          totalRead: true,
          totalClicked: true,
          attributedRevenueInr: true
        }
      }),
      
      db.campaign.groupBy({
        by: ["channel"],
        where: campaignWhere,
        _count: {
          id: true
        }
      }),
      
      db.campaignStats.groupBy({
        by: ["campaignId"],
        _sum: {
          attributedRevenueInr: true
        }
      })
    ]);

    const sentTM = statsThisMonth._sum.totalSent || 0;
    const delTM = statsThisMonth._sum.totalDelivered || 0;
    const readTM = statsThisMonth._sum.totalRead || 0;
    const clickTM = statsThisMonth._sum.totalClicked || 0;
    const revenueThisMonth = statsThisMonth._sum.attributedRevenueInr || 0;

    const sentLM = statsLastMonth._sum.totalSent || 0;
    const delLM = statsLastMonth._sum.totalDelivered || 0;
    const readLM = statsLastMonth._sum.totalRead || 0;
    const clickLM = statsLastMonth._sum.totalClicked || 0;
    const revenueLastMonth = statsLastMonth._sum.attributedRevenueInr || 0;

    const delRateTM = sentTM > 0 ? (delTM / sentTM) * 100 : 0;
    const clickRateTM = readTM > 0 ? (clickTM / readTM) * 100 : 0;

    const delRateLM = sentLM > 0 ? (delLM / sentLM) * 100 : 0;
    const clickRateLM = readLM > 0 ? (clickLM / readLM) * 100 : 0;

    
    const deliveryRateTrend = parseFloat((delRateTM - delRateLM).toFixed(1));
    const clickRateTrend = parseFloat((clickRateTM - clickRateLM).toFixed(1));
    
    const revenueTrend = revenueLastMonth > 0
      ? parseFloat((((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1))
      : (revenueThisMonth > 0 ? 100.0 : 0.0);

    return NextResponse.json({
      totalCampaigns,
      totalMessagesSent: sumSent,
      overallDeliveryRate,
      overallOpenRate,
      overallClickRate,
      totalAttributedRevenue,
      campaignsThisMonth,
      revenueThisMonth,
      deliveryRateTrend,
      clickRateTrend,
      revenueTrend,
      channelBreakdown: campaignsByChannel.map((item) => ({
        channel: item.channel,
        count: item._count.id
      }))
    });
  } catch (error: any) {
    console.error("GET /api/analytics/overview error:", error);
    return NextResponse.json({ error: "Failed to compile analytics overview" }, { status: 500 });
  }
}
