/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hide the Next.js dev-mode indicator badge (the small "N" that only ever
  // shows during `next dev` — it never appears in a production/deployed build).
  devIndicators: false,
  // Remote images (event posters, transit agency logos) come from many hosts we
  // don't control, so we don't run them through the Next image optimizer.
  images: { unoptimized: true },
  // The project lives inside OneDrive, whose sync locks build-cache files
  // mid-write and corrupts them ("Access is denied"). OneDrive never syncs
  // anything under node_modules, so the build output hides there.
  distDir: "node_modules/.cache/next-dist",
};

export default nextConfig;
