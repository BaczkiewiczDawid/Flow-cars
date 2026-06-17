/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    // Zdjęcia ogłoszeń pochodzą z domen OLX i Otomoto - dopuszczamy je do optymalizacji obrazów Next.js.
    remotePatterns: [
      { protocol: 'https', hostname: '**.olx.pl' },
      { protocol: 'https', hostname: '**.olxcdn.com' },
      { protocol: 'https', hostname: '**.otomoto.pl' },
      { protocol: 'https', hostname: '**.olcdn.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

module.exports = nextConfig;
