import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '../theme/ColorLockContext';

interface HeaderProps {
    title?: string;
    leftAction?: React.ReactNode;
    rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<HeaderProps> = ({ title, leftAction, rightAction }) => {
    const colors = useColors();

    return (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            <View style={styles.sideContainer}>{leftAction}</View>
            <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
            <View style={styles.sideContainer}>{rightAction}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 24, // Increased right padding to prevent button from hugging the edge
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    sideContainer: {
        minWidth: 44, // Changed from fixed width to minWidth for flexibility
        flexDirection: 'row', // Ensure content aligns properly
        justifyContent: 'flex-end', // Align content to the outer edges
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    }
});
