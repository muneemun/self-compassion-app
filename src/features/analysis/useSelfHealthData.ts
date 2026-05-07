import { useMemo } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';

export type PeriodType = '주간' | '월간' | '연간';

export const useSelfHealthData = (period: PeriodType) => {
    const relationships = useRelationshipStore((state) => state.relationships);
    const selfTimeEntries = useSelfTimeStore((state) => state.entries);

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
            interactionCount: 0,
            selfTimeCount: 0,
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

        const interactionHistory = relationships.flatMap(r => r.history || []).map(h => ({ ...h, isSelfTime: false }));
        const mappedSelfTime = selfTimeEntries.filter(e => !e.isDeleted).map(e => ({
            id: e.id,
            date: e.createdAt.split('T')[0],
            isSelfTime: true,
            temperature: e.emotionalSatisfaction,
            oxytocin: 60,
            cortisol: e.physicalEnergy,
            duration: e.durationMinutes,
            category: e.category,
            satisfaction: e.emotionalSatisfaction
        }));

        const allHistory = [...interactionHistory, ...mappedSelfTime]
            .filter(h => h.date)
            .map(h => ({ ...h, dateObj: new Date(h.date) }))
            .filter(h => h.dateObj >= startDate && !isNaN(h.dateObj.getTime()));

        let totalOxytocinSum = 0;
        let totalCortisolSum = 0;
        let positiveCount = 0;
        let challengingCount = 0;

        let totalRestoreMinutes = 0;
        let totalRestoreSatisfaction = 0;
        let selfTimeCount = 0;
        const categoryCounts: Record<string, number> = {};

        allHistory.forEach(h => {
            let slotIdx = -1;
            if (mode === 'daily') {
                slotIdx = Math.floor((h.dateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            } else {
                slotIdx = (h.dateObj.getFullYear() - startDate.getFullYear()) * 12 + (h.dateObj.getMonth() - startDate.getMonth());
            }

            if (slotIdx >= 0 && slotIdx < numSlots) {
                if (h.isSelfTime) {
                    slots[slotIdx].selfTimeCount += 1;
                } else {
                    slots[slotIdx].interactionCount += 1;
                }
                const totalCount = slots[slotIdx].interactionCount + slots[slotIdx].selfTimeCount;
                slots[slotIdx].totalTemp += (h.closeness || h.temperature || 50);
                slots[slotIdx].totalOxytocin += (h.oxytocin || 50);
                slots[slotIdx].totalCortisol += (h.cortisol || 20);

                totalOxytocinSum += (h.oxytocin || 50);
                totalCortisolSum += (h.cortisol || 20);

                if ((h.closeness || h.temperature || 0) >= 60) positiveCount++;
                if ((h.closeness || h.temperature || 0) <= 40 || (h.cortisol || 0) >= 60) challengingCount++;
            }

            if (h.isSelfTime) {
                totalRestoreMinutes += h.duration || 0;
                totalRestoreSatisfaction += h.satisfaction || 0;
                selfTimeCount++;
                if (h.category) {
                    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
                }
            }
        });

        const rawBestCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';
        
        const EASY_CATEGORY_MAP: Record<string, string> = {
            'SOMATIC': '가벼운 운동',
            'somatic': '가벼운 운동',
            'WRITING': '일기 쓰기',
            'writing': '일기 쓰기',
            'CREATIVE': '만들기/그리기',
            'creative': '만들기/그리기',
            'SENSORY': '편안한 휴식',
            'sensory': '편안한 휴식',
            'MINDFULNESS': '조용히 생각하기',
            'mindfulness': '조용히 생각하기'
        };

        const bestCategory = EASY_CATEGORY_MAP[rawBestCategory] || rawBestCategory;
        const avgRestorationDelta = selfTimeCount > 0 ? Math.round(totalRestoreSatisfaction / selfTimeCount) : 0;

        const interactionCounts = slots.map(s => s.interactionCount);
        const selfTimeCounts = slots.map(s => s.selfTimeCount);
        const totalCounts = slots.map(s => s.interactionCount + s.selfTimeCount);
        const avgTemps = slots.map((s, i) => totalCounts[i] > 0 ? Math.round(s.totalTemp / totalCounts[i]) : null);
        const labels = slots.map(s => s.label);

        const maxCount = Math.max(...interactionCounts, ...selfTimeCounts, 1);
        const normalizedInteractionCounts = interactionCounts.map(c => Math.round((c / maxCount) * 100));
        const normalizedSelfTimeCounts = selfTimeCounts.map(c => Math.round((c / maxCount) * 100));

        // Pulse points (use last 15 interactions in this period)
        const pulseHistory = [...allHistory]
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
            .slice(-20);

        const pulsePoints = pulseHistory.length > 0
            ? pulseHistory.map(h => ({
                value: h.closeness || h.temperature || null,
                isSelfTime: h.isSelfTime || false
            }))
            : Array(15).fill({ value: null, isSelfTime: false });

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
            selfTimeStats: {
                totalRestoreMinutes,
                avgRestorationDelta,
                bestCategory,
                selfTimeCount
            },
            stats: {
                interactionCounts: normalizedInteractionCounts,
                selfTimeCounts: normalizedSelfTimeCounts,
                rawCounts: interactionCounts,
                avgTemps,
                labels
            },
            dateRange: {
                start: startDate,
                end: now
            }
        };
    }, [relationships, selfTimeEntries, period]);

    return {
        ...periodData
    };
};
