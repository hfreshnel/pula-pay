import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userService from "../../services/userService.js";
import { AppError } from "../../errors/AppErrors.js";

// Input validation helpers
function validatePhone(phone: string): boolean {
    // Accept phone format: digits only, 7-15 chars, optionally with leading +
    const phoneRegex = /^\+?\d{7,15}$/;
    return phoneRegex.test(phone);
}

function validatePassword(password: string): boolean {
    // Minimum 8 chars, at least one number, one uppercase, one lowercase
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
}

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
    if (!validatePhone(phone)) {
        throw new AppError("Invalid phone number format", 400, "INVALID_PHONE");
    }
    if (!validatePassword(password)) {
        throw new AppError("Password must be at least 8 characters with uppercase, lowercase, and numbers", 400, "WEAK_PASSWORD");
    }

    const existingUser = await userService.getUserByPhone(phone);
    if (existingUser) {
        throw new AppError("Phone number already registered", 409, "USER_EXISTS");
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await userService.createUser(phone, hashed);

    // Generate OTP
    const otp = process.env.NODE_ENV === "production"
        ? crypto.randomInt(100000, 999999).toString() // Secure random in prod
        : "000000";

    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await userService.addOtp(phone, otp, otpExpiresAt);

    if (process.env.NODE_ENV !== "production") {
        console.log(`DEV MODE: OTP pour ${phone}: ${otp}`); 
    }

    return user;
}

export async function verifyUser(phone: string, otp: string) {
    if (!validatePhone(phone)) {
        throw new AppError("Invalid phone number format", 400, "INVALID_PHONE");
    }
    if (!/^\d{6}$/.test(otp)) {
        throw new AppError("Invalid OTP format", 400, "INVALID_OTP");
    }

    const user = await userService.getUserByPhone(phone);
    if (!user) {
        throw new AppError("Verification failed", 401, "VERIFICATION_FAILED");
    }

    if (user.isVerified) {
        throw new AppError("User already verified", 400, "ALREADY_VERIFIED");
    }

    // Check OTP expiration
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        throw new AppError("OTP expired. Request a new one.", 401, "OTP_EXPIRED");
    }

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeCompare(user.otpCode || "", otp)) {
        throw new AppError("Verification failed", 401, "VERIFICATION_FAILED");
    }

    await userService.verifiedUser(phone);
}

export async function loginUser(phone: string, password: string) {
    if (!validatePhone(phone)) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }
    if (!password || password.length === 0) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const user = await userService.getUserByPhone(phone);
    
    if (!user || !user.isVerified) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(password, user.passwordHash!);
    if (!ok) {
        // TO DO
        // Add delay to mitigate brute force (optional, but recommended)
        // Ex: await new Promise(r => setTimeout(r, 500));
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    return token;
}