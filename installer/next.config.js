/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable server-side features for SSH
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client'],
};

module.exports = nextConfig;
