import LoadingSpinner from "./ui/loading-spinner";
import { Suspense, ReactNode } from "react";
import ErrorBoundary from "./error-boundary";

interface SafeComponentProps {
    children: ReactNode;
    fallback?: ReactNode;
    loadingMessage?: string;
    errorMessage?: string;
}

export default function SafeComponent({
    children,
    fallback = null,
    loadingMessage = "Loading...",
    errorMessage = "An error occurred in this componant.",
}: SafeComponentProps) {
    return (
        <ErrorBoundary fallback={fallback}>
            <Suspense fallback={LoadingSpinner({ message: loadingMessage })}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}