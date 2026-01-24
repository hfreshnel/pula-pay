import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react-native';
import { useTheme } from '@/src/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onDismiss: (id: string) => void;
}

const TOAST_ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

export function Toast({ id, type, message, duration = 4000, onDismiss }: ToastProps) {
    const theme = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        // Fade in animation
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss after duration
        const timer = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss(id);
        });
    };

    const Icon = TOAST_ICONS[type];

    const backgroundColor = {
        success: theme.colors.success || '#10b981',
        error: theme.colors.danger,
        warning: '#f59e0b',
        info: theme.colors.primary,
    }[type];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor,
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Icon size={20} color="#fff" />
            <Text style={styles.message} numberOfLines={3}>
                {message}
            </Text>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                <X size={18} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        gap: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
    },
});
