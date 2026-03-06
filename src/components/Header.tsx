'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, LayoutDashboard, Tv, TrendingUp } from 'lucide-react';

interface HeaderProps {
  onNewTask: () => void;
}

export function Header({ onNewTask }: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-4 px-6 border-b border-[#2A2A3E] bg-[#0E0E14]">
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E91E8C] to-[#00D9FF] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#34D399] rounded-full border-2 border-[#0E0E14] pulse-dot" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Mission Control</h1>
            <p className="text-[10px] text-muted-foreground -mt-0.5">AIM Agent Dashboard</p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge className="bg-[#34D399]/20 text-[#34D399] border-[#34D399]/30 text-[10px]">
          <span className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1.5 pulse-dot" />
          Online
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/content">
          <Button
            variant="outline"
            className="border-[#2A2A3E] hover:border-[#E91E8C]/50 hover:bg-[#E91E8C]/10 gap-2"
          >
            <Tv className="h-4 w-4 text-[#E91E8C]" />
            Media Hub
          </Button>
        </Link>
        <Link href="/funnels">
          <Button
            variant="outline"
            className="border-[#2A2A3E] hover:border-[#34D399]/50 hover:bg-[#34D399]/10 gap-2"
          >
            <TrendingUp className="h-4 w-4 text-[#34D399]" />
            Funnels
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button
            variant="outline"
            className="border-[#2A2A3E] hover:border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 gap-2"
          >
            <LayoutDashboard className="h-4 w-4 text-[#00D9FF]" />
            CEO Dashboard
          </Button>
        </Link>
        <Button
          onClick={onNewTask}
          className="bg-[#E91E8C] hover:bg-[#C4187A] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>
    </header>
  );
}
