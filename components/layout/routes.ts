import type { LucideIcon } from "lucide-react";
import {
  Home,
  Radio,
  AudioLines,
  Layers,
  Camera,
  Columns3,
  FolderOpen,
  BookOpen,
  Wrench,
  FileText,
} from "lucide-react";

export interface RouteDef {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Explore" | "Analyze" | "Library" | "Reference";
}

export const ROUTES: RouteDef[] = [
  { href: "/", label: "Home", icon: Home, group: "Overview" },
  { href: "/live", label: "Live Cymatics", icon: Radio, group: "Explore" },
  { href: "/audio", label: "Audio Laboratory", icon: AudioLines, group: "Explore" },
  { href: "/simulator", label: "Plate Simulator", icon: Layers, group: "Explore" },
  { href: "/physical", label: "Real Experiment Analyzer", icon: Camera, group: "Analyze" },
  { href: "/compare", label: "Compare Experiments", icon: Columns3, group: "Analyze" },
  { href: "/experiments", label: "Saved Experiments", icon: FolderOpen, group: "Library" },
  { href: "/learn", label: "Learn", icon: BookOpen, group: "Reference" },
  { href: "/hardware", label: "Hardware Guide", icon: Wrench, group: "Reference" },
  { href: "/methodology", label: "Methodology", icon: FileText, group: "Reference" },
];

export const MOBILE_PRIMARY_ROUTES = ["/live", "/audio", "/experiments"];

export const ROUTE_GROUPS: RouteDef["group"][] = ["Overview", "Explore", "Analyze", "Library", "Reference"];
