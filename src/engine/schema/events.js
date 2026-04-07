import { z } from 'zod';

/** 
 * Session Constants
 */
export const SessionType = z.enum(['QUIZ', 'MOCK_TEST', 'ROADMAP']);
export const SessionStatus = z.enum(['LOBBY', 'ACTIVE', 'FINISHED', 'TERMINATED']);
export const UserRole = z.enum(['HOST', 'GUEST']);

/**
 * JOIN_SESSION Event
 */
export const JoinSessionSchema = z.object({
  sessionId: z.string(),
  role: UserRole,
  userId: z.string(),
  userName: z.string(),
});

/**
 * HOST_ACTION Event
 */
export const HostActionSchema = z.object({
  action: z.enum([
    'START_SESSION', 
    'NAVIGATE_STEP', 
    'UPDATE_TIMER', 
    'PAUSE_SESSION', 
    'RESUME_SESSION', 
    'END_SESSION', 
    'TERMINATE'
  ]),
  timestamp: z.number(),
  payload: z.record(z.any()).default({}),
});

/**
 * SYNC_STATE / STATE_UPDATE Event
 */
export const SessionStateSchema = z.object({
  sessionId: z.string(),
  type: SessionType,
  status: SessionStatus,
  activeContentId: z.string(),
  currentStep: z.number().default(0),
  timerRelative: z.number().optional(), // Seconds remaining
  hostId: z.string(),
  lastActionTimestamp: z.number().optional(),
  participants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: UserRole,
    isReady: z.boolean().default(false),
  })),
});

/**
 * ERROR Event
 */
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  timestamp: z.number(),
});
