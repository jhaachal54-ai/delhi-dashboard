/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remote images (event posters, transit agency logos) come from many hosts we
  // don't control, so we don't run them through the Next image optimizer.
  images: { unoptimized: true },
};

export default nextConfig;
