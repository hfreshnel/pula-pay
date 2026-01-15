import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userService from "../../services/userService.js";
import { UnauthorizedError, ConflictError, BadRequestError, InternalError } from "../../errors/AppErrors.js";

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

export async function registerUser(phone: string, password: string) {
    const existingUser = await userService.getUserByPhone(phone);
    if (existingUser) {
        throw new ConflictError("Phone number already registered", "USER_EXISTS");
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await userService.createUser(phone, hashed);

    // Generate OTP
    const otp = process.env.NODE_ENV === "production"
        ? crypto.randomInt(100000, 999999).toString() // Secure random in prod
        : "000000";

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    //TODO: HASH OTP before storing for better security
    await userService.addOtp(user.id, otp, otpExpiresAt);

    return user;
}

export async function verifyUser(phone: string, otp: string) {
    const user = await userService.getUserByPhone(phone);
    if (!user || !user.otpCode || !user.otpExpiresAt) {
        throw new UnauthorizedError("Verification failed");
    }

    if (user.isVerified) {
        throw new BadRequestError("User already verified", "ALREADY_VERIFIED");
    }

    // Check OTP expiration
    if (new Date() > user.otpExpiresAt) {
        throw new UnauthorizedError("OTP expired", "OTP_EXPIRED");
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(user.otpCode || "", otp)) {
        throw new UnauthorizedError("Verification failed", "VERIFICATION_FAILED");
    }

    await userService.verifiedUser(user.id);
}

export async function loginUser(phone: string, password: string) {
    const user = await userService.getUserByPhone(phone);
    
    if (!user || !user.isVerified || !user.passwordHash) {
        throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(password, user.passwordHash!);
    if (!ok) {
        // TO DO
        // Add delay to mitigate brute force (optional, but recommended)
        // Ex: await new Promise(r => setTimeout(r, 500));
        throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new InternalError("JWT secret is not configured");
    }

    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "1d" });
    return token;
}