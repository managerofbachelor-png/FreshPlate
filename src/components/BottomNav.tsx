import React from 'react';
import { motion } from 'motion/react';
import { Home, CalendarDays, Wallet, Dumbbell, User } from 'lucide-react';
import { TabId } from '../types';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  plannedCount: number;
}

const TABS: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, plannedCount }) => {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-lg"
    >
      <div className="rounded-[28px] bg-white/95 px-2 py-1.5 shadow-[0_12px_32px_rgba(28,43,26,0.14)] flex items-center justify-between gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-[22px] px-3 py-2.5 min-h-[44px] transition-colors whitespace-nowrap shrink-0 ${
                isActive ? 'text-white flex-[1.35]' : 'text-[#7A8A76] hover:text-[#1C2B1A] flex-1'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              {isActive && (
                <motion.span
                  layoutId="activeNavPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-[22px] bg-[#7CB342] shadow-[0_4px_12px_rgba(124,179,66,0.38)]"
                />
              )}
              <motion.span
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: 0.18 }}
                className="relative z-10 flex items-center gap-1.5"
              >
                <Icon className="h-[19px] w-[19px] stroke-[2.1]" />
                {isActive && (
                  <span className="font-display text-xs font-bold tracking-tight">{tab.label}</span>
                )}
              </motion.span>
              {tab.id === 'planner' && !isActive && plannedCount > 0 && (
                <span className="relative z-10 text-[10px] font-bold text-[#7CB342] tabular-nums">
                  {plannedCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
