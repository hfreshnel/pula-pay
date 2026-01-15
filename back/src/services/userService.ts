import { prisma } from "./client.js";

const userService = {
  getUserByPhone: async function (phone: string) {
    return await prisma.appUser.findUnique({ where: { phone } });
  },
  
  getUserById: async function (id: string) {
    return await prisma.appUser.findUnique({ where: { id } });
  },

  createUser: async function (phone: string, password: string) {
    return await prisma.appUser.create({
      data: {
        phone: phone,
        passwordHash: password
      }
    });
  },

  addOtp: async function (userId: string, otpCode: string, otpExpiresAt: Date) {
    return await prisma.appUser.update({
      where: { id: userId },
      data: { otpCode, otpExpiresAt }
    });
  },

  verifiedUser: async function (userId: string) {
    return await prisma.appUser.update({
      where: { id: userId },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null}
    });
  }
};

export default userService;