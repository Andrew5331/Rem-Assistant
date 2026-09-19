import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SCHEDULE: '@rem/schedule',
  TASKS: '@rem/tasks',
  NOTES: '@rem/notes',
  MOOD: '@rem/mood',
  GOAL: '@rem/goal',
  CHAT: '@rem/chat',
};

async function getJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function setJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // no-op: almacenamiento no disponible
  }
}

export const Storage = {
  KEYS,
  getSchedule: () => getJSON(KEYS.SCHEDULE, DEFAULT_SCHEDULE),
  setSchedule: (v) => setJSON(KEYS.SCHEDULE, v),
  getTasks: () => getJSON(KEYS.TASKS, DEFAULT_TASKS),
  setTasks: (v) => setJSON(KEYS.TASKS, v),
  getNotes: () => getJSON(KEYS.NOTES, []),
  setNotes: (v) => setJSON(KEYS.NOTES, v),
  getMood: () => getJSON(KEYS.MOOD, 'Focused'),
  setMood: (v) => setJSON(KEYS.MOOD, v),
  getGoal: () => getJSON(KEYS.GOAL, 'Finish ML assignment before 6 PM'),
  setGoal: (v) => setJSON(KEYS.GOAL, v),
  getChat: () => getJSON(KEYS.CHAT, []),
  setChat: (v) => setJSON(KEYS.CHAT, v),
};

export const DEFAULT_SCHEDULE = [
  { id: '1', subject: 'Advanced Algorithms', code: 'CS-401', room: 'Room 402 (East Hall)', professor: 'Prof. Martinez', start: '09:00', end: '10:30' },
  { id: '2', subject: 'Distributed Systems Lab', code: 'LAB B4', room: 'Practical Simulation', professor: '', start: '11:00', end: '13:00' },
];

export const DEFAULT_TASKS = [
  { id: '1', title: 'Submit Machine Learning Assignment 3', due: 'Due Today 23:59', priority: 'High', done: false },
  { id: '2', title: 'Read Chapter 4: Neural Networks', due: 'Due Tomorrow', priority: 'Medium', done: false },
  { id: '3', title: 'Review Linear Algebra Quiz', due: 'Score 9.4/10', priority: 'Done', done: true },
];
