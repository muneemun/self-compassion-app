import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const UI_CONSTANTS = {
    HEADER_HEIGHT: 64,
    HORIZONTAL_PADDING: 20,
    BUTTON_SIZE: 44,
    ICON_SIZE: 24,
    GAP_SMALL: 8,
    GAP_MEDIUM: 10,
};

export const COMMON_STYLES = StyleSheet.create({
    headerContainer: {
        height: UI_CONSTANTS.HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: UI_CONSTANTS.HORIZONTAL_PADDING,
        justifyContent: 'space-between',
    },
    primaryActionBtn: {
        width: UI_CONSTANTS.BUTTON_SIZE,
        height: UI_CONSTANTS.BUTTON_SIZE,
        borderRadius: UI_CONSTANTS.BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A5D4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryActionBtn: {
        width: UI_CONSTANTS.BUTTON_SIZE,
        height: UI_CONSTANTS.BUTTON_SIZE,
        borderRadius: UI_CONSTANTS.BUTTON_SIZE / 2,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(74,93,78,0.05)',
    },
    headerRightGroup: {
        flexDirection: 'row',
        gap: UI_CONSTANTS.GAP_MEDIUM,
    }
});
