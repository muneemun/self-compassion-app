import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Dimensions, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native';
import { HubLayout } from '../../layouts/BaseLayout';
import { useColors } from '../../theme/ColorLockContext';
import { UI_CONSTANTS, COMMON_STYLES } from '../../theme/LayoutStyles';
import { ArrowLeft, MoreHorizontal, Send, Wind, Smile, AlertCircle, Waves, MessageSquareOff, Sparkles, BookOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    type: 'ai' | 'user';
    text: string;
    sender?: string;
    time: string;
    recipe?: 'breathing' | 'grounding' | 'reflection';
}

const ChatMessage = ({ msg }: { msg: Message }) => {
    const colors = useColors();
    const isAi = msg.type === 'ai';
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.messageWrapper,
                isAi ? styles.aiWrapper : styles.userWrapper,
                {
                    opacity: fadeAnim,
                    transform: [{
                        translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [isAi ? -20 : 20, 0]
                        })
                    }]
                }
            ]}
        >
            {isAi && (
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_4nbf8XYKfUAdnhk0h_PYVe-cPF_A6hYA9qFKFARMFD5X_qYabF_Q6Ahn_fkVop9cc55TdPKTmst_DJOCIElrUGuKDyp-_k94tXARDdb7vrNXxdd3jErzAMy5B5wgWlGRB8y8M-9gBmW8jww40YT4sCkNxkzhsII5eswcUTMVpRzkwka7PHIu33bUdVOthx2lrxFeMrz1p9nZKI8uSDYzdrGP2WAEkp1NN7cOYU5PBWL7mZ6a6MkSMy_qYSR3Vgv2v2IfX_K4lhQ' }}
                        style={styles.aiAvatar}
                    />
                </View>
            )}
            <View style={[styles.messageContent, isAi ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
                {isAi && <Text style={[styles.senderName, { color: colors.primary, opacity: 0.6 }]}>{msg.sender}</Text>}
                <View style={[
                    styles.bubble,
                    isAi ? styles.aiBubble : styles.userBubble,
                    isAi ? { backgroundColor: colors.white, borderColor: 'rgba(74,93,78,0.05)' } : { backgroundColor: colors.accent }
                ]}>
                    <Text style={[styles.messageText, isAi ? { color: colors.primary } : { color: colors.white }]}>
                        {msg.text}
                    </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.primary, opacity: 0.4 }]}>{msg.time}</Text>
            </View>
        </Animated.View>
    );
};

const BreathingGuide = () => {
    const colors = useColors();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.4,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    return (
        <View style={styles.breathingContainer}>
            <View style={styles.orbitRings}>
                <View style={[styles.ring, { borderColor: colors.primary, opacity: 0.1 }]} />
                <View style={[styles.ring, { borderColor: colors.primary, opacity: 0.05, transform: [{ scale: 1.25 }] }]} />
            </View>

            <Animated.View style={[styles.coreCircle, { backgroundColor: colors.primary, transform: [{ scale: scaleAnim }] }]}>
                <Wind color={colors.white} size={32} style={{ opacity: 0.9, marginBottom: 4 }} />
                <Text style={styles.coreText}>안정 호흡</Text>
                <Text style={styles.coreSubText}>들이마시고... 내쉬고...</Text>
            </Animated.View>

            <Text style={[styles.breathingHint, { color: colors.primary, opacity: 0.7 }]}>
                천천히 원의 크기에 맞춰 호흡하세요
            </Text>
        </View>
    );
};

const RecipeCard = ({ title, description, icon: Icon, onPress }: { title: string, description: string, icon: any, onPress: () => void }) => {
    const colors = useColors();
    return (
        <TouchableOpacity
            style={[styles.recipeCard, { backgroundColor: colors.white, borderColor: 'rgba(74,93,78,0.05)' }]}
            onPress={onPress}
        >
            <View style={[styles.recipeIconWrapper, { backgroundColor: 'rgba(74,93,78,0.05)' }]}>
                <Icon size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.recipeTitle, { color: colors.primary }]}>{title}</Text>
                <Text style={[styles.recipeDesc, { color: colors.primary, opacity: 0.6 }]}>{description}</Text>
            </View>
            <ArrowLeft size={18} color={colors.primary} style={{ transform: [{ rotate: '180deg' }], opacity: 0.3 }} />
        </TouchableOpacity>
    );
};

export const SosRxCenter = ({ onBack }: { onBack?: () => void }) => {
    const colors = useColors();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            sender: 'Dr. Warmth',
            text: '안녕하세요. 지금 마음이 어떤가요? 힘든 일이 있다면 제가 들어드릴게요.',
            time: '오후 10:00'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [showBreathing, setShowBreathing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const generateResponse = (input: string) => {
        const text = input.toLowerCase();
        if (text.includes('불안') || text.includes('숨') || text.includes('떨려')) {
            return {
                text: '갑작스러운 불안감에 숨이 가빠지셨군요. 지금은 논리적인 생각보다 몸의 감각을 안정시키는 게 우선입니다. 저와 함께 1분간 호흡을 맞춰볼까요?',
                recipe: 'breathing' as const
            };
        } else if (text.includes('화가') || text.includes('미워') || text.includes('짜증')) {
            return {
                text: '마음 속 열기가 여기까지 느껴지네요. 그 분노를 잠시 객관화해볼 시간이 필요해요. "분노 가라앉히기" 처방전을 드릴게요.',
                recipe: 'reflection' as const
            };
        } else if (text.includes('슬퍼') || text.includes('우울') || text.includes('혼자')) {
            return {
                text: '깊은 어둠 속에 계신 것 같아 마음이 아프네요. 당신은 결코 혼자가 아니에요. 지금 이 순간 당신을 지탱해주는 5가지 감각을 찾아볼까요?',
                recipe: 'grounding' as const
            };
        }
        return {
            text: '그렇군요. 당신의 이야기를 들으니 저도 마음이 쓰이네요. 조금 더 구체적으로 말씀해주시겠어요? 제가 어떤 도움을 드릴 수 있을까요?',
            recipe: undefined
        };
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            text: inputText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        Keyboard.dismiss();

        // Dr. Warmth Response Logic
        setTimeout(() => {
            const aiResponse = generateResponse(inputText);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                sender: 'Dr. Warmth',
                text: aiResponse.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                recipe: aiResponse.recipe
            };
            setMessages(prev => [...prev, aiMsg]);
            if (aiResponse.recipe === 'breathing') setShowBreathing(true);
        }, 1000);
    };

    return (
        <HubLayout>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Fixed Header */}
                <View style={[COMMON_STYLES.headerContainer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={onBack} style={COMMON_STYLES.secondaryActionBtn}>
                        <ArrowLeft size={UI_CONSTANTS.ICON_SIZE} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SOS 보호 허브</Text>
                    <TouchableOpacity style={COMMON_STYLES.secondaryActionBtn}>
                        <MoreHorizontal size={UI_CONSTANTS.ICON_SIZE} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} msg={msg} />
                    ))}

                    {showBreathing && <BreathingGuide />}

                    {/* Dynamic Prescriptions */}
                    <View style={styles.recipeSection}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>Dr. Warmth의 처방전</Text>
                        <RecipeCard
                            title="안행 호흡 가이드"
                            description="심박수를 낮추고 부교감 신경을 활성화합니다."
                            icon={Wind}
                            onPress={() => setShowBreathing(true)}
                        />
                        <RecipeCard
                            title="5-4-3-2-1 그라운딩"
                            description="현재의 감각에 집중하여 불안을 차단합니다."
                            icon={Sparkles}
                            onPress={() => { }}
                        />
                        <RecipeCard
                            title="자기 자비 편지"
                            description="나를 비난하는 목소리를 잠재우는 글쓰기."
                            icon={BookOpen}
                            onPress={() => { }}
                        />
                    </View>
                </ScrollView>

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: 'rgba(74,93,78,0.1)' }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.white, borderColor: 'rgba(74,93,78,0.1)' }]}>
                        <TextInput
                            style={[styles.input, { color: colors.primary }]}
                            placeholder="지금 느껴지는 감정을 말해주세요..."
                            placeholderTextColor="rgba(74,93,78,0.4)"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSend}
                        >
                            <Send color={colors.white} size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </HubLayout>
    );
};

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingVertical: 20,
        paddingBottom: 40,
    },
    messageWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    aiWrapper: {
        justifyContent: 'flex-start',
    },
    userWrapper: {
        justifyContent: 'flex-end',
    },
    avatarWrapper: {
        marginRight: 12,
    },
    aiAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    messageContent: {
        maxWidth: '75%',
    },
    senderName: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
        marginBottom: 4,
    },
    bubble: {
        padding: 14,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    aiBubble: {
        borderTopLeftRadius: 0,
        borderWidth: 1,
    },
    userBubble: {
        borderTopRightRadius: 0,
    },
    messageText: {
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        marginHorizontal: 4,
    },
    breathingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        marginHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 30,
        marginBottom: 20,
    },
    orbitRings: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 1,
        position: 'absolute',
    },
    coreCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    coreText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    coreSubText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        opacity: 0.8,
        marginTop: 4,
    },
    breathingHint: {
        marginTop: 40,
        fontSize: 13,
        fontWeight: '700',
    },
    recipeSection: {
        paddingHorizontal: 20,
        marginTop: 10,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
    },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        gap: 16,
    },
    recipeIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recipeTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    recipeDesc: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    inputContainer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        borderTopWidth: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingLeft: 16,
        borderRadius: 30,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        height: 44,
        fontSize: 15,
        fontWeight: '600',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
