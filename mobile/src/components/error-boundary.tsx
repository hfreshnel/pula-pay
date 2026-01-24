import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { logger } from "../utils/logger";

type State = {
    hasError: boolean;
    error: any | null;
    errorInfo: any | null;
    retryCount: number;
};

export default class ErrorBoundary extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error } as Partial<State>;
    }

    componentDidCatch(error: any, errorInfo: any) {
        // Save error details to state and log
        this.setState({ errorInfo });
        logger.error('APP', 'Unhandled error caught by ErrorBoundary', {
            error: error?.message ?? String(error),
            stack: error?.stack,
            componentStack: errorInfo?.componentStack,
        });
    }

    handleRetry = () => {
        // Increment retryCount and reset error state so children can attempt to render again
        this.setState((prev) => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prev.retryCount + 1,
        }));
    };

    renderFallback() {
        const { error, errorInfo, retryCount } = this.state;
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Une erreur s'est produite</Text>
                {error && <Text style={styles.message}>{String(error)}</Text>}
                {errorInfo && (
                    <Text style={styles.stack} numberOfLines={8} ellipsizeMode="tail">
                        {String(errorInfo.componentStack || errorInfo)}
                    </Text>
                )}

                <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                    <Text style={styles.buttonText}>Réessayer ({retryCount})</Text>
                </TouchableOpacity>
            </View>
        );
    }

    render() {
        if (this.state.hasError) {
            return this.renderFallback();
        }
        return this.props.children ?? null;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },
    message: {
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 8,
    },
    stack: {
        color: "#9ca3af",
        fontSize: 12,
        marginBottom: 16,
    },
    button: {
        backgroundColor: "#6366f1",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
    },
});