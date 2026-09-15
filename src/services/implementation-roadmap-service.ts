export type RoadmapPhase = 'Foundation' | 'HR Core' | 'HR Advanced' | 'PRO Core' | 'PRO Advanced' | 'Polish';
export type RoadmapSprintStatus = 'Planned' | 'In Progress' | 'Implemented' | 'Validation';

export type ImplementationRoadmapSprint = {
  phaseNumber: number;
  phase: RoadmapPhase;
  sprint: number;
  title: string;
  deliverables: string;
  weeks: string;
  module: 'Foundation' | 'HR' | 'PRO' | 'Platform';
  status: RoadmapSprintStatus;
};

export const implementationRoadmap: ImplementationRoadmapSprint[] = [
  {
    phaseNumber: 1,
    phase: 'Foundation',
    sprint: 1,
    title: 'Auth, RBAC, schema and storage foundation',
    deliverables: 'Auth system, RBAC, user management, DB schema setup, file storage config',
    weeks: '1-2',
    module: 'Foundation',
    status: 'Implemented',
  },
  {
    phaseNumber: 1,
    phase: 'Foundation',
    sprint: 2,
    title: 'Employee data foundation',
    deliverables: 'Employee Data Sheet — full CRUD, document upload, profile photo',
    weeks: '2-3',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 2,
    phase: 'HR Core',
    sprint: 3,
    title: 'Attendance management',
    deliverables: 'Attendance module — manual mark, bulk import, monthly summary',
    weeks: '3-4',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 2,
    phase: 'HR Core',
    sprint: 4,
    title: 'Leave management',
    deliverables: 'Leave management — all leave types, approval flow, balance tracking',
    weeks: '4-5',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 2,
    phase: 'HR Core',
    sprint: 5,
    title: 'Payroll and payslips',
    deliverables: 'Payroll engine — calculations, payslip PDF generation',
    weeks: '5-6',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 3,
    phase: 'HR Advanced',
    sprint: 6,
    title: 'EOSB and WPS generation',
    deliverables: 'EOSB calculator, WPS SIF file generation',
    weeks: '6-7',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 3,
    phase: 'HR Advanced',
    sprint: 7,
    title: 'Exit workflow and letters',
    deliverables: 'Exit checklist, relieving + experience letter generation',
    weeks: '7-8',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 3,
    phase: 'HR Advanced',
    sprint: 8,
    title: 'Exit feedback and attrition',
    deliverables: 'Exit interview form, attrition dashboard',
    weeks: '8-9',
    module: 'HR',
    status: 'Implemented',
  },
  {
    phaseNumber: 4,
    phase: 'PRO Core',
    sprint: 9,
    title: 'Company documents',
    deliverables: 'Company documents — full CRUD, expiry tracking, file storage',
    weeks: '9-10',
    module: 'PRO',
    status: 'Implemented',
  },
  {
    phaseNumber: 4,
    phase: 'PRO Core',
    sprint: 10,
    title: 'Employee immigration',
    deliverables: 'Employee immigration records, labour list view',
    weeks: '10-11',
    module: 'PRO',
    status: 'Implemented',
  },
  {
    phaseNumber: 4,
    phase: 'PRO Core',
    sprint: 11,
    title: 'Insurance and reminders',
    deliverables: 'Insurance records, renewal reminder engine (cron)',
    weeks: '11-12',
    module: 'PRO',
    status: 'Implemented',
  },
  {
    phaseNumber: 5,
    phase: 'PRO Advanced',
    sprint: 12,
    title: 'GCC branches and owners',
    deliverables: 'GCC branch documents, owners database (restricted)',
    weeks: '12-13',
    module: 'PRO',
    status: 'Implemented',
  },
  {
    phaseNumber: 5,
    phase: 'PRO Advanced',
    sprint: 13,
    title: 'Renewal dashboard and notifications',
    deliverables: 'Renewal dashboard (color-coded), notification system (email+SMS)',
    weeks: '13-14',
    module: 'PRO',
    status: 'Implemented',
  },
  {
    phaseNumber: 6,
    phase: 'Polish',
    sprint: 14,
    title: 'Self-service and E2E',
    deliverables: 'Self-service portal, mobile-responsive UI, end-to-end testing',
    weeks: '14-15',
    module: 'Platform',
    status: 'Validation',
  },
  {
    phaseNumber: 6,
    phase: 'Polish',
    sprint: 15,
    title: 'Performance, audit and deployment',
    deliverables: 'Performance tuning, security audit, UAT, deployment',
    weeks: '15-16',
    module: 'Platform',
    status: 'Planned',
  },
];

export class ImplementationRoadmapService {
  static getRoadmap() {
    const phases = Array.from(new Set(implementationRoadmap.map((item) => item.phaseNumber)))
      .map((phaseNumber) => {
        const sprints = implementationRoadmap.filter((item) => item.phaseNumber === phaseNumber);
        return {
          phaseNumber,
          phase: sprints[0]?.phase,
          weeks: `${sprints[0]?.weeks.split('-')[0]}-${sprints[sprints.length - 1]?.weeks.split('-')[1]}`,
          sprints,
        };
      });

    return {
      sprints: implementationRoadmap,
      phases,
      summary: {
        totalSprints: implementationRoadmap.length,
        implemented: implementationRoadmap.filter((item) => item.status === 'Implemented').length,
        validation: implementationRoadmap.filter((item) => item.status === 'Validation').length,
        planned: implementationRoadmap.filter((item) => item.status === 'Planned').length,
        totalWeeks: 16,
      },
    };
  }
}
