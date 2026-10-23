import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vn.fa26se119.ccv',
  appName: 'CCV',
  webDir: 'dist',
  backgroundColor: '#f3f4f0',
  plugins: {
    // Giữ nội dung dưới thanh trạng thái và thanh điều hướng của Android.
    SystemBars: {
      insetsHandling: 'native',
    },
  },
};

export default config;
