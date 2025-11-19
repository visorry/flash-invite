import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@super-invite/db";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: process.env.CORS_ORIGINS 
		? process.env.CORS_ORIGINS.split(',').filter(Boolean)
		: ["http://localhost:3001", "http://localhost:3000"],
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			isAdmin: {
				type: "boolean",
				defaultValue: false,
				input: false, // Don't allow setting via registration
			},
		},
	},
});
