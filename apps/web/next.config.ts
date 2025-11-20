import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactCompiler: false,
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	output: 'standalone', // For production deployments
};

export default nextConfig;
