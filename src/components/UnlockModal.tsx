import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Diamond, X } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
// import Purchases from 'react-native-purchases'; // To be fully configured later

interface UnlockModalProps {
    visible: boolean;
    onClose: () => void;
    onUnlock: () => void;
    title?: string;
    description?: string;
}

// 테스트용 광고 ID
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3940256099942544~3347511713'; // 교체 필요

export const UnlockModal: React.FC<UnlockModalProps> = ({ 
    visible, 
    onClose, 
    onUnlock,
    title = "더 깊은 마음의 지형도를 확인해 보세요",
    description = "상세 리포트를 열람하기 위한 방식을 선택해 주세요."
}) => {
    const { setPremiumUnlocked } = useAppStore();
    const [isLoadingAd, setIsLoadingAd] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleWatchAd = () => {
        setIsLoadingAd(true);
        
        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });

        let loadedListener: any;
        let earnedRewardListener: any;
        let closedListener: any;
        let errorListener: any;

        const cleanup = () => {
            loadedListener?.();
            earnedRewardListener?.();
            closedListener?.();
            errorListener?.();
        };

        loadedListener = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setIsLoadingAd(false);
            rewarded.show();
        });

        earnedRewardListener = rewarded.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            reward => {
                cleanup();
                onUnlock(); // 보상 획득 시 언락
            },
        );

        closedListener = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
            cleanup();
            setIsLoadingAd(false);
        });

        errorListener = rewarded.addAdEventListener(RewardedAdEventType.ERROR, (error) => {
            cleanup();
            setIsLoadingAd(false);
            Alert.alert('안내', '광고를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
        });

        rewarded.load();
    };

    const handlePurchase = async () => {
        setIsPurchasing(true);
        try {
            // 실제 구현 시 RevenueCat Purchases.purchasePackage() 등 호출
            // 테스트 모드이므로 1초 대기 후 강제 성공 처리
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPremiumUnlocked(true);
            onUnlock();
            Alert.alert('결제 성공', '프리미엄 열람권이 성공적으로 적용되었습니다!');
        } catch (error) {
            Alert.alert('결제 실패', '결제 중 오류가 발생했습니다.');
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>

                        <View style={styles.optionsContainer}>
                            <TouchableOpacity 
                                style={[styles.optionButton, styles.adButton]} 
                                onPress={handleWatchAd}
                                disabled={isLoadingAd || isPurchasing}
                            >
                                {isLoadingAd ? (
                                    <ActivityIndicator color="#5D4037" />
                                ) : (
                                    <>
                                        <Play size={20} color="#5D4037" />
                                        <Text style={styles.adButtonText}>후원하고 무료로 보기</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.optionButton, styles.purchaseButton]} 
                                onPress={handlePurchase}
                                disabled={isLoadingAd || isPurchasing}
                            >
                                {isPurchasing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Diamond size={20} color="#fff" />
                                        <Text style={styles.purchaseButtonText}>프리미엄 열람권 ($1.00)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'rgba(255, 253, 249, 0.95)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    adButton: {
        backgroundColor: '#F5E6D3',
    },
    adButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    purchaseButton: {
        backgroundColor: '#4A3B32',
    },
    purchaseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    }
});
