import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
import { CrmEmployee } from './CrmEmployee';
import { CrmcOpportunities } from './CrmcOpportunities';
interface CrmcForumLeadsAttributes {
  id: number;
  fname: string;
  mname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  whatsapp_number: string;
  nationality: string;
  passport_number: string | null;
  address: string;
  dob: Date | null;
  gender: string;
  id_number: string;
  id_expiry: Date;
  id_issue_date: Date;
  country_interest: string;
  sub_country_interest: number;
  service_interest: string;
  market_source: string;
  sub_market_source: number;
  appointment: Date | null;
  followup: Date;
  folowuptime: Date;
  followupstat: number;
  enquiry: string;
  convet: string;
  priority: string;
  regdate: Date;
  regtime: Date;
  last_updated: string;
  last_updtd_time: string;
  stepComplete: number;
  payType: string | null;
  assignTo: number | null;
  case_officer: number | null;
  Counsilor: number | null;
  branch: number;
  region: number;
  payTotal: number;
  discount: number;
  paidYet: number | null;
  payBalance: number;
  feeAgreeDate: Date | null;
  demandAmt: number;
  dueDate: Date | null;
  demdRemark: string | null;
  agreeDate: Date | null;
  renDate: Date | null;
  renExpiryDate: Date | null;
  renew_type: string | null;
  status: string | null;
  status_date: Date;
  notf: number;
  type: string;
  password: string | null;
  novat: number | null;
  i_p: string | null;
  escalation: string | null;
  transfer_date: Date | null;
  transfer_time: string;
  transfered: number | null;
  transfered_by: number;
  otp_status: number | null;
  otp: number | null;
  otp_date: Date | null;
  otp_email: string | null;
  browser: string | null;
  hostname: string | null;
  digital_signature: string | null;
  lead_import_by: number | null;
  lead_import: number | null;
  education: string | null;
  profession: string | null;
  exist: number;
  no_of_applicants: number;
  advanced: number;
  do_status: number;
  arm_status: number;
  gm_status: number;
  discount_status: number;
  discount_remarks: string;
  discount_by: number;
  discount_date: Date;
  campaign: string;
  campaign_group: string;
  pa_fname: string;
  pa_lname: string;
  lead_remark: string;
  created: Date;
  created_by: number;
  alert: number;
  area: string;
  lead_quality: string;
  transferred_remark_update: number;
  untouch_transfer: number;
  lead_nq_reason: string;
  tele_caller_alert: number;
  tele_caller_remark: string;
  tele_caller_remark_by: number;
  tele_date: Date;
  lead_date: Date;
  duplicate: number;
  duplicate_count: number;
  ref_remark: string;
  na_record: number;
  old_assgined: number;
  nal_count: number;
  campaign_id: number;
  old_branch: number;
  sf: number;
  // Opportunity conversion fields
  opportunity_status: string | null;
  conversion_date: Date | null;
  conversion_reason: string | null;
  lost_reason: string | null;
  competitor: string | null;
  qualification_score: number | null;
  budget_range: string | null;
  timeline: string | null;
  decision_maker: string | null;
  decision_maker_title: string | null;
  decision_maker_contact: string | null;
  next_followup_date: Date | null;
  opportunity_notes: string | null;
  tags: string | null;
}

interface CrmcForumLeadsCreationAttributes extends Optional<CrmcForumLeadsAttributes, 'id' | 'dob' | 'appointment' | 'followup' | 'folowuptime' | 'followupstat' | 'stepComplete' | 'payType' | 'payTotal' | 'discount' | 'paidYet' | 'payBalance' | 'feeAgreeDate' | 'demandAmt' | 'dueDate' | 'demdRemark' | 'agreeDate' | 'renDate' | 'renExpiryDate' | 'renew_type' | 'status' | 'notf' | 'password' | 'novat' | 'i_p' | 'escalation' | 'transfer_date' | 'transfered' | 'otp_status' | 'otp' | 'otp_date' | 'otp_email' | 'browser' | 'hostname' | 'digital_signature' | 'lead_import_by' | 'lead_import' | 'education' | 'profession' | 'whatsapp_number' | 'passport_number'> { }

class CrmcForumLeads extends Model<CrmcForumLeadsAttributes, CrmcForumLeadsCreationAttributes> implements CrmcForumLeadsAttributes {
  declare id: number;
  declare fname: string;
  declare mname: string;
  declare lname: string;
  declare email: string;
  declare phone: string;
  declare mobile: string;
  declare whatsapp_number: string;
  declare nationality: string;
  declare passport_number: string | null;
  declare address: string;
  declare dob: Date | null;
  declare gender: string;
  declare id_number: string;
  declare id_expiry: Date;
  declare id_issue_date: Date;
  declare country_interest: string;
  declare sub_country_interest: number;
  declare service_interest: string;
  declare market_source: string;
  declare sub_market_source: number;
  declare appointment: Date | null;
  declare followup: Date;
  declare folowuptime: Date;
  declare followupstat: number;
  declare enquiry: string;
  declare convet: string;
  declare priority: string;
  declare regdate: Date;
  declare regtime: Date;
  declare last_updated: string;
  declare last_updtd_time: string;
  declare stepComplete: number;
  declare payType: string | null;
  declare assignTo: number | null;
  declare case_officer: number | null;
  declare Counsilor: number | null;
  declare branch: number;
  declare region: number;
  declare payTotal: number;
  declare discount: number;
  declare paidYet: number | null;
  declare payBalance: number;
  declare feeAgreeDate: Date | null;
  declare demandAmt: number;
  declare dueDate: Date | null;
  declare demdRemark: string | null;
  declare agreeDate: Date | null;
  declare renDate: Date | null;
  declare renExpiryDate: Date | null;
  declare renew_type: string | null;
  declare status: string | null;
  declare status_date: Date;
  declare notf: number;
  declare type: string;
  declare password: string | null;
  declare novat: number | null;
  declare i_p: string | null;
  declare escalation: string | null;
  declare transfer_date: Date | null;
  declare transfer_time: string;
  declare transfered: number | null;
  declare transfered_by: number;
  declare otp_status: number | null;
  declare otp: number | null;
  declare otp_date: Date | null;
  declare otp_email: string | null;
  declare browser: string | null;
  declare hostname: string | null;
  declare digital_signature: string | null;
  declare lead_import_by: number | null;
  declare lead_import: number | null;
  declare education: string | null;
  declare profession: string | null;
  declare exist: number;
  declare no_of_applicants: number;
  declare advanced: number;
  declare do_status: number;
  declare arm_status: number;
  declare gm_status: number;
  declare discount_status: number;
  declare discount_remarks: string;
  declare discount_by: number;
  declare discount_date: Date;
  declare campaign: string;
  declare campaign_group: string;
  declare pa_fname: string;
  declare pa_lname: string;
  declare lead_remark: string;
  declare created: Date;
  declare created_by: number;
  declare alert: number;
  declare area: string;
  declare lead_quality: string;
  declare transferred_remark_update: number;
  declare untouch_transfer: number;
  declare lead_nq_reason: string;
  declare tele_caller_alert: number;
  declare tele_caller_remark: string;
  declare tele_caller_remark_by: number;
  declare tele_date: Date;
  declare lead_date: Date;
  declare duplicate: number;
  declare duplicate_count: number;
  declare ref_remark: string;
  declare na_record: number;
  declare old_assgined: number;
  declare nal_count: number;
  declare campaign_id: number;
  declare old_branch: number;
  declare sf: number;
  // Opportunity conversion fields
  declare opportunity_status: string | null;
  declare conversion_date: Date | null;
  declare conversion_reason: string | null;
  declare lost_reason: string | null;
  declare competitor: string | null;
  declare qualification_score: number | null;
  declare budget_range: string | null;
  declare timeline: string | null;
  declare decision_maker: string | null;
  declare decision_maker_title: string | null;
  declare decision_maker_contact: string | null;
  declare next_followup_date: Date | null;
  declare opportunity_notes: string | null;
  declare tags: string | null;

  // Associations
  declare dmEmployeeByASSIGNTo?: CrmEmployee;
  declare dmEmployeeByCASEOFFICER?: CrmEmployee;
  declare dmEmployeeByCoUNSILOR?: CrmEmployee;
  declare dmBranch?: any;
  declare dmRegion?: any;
  declare dmcNotifications?: any[];
  declare dmcFollowUpReminders?: any[];
  declare dmcMeetingSchedules?: any[];

  public static associate(models: any) {
    // Core working associations
    CrmcForumLeads.belongsTo(models.CrmEmployee, { foreignKey: 'assignTo', targetKey: 'id', as: 'dmEmployeeByASSIGNTo' });
    CrmcForumLeads.belongsTo(models.CrmBranch, { foreignKey: 'branch', targetKey: 'id', as: 'dmBranch' });
    
    // Opportunities association
    CrmcForumLeads.hasMany(models.CrmcOpportunities, { foreignKey: 'leadId', sourceKey: 'id', as: 'dmcOpportunities' });
    CrmcForumLeads.hasMany(models.CrmOperationStageData, { foreignKey: 'leadId', sourceKey: 'id', as: 'operationStages' });
    CrmcForumLeads.hasMany(models.CrmOpsDocuments, { foreignKey: 'leadId', sourceKey: 'id', as: 'operationsDocuments' });
    CrmcForumLeads.belongsTo(models.CrmRegion, { foreignKey: 'region', targetKey: 'id', as: 'dmRegion' });
    
    // Optional associations that may exist
    if (models.CrmEmployee) {
      CrmcForumLeads.belongsTo(models.CrmEmployee, { foreignKey: 'case_officer', targetKey: 'id', as: 'dmEmployeeByCASEOFFICER' });
      CrmcForumLeads.belongsTo(models.CrmEmployee, { foreignKey: 'Counsilor', targetKey: 'id', as: 'dmEmployeeByCoUNSILOR' });
    }
    
    // Only add associations if the models exist and columns are present
    if (models.CrmcNotifications) {
      CrmcForumLeads.hasMany(models.CrmcNotifications, { foreignKey: 'user_id', sourceKey: 'assignTo', as: 'dmcNotifications' });
    }
    
    if (models.CrmcFollowUpReminders) {
      CrmcForumLeads.hasMany(models.CrmcFollowUpReminders, { foreignKey: 'lead_id', sourceKey: 'id', as: 'dmcFollowUpReminders' });
    }
    
    if (models.CrmcMeetingSchedules) {
      CrmcForumLeads.hasMany(models.CrmcMeetingSchedules, { foreignKey: 'lead_id', sourceKey: 'id', as: 'dmcMeetingSchedules' });
    }
    
    // Only add opportunity association if the column exists
    if (models.CrmcOpportunities) {
      // Check if opportunity_id column exists before adding association
      // This will be handled at runtime to avoid errors
    }
  }
}

CrmcForumLeads.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    fname: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    mname: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    lname: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    whatsapp_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    passport_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING(55),
      allowNull: false
    },
    id_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    id_expiry: {
      type: DataTypes.DATE,
      allowNull: false
    },
    id_issue_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    country_interest: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sub_country_interest: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_interest: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    market_source: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sub_market_source: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    appointment: {
      type: DataTypes.DATE,
      allowNull: true
    },
    followup: {
      type: DataTypes.DATE,
      allowNull: false
    },
    folowuptime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    followupstat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    enquiry: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    convet: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    priority: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    regdate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    regtime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    last_updated: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    last_updtd_time: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    stepComplete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    payType: {
      type: DataTypes.STRING(55),
      allowNull: true
    },
    assignTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    case_officer: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Counsilor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    paidYet: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    payBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    feeAgreeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    demandAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    demdRemark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    agreeDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    renew_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(55),
      allowNull: true
    },
    status_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    notf: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    novat: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    i_p: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    escalation: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    transfer_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transfer_time: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    transfered: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    transfered_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    otp_status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    otp_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    otp_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    browser: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hostname: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    digital_signature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lead_import_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lead_import: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    education: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    profession: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    exist: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    no_of_applicants: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    advanced: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    do_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    arm_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    gm_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discount_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discount_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    discount_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discount_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    campaign: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    campaign_group: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    pa_fname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    pa_lname: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    lead_remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    alert: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lead_quality: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    transferred_remark_update: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    untouch_transfer: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lead_nq_reason: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tele_caller_alert: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tele_caller_remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tele_caller_remark_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tele_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lead_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duplicate: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    duplicate_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ref_remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    na_record: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    old_assgined: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nal_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    old_branch: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sf: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    // Opportunity conversion fields
    opportunity_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    conversion_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    conversion_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lost_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    competitor: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    qualification_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    budget_range: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    timeline: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    decision_maker: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    decision_maker_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    decision_maker_contact: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    next_followup_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    opportunity_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'CrmcForumLeads',
    tableName: 'crm_forum_leads',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeads };
export type { CrmcForumLeadsAttributes, CrmcForumLeadsCreationAttributes };
