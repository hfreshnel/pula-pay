import Animated from "react-native-reanimated";

export default function LoadingSpinner({ message = "Loading..." }) {
    return (
        <Animated.View
            style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
            }}
        >
            <Animated.Text
                style={{
                    fontSize: 18,
                    fontWeight: "500",
                }}
            >
                {message}
            </Animated.Text>
        </Animated.View>
    )
}