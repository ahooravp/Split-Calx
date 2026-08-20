import { motion } from "motion/react";
import { FiMoon, FiSun } from "react-icons/fi";

// 1. Scaled down: text-xs, gap-1.5, tighter padding (px-2.5 py-1.5)
const TOGGLE_CLASSES = "text-xs font-bold flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 transition-colors duration-300 relative z-10 cursor-pointer";

export default function ThemeToggle({ theme, setTheme }) {
  return (
    // 2. Scaled down: outer padding reduced from p-1 to p-0.5
    <div className="relative flex w-fit items-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300/50 dark:border-slate-700/50 p-0.5 transition-[background-color,border-color,box-shadow] duration-300 ease-in-out shadow-inner">

      <button
        className={`${TOGGLE_CLASSES} ${theme === "light" ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        onClick={() => setTheme("light")}
      >
        {/* 3. Scaled down: fixed icon size to text-sm */}
        <FiSun className="relative z-10 text-sm" />
        <span className="relative z-10 hidden sm:block">Light</span>
      </button>

      <button
        className={`${TOGGLE_CLASSES} ${theme === "dark" ? "text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        onClick={() => setTheme("dark")}
      >
        <FiMoon className="relative z-10 text-sm" />
        <span className="relative z-10 hidden sm:block">Dark</span>
      </button>

      {/* 4. Scaled down: inset changed from inset-1 to inset-0.5 to match outer padding */}
      <div
        className={`absolute inset-0.5 z-0 flex ${theme === "dark" ? "justify-end" : "justify-start"
          }`}
      >
        <motion.span
          layout
          layoutDependency={theme}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }} className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 shadow-sm"
        />
      </div>
    </div>
  );
}