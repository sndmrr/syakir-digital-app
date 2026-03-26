import React from 'react';
import { LogOut, Menu, Signal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { motion } from 'framer-motion';

interface HeaderProps {
  onSignOut: () => void;
  showAdminMenu?: boolean;
  onAdminMenuClick?: () => void;
}

export const Header = ({ onSignOut, showAdminMenu, onAdminMenuClick }: HeaderProps) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-md border-2 border-blue-200 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/50"></div>
      <div className="absolute top-0 left-1/4 w-32 h-[2px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <AnimatedLogo size="md" />
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-lg opacity-20"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-black bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Syakir Digital
              </h1>
              <Signal className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
              Solusi Kebutuhan Digital Anda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {showAdminMenu && onAdminMenuClick && (
            <Button
              onClick={onAdminMenuClick}
              variant="ghost"
              size="sm"
              className="relative bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-xl transition-all duration-300 hover:scale-105 hover:border-blue-400"
            >
              <Menu className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Menu Admin</span>
            </Button>
          )}
          <Button
            onClick={onSignOut}
            variant="ghost"
            size="sm"
            className="relative bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 rounded-xl transition-all duration-300 hover:scale-105 hover:border-red-400"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
