export interface VolunteerGroupConfig {
  id: string;
  name: string;
  gujaratiName: string;
  groupLetter: 'A' | 'B' | 'C';
  groupLeaderName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dateRangeDisplay: string;
  colorScheme: {
    border: string;
    bg: string;
    selectedBg: string;
    text: string;
    badge: string;
  };
}

export const VOLUNTEER_GROUPS: VolunteerGroupConfig[] = [
  {
    id: 'group_a',
    name: 'Group - A (Group Keshav)',
    gujaratiName: 'ગ્રુપ - A (ગ્રુપ કેશવ)',
    groupLetter: 'A',
    groupLeaderName: 'કેશવ',
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    dateRangeDisplay: '10/11/2026 થી 20/11/2026',
    colorScheme: {
      border: 'border-blue-400',
      bg: 'bg-blue-50/40',
      selectedBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-600 ring-2 ring-blue-500/30',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    },
  },
  {
    id: 'group_b',
    name: 'Group - B (Group Mahant)',
    gujaratiName: 'ગ્રુપ - B (ગ્રુપ મહંત)',
    groupLetter: 'B',
    groupLeaderName: 'મહંત',
    startDate: '2026-11-10',
    endDate: '2026-11-30',
    dateRangeDisplay: '10/11/2026 થી 30/11/2026',
    colorScheme: {
      border: 'border-amber-400',
      bg: 'bg-amber-50/40',
      selectedBg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-600 ring-2 ring-amber-500/30',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  },
  {
    id: 'group_c',
    name: 'Group - C (Group Pramukh)',
    gujaratiName: 'ગ્રુપ - C (ગ્રુપ પ્રમુખ)',
    groupLetter: 'C',
    groupLeaderName: 'પ્રમુખ',
    startDate: '2026-11-20',
    endDate: '2026-11-30',
    dateRangeDisplay: '20/11/2026 થી 30/11/2026',
    colorScheme: {
      border: 'border-emerald-400',
      bg: 'bg-emerald-50/40',
      selectedBg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-600 ring-2 ring-emerald-500/30',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  },
];
