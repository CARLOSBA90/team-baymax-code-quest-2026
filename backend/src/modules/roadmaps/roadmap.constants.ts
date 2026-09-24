export enum RoadmapStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export enum RoadmapGoalType {
  PROFESSIONAL = 'PROFESSIONAL',
  PROJECT = 'PROJECT',
  SKILL = 'SKILL',
}

export enum DeclaredLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum RoadmapGeneratorProvider {
  RULES = 'RULES',
  NVIDIA = 'NVIDIA',
}

export enum RoadmapGenerationType {
  AI = 'AI',
  DETERMINISTIC = 'DETERMINISTIC',
  UNKNOWN = 'UNKNOWN',
}

export enum RoadmapGenerationMode {
  AUTO = 'AUTO',
  AI = 'AI',
  DETERMINISTIC = 'DETERMINISTIC',
}

export enum PublicCourseLevel {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
}

export const ROADMAP_RULES_VERSION = 'rules-courses-v1';
export const NVIDIA_DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const NVIDIA_DEFAULT_TIMEOUT_MS = 10_000;
export const NVIDIA_TEMPERATURE = 0.1;
export const NVIDIA_MAX_TOKENS = 2_048;
export const ROADMAP_SNAPSHOT_VERSION = 4;
export const ROADMAP_MAX_ITEMS = 50;

export const PROGRESS_MIN_PERCENTAGE = 0;
export const PROGRESS_MAX_PERCENTAGE = 100;
export const INITIAL_VERSION = 0;
export const VERSION_INCREMENT = 1;
export const EMPTY_COLLECTION_SIZE = 0;
export const FIRST_COLLECTION_INDEX = 0;
export const FIRST_ITEM_ORDER = 1;
export const MIN_SKILL_WEIGHT = 0;

export const DEFAULT_PAGE = 1;
export const MIN_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;

export const MIN_WEEKLY_HOURS = 0.01;
export const MAX_WEEKLY_HOURS = 168;
export const LOW_WEEKLY_HOURS_LIMIT = 4;
export const MEDIUM_WEEKLY_HOURS_LIMIT = 7;
export const LOW_RESOURCE_BUDGET = 3;
export const DEFAULT_RESOURCE_BUDGET = 5;
export const HIGH_RESOURCE_BUDGET = 8;

export const MIN_GOAL_DESCRIPTION_LENGTH = 10;
export const MAX_GOAL_DESCRIPTION_LENGTH = 1000;
export const MIN_TITLE_LENGTH = 1;
export const MAX_TITLE_LENGTH = 120;
export const MIN_IDENTIFIER_LENGTH = 1;
export const HOURS_TO_MINUTES = 60;
export const MAX_DECIMAL_PLACES = 2;
export const UNIQUE_MATCH_COUNT = 1;
