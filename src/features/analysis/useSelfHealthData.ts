import { useMemo } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';

export type PeriodType = '주간' | '월간' | '연간';

export const useSelfHealthData = (period: PeriodType) => {
    const relationships = useRelationshipStore((state) => state.relationships);

    // 1. Relationship Balance (Radar Chart)
    const balanceData = useMemo(() => {
        if (relationships.length === 0) {
            return { Trust: 50, Growth: 50, Stability: 50, Passion: 50, Joy: 50 };
        }

        let totalTrust = 0;
        let totalGrowth = 0;
        let totalStability = 0;
        let totalPassion = 0;
        let totalJoy = 0;
        const count = relationships.length;

        relationships.forEach(r => {
            const { trust, communication, frequency, satisfaction } = r.metrics;
            const areaScores = r.rqsResult?.areaScores;

            const trustScore = areaScores?.safety ? areaScores.safety * 25 : trust;
            totalTrust += trustScore;

            const growthScore = areaScores?.growth ? areaScores.growth * 25 : satisfaction;
            totalGrowth += growthScore;

            const stabilityScore = areaScores?.reciprocity ? areaScores.reciprocity * 25 : (trust * 0.7 + frequency * 0.3);
            totalStability += stabilityScore;

            const joyScore = areaScores?.vitality ? areaScores.vitality * 25 : (satisfaction + (r.temperature || 50)) / 2;
            totalJoy += joyScore;

            const passionScore = (areaScores?.vitality && areaScores?.growth) ? ((areaScores.vitality + areaScores.growth) / 2) * 25 : communication;
            totalPassion += passionScore;
        });

        return {
            Trust: Math.round(totalTrust / count),
            Growth: Math.round(totalGrowth / count),
            Stability: Math.round(totalStability / count),
            Passion: Math.round(totalPassion / count),
            Joy: Math.round(totalJoy / count),
        };
    }, [relationships]);

    // 2. Period Data Calculation
    const periodData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        let numSlots = 7;
        let mode: 'daily' | 'monthly' = 'daily';

        if (period === '주간') {
            numSlots = 7;
            startDate.setDate(now.getDate() - 6);
        } else if (period === '월간') {
            numSlots = 30;
            startDate.setDate(now.getDate() - 29);
        } else {
            numSlots = 12;
            mode = 'monthly';
            startDate.setMonth(now.getMonth() - 11);
            startDate.setDate(1);
        }

        const slots = Array.from({ length: numSlots }, () => ({
            count: 0,
            totalTemp: 0,
            totalOxytocin: 0,
            totalCortisol: 0,
            label: ''
        }));

        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

        // Generate labels and slots
        for (let i = 0; i < numSlots; i++) {
            const d = new Date(startDate);
            if (mode === 'daily') {
                d.setDate(startDate.getDate() + i);
                slots[i].label = period === '주간' ? dayNames[d.getDay()] : `${d.getDate()}`;
            } else {
                d.setMonth(startDate.getMonth() + i);
                slots[i].label = `${d.getMonth() + 1}월`;
            }
        }

        const allHistory = relationships.flatMap(r => r.history || [])
            .filter(h => h.date)
            .map(h => ({ ...h, dateObj: new Date(h.date) }))
            .filter(h => h.dateObj >= startDate);

        let totalOxytocinSum = 0;
        let totalCortisolSum = 0;
        let positiveCount = 0;
        let challengingCount = 0;

        allHistory.forEach(h => {
            let slotIdx = -1;
            if (mode === 'daily') {
                slotIdx = Math.floor((h.dateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            } else {
                slotIdx = (h.dateObj.getFullYear() - startDate.getFullYear()) * 12 + (h.dateObj.getMonth() - startDate.getMonth());
            }

            if (slotIdx >= 0 && slotIdx < numSlots) {
                slots[slotIdx].count += 1;
                slots[slotIdx].totalTemp += (h.temperature || 50);
                slots[slotIdx].totalOxytocin += (h.oxytocin || 50);
                slots[slotIdx].totalCortisol += (h.cortisol || 20);

                totalOxytocinSum += (h.oxytocin || 50);
                totalCortisolSum += (h.cortisol || 20);

                if ((h.temperature || 0) >= 60) positiveCount++;
                if ((h.temperature || 0) <= 40 || (h.cortisol || 0) >= 60) challengingCount++;
            }
        });

        const interactionCounts = slots.map(s => s.count);
        const avgTemps = slots.map(s => s.count > 0 ? Math.round(s.totalTemp / s.count) : 50);
        const labels = slots.map(s => s.label);

        const maxCount = Math.max(...interactionCounts, 1);
        const normalizedCounts = interactionCounts.map(c => Math.round((c / maxCount) * 100));

        // Pulse points (use last 15 interactions in this period)
        const pulseHistory = [...allHistory]
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
            .slice(-20);

        const pulsePoints = pulseHistory.length > 0
            ? pulseHistory.map(h => h.temperature || 50)
            : [50, 52, 48, 50, 51, 49, 50];

        return {
            pulseStats: {
                positive: positiveCount,
                challenging: challengingCount,
                total: allHistory.length
            },
            pulsePoints,
            energyTotal: {
                avgOxytocin: allHistory.length > 0 ? Math.round(totalOxytocinSum / allHistory.length) : 50,
                avgCortisol: allHistory.length > 0 ? Math.round(totalCortisolSum / allHistory.length) : 20,
            },
            stats: {
                interactionCounts: normalizedCounts,
                rawCounts: interactionCounts,
                avgTemps,
                labels
            },
            dateRange: {
                start: startDate,
                end: now
            }
        };
    }, [relationships, period]);

    return {
        balanceData,
        ...periodData
    };
};
