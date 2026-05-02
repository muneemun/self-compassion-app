import { useMemo } from 'react';
import { useRelationshipStore } from '../../store/useRelationshipStore';
import { useSelfTimeStore } from '../../store/useSelfTimeStore';
import { RelationshipNode } from '../../types/relationship';

export interface StructuralInsight {
    type: 'density' | 'stress' | 'recovery' | 'balance';
    title: string;
    description: string;
    value: string | number;
    severity: 'low' | 'medium' | 'high';
}

export interface DiagnosisResult {
    headline: string;
    insights: StructuralInsight[];
    actionItems: {
        label: string;
        actionType: 'move_orbit' | 'reduce_influence' | 'self_care' | 'connect';
        targetId?: string;
    }[];
}

export const useStructuralDiagnosis = () => {
    const relationships = useRelationshipStore((state) => state.relationships);
    const selfTimeEntries = useSelfTimeStore((state) => state.entries);

    const diagnosis = useMemo((): DiagnosisResult => {
        const insights: StructuralInsight[] = [];
        const actionItems: DiagnosisResult['actionItems'] = [];

        // 1. Analyze L1 Density (Dunbar's 5)
        const l1Nodes = relationships.filter(r => r.zone === 1);
        if (l1Nodes.length > 5) {
            insights.push({
                type: 'density',
                title: '핵심 관계 과밀',
                description: `핵심 궤도(L1)에 ${l1Nodes.length}명이 밀집되어 있어 정서적 에너지가 분산되고 있습니다.`,
                value: l1Nodes.length,
                severity: l1Nodes.length > 7 ? 'high' : 'medium'
            });
            actionItems.push({
                label: '가장 에너지를 많이 쓰는 관계 이동하기',
                actionType: 'move_orbit'
            });
        }

        // 2. Analyze Stress Concentration (Cortisol)
        const highStressNodes = relationships
            .filter(r => {
                const recentHistory = r.history.slice(-5);
                const avgCortisol = recentHistory.reduce((acc, h) => acc + (h.cortisol || 0), 0) / (recentHistory.length || 1);
                return avgCortisol > 60;
            })
            .sort((a, b) => {
                const bStress = b.history.slice(-1)[0]?.cortisol || 0;
                const aStress = a.history.slice(-1)[0]?.cortisol || 0;
                return bStress - aStress;
            });

        if (highStressNodes.length > 0) {
            const topStress = highStressNodes[0];
            insights.push({
                type: 'stress',
                title: '특정 관계 스트레스 집중',
                description: `'${topStress.name}'님과의 상호작용에서 발생하는 긴장 피로도가 높습니다.`,
                value: `${Math.round(topStress.history.slice(-1)[0]?.cortisol || 0)}%`,
                severity: 'high'
            });
            actionItems.push({
                label: '이 관계의 영향도 낮추기',
                actionType: 'reduce_influence',
                targetId: topStress.id
            });
        }

        // 3. Analyze Recovery Resource Deficit
        const lastSelfTime = selfTimeEntries.length > 0 ? new Date(selfTimeEntries[0].createdAt) : new Date(0);
        const lastAntidoteInteraction = relationships
            .filter(r => r.rqsResult?.category === 'Antidote')
            .flatMap(r => r.history)
            .map(h => new Date(h.date))
            .sort((a, b) => b.getTime() - a.getTime())[0] || new Date(0);

        const daysSinceRecovery = (Date.now() - Math.max(lastSelfTime.getTime(), lastAntidoteInteraction.getTime())) / (1000 * 60 * 60 * 24);

        if (daysSinceRecovery > 3) {
            insights.push({
                type: 'recovery',
                title: '회복 자원 부족',
                description: '최근 3일간 충분한 정서 충전이나 안티도트 관계와의 교류가 없었습니다.',
                value: `${Math.floor(daysSinceRecovery)}일 경과`,
                severity: 'high'
            });
            actionItems.push({
                label: '오늘 10분 나와의 시간 갖기',
                actionType: 'self_care'
            });
        }

        // Generate Headline
        let headline = '현재 정서 우주는 평온한 궤도를 유지하고 있습니다.';
        if (insights.some(i => i.severity === 'high')) {
            if (insights.some(i => i.type === 'stress')) {
                headline = '특정 관계의 중력이 중심을 흔들고 있습니다.';
            } else if (insights.some(i => i.type === 'density')) {
                headline = '관계 과밀로 인해 중심 에너지가 간섭받고 있습니다.';
            } else {
                headline = '정서 회복 자원이 임계치 이하로 낮아진 상태입니다.';
            }
        }

        return {
            headline,
            insights: insights.slice(0, 3), // Max 3
            actionItems: actionItems.slice(0, 4) // Max 4
        };
    }, [relationships, selfTimeEntries]);

    return diagnosis;
};
