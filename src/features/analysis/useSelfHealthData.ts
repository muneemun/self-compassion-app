import { useMemo } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';

export type PeriodType = '주간' | '월간' | '연간';

export const useSelfHealthData = (period: PeriodType) => {
    const relationships = useRelationshipStore((state) => state.relationships);
    const selfTimeEntries = useSelfTimeStore((state) => state.entries);

    // 2. Period Data Calculation
    const periodData = useMemo(() => {
        // Helper to get local midnight date for consistent comparison
        const normalizeToLocalMidnight = (date: Date | string) => {
            if (!date) return new Date(NaN);
            
            if (typeof date === 'string') {
                // If it's YYYY-MM-DD or ISO string, split and use local constructor
                const datePart = date.split('T')[0];
                const parts = datePart.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    return new Date(year, month, day, 0, 0, 0, 0);
                }
            }
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return d;
            
            const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            result.setHours(0, 0, 0, 0);
            return result;
        };

        const now = new Date();
        const todayLocal = normalizeToLocalMidnight(now);
        let startDate = new Date(todayLocal);

        let numSlots = 7;
        let mode: 'daily' | 'monthly' = 'daily';

        if (period === '주간') {
            numSlots = 7;
            startDate.setDate(todayLocal.getDate() - 6);
        } else if (period === '월간') {
            numSlots = 30;
            startDate.setDate(todayLocal.getDate() - 29);
        } else {
            numSlots = 12;
            mode = 'monthly';
            startDate.setMonth(todayLocal.getMonth() - 11);
            startDate.setDate(1);
        }
        
        startDate = normalizeToLocalMidnight(startDate);

        const slots = Array.from({ length: numSlots }, () => ({
            interactionCount: 0,
            selfTimeCount: 0,
            totalEnergy: 0,
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

        const IGNORED_KEYWORDS = ['등록', '초기', 'RQS', '진단', '분석'];
        const interactionHistory = relationships
            .flatMap(r => r.history || [])
            .filter(h => !IGNORED_KEYWORDS.some(keyword => h.title?.includes(keyword)))
            .map(h => ({ ...h, isSelfTime: false }));
            
        const mappedSelfTime = selfTimeEntries.filter(e => !e.isDeleted).map(e => ({
            id: e.id,
            date: e.createdAt ? e.createdAt.split('T')[0] : '',
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
            .map(h => ({ 
                ...h, 
                dateObj: normalizeToLocalMidnight(h.date) 
            }))
            .filter(h => h.dateObj.getTime() >= startDate.getTime() && !isNaN(h.dateObj.getTime()));

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
                // Difference in days using normalized midnight dates
                const diffMs = h.dateObj.getTime() - startDate.getTime();
                slotIdx = Math.round(diffMs / (1000 * 60 * 60 * 24));
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
                slots[slotIdx].totalEnergy += (h.closeness || h.temperature || h.satisfaction || 0);
                slots[slotIdx].totalOxytocin += (h.oxytocin || 0);
                slots[slotIdx].totalCortisol += (h.cortisol || 0);

                totalOxytocinSum += (h.oxytocin || 0);
                totalCortisolSum += (h.cortisol || 0);

                // 라벨 및 카운트 판단 기준: 상호작용의 질 (만족도 vs 에너지 소모)
                const isPositive = h.isSelfTime ? true : ((h.satisfaction || 0) >= (h.energyDrain || 0));
                if (isPositive) positiveCount++;
                else challengingCount++;

                // 만약 코르티솔(스트레스) 반응이 매우 높으면 별도로 소모 카운트에 추가 고려 (선택 사항)
                if (!h.isSelfTime && (h.cortisol || 0) >= 70 && isPositive) {
                    // 긍정이더라도 스트레스가 너무 높으면 소모적으로도 집계할 수 있음 (현재는 단순화)
                }
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
        const avgEnergyLevels = slots.map((s, i) => totalCounts[i] > 0 ? Math.round(s.totalEnergy / totalCounts[i]) : null);
        const labels = slots.map(s => s.label);

        const maxCount = Math.max(...interactionCounts, ...selfTimeCounts, 5); // 최소 기준치를 5로 두어 데이터가 적을 때 꽉 차지 않게 함
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
                avgOxytocin: allHistory.length > 0 ? Math.round(totalOxytocinSum / allHistory.length) : 0,
                avgCortisol: allHistory.length > 0 ? Math.round(totalCortisolSum / allHistory.length) : 0,
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
                avgEnergyLevels,
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
