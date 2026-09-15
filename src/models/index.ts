import { sequelize } from '../lib/sequelize';

import { Appointments } from './Appointments';
import { BranchTarget } from './BranchTarget';
import { ClientStatus } from './ClientStatus';
import { CrmcAutoReassignmentRules } from './CrmcAutoReassignmentRules';
import { CrmcAutoReassignmentRuns } from './CrmcAutoReassignmentRuns';
import { CrmcForumLeads } from './CrmcForumLeads';
import { CrmcForumLeadsAssesments } from './CrmcForumLeadsAssesments';
import { CrmcForumLeadsAssesmentDesgn } from './CrmcForumLeadsAssesmentDesgn';
import { CrmcForumLeadsAssesmentEdu } from './CrmcForumLeadsAssesmentEdu';
import { CrmcForumLeadsContracts } from './CrmcForumLeadsContracts';
import { CrmcForumLeadsFee } from './CrmcForumLeadsFee';
import { CrmcForumLeadsObservations } from './CrmcForumLeadsObservations';
import { CrmcForumLeadsRemarks } from './CrmcForumLeadsRemarks';
import { Crm3partyPayment } from './Crm3partyPayment';
import { Crm3partyPaymentDet } from './Crm3partyPaymentDet';
import { CrmAccounts } from './CrmAccounts';
import { CrmAdditionalDocuments } from './CrmAdditionalDocuments';
import { CrmAssignmentRule } from './CrmAssignmentRule';
import { CrmAssignmentRuleState } from './CrmAssignmentRuleState';
import { CrmB2b } from './CrmB2b';
import { CrmB2bInvoices } from './CrmB2bInvoices';
import { CrmBatch } from './CrmBatch';
import { CrmBranch } from './CrmBranch';
import { CrmBranchAllocations } from './CrmBranchAllocations';
import { CrmBranchExchangeRateMap } from './CrmBranchExchangeRateMap';
import { CrmCallRequest } from './CrmCallRequest';
import { CrmCampaigns } from './CrmCampaigns';
import { CrmClients } from './CrmClients';
import { CrmClientConversations } from './CrmClientConversations';
import { CrmClientLogs } from './CrmClientLogs';
import { CrmContractFile } from './CrmContractFile';
import { CrmCounsilorAllocations } from './CrmCounsilorAllocations';
import { CrmCountriesTypeProgram } from './CrmCountriesTypeProgram';
import { CrmCountryProces } from './CrmCountryProces';
import { CrmCoaAccount } from './CrmCoaAccount';
import { CrmCurrency } from './CrmCurrency';
import { CrmExchangeRate } from './CrmExchangeRate';
import { CrmDepartment } from './CrmDepartment';
import { CrmEmailTemplates } from './CrmEmailTemplates';
import { CrmEmployee } from './CrmEmployee';
import { CrmEmployeeAttendance } from './CrmEmployeeAttendance';
import { CrmEmployeeMfa } from './CrmEmployeeMfa';
import { CrmEmployeeTarget } from './CrmEmployeeTarget';
import { CrmEmployer } from './CrmEmployer';
import { CrmEuropeCasesVerification } from './CrmEuropeCasesVerification';
import { CrmEvaluationReportDocuments } from './CrmEvaluationReportDocuments';
import { CrmEvaluationReports } from './CrmEvaluationReports';
import { CrmExpense } from './CrmExpense';
import { CrmFee } from './CrmFee';
import { CrmLeadRoundRobinState } from './CrmLeadRoundRobinState';
import { CrmLeaveHistory } from './CrmLeaveHistory';
import { CrmLeaveType } from './CrmLeaveType';
import { CrmLibrary } from './CrmLibrary';
import { CrmOfficialEmails } from './CrmOfficialEmails';
import { CrmClientChecklistStage } from './CrmClientChecklistStage';
import { CrmOperationAllocations } from './CrmOperationAllocations';
import { CrmOperationStageData } from './CrmOperationStageData';
import { CrmOpportunityComplianceApprovals } from './CrmOpportunityComplianceApprovals';
import { CrmOpsDocuments } from './CrmOpsDocuments';
import { CrmOpsAssignment } from './CrmOpsAssignment';
import { CrmcOpportunities } from './CrmcOpportunities';
import { CrmcOpportunityQuotations } from './CrmcOpportunityQuotations';
import { CrmcQuotationItems } from './CrmcQuotationItems';
import { CrmcOpportunityPayments } from './CrmcOpportunityPayments';
import { CrmcOpportunityDocuments } from './CrmcOpportunityDocuments';
import { CrmcOpportunityAgreements } from './CrmcOpportunityAgreements';
import { CrmcOpportunityActivities } from './CrmcOpportunityActivities';
import { CrmcDiscountApprovals } from './CrmcDiscountApprovals';
import { CrmcLeadReassignments } from './CrmcLeadReassignments';
import { CrmcNotifications } from './CrmcNotifications';
import { CrmcFollowUpReminders } from './CrmcFollowUpReminders';
import { CrmcMeetingSchedules } from './CrmcMeetingSchedules';
import { CrmPayHistory } from './CrmPayHistory';
import { CrmPermission } from './CrmPermission';
import { CrmProgramType } from './CrmProgramType';
import { CrmProspectDocuments } from './CrmProspectDocuments';
import { CrmProspectRemarks } from './CrmProspectRemarks';
import { CrmProspects } from './CrmProspects';
import { CrmRefunds } from './CrmRefunds';
import { CrmRegion } from './CrmRegion';
import { CrmRole } from './CrmRole';
import { CrmRolePermission } from './CrmRolePermission';
import { CrmService } from './CrmService';
import { CrmSource } from './CrmSource';
import { CrmTargetDates } from './CrmTargetDates';
import { CrmTask } from './CrmTask';
import { CrmTeams } from './CrmTeams';
import { CrmVendors } from './CrmVendors';
import { CrmVendorDocuments } from './CrmVendorDocuments';
import { CrmVendorInvoice } from './CrmVendorInvoice';
import { CrmWpCases } from './CrmWpCases';
import { ExpenseType } from './ExpenseType';
import { GaryWorkDocs } from './GaryWorkDocs';
import { Ielts } from './Ielts';
import { Qualification } from './Qualification';
import { StudentLeadsLogs } from './StudentLeadsLogs';
import { Target } from './Target';
import { TaskRemarks } from './TaskRemarks';

import {
  HrAttendanceRecord,
  HrEmployeeDocument,
  HrEmployeeLetter,
  HrEosbSettlement,
  HrExitChecklist,
  HrExitChecklistItem,
  HrExitInterview,
  HrHeadcountSnapshot,
  HrLeaveBalance,
  HrLeaveRequest,
  HrLetterTemplate,
  HrPayslip,
  NotificationLog,
  ProCompany,
  ProDocument,
  ProEmployeeImmigration,
  ProGccBranchDocument,
  ProInsuranceRecord,
  ProMonthlyTask,
  ProOwnerDocument,
  ProWpsRecord,
} from './HrProModels';
import { ItSupportTicket, ItSupportTicketComment } from './ItSupportModels';
import { CrmOpportunityWorkflowReview } from './CrmOpportunityWorkflowReview';
import { CrmOpportunityWorkflowAuditLog } from './CrmOpportunityWorkflowAuditLog';
import { CrmRemarks } from './CrmRemarks';
import { CrmOpportunityHandoverNote } from './CrmOpportunityHandoverNote';
import { CrmOpportunityAccountingVerification } from './CrmOpportunityAccountingVerification';
import { CrmClientUploadPortal } from './CrmClientUploadPortal';
import { CrmClientUploadChecklistItem } from './CrmClientUploadChecklistItem';
import { CrmOpportunityPaymentSchedule } from './CrmOpportunityPaymentSchedule';

const models = {
  Appointments: Appointments,
  BranchTarget: BranchTarget,
  ClientStatus: ClientStatus,
  CrmcAutoReassignmentRules: CrmcAutoReassignmentRules,
  CrmcAutoReassignmentRuns: CrmcAutoReassignmentRuns,
  CrmcForumLeads: CrmcForumLeads,
  CrmcForumLeadsAssesments: CrmcForumLeadsAssesments,
  CrmcForumLeadsAssesmentDesgn: CrmcForumLeadsAssesmentDesgn,
  CrmcForumLeadsAssesmentEdu: CrmcForumLeadsAssesmentEdu,
  CrmcForumLeadsContracts: CrmcForumLeadsContracts,
  CrmcForumLeadsFee: CrmcForumLeadsFee,
  CrmcForumLeadsObservations: CrmcForumLeadsObservations,
  CrmcForumLeadsRemarks: CrmcForumLeadsRemarks,
  Crm3partyPayment: Crm3partyPayment,
  Crm3partyPaymentDet: Crm3partyPaymentDet,
  CrmAccounts: CrmAccounts,
  CrmAdditionalDocuments: CrmAdditionalDocuments,
  CrmAssignmentRule: CrmAssignmentRule,
  CrmAssignmentRuleState: CrmAssignmentRuleState,
  CrmB2b: CrmB2b,
  CrmB2bInvoices: CrmB2bInvoices,
  CrmBatch: CrmBatch,
  CrmBranch: CrmBranch,
  CrmBranchAllocations: CrmBranchAllocations,
  CrmBranchExchangeRateMap: CrmBranchExchangeRateMap,
  CrmCallRequest: CrmCallRequest,
  CrmCampaigns: CrmCampaigns,
  CrmClients: CrmClients,
  CrmClientConversations: CrmClientConversations,
  CrmClientLogs: CrmClientLogs,
  CrmContractFile: CrmContractFile,
  CrmCounsilorAllocations: CrmCounsilorAllocations,
  CrmCountriesTypeProgram: CrmCountriesTypeProgram,
  CrmCountryProces: CrmCountryProces,
  CrmCoaAccount: CrmCoaAccount,
  CrmCurrency: CrmCurrency,
  CrmExchangeRate: CrmExchangeRate,
  CrmDepartment: CrmDepartment,
  CrmEmailTemplates: CrmEmailTemplates,
  CrmEmployee: CrmEmployee,
  CrmEmployeeAttendance: CrmEmployeeAttendance,
  CrmEmployeeMfa: CrmEmployeeMfa,
  CrmEmployeeTarget: CrmEmployeeTarget,
  CrmEmployer: CrmEmployer,
  CrmEuropeCasesVerification: CrmEuropeCasesVerification,
  CrmEvaluationReportDocuments: CrmEvaluationReportDocuments,
  CrmEvaluationReports: CrmEvaluationReports,
  CrmExpense: CrmExpense,
  CrmFee: CrmFee,
  CrmLeadRoundRobinState: CrmLeadRoundRobinState,
  CrmLeaveHistory: CrmLeaveHistory,
  CrmLeaveType: CrmLeaveType,
  CrmLibrary: CrmLibrary,
  CrmOfficialEmails: CrmOfficialEmails,
  CrmClientChecklistStage: CrmClientChecklistStage,
  CrmOperationAllocations: CrmOperationAllocations,
  CrmOperationStageData: CrmOperationStageData,
  CrmOpportunityComplianceApprovals: CrmOpportunityComplianceApprovals,
  CrmOpsDocuments: CrmOpsDocuments,
  CrmOpsAssignment: CrmOpsAssignment,
  CrmcOpportunities: CrmcOpportunities,
  CrmcOpportunityQuotations: CrmcOpportunityQuotations,
  CrmcQuotationItems: CrmcQuotationItems,
  CrmcOpportunityPayments: CrmcOpportunityPayments,
  CrmcOpportunityDocuments: CrmcOpportunityDocuments,
  CrmcOpportunityAgreements: CrmcOpportunityAgreements,
  CrmcOpportunityActivities: CrmcOpportunityActivities,
  CrmcDiscountApprovals: CrmcDiscountApprovals,
  CrmcLeadReassignments: CrmcLeadReassignments,
  CrmcNotifications: CrmcNotifications,
  CrmcFollowUpReminders: CrmcFollowUpReminders,
  CrmcMeetingSchedules: CrmcMeetingSchedules,
  CrmPayHistory: CrmPayHistory,
  CrmPermission: CrmPermission,
  CrmProgramType: CrmProgramType,
  CrmProspectDocuments: CrmProspectDocuments,
  CrmProspectRemarks: CrmProspectRemarks,
  CrmProspects: CrmProspects,
  CrmRefunds: CrmRefunds,
  CrmRegion: CrmRegion,
  CrmRole: CrmRole,
  CrmRolePermission: CrmRolePermission,
  CrmService: CrmService,
  CrmSource: CrmSource,
  CrmTargetDates: CrmTargetDates,
  CrmTask: CrmTask,
  CrmTeams: CrmTeams,
  CrmVendors: CrmVendors,
  CrmVendorDocuments: CrmVendorDocuments,
  CrmVendorInvoice: CrmVendorInvoice,
  CrmWpCases: CrmWpCases,
  ExpenseType: ExpenseType,
  GaryWorkDocs: GaryWorkDocs,
  Ielts: Ielts,
  Qualification: Qualification,
  StudentLeadsLogs: StudentLeadsLogs,
  Target: Target,
  TaskRemarks: TaskRemarks,
  HrAttendanceRecord,
  HrEmployeeDocument,
  HrEmployeeLetter,
  HrEosbSettlement,
  HrExitChecklist,
  HrExitChecklistItem,
  HrExitInterview,
  HrHeadcountSnapshot,
  HrLeaveBalance,
  HrLeaveRequest,
  HrLetterTemplate,
  HrPayslip,
  NotificationLog,
  ProCompany,
  ProDocument,
  ProEmployeeImmigration,
  ProGccBranchDocument,
  ProInsuranceRecord,
  ProMonthlyTask,
  ProOwnerDocument,
  ProWpsRecord,
  CrmOpportunityWorkflowReview,
  CrmOpportunityWorkflowAuditLog,
  CrmOpportunityHandoverNote,
  CrmOpportunityAccountingVerification,
  CrmClientUploadPortal,
  CrmClientUploadChecklistItem,
  CrmOpportunityPaymentSchedule,
  CrmRemarks,
};

type ModelWithAssociate = {
  associate?: (registeredModels: Record<string, unknown>) => void;
};

Object.values(models).forEach((model) => {
  const associableModel = model as ModelWithAssociate;
  if (associableModel.associate) {
    associableModel.associate(models);
  }
});

export { sequelize, models };
export { Appointments } from './Appointments';
export type { AppointmentsAttributes, AppointmentsCreationAttributes } from './Appointments';
export { BranchTarget } from './BranchTarget';
export { ClientStatus } from './ClientStatus';
export { CrmcAutoReassignmentRules } from './CrmcAutoReassignmentRules';
export type { CrmcAutoReassignmentRulesAttributes, CrmcAutoReassignmentRulesCreationAttributes } from './CrmcAutoReassignmentRules';
export { CrmcAutoReassignmentRuns } from './CrmcAutoReassignmentRuns';
export type { CrmcAutoReassignmentRunsAttributes, CrmcAutoReassignmentRunsCreationAttributes } from './CrmcAutoReassignmentRuns';
export { CrmcForumLeads } from './CrmcForumLeads';
export type { CrmcForumLeadsAttributes } from './CrmcForumLeads';
export { CrmcForumLeadsAssesments } from './CrmcForumLeadsAssesments';
export { CrmcForumLeadsAssesmentDesgn } from './CrmcForumLeadsAssesmentDesgn';
export { CrmcForumLeadsAssesmentEdu } from './CrmcForumLeadsAssesmentEdu';
export { CrmcForumLeadsContracts } from './CrmcForumLeadsContracts';
export type { CrmcForumLeadsContractsAttributes } from './CrmcForumLeadsContracts';
export { CrmcForumLeadsFee } from './CrmcForumLeadsFee';
export type { CrmcForumLeadsFeeAttributes } from './CrmcForumLeadsFee';
export { CrmcForumLeadsObservations } from './CrmcForumLeadsObservations';
export { CrmcForumLeadsRemarks } from './CrmcForumLeadsRemarks';
export { Crm3partyPayment } from './Crm3partyPayment';
export type { Crm3partyPaymentAttributes } from './Crm3partyPayment';
export { Crm3partyPaymentDet } from './Crm3partyPaymentDet';
export { CrmAccounts } from './CrmAccounts';
export type { CrmAccountsAttributes } from './CrmAccounts';
export { CrmAdditionalDocuments } from './CrmAdditionalDocuments';
export { CrmAssignmentRule } from './CrmAssignmentRule';
export type { CrmAssignmentRuleAttributes, CrmAssignmentRuleCreationAttributes } from './CrmAssignmentRule';
export { CrmAssignmentRuleState } from './CrmAssignmentRuleState';
export type { CrmAssignmentRuleStateAttributes, CrmAssignmentRuleStateCreationAttributes } from './CrmAssignmentRuleState';
export { CrmB2b } from './CrmB2b';
export type { CrmB2bAttributes } from './CrmB2b';
export { CrmB2bInvoices } from './CrmB2bInvoices';
export type { CrmB2bInvoicesAttributes } from './CrmB2bInvoices';
export { CrmBatch } from './CrmBatch';
export { CrmBranch } from './CrmBranch';
export type { CrmBranchAttributes } from './CrmBranch';
export { CrmBranchAllocations } from './CrmBranchAllocations';
export { CrmBranchExchangeRateMap } from './CrmBranchExchangeRateMap';
export type { CrmBranchExchangeRateMapAttributes } from './CrmBranchExchangeRateMap';
export { CrmCallRequest } from './CrmCallRequest';
export { CrmCampaigns } from './CrmCampaigns';
export type { CrmCampaignsAttributes } from './CrmCampaigns';
export { CrmClients } from './CrmClients';
export type { CrmClientsAttributes } from './CrmClients';
export { CrmClientConversations } from './CrmClientConversations';
export { CrmClientLogs } from './CrmClientLogs';
export { CrmContractFile } from './CrmContractFile';
export { CrmCounsilorAllocations } from './CrmCounsilorAllocations';
export { CrmCountriesTypeProgram } from './CrmCountriesTypeProgram';
export { CrmCountryProces } from './CrmCountryProces';
export { CrmCoaAccount } from './CrmCoaAccount';
export type { CrmCoaAccountAttributes } from './CrmCoaAccount';
export { CrmCurrency } from './CrmCurrency';
export { CrmExchangeRate } from './CrmExchangeRate';
export type { CrmExchangeRateAttributes } from './CrmExchangeRate';
export { CrmDepartment } from './CrmDepartment';
export type { CrmDepartmentAttributes, CrmDepartmentCreationAttributes } from './CrmDepartment';
export { CrmEmailTemplates } from './CrmEmailTemplates';
export { CrmEmployee } from './CrmEmployee';
export type { CrmEmployeeAttributes } from './CrmEmployee';
export { CrmEmployeeAttendance } from './CrmEmployeeAttendance';
export type { CrmEmployeeAttendanceAttributes } from './CrmEmployeeAttendance';
export { CrmEmployeeMfa } from './CrmEmployeeMfa';
export type { CrmEmployeeMfaAttributes, CrmEmployeeMfaCreationAttributes } from './CrmEmployeeMfa';
export { CrmEmployeeTarget } from './CrmEmployeeTarget';
export type { CrmEmployeeTargetAttributes, CrmEmployeeTargetCreationAttributes } from './CrmEmployeeTarget';
export { CrmEmployer } from './CrmEmployer';
export type { CrmEmployerAttributes, CrmEmployerCreationAttributes } from './CrmEmployer';
export { CrmEuropeCasesVerification } from './CrmEuropeCasesVerification';
export { CrmEvaluationReportDocuments } from './CrmEvaluationReportDocuments';
export { CrmEvaluationReports } from './CrmEvaluationReports';
export { CrmExpense } from './CrmExpense';
export { CrmFee } from './CrmFee';
export { CrmLeadRoundRobinState } from './CrmLeadRoundRobinState';
export type { CrmLeadRoundRobinStateAttributes, CrmLeadRoundRobinStateCreationAttributes } from './CrmLeadRoundRobinState';
export { CrmLeaveHistory } from './CrmLeaveHistory';
export { CrmLeaveType } from './CrmLeaveType';
export { CrmLibrary } from './CrmLibrary';
export { CrmOfficialEmails } from './CrmOfficialEmails';
export { CrmClientChecklistStage } from './CrmClientChecklistStage';
export type { CrmClientChecklistStageAttributes, CrmClientChecklistStageCreationAttributes } from './CrmClientChecklistStage';
export { CrmOperationAllocations } from './CrmOperationAllocations';
export { CrmOperationStageData } from './CrmOperationStageData';
export type { CrmOperationStageDataAttributes, CrmOperationStageDataCreationAttributes } from './CrmOperationStageData';
export { CrmOpportunityComplianceApprovals } from './CrmOpportunityComplianceApprovals';
export type { CrmOpportunityComplianceApprovalsAttributes, CrmOpportunityComplianceApprovalsCreationAttributes } from './CrmOpportunityComplianceApprovals';
export { CrmOpsDocuments } from './CrmOpsDocuments';
export { CrmOpsAssignment } from './CrmOpsAssignment';
export type { CrmOpsAssignmentAttributes, CrmOpsAssignmentCreationAttributes } from './CrmOpsAssignment';
export { CrmPayHistory } from './CrmPayHistory';
export { CrmPermission } from './CrmPermission';
export type { CrmPermissionAttributes, CrmPermissionCreationAttributes } from './CrmPermission';
export { CrmProgramType } from './CrmProgramType';
export { CrmProspectDocuments } from './CrmProspectDocuments';
export type { CrmProspectDocumentsAttributes, CrmProspectDocumentsCreationAttributes } from './CrmProspectDocuments';
export { CrmProspectRemarks } from './CrmProspectRemarks';
export type { CrmProspectRemarksAttributes, CrmProspectRemarksCreationAttributes } from './CrmProspectRemarks';
export { CrmProspects } from './CrmProspects';
export type { CrmProspectsAttributes, CrmProspectsCreationAttributes } from './CrmProspects';
export { CrmRefunds } from './CrmRefunds';
export { CrmRegion } from './CrmRegion';
export { CrmRole } from './CrmRole';
export { CrmRolePermission } from './CrmRolePermission';
export type { CrmRolePermissionAttributes, CrmRolePermissionCreationAttributes } from './CrmRolePermission';
export { CrmService } from './CrmService';
export type { CrmServiceAttributes, CrmServiceCreationAttributes } from './CrmService';
export { CrmSource } from './CrmSource';
export type { CrmSourceAttributes, CrmSourceCreationAttributes } from './CrmSource';
export { CrmTargetDates } from './CrmTargetDates';
export { CrmTask } from './CrmTask';
export { CrmTeams } from './CrmTeams';
export { CrmVendors } from './CrmVendors';
export { CrmVendorDocuments } from './CrmVendorDocuments';
export { CrmVendorInvoice } from './CrmVendorInvoice';
export { CrmWpCases } from './CrmWpCases';
export { ExpenseType } from './ExpenseType';
export { GaryWorkDocs } from './GaryWorkDocs';
export { Ielts } from './Ielts';
export { Qualification } from './Qualification';
export { StudentLeadsLogs } from './StudentLeadsLogs';
export { Target } from './Target';
export { TaskRemarks } from './TaskRemarks';


export { CrmcOpportunities } from './CrmcOpportunities';
export { CrmcOpportunityQuotations } from './CrmcOpportunityQuotations';
export { CrmcQuotationItems } from './CrmcQuotationItems';
export { CrmcOpportunityPayments } from './CrmcOpportunityPayments';
export { CrmcOpportunityDocuments } from './CrmcOpportunityDocuments';
export { CrmcOpportunityAgreements } from './CrmcOpportunityAgreements';
export { CrmcOpportunityActivities } from './CrmcOpportunityActivities';
export { CrmcNotifications } from './CrmcNotifications';
export { CrmcFollowUpReminders } from './CrmcFollowUpReminders';
export { CrmcMeetingSchedules } from './CrmcMeetingSchedules';
export { CrmcDiscountApprovals } from './CrmcDiscountApprovals';
export { CrmcLeadReassignments } from './CrmcLeadReassignments';
export {
  HrAttendanceRecord,
  HrEmployeeDocument,
  HrEmployeeLetter,
  HrEosbSettlement,
  HrExitChecklist,
  HrExitChecklistItem,
  HrExitInterview,
  HrHeadcountSnapshot,
  HrLeaveBalance,
  HrLeaveRequest,
  HrLetterTemplate,
  HrPayslip,
  NotificationLog,
  ProCompany,
  ProDocument,
  ProEmployeeImmigration,
  ProGccBranchDocument,
  ProInsuranceRecord,
  ProMonthlyTask,
  ProOwnerDocument,
  ProWpsRecord,
} from './HrProModels';
export { ItSupportTicket, ItSupportTicketComment } from './ItSupportModels';

// Legacy-friendly aliases used in older service layers
export { CrmcForumLeads as Lead } from './CrmcForumLeads';
export { CrmEmployee as Employee } from './CrmEmployee';
export { CrmBranch as Branch } from './CrmBranch';
export { CrmRegion as Region } from './CrmRegion';
export { CrmProgramType as Program } from './CrmProgramType';
export { CrmFee as Fee } from './CrmFee';
export { CrmCurrency as Currency } from './CrmCurrency';
export { CrmRole as Role } from './CrmRole';
export { CrmSource as MarketSource } from './CrmSource';

// CRM Process Flow models
export { CrmOpportunityWorkflowReview } from './CrmOpportunityWorkflowReview';
export type { CrmOpportunityWorkflowReviewAttributes } from './CrmOpportunityWorkflowReview';
export { CrmOpportunityWorkflowAuditLog } from './CrmOpportunityWorkflowAuditLog';
export type { CrmOpportunityWorkflowAuditLogAttributes } from './CrmOpportunityWorkflowAuditLog';
export { CrmOpportunityHandoverNote } from './CrmOpportunityHandoverNote';
export type { CrmOpportunityHandoverNoteAttributes } from './CrmOpportunityHandoverNote';
export { CrmOpportunityAccountingVerification } from './CrmOpportunityAccountingVerification';
export type { CrmOpportunityAccountingVerificationAttributes } from './CrmOpportunityAccountingVerification';
export { CrmClientUploadPortal } from './CrmClientUploadPortal';
export type { CrmClientUploadPortalAttributes } from './CrmClientUploadPortal';
export { CrmClientUploadChecklistItem } from './CrmClientUploadChecklistItem';
export type { CrmClientUploadChecklistItemAttributes } from './CrmClientUploadChecklistItem';
export { CrmOpportunityPaymentSchedule } from './CrmOpportunityPaymentSchedule';
export type { CrmOpportunityPaymentScheduleAttributes } from './CrmOpportunityPaymentSchedule';
export { CrmRemarks } from './CrmRemarks';
export type { CrmRemarksAttributes } from './CrmRemarks';
