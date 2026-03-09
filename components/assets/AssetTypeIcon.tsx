"use client";

import { Bot, MessageSquare, Cpu, Database, Layout, Wrench, GitBranch } from "lucide-react";

const ASSET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MODEL: Cpu,
  PROMPT: MessageSquare,
  AGENT: Bot,
  DATASET: Database,
  APPLICATION: Layout,
  TOOL: Wrench,
  PIPELINE: GitBranch
};

type Props = { type: string };

export function AssetTypeIcon({ type }: Props) {
  const Icon = ASSET_ICONS[type] ?? Bot;
  return <Icon className="h-4 w-4 text-slatePro-400" />;
}
