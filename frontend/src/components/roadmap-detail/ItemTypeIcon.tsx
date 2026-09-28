import type { ComponentType } from "react";
import type { RoadmapItemType } from "@/types";
import {
  CourseIcon,
  DocumentIcon,
  FlagIcon,
  GenericItemIcon,
  type RoadmapDetailIconProps,
} from "./RoadmapDetailIcons";

export interface ItemTypeIconProps {
  type: RoadmapItemType;
  className?: string;
}

const ICONS: Record<string, ComponentType<RoadmapDetailIconProps>> = {
  COURSE: CourseIcon,
  MEDIA: DocumentIcon,
  CHALLENGE: FlagIcon,
};

/** Icono decorativo del tipo de ítem; tipos desconocidos → icono genérico. */
export function ItemTypeIcon({ type, className }: ItemTypeIconProps) {
  const Icon = Object.hasOwn(ICONS, type) ? ICONS[type] : GenericItemIcon;
  return <Icon className={className} />;
}
