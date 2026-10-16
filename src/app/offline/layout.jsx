export const metadata = {
  title: "ऑफ़लाइन मोड (Offline Mode) - QuizWeb",
  description: "आप वर्तमान में ऑफ़लाइन हैं। कनेक्शन पुनः स्थापित होते ही आपका डेटा स्वचालित रूप से सिंक हो जाएगा।",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({ children }) {
  return children;
}
