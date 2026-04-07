import React from 'react';
import QuizPlayer from '@/engine/players/QuizPlayer';

/* 
 * ComponentMapper: The "Brain" of the Session-Agnostic Engine.
 * This is where we map a SessionType to its actual content player. 
 */

const ExamPlayer = () => <div className="p-8 text-center bg-white rounded-3xl shadow-xl">📝 Exam Mode Active</div>;
const InteractiveRoadmap = () => <div className="p-8 text-center bg-white rounded-3xl shadow-xl">🧭 Roadmap Sync Active</div>;

export const COMPONENT_MAPPER = {
  'QUIZ': QuizPlayer,
  'MOCK_TEST': ExamPlayer,
  'ROADMAP': InteractiveRoadmap,
};

export function getPlayerComponent(type) {
  return COMPONENT_MAPPER[type] || null;
}
