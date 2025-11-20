import { betterAuth, type Auth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@super-invite/db";

export const auth: Auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
			secure: process.env.NODE_ENV === 'production',
			httpOnly: false,
			path: "/",
			domain: process.env.COOKIE_DOMAIN,
		},
	},
});
