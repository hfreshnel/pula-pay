import PhoneNumberInput, { ICountry, PhoneInputProps as LibPhoneInputProps } from "react-native-international-phone-number";
import { useTheme } from "@/src/theme";

export type { ICountry };

type DefaultCountry = LibPhoneInputProps["defaultCountry"];

interface PhoneInputProps {
    value: string;
    onChangePhoneNumber?: (value: string) => void;
    onChangeSelectedCountry?: (country: ICountry) => void;
    defaultCountry?: DefaultCountry;
    disabled?: boolean;
}

export default function PhoneInput({
    value,
    onChangePhoneNumber,
    onChangeSelectedCountry,
    defaultCountry = "BJ",
    disabled = false,
}: PhoneInputProps) {
    const theme = useTheme();

    return (
        <PhoneNumberInput
            value={value}
            onChangePhoneNumber={onChangePhoneNumber}
            defaultCountry={defaultCountry}
            onChangeSelectedCountry={onChangeSelectedCountry}
            disabled={disabled}
            ref={null}
            theme={theme.mode === "dark" ? "dark" : "light"}
        />
    );
}
