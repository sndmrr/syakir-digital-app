import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Sun, Moon, Sunset, Coffee, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeGreetingProps {
  userName: string;
}

const motivationalMessages = [
  { text: "Target harian menanti, ayo capai!", emoji: "🎯" },
  { text: "Semangat jualan hari ini!", emoji: "💪" },
  { text: "Satu langkah lagi menuju target!", emoji: "🚀" },
  { text: "Pelanggan puas, rezeki berlimpah!", emoji: "⭐" },
  { text: "Konsistensi adalah kunci sukses!", emoji: "🔑" },
  { text: "Hari ini lebih baik dari kemarin!", emoji: "📈" },
  { text: "Fokus, disiplin, dan sukses!", emoji: "💎" },
  { text: "Layanan terbaik untuk pelanggan!", emoji: "🏆" },
];

const getRandomMotivation = () => {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return { greeting: "Selamat Pagi", emoji: "☀️", icon: Coffee, color: "from-blue-600 via-blue-500 to-cyan-500" };
  } else if (hour >= 11 && hour < 15) {
    return { greeting: "Selamat Siang", emoji: "🌤️", icon: Sun, color: "from-sky-600 via-blue-500 to-indigo-500" };
  } else if (hour >= 15 && hour < 18) {
    return { greeting: "Selamat Sore", emoji: "🌅", icon: Sunset, color: "from-indigo-600 via-blue-500 to-cyan-600" };
  } else {
    return { greeting: "Selamat Malam", emoji: "🌙", icon: Moon, color: "from-slate-700 via-blue-800 to-indigo-900" };
  }
};

const WelcomeGreeting = ({ userName }: WelcomeGreetingProps) => {
  const [motivation] = useState(() => getRandomMotivation());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeData = getTimeGreeting();
  const TimeIcon = timeData.icon;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-2 sm:mb-4">
      <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r ${timeData.color} p-[1px] shadow-lg`}>
        <div className={`relative bg-gradient-to-br ${timeData.color} rounded-[11px] sm:rounded-[15px] px-3 py-2 sm:px-6 sm:py-4 overflow-hidden`}>
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-10 -right-10 w-20 h-20 sm:w-24 sm:h-24 bg-white/15 rounded-full blur-xl" />

          <div className="relative z-10 flex flex-col gap-1.5 sm:gap-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="bg-white/15 backdrop-blur-sm rounded-full p-2 sm:p-3 shrink-0">
                  <TimeIcon className="w-5 h-5 sm:w-8 sm:h-8 text-white drop-shadow-md" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-white/80 text-[10px] sm:text-sm font-medium">{timeData.emoji} {timeData.greeting}</p>
                  <h2 className="text-sm sm:text-xl md:text-2xl font-bold text-white drop-shadow-md truncate">{userName} 👋</h2>
                </div>
              </div>

              <Button onClick={handleRefresh} size="sm" className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 shrink-0">
                <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.5, ease: "easeInOut" }}>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.div>
              </Button>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 py-1 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-200 shrink-0" />
              <p className="text-white/85 text-[9px] sm:text-sm truncate">{motivation.emoji} {motivation.text}</p>
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-200 shrink-0" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeGreeting;
