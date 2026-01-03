import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	typescript: {
		ignoreBuildErrors: true,
	},
	output: 'standalone', // For production deployments
};

export default nextConfig;
