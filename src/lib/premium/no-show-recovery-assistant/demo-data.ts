import { noShowPaths } from "@/src/lib/i18n/locale";
import { noShowCopy } from "./copy";

export const DEMO_PATH = noShowPaths(null).demo;
export const KIT_PATH = noShowPaths(null).kit;

const english = noShowCopy("en");

export const FICTIONAL_DATA_NOTICE = english.fictionalNotice;
export const SAMPLE_BOOKINGS_CSV = english.sampleBookingsCsv;
export const RECOVERY_LOG_CSV = english.recoveryLogCsv;
