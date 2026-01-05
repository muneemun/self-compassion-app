import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../theme/ColorLockContext';

interface LayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    scrollable?: boolean;
}

const BaseLayout: React.FC<LayoutProps> = ({
    children,
    header,
    footer,
    scrollable = false
}) => {
    const colors = useColors();

    return (
        <SafeAreaView
            edges={['top']}
            style={[styles.safeArea, { backgroundColor: colors.background }]}
        >
            <View style={styles.container}>
                {header && <View>{header}</View>}
                {scrollable ? (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {children}
                    </ScrollView>
                ) : (
                    <View style={styles.flexContent}>
                        {children}
                    </View>
                )}
                {footer && <View>{footer}</View>}
            </View>
        </SafeAreaView>
    );
};

export const HubLayout: React.FC<LayoutProps> = (props) => <BaseLayout {...props} />;
export const DetailLayout: React.FC<LayoutProps> = (props) => <BaseLayout {...props} />;
export const TaskLayout: React.FC<LayoutProps> = (props) => <BaseLayout {...props} />;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    flexContent: {
        flex: 1,
    },
});
