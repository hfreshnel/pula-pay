import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '@/src/store/toastStore';
import { Toast } from './toast';

export function ToastContainer() {
    const { toasts, dismissToast } = useToastStore();
    const insets = useSafeAreaInsets();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    message={toast.message}
                    duration={toast.duration}
                    onDismiss={dismissToast}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 9999,
    },
});
