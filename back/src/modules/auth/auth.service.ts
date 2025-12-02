import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userService from "../../services/userService.js";

export async function registerUser(phone: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await userService.createUser(phone, hashed);

    const otp = process.env.NODE_ENV === "production"
        ? "000000"
        : Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await userService.addOtp(phone, otp, otpExpiresAt);

    console.log(`OTP pour ${phone}: ${otp}`); // TODO: envoyer SMS
    return user;
};

export async function verifyUser(phone: string, otp: string) {
    const user = await userService.getUserByPhone(phone);
    if (!user) throw new Error("Unknown user");

    if (user.isVerified) throw new Error("Already verified");

    if (new Date() > user.otpExpiresAt!) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await userService.addOtp(phone, newOtp, otpExpiresAt);
        console.log(`OTP pour ${phone}: ${newOtp}`);
        throw new Error("OTP code expired, a new one will be sent");
    }

    if (user.otpCode !== otp) throw new Error("Wrong or expired OPT code");

    await userService.verifiedUser(phone);
}

export async function loginUser(phone: string, password: string) {
    const user = await userService.getUserByPhone(phone);
    if (!user) throw new Error("Unknown user");
    if (!user.isVerified) throw new Error("Non verified user");

    const ok = await bcrypt.compare(password, user.passwordHash!);
    if (!ok) throw new Error("Wrong password");

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    return token;
}