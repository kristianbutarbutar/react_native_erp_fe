'use client';

import React, { useState, useEffect } from 'react';

// ==========================================
// 1. DATA CONTRACTS & TYPES
// ==========================================

export interface KPICardData {
    title: string;
    badgeNumber: string;
    metric: string;
    trend: string;
    trendPositive: boolean;
    sparkline: number[];
    footerLabel: string;
}

export interface DonutCategory {
    label: string;
    percentage: number;
    color: string;
}

export interface DonutChartData {
    title: string;
    badgeNumber: string;
    categories: DonutCategory[];
}

export interface StackedBarItem {
    quarter: string;
    values: { name: string; value: number; color: string }[];
}

export interface StackedColumnData {
    title: string;
    badgeNumber: string;
    seriesNames: { name: string; color: string }[];
    data: StackedBarItem[];
}

export interface HorizontalBarItem {
    model: string;
    primaryValue: number;
    secondaryValue: number;
    primaryColor: string;
    secondaryColor: string;
}

export interface HorizontalBarData {
    title: string;
    badgeNumber: string;
    items: HorizontalBarItem[];
}

export interface AreaChartData {
    title: string;
    badgeNumber: string;
    seriesLabel: string;
    seriesColor: string;
    accentColor: string;
    months: string[];
    values: number[];
    yUnit: string;
}

export interface LineChartPoint {
    day: number;
    value: number;
}

export interface LineChartData {
    title: string;
    badgeNumber: string;
    seriesLabel: string;
    data: LineChartPoint[];
    lastValue: string;
}

export interface SparklineCardData {
    title: string;
    badgeNumber: string;
    value: string;
    points: number[];
}

export interface GaugeChartData {
    title: string;
    badgeNumber: string;
    score: number;
    target: number;
    min: number;
    max: number;
}

export interface DashboardDataPayload {
    header: {
        title: string;
        period: string;
        viewMode: string;
    };
    kpiRevenue: KPICardData;
    salesCategory: DonutChartData;
    regionalGrowth: StackedColumnData;
    topProducts: HorizontalBarData;
    websiteTraffic: AreaChartData;
    activeUserTrends: LineChartData;
    avgSessionDuration: SparklineCardData;
    customerSatisfaction: GaugeChartData;
    monthlySignups: AreaChartData;
}

// ==========================================
// 2. DEFAULT SAMPLE JSON DATA
// ==========================================

export const sampleDashboardData: DashboardDataPayload = {
    header: {
        title: 'PERFORMANCE ANALYTICS DASHBOARD',
        period: 'SEPT 2026',
        viewMode: 'Global Views',
    },
    kpiRevenue: {
        badgeNumber: '1. KPI Card (Single Value)',
        title: 'TOTAL REVENUE YTD',
        metric: '$3.4M',
        trend: '↗ (+12.5% vs Last Year)',
        trendPositive: true,
        sparkline: [20, 25, 22, 35, 30, 48, 42, 60, 55, 75, 70, 95],
        footerLabel: 'Key Performance Indicator',
    },
    salesCategory: {
        badgeNumber: '2. Donut Chart',
        title: 'SALES BY CATEGORY',
        categories: [
            { label: 'Electronics', percentage: 35, color: '#38BDF8' },
            { label: 'Apparel', percentage: 28, color: '#F97316' },
            { label: 'Home Goods', percentage: 20, color: '#22C55E' },
            { label: 'Other', percentage: 17, color: '#A855F7' },
        ],
    },
    regionalGrowth: {
        badgeNumber: '3. Stacked Column Chart',
        title: 'REGIONAL QUARTERLY GROWTH',
        seriesNames: [
            { name: 'North', color: '#38BDF8' },
            { name: 'South', color: '#F97316' },
            { name: 'East', color: '#22C55E' },
            { name: 'West', color: '#A855F7' },
        ],
        data: [
            {
                quarter: 'Q1',
                values: [
                    { name: 'North', value: 20, color: '#38BDF8' },
                    { name: 'South', value: 25, color: '#F97316' },
                    { name: 'East', value: 20, color: '#22C55E' },
                    { name: 'West', value: 15, color: '#A855F7' },
                ],
            },
            {
                quarter: 'Q2',
                values: [
                    { name: 'North', value: 25, color: '#38BDF8' },
                    { name: 'South', value: 30, color: '#F97316' },
                    { name: 'East', value: 22, color: '#22C55E' },
                    { name: 'West', value: 20, color: '#A855F7' },
                ],
            },
            {
                quarter: 'Q3',
                values: [
                    { name: 'North', value: 30, color: '#38BDF8' },
                    { name: 'South', value: 35, color: '#F97316' },
                    { name: 'East', value: 28, color: '#22C55E' },
                    { name: 'West', value: 25, color: '#A855F7' },
                ],
            },
            {
                quarter: 'Q4',
                values: [
                    { name: 'North', value: 40, color: '#38BDF8' },
                    { name: 'South', value: 40, color: '#F97316' },
                    { name: 'East', value: 35, color: '#22C55E' },
                    { name: 'West', value: 30, color: '#A855F7' },
                ],
            },
        ],
    },
    topProducts: {
        badgeNumber: '4. Bar Chart (Horizontal)',
        title: 'TOP PRODUCTS SOLD',
        items: [
            { model: 'Model A', primaryValue: 567, secondaryValue: 723, primaryColor: '#38BDF8', secondaryColor: '#0284C7' },
            { model: 'Model B', primaryValue: 257, secondaryValue: 555, primaryColor: '#F97316', secondaryColor: '#C2410C' },
            { model: 'Model C', primaryValue: 228, secondaryValue: 135, primaryColor: '#22C55E', secondaryColor: '#15803D' },
            { model: 'Model D', primaryValue: 203, secondaryValue: 110, primaryColor: '#A855F7', secondaryColor: '#7E22CE' },
            { model: 'Model E', primaryValue: 198, secondaryValue: 85, primaryColor: '#EC4899', secondaryColor: '#BE185D' },
        ],
    },
    websiteTraffic: {
        badgeNumber: '5. Area Chart',
        title: 'MONTHLY WEBSITE TRAFFIC',
        seriesLabel: 'Users (k)',
        seriesColor: '#38BDF8',
        accentColor: '#0284C7',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        values: [40, 75, 95, 80, 145, 130, 85, 45],
        yUnit: 'Users (k)',
    },
    activeUserTrends: {
        badgeNumber: '6. Line Chart',
        title: 'ACTIVE USER TRENDS',
        seriesLabel: "Daily Users ('k')",
        data: [
            { day: 1, value: 105 },
            { day: 3, value: 118 },
            { day: 6, value: 112 },
            { day: 8, value: 132 },
            { day: 10, value: 128 },
            { day: 13, value: 145 },
            { day: 16, value: 140 },
            { day: 19, value: 158 },
            { day: 22, value: 152 },
            { day: 25, value: 168 },
            { day: 27, value: 162 },
            { day: 29, value: 175 },
            { day: 31, value: 182 },
        ],
        lastValue: '182k',
    },
    avgSessionDuration: {
        badgeNumber: '7. Sparkline',
        title: 'AVG. SESSION DURATION',
        value: '3m 45s',
        points: [25, 45, 30, 60, 40, 75, 35, 90, 65, 80, 50, 95, 70, 85],
    },
    customerSatisfaction: {
        badgeNumber: '8. Gauge Chart',
        title: 'CUSTOMER SATISFACTION (CSAT)',
        score: 88,
        target: 85,
        min: 0,
        max: 100,
    },
    monthlySignups: {
        badgeNumber: '9. Area Chart',
        title: 'MONTHLY SIGN-UPS',
        seriesLabel: 'Sign-ups (k)',
        seriesColor: '#22C55E',
        accentColor: '#16A34A',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        values: [0.5, 0.8, 1.5, 3.2, 6.5, 9.8, 11.2, 12.1],
        yUnit: 'Sign-ups (k)',
    },
};

// ==========================================
// 3. ULTRA-COMPACT RESPONSIVE CARD CONTAINER
// ==========================================

const ChartCard: React.FC<{
    badgeNumber: string;
    title: string;
    children: React.ReactNode;
    isDesktop: boolean;
}> = ({ badgeNumber, title, children, isDesktop }) => (
    <div
        style={{
            backgroundColor: '#1E2433',
            borderRadius: isDesktop ? '4px' : '8px',
            padding: isDesktop ? '5px 7px' : '12px 14px',
            border: '1px solid #2D3748',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            height: '100%',
            width: '100%',
            minHeight: 0,
            boxSizing: 'border-box',
            overflow: 'hidden',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0, marginBottom: isDesktop ? '2px' : '6px' }}>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ color: '#94A3B8', fontSize: isDesktop ? '8px' : '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {badgeNumber}
                </div>
                <div style={{ color: '#F1F5F9', fontSize: isDesktop ? '9.5px' : '12px', fontWeight: 700, marginTop: '0.5px', letterSpacing: '0.2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {title}
                </div>
            </div>
            <div style={{ color: '#64748B', cursor: 'pointer', fontSize: isDesktop ? '10px' : '13px', lineHeight: '1', paddingLeft: '3px' }}>⋮</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            {children}
        </div>
    </div>
);

// ==========================================
// 4. INDIVIDUAL CHART COMPONENT FUNCTIONS
// ==========================================

// 1. KPI Card (Single Value)
export const renderKPICard = (data: KPICardData, isDesktop = true) => {
    const max = Math.max(...data.sparkline);
    const min = Math.min(...data.sparkline);
    const points = data.sparkline
        .map((val, idx) => {
            const x = (idx / (data.sparkline.length - 1)) * 260;
            const y = 38 - ((val - min) / (max - min || 1)) * 30;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ marginTop: isDesktop ? '0px' : '4px', flexShrink: 0 }}>
                <div style={{ color: '#FFFFFF', fontSize: isDesktop ? '17px' : '26px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                    {data.metric}
                </div>
                <div style={{ color: data.trendPositive ? '#22C55E' : '#EF4444', fontSize: isDesktop ? '8px' : '10px', fontWeight: 600, marginTop: '1px' }}>
                    {data.trend}
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                <svg viewBox="0 0 260 42" preserveAspectRatio="none" style={{ width: '100%', height: '100%', maxHeight: isDesktop ? '32px' : '50px', overflow: 'visible' }}>
                    <polyline fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
                    {data.sparkline.length > 0 && (
                        <circle cx="260" cy={38 - ((data.sparkline[data.sparkline.length - 1] - min) / (max - min || 1)) * 30} r="2.5" fill="#38BDF8" />
                    )}
                </svg>
            </div>

            <div style={{ color: '#64748B', fontSize: isDesktop ? '7.5px' : '9px', textAlign: 'center', marginTop: '1px', flexShrink: 0 }}>
                {data.footerLabel}
            </div>
        </ChartCard>
    );
};

// 2. Donut Chart
export const renderDonutChart = (data: DonutChartData, isDesktop = true) => {
    let accumulatedAngle = 0;
    const radius = 32;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', maxHeight: isDesktop ? '62px' : '90px', transform: 'rotate(-90deg)' }}>
                    {data.categories.map((cat, idx) => {
                        const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((accumulatedAngle / 100) * circumference);
                        accumulatedAngle += cat.percentage;
                        return (
                            <circle
                                key={idx}
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="transparent"
                                stroke={cat.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                            />
                        );
                    })}
                </svg>

                <div style={{ position: 'absolute', top: '8%', left: '12%', color: '#A855F7', fontSize: isDesktop ? '7px' : '9px', fontWeight: 700 }}>17%</div>
                <div style={{ position: 'absolute', top: '12%', right: '10%', color: '#38BDF8', fontSize: isDesktop ? '7px' : '9px', fontWeight: 700 }}>35%</div>
                <div style={{ position: 'absolute', bottom: '8%', right: '24%', color: '#F97316', fontSize: isDesktop ? '7px' : '9px', fontWeight: 700 }}>28%</div>
                <div style={{ position: 'absolute', bottom: '16%', left: '10%', color: '#22C55E', fontSize: isDesktop ? '7px' : '9px', fontWeight: 700 }}>20%</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isDesktop ? '1px 3px' : '3px 6px', marginTop: '1px', flexShrink: 0 }}>
                {data.categories.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                        <span style={{ color: '#CBD5E1', fontSize: isDesktop ? '7.5px' : '9px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{cat.label}</span>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
};

// 3. Stacked Column Chart
export const renderStackedColumnChart = (data: StackedColumnData, isDesktop = true) => {
    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: isDesktop ? '5px' : '8px', marginBottom: '2px', flexShrink: 0 }}>
                {data.seriesNames.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: '5px', height: '5px', backgroundColor: s.color, borderRadius: '1px' }} />
                        <span style={{ color: '#94A3B8', fontSize: isDesktop ? '7.5px' : '9px' }}>{s.name}</span>
                    </div>
                ))}
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '14px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px' }}>
                    <span>16k</span>
                    <span>12k</span>
                    <span>8k</span>
                    <span>4k</span>
                    <span>0</span>
                </div>

                {data.data.map((bar, bIdx) => (
                    <div key={bIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: isDesktop ? '13px' : '18px', display: 'flex', flexDirection: 'column-reverse', borderRadius: '2px', overflow: 'hidden' }}>
                            {bar.values.map((v, vIdx) => (
                                <div key={vIdx} style={{ height: isDesktop ? `${v.value * 0.45}px` : `${v.value * 0.75}px`, backgroundColor: v.color, width: '100%' }} />
                            ))}
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: isDesktop ? '7.5px' : '9px', marginTop: '1px' }}>{bar.quarter}</span>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>Quarter</div>
        </ChartCard>
    );
};

// 4. Horizontal Bar Chart
export const renderHorizontalBarChart = (data: HorizontalBarData, isDesktop = true) => {
    const maxValue = 800;

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', margin: '1px 0' }}>
                {data.items.map((item, idx) => {
                    const widthPct = (item.primaryValue / maxValue) * 100;
                    return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: isDesktop ? '36px' : '44px', color: '#94A3B8', fontSize: isDesktop ? '7.5px' : '9px', textAlign: 'right', flexShrink: 0 }}>{item.model}</span>
                            <div style={{ flex: 1, height: isDesktop ? '9px' : '12px', backgroundColor: '#0F172A', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                                <div
                                    style={{
                                        width: `${widthPct}%`,
                                        height: '100%',
                                        backgroundColor: item.primaryColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: '2px',
                                    }}
                                >
                                    <span style={{ color: '#000000', fontSize: isDesktop ? '6.5px' : '8px', fontWeight: 800 }}>{item.primaryValue}</span>
                                </div>
                                <span style={{ position: 'absolute', right: '2px', top: '0', color: '#94A3B8', fontSize: isDesktop ? '6.5px' : '8px', lineHeight: isDesktop ? '9px' : '12px' }}>
                                    {item.secondaryValue}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: isDesktop ? '40px' : '48px', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>
                <span>0</span>
                <span>20</span>
                <span>40</span>
                <span>60</span>
                <span>80</span>
                <span>100</span>
            </div>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>Units Sold</div>
        </ChartCard>
    );
};

// 5. Area Chart (Website Traffic)
export const renderAreaChart = (data: AreaChartData, isDesktop = true) => {
    const max = Math.max(...data.values, 160);
    const width = 280;
    const height = 65;
    const points = data.values.map((v, i) => {
        const x = (i / (data.values.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
    });

    const pathD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
    const lineD = `M ${points.join(' L ')}`;

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginBottom: '1px', flexShrink: 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: data.seriesColor }} />
                <span style={{ color: '#CBD5E1', fontSize: isDesktop ? '7.5px' : '9px' }}>{data.seriesLabel}</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6px' : '7.5px' }}>
                    <span>145k</span>
                    <span>120k</span>
                    <span>90k</span>
                    <span>60k</span>
                    <span>30k</span>
                    <span>0</span>
                </div>

                <div style={{ flex: 1, paddingLeft: '18px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', flex: 1, minHeight: 0, overflow: 'visible' }}>
                        <defs>
                            <linearGradient id={`areaGrad-${data.badgeNumber}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={data.seriesColor} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={data.accentColor} stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        <path d={pathD} fill={`url(#areaGrad-${data.badgeNumber})`} />
                        <path d={lineD} fill="none" stroke={data.seriesColor} strokeWidth="1.5" />
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', marginTop: '1px', flexShrink: 0 }}>
                        {data.months.map((m, idx) => (
                            <span key={idx}>{m}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>Months</div>
        </ChartCard>
    );
};

// 6. Line Chart (Active User Trends)
export const renderLineChart = (data: LineChartData, isDesktop = true) => {
    const max = 200;
    const min = 100;
    const width = 260;
    const height = 65;

    const points = data.data.map((p, i) => {
        const x = (i / (data.data.length - 1)) * width;
        const y = height - ((p.value - min) / (max - min)) * height;
        return { x, y, val: p.value };
    });

    const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginBottom: '1px', flexShrink: 0 }}>
                <span style={{ width: '4px', height: '4px', backgroundColor: '#38BDF8', transform: 'rotate(45deg)' }} />
                <span style={{ color: '#CBD5E1', fontSize: isDesktop ? '7.5px' : '9px' }}>{data.seriesLabel}</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6px' : '7.5px' }}>
                    <span>200k</span>
                    <span>150k</span>
                    <span>100k</span>
                </div>

                <div style={{ flex: 1, paddingLeft: '18px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', flex: 1, minHeight: 0, overflow: 'visible' }}>
                        <polyline fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2.5 2.5" points={polylineStr} />
                        {points.map((pt, i) => (
                            <circle key={i} cx={pt.x} cy={pt.y} r="1.8" fill="#38BDF8" />
                        ))}
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', marginTop: '1px', flexShrink: 0 }}>
                        <span>1</span>
                        <span>13</span>
                        <span>27</span>
                        <span>31</span>
                    </div>
                </div>
            </div>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>Days (1-31 Sept 2026)</div>
        </ChartCard>
    );
};

// 7. Sparkline Card
export const renderSparklineCard = (data: SparklineCardData, isDesktop = true) => {
    const max = Math.max(...data.points);
    const min = Math.min(...data.points);
    const width = 180;
    const height = 40;

    const polylineStr = data.points
        .map((v, i) => {
            const x = (i / (data.points.length - 1)) * width;
            const y = height - ((v - min) / (max - min || 1)) * (height - 6);
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ color: '#FFFFFF', fontSize: isDesktop ? '16px' : '22px', fontWeight: 800, marginTop: '1px', flexShrink: 0 }}>
                {data.value}
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', maxHeight: isDesktop ? '34px' : '48px', overflow: 'visible' }}>
                    <polyline fill="none" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={polylineStr} />
                </svg>
            </div>
        </ChartCard>
    );
};

// 8. Gauge Chart
export const renderGaugeChart = (data: GaugeChartData, isDesktop = true) => {
    const angle = 180 - (data.score / (data.max - data.min)) * 180;
    const needleRad = (angle * Math.PI) / 180;
    const cx = 80;
    const cy = 65;
    const r = 40;

    const nx = cx + r * 0.75 * Math.cos(needleRad);
    const ny = cy - r * 0.75 * Math.sin(needleRad);

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 160 78" style={{ width: '100%', height: '100%', maxHeight: isDesktop ? '48px' : '65px', overflow: 'visible' }}>
                    <path d="M 30,65 A 50,50 0 0,1 130,65" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
                    <path d="M 30,65 A 50,50 0 0,1 124,48" fill="none" stroke="#22C55E" strokeWidth="12" strokeLinecap="round" />
                    <circle cx="118" cy="38" r="2" fill="#FFFFFF" />
                    <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="3.5" fill="#CBD5E1" />
                </svg>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: isDesktop ? '80px' : '100px', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', marginTop: '-4px' }}>
                    <span>{data.min}</span>
                    <span>{data.max}</span>
                </div>

                <div style={{ color: '#FFFFFF', fontSize: isDesktop ? '12px' : '15px', fontWeight: 800, marginTop: '1px', lineHeight: 1 }}>
                    {data.score}%
                </div>
                <div style={{ color: '#94A3B8', fontSize: isDesktop ? '7px' : '8.5px' }}>
                    Target: {data.target}%
                </div>
            </div>
        </ChartCard>
    );
};

// 9. Area Chart (Monthly Signups)
export const renderMonthlySignupsArea = (data: AreaChartData, isDesktop = true) => {
    const max = 14;
    const width = 280;
    const height = 65;
    const points = data.values.map((v, i) => {
        const x = (i / (data.values.length - 1)) * width;
        const y = height - (v / max) * height;
        return `${x},${y}`;
    });

    const pathD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;
    const lineD = `M ${points.join(' L ')}`;

    return (
        <ChartCard badgeNumber={data.badgeNumber} title={data.title} isDesktop={isDesktop}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginBottom: '1px', flexShrink: 0 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: data.seriesColor }} />
                <span style={{ color: '#CBD5E1', fontSize: isDesktop ? '7.5px' : '9px' }}>{data.seriesLabel}</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6px' : '7.5px' }}>
                    <span>12</span>
                    <span>8</span>
                    <span>4</span>
                    <span>0</span>
                </div>

                <div style={{ flex: 1, paddingLeft: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', flex: 1, minHeight: 0, overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#15803D" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        <path d={pathD} fill="url(#signupGrad)" />
                        <path d={lineD} fill="none" stroke="#22C55E" strokeWidth="1.5" />
                    </svg>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', marginTop: '1px', flexShrink: 0 }}>
                        {data.months.map((m, idx) => (
                            <span key={idx}>{m}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div style={{ textAlign: 'center', color: '#64748B', fontSize: isDesktop ? '6.5px' : '8px', flexShrink: 0 }}>Months</div>
        </ChartCard>
    );
};

// ==========================================
// 5. MAIN DASHBOARD COMPONENT
// ==========================================

export interface DashboardProps {
    initialData?: DashboardDataPayload;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialData = sampleDashboardData }) => {
    const [data] = useState<DashboardDataPayload>(initialData);
    const [isDesktop, setIsDesktop] = useState<boolean>(true);

    useEffect(() => {
        const checkViewport = () => {
            if (typeof window !== 'undefined') {
                setIsDesktop(window.innerWidth >= 1024);
            }
        };
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    return (
        <div
            style={{
                backgroundColor: '#0F172A',
                width: isDesktop ? '85vw' : '100vw',
                minHeight: '80vh',
                display: 'flex', paddingTop: '0px', gap: '0px',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                overflow: 'hidden', marginTop: '0px', overflowY: 'auto',
            }}
        >
            {/* 75% Width & 80% Height Container on Desktop with margin 5px */}
            <div
                style={{
                    backgroundColor: '#111827',
                    width: isDesktop ? '75vw' : '100vw',
                    height: isDesktop ? '90vh' : 'auto',
                    maxHeight: isDesktop ? '70vh' : 'none',
                    borderRadius: isDesktop ? '8px' : '0px',
                    border: isDesktop ? '1px solid #1E293B' : 'none',
                    boxShadow: isDesktop ? '0 10px 25px rgba(0, 0, 0, 0.4)' : 'none',
                    color: '#F8FAFC',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    padding: isDesktop ? '0px 0px' : '0px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                    overflowY: isDesktop ? 'hidden' : 'auto',
                    marginTop: '0px', paddingTop: '0px',
                }}
            >
                {/* Top Header Bar */}
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #1E293B',
                        paddingBottom: isDesktop ? '4px' : '10px', paddingTop: '0px', gap: '0',
                        marginBottom: isDesktop ? '6px' : '12px', marginTop: '0px',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: isDesktop ? '13px' : '16px', cursor: 'pointer' }}>☰</span>
                        <h1 style={{ margin: 0, fontSize: isDesktop ? '11px' : '15px', fontWeight: 800, letterSpacing: '0.5px', color: '#FFFFFF' }}>
                            {data.header.title}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#1E2433',
                                border: '1px solid #334155',
                                borderRadius: '3px',
                                padding: isDesktop ? '2px 5px' : '4px 7px',
                                fontSize: isDesktop ? '8.5px' : '10.5px',
                                color: '#CBD5E1',
                                gap: '3px',
                            }}
                        >
                            <span>🕒</span>
                            <span>📅 {data.header.period} ▾</span>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#1E2433',
                                border: '1px solid #334155',
                                borderRadius: '3px',
                                padding: isDesktop ? '2px 5px' : '4px 7px',
                                fontSize: isDesktop ? '8.5px' : '10.5px',
                                color: '#CBD5E1',
                                gap: '3px',
                            }}
                        >
                            <span>👤</span>
                            <span>{data.header.viewMode} ▾</span>
                        </div>
                    </div>
                </header>

                {/* Main Grid Content: Fits precisely within 80vh desktop container */}
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isDesktop ? '6px' : '5px',
                    }}
                >
                    {/* Row 1: 4 Cards */}
                    <div
                        style={{
                            flex: isDesktop ? 1 : 'none',
                            minHeight: 0,
                            display: 'grid',
                            gridTemplateColumns: isDesktop ? 'repeat(4, minmax(0, 1fr))' : '1fr',
                            gap: isDesktop ? '6px' : '10px',
                        }}
                    >
                        {renderKPICard(data.kpiRevenue, isDesktop)}
                        {renderDonutChart(data.salesCategory, isDesktop)}
                        {renderStackedColumnChart(data.regionalGrowth, isDesktop)}
                        {renderHorizontalBarChart(data.topProducts, isDesktop)}
                    </div>

                    {/* Row 2: 5 Cards */}
                    <div
                        style={{
                            flex: isDesktop ? 1 : 'none',
                            minHeight: 0,
                            display: 'grid',
                            gridTemplateColumns: isDesktop ? 'repeat(5, minmax(0, 1fr))' : '1fr',
                            gap: isDesktop ? '6px' : '10px',
                        }}
                    >
                        {renderAreaChart(data.websiteTraffic, isDesktop)}
                        {renderLineChart(data.activeUserTrends, isDesktop)}
                        {renderSparklineCard(data.avgSessionDuration, isDesktop)}
                        {renderGaugeChart(data.customerSatisfaction, isDesktop)}
                        {renderMonthlySignupsArea(data.monthlySignups, isDesktop)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;