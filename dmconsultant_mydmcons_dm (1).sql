-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 21, 2026 at 05:20 PM
-- Server version: 8.0.44
-- PHP Version: 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dmconsultant_mydmcons_dm`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `date` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `appointtime` time NOT NULL,
  `counsilorid` int DEFAULT NULL,
  `booked` int DEFAULT NULL,
  `done` int DEFAULT NULL,
  `not_done` int DEFAULT NULL,
  `region` int DEFAULT NULL,
  `branch` int NOT NULL DEFAULT '0',
  `screenshot` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `second_done` int NOT NULL,
  `second_meet_date` date NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_counteries`
--

CREATE TABLE `appointment_counteries` (
  `id` int NOT NULL,
  `country_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auditor_followups`
--

CREATE TABLE `auditor_followups` (
  `id` int NOT NULL,
  `followup_date` date NOT NULL,
  `followup_time` time NOT NULL,
  `followup_remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `lead_id` int NOT NULL,
  `assign` int NOT NULL,
  `na_record` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auditor_meetings`
--

CREATE TABLE `auditor_meetings` (
  `id` int NOT NULL,
  `meeting_date` date NOT NULL,
  `meeting_time` time NOT NULL,
  `meeting_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `lead_id` int NOT NULL,
  `assign` int NOT NULL,
  `na_record` int NOT NULL,
  `followup_meet` int NOT NULL,
  `mail_sent` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aus_eoi`
--

CREATE TABLE `aus_eoi` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `dol` varchar(30) DEFAULT NULL,
  `doe` varchar(30) DEFAULT NULL,
  `points` int DEFAULT NULL,
  `eoi_status` varchar(30) DEFAULT NULL,
  `pof` varchar(30) DEFAULT NULL,
  `statcat` varchar(100) NOT NULL,
  `state` varchar(30) DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `aus_eoi_old`
--

CREATE TABLE `aus_eoi_old` (
  `id` int NOT NULL,
  `leadid` varchar(50) DEFAULT NULL,
  `dol` varchar(30) DEFAULT NULL,
  `doe` varchar(30) DEFAULT NULL,
  `points` int DEFAULT NULL,
  `eoi_status` varchar(30) DEFAULT NULL,
  `pof` varchar(30) DEFAULT NULL,
  `statcat` varchar(100) NOT NULL,
  `state` varchar(30) DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `aus_nom`
--

CREATE TABLE `aus_nom` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `nomstate` varchar(30) DEFAULT NULL,
  `subdate` varchar(30) DEFAULT NULL,
  `nomexpdate` varchar(30) DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL,
  `nomStatus` varchar(100) NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `aus_nom_old`
--

CREATE TABLE `aus_nom_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(50) DEFAULT NULL,
  `nomstate` varchar(30) DEFAULT NULL,
  `subdate` varchar(30) DEFAULT NULL,
  `nomexpdate` varchar(30) DEFAULT NULL,
  `file` varchar(50) DEFAULT NULL,
  `nomStatus` varchar(100) NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `branch_target`
--

CREATE TABLE `branch_target` (
  `id` int NOT NULL,
  `branch` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `appointment` int DEFAULT NULL,
  `sales` int DEFAULT NULL,
  `leads` int DEFAULT NULL,
  `target_date_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `business_ass_payment`
--

CREATE TABLE `business_ass_payment` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `paydate` varchar(50) NOT NULL,
  `payMethod` varchar(55) DEFAULT NULL,
  `payTotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `taxAmt` decimal(10,2) NOT NULL,
  `payBalance` decimal(10,2) NOT NULL,
  `payAmt` decimal(10,2) NOT NULL,
  `totPayAmt` decimal(10,2) NOT NULL,
  `demdRemark` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `canada_status`
--

CREATE TABLE `canada_status` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `type` varchar(40) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL,
  `emp` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `client_status`
--

CREATE TABLE `client_status` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `type` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `date` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `file` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `counselorid` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `client_status_old`
--

CREATE TABLE `client_status_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(20) DEFAULT NULL,
  `type` varchar(30) NOT NULL,
  `date` varchar(30) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `file` varchar(100) DEFAULT NULL,
  `counselorid` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_auh_email_leads`
--

CREATE TABLE `dmc_auh_email_leads` (
  `id` int NOT NULL,
  `email` varchar(555) NOT NULL,
  `email_sent` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_email_leads`
--

CREATE TABLE `dmc_forum_email_leads` (
  `id` int NOT NULL,
  `email` varchar(555) NOT NULL,
  `paidYet` decimal(10,2) DEFAULT '0.00',
  `email_sent` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads`
--

CREATE TABLE `dmc_forum_leads` (
  `id` int NOT NULL,
  `fname` varchar(555) NOT NULL,
  `mname` varchar(555) NOT NULL,
  `lname` varchar(555) NOT NULL,
  `email` varchar(555) NOT NULL,
  `phone` varchar(555) NOT NULL,
  `mobile` varchar(555) NOT NULL,
  `nationality` varchar(555) NOT NULL,
  `address` text NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(55) NOT NULL,
  `id_number` varchar(255) NOT NULL,
  `id_expiry` date NOT NULL,
  `id_issue_date` date NOT NULL,
  `country_interest` varchar(555) NOT NULL,
  `sub_country_interest` int NOT NULL,
  `service_interest` varchar(555) NOT NULL,
  `market_source` varchar(555) NOT NULL,
  `sub_market_source` int NOT NULL,
  `appointment` date DEFAULT NULL,
  `followup` date NOT NULL,
  `folowuptime` time NOT NULL,
  `followupstat` int NOT NULL DEFAULT '0',
  `enquiry` varchar(555) NOT NULL,
  `convet` varchar(555) NOT NULL,
  `priority` varchar(10) NOT NULL,
  `regdate` date NOT NULL,
  `regtime` time NOT NULL,
  `last_updated` varchar(30) NOT NULL,
  `last_updtd_time` varchar(50) NOT NULL,
  `stepComplete` int NOT NULL DEFAULT '1',
  `payType` varchar(55) DEFAULT NULL,
  `assignTo` int NOT NULL,
  `case_officer` int NOT NULL,
  `Counsilor` int NOT NULL,
  `branch` int NOT NULL,
  `region` int NOT NULL,
  `payTotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paidYet` decimal(10,2) DEFAULT '0.00',
  `payBalance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `feeAgreeDate` date DEFAULT NULL,
  `demandAmt` decimal(10,2) NOT NULL DEFAULT '0.00',
  `dueDate` date DEFAULT NULL,
  `demdRemark` text,
  `agreeDate` date DEFAULT NULL,
  `renDate` date DEFAULT NULL,
  `renExpiryDate` date DEFAULT NULL,
  `renew_type` varchar(50) DEFAULT NULL,
  `status` varchar(55) DEFAULT NULL,
  `status_date` date NOT NULL,
  `notf` int NOT NULL DEFAULT '0',
  `type` text NOT NULL,
  `password` varchar(30) DEFAULT NULL,
  `novat` int DEFAULT NULL,
  `i_p` varchar(50) DEFAULT NULL,
  `escalation` varchar(20) DEFAULT NULL,
  `transfer_date` date DEFAULT NULL,
  `transfer_time` varchar(20) NOT NULL,
  `transfered` int DEFAULT NULL,
  `transfered_by` int NOT NULL,
  `otp_status` int DEFAULT NULL,
  `otp` int DEFAULT NULL,
  `otp_date` datetime DEFAULT NULL,
  `otp_email` varchar(255) DEFAULT NULL,
  `browser` longtext,
  `hostname` longtext,
  `digital_signature` longtext,
  `lead_import_by` int DEFAULT NULL,
  `lead_import` int DEFAULT NULL,
  `education` varchar(255) DEFAULT NULL,
  `profession` varchar(255) DEFAULT NULL,
  `exist` int NOT NULL,
  `no_of_applicants` int NOT NULL,
  `advanced` int NOT NULL,
  `do_status` int NOT NULL,
  `arm_status` int NOT NULL,
  `gm_status` int NOT NULL,
  `discount_status` int NOT NULL,
  `discount_remarks` longtext NOT NULL,
  `discount_by` int NOT NULL,
  `discount_date` datetime NOT NULL,
  `campaign` varchar(200) NOT NULL,
  `campaign_group` varchar(50) NOT NULL,
  `pa_fname` varchar(255) NOT NULL,
  `pa_lname` varchar(255) NOT NULL,
  `lead_remark` text NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  `alert` int NOT NULL,
  `area` varchar(100) NOT NULL,
  `lead_quality` varchar(100) NOT NULL,
  `transferred_remark_update` int NOT NULL,
  `untouch_transfer` int NOT NULL,
  `lead_nq_reason` varchar(100) NOT NULL,
  `tele_caller_alert` int NOT NULL,
  `tele_caller_remark` longtext NOT NULL,
  `tele_caller_remark_by` int NOT NULL,
  `tele_date` date NOT NULL,
  `lead_date` date NOT NULL,
  `duplicate` int NOT NULL,
  `duplicate_count` int NOT NULL,
  `ref_remark` longtext NOT NULL,
  `na_record` int NOT NULL,
  `old_assgined` int NOT NULL,
  `nal_count` int NOT NULL,
  `campaign_id` int NOT NULL,
  `old_branch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Triggers `dmc_forum_leads`
--
DELIMITER $$
CREATE TRIGGER `lead_transfers` AFTER UPDATE ON `dmc_forum_leads` FOR EACH ROW BEGIN IF (NEW.assignTo != OLD.assignTO OR NEW.Counsilor != OLD.Counsilor) THEN
INSERT into lead_logs (leadid,ACTION) VALUES (NEW.id,concat((SELECT name FROM dm_employee WHERE id=OLD.Counsilor)," to ",(SELECT name FROM dm_employee WHERE id=NEW.Counsilor)));
END if;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_assesments`
--

CREATE TABLE `dmc_forum_leads_assesments` (
  `Id` int NOT NULL,
  `leadId` int NOT NULL,
  `Type` varchar(55) DEFAULT NULL,
  `cob` varchar(555) DEFAULT NULL,
  `phOffice` varchar(555) DEFAULT NULL,
  `marStatus` varchar(555) DEFAULT NULL,
  `haveChild` varchar(555) DEFAULT NULL,
  `noOfChild` varchar(555) DEFAULT NULL,
  `spfname` varchar(255) DEFAULT NULL,
  `spmname` varchar(255) DEFAULT NULL,
  `splname` varchar(255) DEFAULT NULL,
  `spgender` varchar(255) DEFAULT NULL,
  `spdob` date DEFAULT NULL,
  `spcob` varchar(255) DEFAULT NULL,
  `spcitizenof` varchar(255) DEFAULT NULL,
  `spaddress` text,
  `spmobile` varchar(255) DEFAULT NULL,
  `spphHome` varchar(255) DEFAULT NULL,
  `spphOffice` varchar(255) DEFAULT NULL,
  `spemail` varchar(255) DEFAULT NULL,
  `relName` varchar(555) DEFAULT NULL,
  `reRelation` varchar(555) DEFAULT NULL,
  `reCountry` varchar(555) DEFAULT NULL,
  `reAddress` varchar(555) DEFAULT NULL,
  `reStatus` varchar(555) DEFAULT NULL,
  `moveAsset` varchar(555) DEFAULT NULL,
  `inmoveAsset` varchar(555) DEFAULT NULL,
  `interestIn` varchar(555) DEFAULT NULL,
  `ownership` varchar(555) DEFAULT NULL,
  `document` varchar(255) DEFAULT NULL,
  `assesment` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_assesment_desgn`
--

CREATE TABLE `dmc_forum_leads_assesment_desgn` (
  `id` int NOT NULL,
  `skillId` int NOT NULL,
  `leadId` int NOT NULL,
  `fromEmpRecMonth` varchar(555) DEFAULT NULL,
  `fromEmpRecYear` varchar(555) DEFAULT NULL,
  `toEmpRecMonth` varchar(555) DEFAULT NULL,
  `toEmpRecYear` varchar(555) DEFAULT NULL,
  `empRecName` varchar(555) DEFAULT NULL,
  `empRecDesign` varchar(555) DEFAULT NULL,
  `empRecType` varchar(555) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_assesment_edu`
--

CREATE TABLE `dmc_forum_leads_assesment_edu` (
  `id` int NOT NULL,
  `skillId` int NOT NULL,
  `leadId` int NOT NULL,
  `fromMonth` varchar(555) DEFAULT NULL,
  `fromYear` varchar(555) DEFAULT NULL,
  `toMonth` varchar(555) DEFAULT NULL,
  `toYear` varchar(555) DEFAULT NULL,
  `pSEduName` varchar(555) DEFAULT NULL,
  `pSEduCourse` varchar(555) DEFAULT NULL,
  `pSEduDegree` varchar(555) DEFAULT NULL,
  `pSEduType` varchar(555) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_contracts`
--

CREATE TABLE `dmc_forum_leads_contracts` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `contract` varchar(555) NOT NULL,
  `unsigned_contract` varchar(255) NOT NULL,
  `new_contract` varchar(555) DEFAULT NULL,
  `ar_contract` varchar(255) NOT NULL,
  `garys` varchar(10) DEFAULT NULL,
  `verify` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `verify_by` int NOT NULL DEFAULT '0',
  `verify_date` datetime DEFAULT NULL,
  `batch_id` int NOT NULL,
  `wp_batch_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `employer_id` int NOT NULL,
  `old_crm_ag_id` int NOT NULL,
  `payment_status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_fee`
--

CREATE TABLE `dmc_forum_leads_fee` (
  `id` int NOT NULL,
  `lead` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `taxAmt` decimal(10,2) NOT NULL,
  `payDate` date NOT NULL,
  `paidAmt` decimal(10,2) NOT NULL,
  `paidDate` date NOT NULL,
  `profAmt` decimal(10,2) NOT NULL,
  `status` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_observations`
--

CREATE TABLE `dmc_forum_leads_observations` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `sheet` varchar(555) NOT NULL,
  `emirateId` varchar(255) NOT NULL,
  `document` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `os_visit_sheet` varchar(255) NOT NULL,
  `visit_obs_type` varchar(100) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_observation_old`
--

CREATE TABLE `dmc_forum_leads_observation_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(111) NOT NULL,
  `obs_sheet` varchar(555) NOT NULL,
  `agreement_sheet` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_remarks`
--

CREATE TABLE `dmc_forum_leads_remarks` (
  `id` int NOT NULL,
  `lead` int NOT NULL,
  `date` date DEFAULT NULL,
  `remark` text,
  `emp` int NOT NULL DEFAULT '0',
  `created` time DEFAULT NULL,
  `status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_remark_g`
--

CREATE TABLE `dmc_forum_leads_remark_g` (
  `id` int NOT NULL,
  `lead` int NOT NULL,
  `date` date NOT NULL,
  `remark` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_forum_leads_remark_olds`
--

CREATE TABLE `dmc_forum_leads_remark_olds` (
  `id` int NOT NULL,
  `agreeNo` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `remark` text NOT NULL,
  `emp` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_new_add_leads`
--

CREATE TABLE `dmc_new_add_leads` (
  `id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent` int NOT NULL,
  `date` date NOT NULL,
  `fname` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dmc_new_add_po_leads`
--

CREATE TABLE `dmc_new_add_po_leads` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent` int NOT NULL,
  `date` date NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_3party_payment`
--

CREATE TABLE `dm_3party_payment` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `date` date DEFAULT NULL,
  `currency_id` int NOT NULL,
  `amount` double(10,2) NOT NULL DEFAULT '0.00',
  `Tax` double(20,2) NOT NULL DEFAULT '0.00',
  `payMethod` varchar(55) DEFAULT NULL,
  `emp_id` int NOT NULL DEFAULT '0',
  `receipt_date` datetime NOT NULL,
  `cc_number` varchar(50) NOT NULL,
  `receipt` varchar(255) NOT NULL,
  `counselor_receipt` varchar(255) NOT NULL,
  `trans_or_ref_number` varchar(255) NOT NULL,
  `remarks` longtext NOT NULL,
  `payoption` varchar(100) NOT NULL,
  `paycardoption` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_3party_payment_det`
--

CREATE TABLE `dm_3party_payment_det` (
  `id` int NOT NULL,
  `payId` int NOT NULL,
  `particular` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_3party_payment_old`
--

CREATE TABLE `dm_3party_payment_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(111) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `Tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payMethod` varchar(55) NOT NULL,
  `particular` varchar(55) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_accounts`
--

CREATE TABLE `dm_accounts` (
  `id` int NOT NULL,
  `account_no` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_address` varchar(1024) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_beneficiary` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `iban` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `branch_id` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_additional_documents`
--

CREATE TABLE `dm_additional_documents` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `document` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_admin`
--

CREATE TABLE `dm_admin` (
  `id` int NOT NULL,
  `user` varchar(255) NOT NULL,
  `pwd` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_appointments`
--

CREATE TABLE `dm_appointments` (
  `id` int NOT NULL,
  `task` longtext NOT NULL,
  `asignBy` int NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT '0',
  `created` date NOT NULL,
  `doc` date NOT NULL,
  `notf` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_appointment_remarks`
--

CREATE TABLE `dm_appointment_remarks` (
  `id` int NOT NULL,
  `taskid` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `remarks` text,
  `emp` varchar(20) NOT NULL,
  `notf` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_auditor_counts`
--

CREATE TABLE `dm_auditor_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_auditor_reviews`
--

CREATE TABLE `dm_auditor_reviews` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_b2b`
--

CREATE TABLE `dm_b2b` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_b2b_invoices`
--

CREATE TABLE `dm_b2b_invoices` (
  `id` int NOT NULL,
  `region` int DEFAULT NULL,
  `receipt` varchar(255) NOT NULL,
  `branch` int DEFAULT NULL,
  `company` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `purpose` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `narration` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `vat` int DEFAULT NULL,
  `taxAmt` int DEFAULT NULL,
  `totPayAmt` int DEFAULT NULL,
  `payBalance` double(10,2) NOT NULL,
  `payment_mode` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `discount` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `created` date DEFAULT NULL,
  `Counsilor` int DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_batch`
--

CREATE TABLE `dm_batch` (
  `id` int NOT NULL,
  `batch_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `vendor_id` int NOT NULL,
  `status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_branch`
--

CREATE TABLE `dm_branch` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `ar_name` longtext CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `branch` varchar(75) NOT NULL,
  `region` int NOT NULL,
  `abbrv` varchar(50) NOT NULL,
  `address` text NOT NULL,
  `ar_address` longtext CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `email` varchar(555) NOT NULL,
  `mobile` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `website` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_branch_allocations`
--

CREATE TABLE `dm_branch_allocations` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `branches` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_business_fee`
--

CREATE TABLE `dm_business_fee` (
  `id` int NOT NULL,
  `service` int NOT NULL,
  `country` int NOT NULL,
  `branch` int NOT NULL,
  `currency` int NOT NULL,
  `stage_name` varchar(255) NOT NULL,
  `stage` decimal(10,2) NOT NULL,
  `discount` double(10,2) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_business_payment_plan`
--

CREATE TABLE `dm_business_payment_plan` (
  `leadId` int NOT NULL,
  `legal_fees` double(10,2) NOT NULL,
  `total_fees` double(10,2) NOT NULL,
  `vat` double(10,2) NOT NULL,
  `first_payment` double(10,2) NOT NULL,
  `due_diligence_fees` double(10,2) NOT NULL,
  `government_application_fees` double(10,2) NOT NULL,
  `government_passport_fees` double(10,2) NOT NULL,
  `governement_cert_of_naturalization` double(10,2) NOT NULL,
  `second_payment` double(10,2) NOT NULL,
  `bank_charges` double(10,2) NOT NULL,
  `refund` double(10,2) NOT NULL,
  `balance_payment` double(10,2) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_business_portugal_payment_plan`
--

CREATE TABLE `dm_business_portugal_payment_plan` (
  `leadId` int NOT NULL,
  `legal_fees` double(10,2) NOT NULL,
  `total_fees` double(10,2) NOT NULL,
  `vat` double(10,2) NOT NULL,
  `first_payment` double(10,2) NOT NULL,
  `due_diligence_fees` double(10,2) NOT NULL,
  `government_application_fees` double(10,2) NOT NULL,
  `government_passport_fees` double(10,2) NOT NULL,
  `governement_cert_of_naturalization` double(10,2) NOT NULL,
  `second_payment` double(10,2) NOT NULL,
  `bank_charges` double(10,2) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_campaigns`
--

CREATE TABLE `dm_campaigns` (
  `id` int NOT NULL,
  `campaign` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_2916`
--

CREATE TABLE `dm_cf7db_2916` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_512` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_3232`
--

CREATE TABLE `dm_cf7db_3232` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_748` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_3606`
--

CREATE TABLE `dm_cf7db_3606` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_52` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_535` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `text_34684` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_58` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_3848`
--

CREATE TABLE `dm_cf7db_3848` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_737` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_3870`
--

CREATE TABLE `dm_cf7db_3870` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_503` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_4077`
--

CREATE TABLE `dm_cf7db_4077` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name_52` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_592` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phonetext_646` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `text_301504` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_55986021` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_cf7db_4088`
--

CREATE TABLE `dm_cf7db_4088` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `file_898_cf7dbp_file` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_clients`
--

CREATE TABLE `dm_clients` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `first_name` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `last_name` varchar(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `email` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `image` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `dob` date NOT NULL,
  `address` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `full_address` text CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `token` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `token_validity` datetime NOT NULL,
  `verify` int NOT NULL,
  `password` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `hash_password` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `status` int NOT NULL,
  `accept` int NOT NULL,
  `created` date NOT NULL,
  `case_manager` int NOT NULL,
  `backend_person` int NOT NULL,
  `is_deleted` int NOT NULL,
  `city` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `nationality` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_client_conversations`
--

CREATE TABLE `dm_client_conversations` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `case_manager` int NOT NULL,
  `chat_from_client` int NOT NULL,
  `client_id` int NOT NULL,
  `text` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `file` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `status` int NOT NULL,
  `read_msg` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_client_edu`
--

CREATE TABLE `dm_client_edu` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `date` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `con_mark_sheet_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `con_mark_sheet_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `con_mark_sheet_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `con_mark_sheet_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ind_mark_sheet_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ind_mark_sheet_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_eca_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_eca_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_eca_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_eca_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_wes_eca_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_wes_eca_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `conv_cert_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `conv_cert_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_wes_eca_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `revised_wes_eca_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `eca_m` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `eca_m_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `conv_cert_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `conv_cert_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ind_mark_sheet_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ind_mark_sheet_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bach_seal_trans_unv` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bach_seal_trans_unv_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `eca_b` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `eca_b_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `intermediate` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `intermediate_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ssc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ssc_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `dipthi` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_client_logs`
--

CREATE TABLE `dm_client_logs` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `log` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_client_personal`
--

CREATE TABLE `dm_client_personal` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `date` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `copr` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `copr_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `client_sheet` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `client_sheet_a` int NOT NULL,
  `vphoto` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `vphoto_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `final_visa_docfb` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `final_visa_docfb_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `final_visa_docfull` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `final_visa_docfull_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mcert_re` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mcert_re_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bcert` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `bcert_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `niddoc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `niddoc_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `marraige` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `marraige_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ielts` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ielts_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport_new` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport_new_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pcc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pcc_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `photo` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `photo_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `resume` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `resume_a` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `dipthi` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_client_personal_old`
--

CREATE TABLE `dm_client_personal_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(111) DEFAULT NULL,
  `copr` varchar(50) DEFAULT NULL,
  `copr_a` varchar(20) DEFAULT NULL,
  `vphoto` varchar(50) DEFAULT NULL,
  `vphoto_a` varchar(20) DEFAULT NULL,
  `final_visa_docfb` varchar(50) DEFAULT NULL,
  `final_visa_docfb_a` varchar(20) DEFAULT NULL,
  `final_visa_docfull` varchar(50) DEFAULT NULL,
  `final_visa_docfull_a` varchar(20) DEFAULT NULL,
  `mcert_re` varchar(50) DEFAULT NULL,
  `mcert_re_a` varchar(20) NOT NULL,
  `bcert` varchar(50) DEFAULT NULL,
  `bcert_a` varchar(20) NOT NULL,
  `niddoc` varchar(50) DEFAULT NULL,
  `niddoc_a` varchar(20) NOT NULL,
  `marraige` varchar(50) DEFAULT NULL,
  `marraige_a` varchar(20) DEFAULT NULL,
  `ielts` varchar(50) DEFAULT NULL,
  `ielts_a` varchar(20) DEFAULT NULL,
  `passport` varchar(50) DEFAULT NULL,
  `passport_a` varchar(20) DEFAULT NULL,
  `passport_new` varchar(50) DEFAULT NULL,
  `passport_new_a` varchar(20) DEFAULT NULL,
  `pcc` varchar(50) DEFAULT NULL,
  `pcc_a` varchar(50) DEFAULT NULL,
  `photo` varchar(50) DEFAULT NULL,
  `photo_a` varchar(20) DEFAULT NULL,
  `resume` varchar(50) DEFAULT NULL,
  `resume_a` varchar(20) DEFAULT NULL,
  `date` date NOT NULL,
  `dipthi` int NOT NULL,
  `harish` int NOT NULL,
  `terence` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_commercial_invoices`
--

CREATE TABLE `dm_commercial_invoices` (
  `id` int NOT NULL,
  `region` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `company` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `purpose` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `narration` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `vat` int DEFAULT NULL,
  `taxAmt` int DEFAULT NULL,
  `totPayAmt` int DEFAULT NULL,
  `payment_mode` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `discount` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `created` date DEFAULT NULL,
  `Counsilor` int DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_contract_file`
--

CREATE TABLE `dm_contract_file` (
  `id` int NOT NULL,
  `country` int NOT NULL,
  `service` int NOT NULL,
  `file` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_counsilor_allocations`
--

CREATE TABLE `dm_counsilor_allocations` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `counsilors` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_countries`
--

CREATE TABLE `dm_countries` (
  `id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb3 NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_countries_type_program`
--

CREATE TABLE `dm_countries_type_program` (
  `id` int NOT NULL,
  `country` int NOT NULL,
  `type` int NOT NULL,
  `program` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_country_proces`
--

CREATE TABLE `dm_country_proces` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `sub_counteries` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_currency`
--

CREATE TABLE `dm_currency` (
  `id` int NOT NULL,
  `country` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `currency_code` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `rate` float(10,2) NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_department`
--

CREATE TABLE `dm_department` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_dup_live_chat_leads`
--

CREATE TABLE `dm_dup_live_chat_leads` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` int NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `businesstype` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `emp_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `lead_remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_dup_lp_leads`
--

CREATE TABLE `dm_dup_lp_leads` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` int NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `businesstype` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `emp_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `lead_remark` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_eip_aipp`
--

CREATE TABLE `dm_eip_aipp` (
  `id` int NOT NULL,
  `leadId` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `tab` int NOT NULL,
  `province` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `noc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `registration_date` date NOT NULL,
  `doc_rec_date` date NOT NULL,
  `doc_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `employer_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `job_applied_date` date NOT NULL,
  `job_status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `interview_received` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `interview_date` date NOT NULL,
  `interview_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_eip_mcdii`
--

CREATE TABLE `dm_eip_mcdii` (
  `id` int NOT NULL,
  `leadId` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `tab` int NOT NULL,
  `eligibility` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `doc_received` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `doc_rece_date` date NOT NULL,
  `noc` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `eoi_sub_date` date NOT NULL,
  `eoi_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `exploratory_visit_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `exploratory_visit_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_eip_rnip`
--

CREATE TABLE `dm_eip_rnip` (
  `id` int NOT NULL,
  `leadId` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `tab` int NOT NULL,
  `community` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `noc` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `registration_date` date NOT NULL,
  `doc_rec_date` date NOT NULL,
  `doc_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `employer_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `job_applied_date` date NOT NULL,
  `job_status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `interview_received` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `interview_date` date NOT NULL,
  `interview_status` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_email_attachments`
--

CREATE TABLE `dm_email_attachments` (
  `id` int NOT NULL,
  `email_template_id` int NOT NULL,
  `attachments` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_email_templates`
--

CREATE TABLE `dm_email_templates` (
  `id` int NOT NULL,
  `program` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `template` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `status` int NOT NULL,
  `ops` int NOT NULL,
  `sales` int NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_employee`
--

CREATE TABLE `dm_employee` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cemail` varchar(50) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `cmobile` varchar(255) DEFAULT NULL,
  `paddress` longtext,
  `address` varchar(555) DEFAULT NULL,
  `photo` varchar(555) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `role` int DEFAULT NULL,
  `vendor_id` int NOT NULL,
  `branch` int DEFAULT NULL,
  `region` int DEFAULT NULL,
  `username` varchar(555) DEFAULT NULL,
  `password` varchar(555) DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `ppNo` varchar(255) DEFAULT NULL,
  `visaExp` date DEFAULT NULL,
  `department` int DEFAULT NULL,
  `EID` text,
  `doj` date DEFAULT NULL,
  `nationality` varchar(555) DEFAULT NULL,
  `dol` varchar(50) DEFAULT NULL,
  `remark` text,
  `labexp` varchar(50) DEFAULT NULL,
  `bounce` int DEFAULT NULL,
  `em_local_name` varchar(255) DEFAULT NULL,
  `em_home_name` varchar(255) DEFAULT NULL,
  `em_local_number` varchar(255) DEFAULT NULL,
  `em_home_number` varchar(255) DEFAULT NULL,
  `religion` varchar(200) NOT NULL,
  `gender` varchar(200) NOT NULL,
  `crea` int NOT NULL,
  `wfh` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Triggers `dm_employee`
--
DELIMITER $$
CREATE TRIGGER `change_in_data` AFTER UPDATE ON `dm_employee` FOR EACH ROW BEGIN IF (NEW.role != OLD.role) THEN insert into dm_logs (`message`,`action`,`source`) VALUES ("Promotion or Demotion",NEW.id,concat((SELECT name FROM dm_role where id=OLD.role)," to ",(SELECT name from dm_role WHERE id=NEW.role)));
END IF;
IF (NEW.region != OLD.region) THEN insert into dm_logs (`message`,`action`,`source`) VALUES ("Transfers",NEW.id,concat((SELECT name FROM dm_region where id=OLD.region)," to ",(SELECT name from dm_region WHERE id=NEW.region))); END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `dm_employee_attendance`
--

CREATE TABLE `dm_employee_attendance` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `ip_address` varchar(100) NOT NULL,
  `device` varchar(255) NOT NULL,
  `agent` longtext NOT NULL,
  `login_time` time NOT NULL,
  `logout_time` time NOT NULL,
  `total_hours` double(10,2) NOT NULL,
  `short_fall` double(10,2) NOT NULL,
  `remarks` longtext NOT NULL,
  `watch_by` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `checkin` int NOT NULL,
  `checkout` int NOT NULL,
  `logout_ip_address` varchar(255) NOT NULL,
  `extra_hours` double(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_employee_logs`
--

CREATE TABLE `dm_employee_logs` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `log` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` datetime NOT NULL,
  `ip` varchar(255) NOT NULL,
  `browser` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_employee_logs_old`
--

CREATE TABLE `dm_employee_logs_old` (
  `id` int NOT NULL,
  `agreeNo` int NOT NULL,
  `employee_id` int NOT NULL,
  `log` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_employer`
--

CREATE TABLE `dm_employer` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(255) DEFAULT NULL,
  `paddress` longtext,
  `vendor_id` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `website` varchar(100) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_emp_sims`
--

CREATE TABLE `dm_emp_sims` (
  `id` int NOT NULL,
  `branch` int NOT NULL,
  `msisdn` int NOT NULL,
  `sim_number` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `company` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_emp_stocks`
--

CREATE TABLE `dm_emp_stocks` (
  `id` int NOT NULL,
  `branch` int NOT NULL,
  `msisdn` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` int NOT NULL,
  `model` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `model_number` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `serial_number` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `charger` int NOT NULL,
  `battery` int NOT NULL,
  `mouse` int NOT NULL,
  `keyboard` int NOT NULL,
  `created` date NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `dop` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_enquiry`
--

CREATE TABLE `dm_enquiry` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_europe_cases`
--

CREATE TABLE `dm_europe_cases` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `registration` int NOT NULL,
  `jol` int NOT NULL,
  `loc` int NOT NULL,
  `wp` int NOT NULL,
  `wp_hc` int NOT NULL,
  `dl` int NOT NULL,
  `payment_status_jol` int NOT NULL,
  `payment_status_loc` int NOT NULL,
  `payment_status_wp` int NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `ops` int NOT NULL,
  `sales` int NOT NULL,
  `reject` int NOT NULL,
  `approve` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_europe_cases_verification`
--

CREATE TABLE `dm_europe_cases_verification` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `passports_for_eu` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `os_for_eu` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `ops_status` int NOT NULL,
  `ops_approval` int NOT NULL,
  `ops_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `ops` int NOT NULL,
  `manager` int NOT NULL,
  `manager_status` int NOT NULL,
  `manager_approval` int NOT NULL,
  `manager_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `approval_date` date NOT NULL,
  `rejection_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_europe_payment_adjustments`
--

CREATE TABLE `dm_europe_payment_adjustments` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `stage_1` double(10,2) NOT NULL,
  `stage_2` double(10,2) NOT NULL,
  `stage_3` double(10,2) NOT NULL,
  `stage_4` double(10,2) NOT NULL,
  `stage_5` double(10,2) NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_europe_payment_operations`
--

CREATE TABLE `dm_europe_payment_operations` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `stage_1` int NOT NULL,
  `stage_2` int NOT NULL,
  `stage_3` int NOT NULL,
  `stage_4` int NOT NULL,
  `stage_5` int NOT NULL,
  `stage_status_1` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_status_2` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_status_3` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_status_4` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_status_5` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_europe_vendors_payments`
--

CREATE TABLE `dm_europe_vendors_payments` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `pay_amount` double(10,2) NOT NULL,
  `pay_status` int NOT NULL,
  `pay_date` date NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `sent_email` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_evaluations`
--

CREATE TABLE `dm_evaluations` (
  `id` int NOT NULL,
  `client_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `contact` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `location` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `marrital_status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `experience` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `email_address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `occupation_code` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `skill_type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `age_marks` int NOT NULL,
  `qualification_marks` int NOT NULL,
  `work_exp_marks` int NOT NULL,
  `lang_ab_marks` int NOT NULL,
  `french_marks` int NOT NULL,
  `adap_marks` int NOT NULL,
  `arranged_marks` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  `deleted` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_evaluations_skills`
--

CREATE TABLE `dm_evaluations_skills` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `skill_age_remarks` varchar(255) NOT NULL,
  `skill_age_marks` int NOT NULL,
  `level_of_edu_remarks` varchar(255) NOT NULL,
  `level_of_edu_marks` int NOT NULL,
  `first_level_prof_remarks` varchar(255) NOT NULL,
  `first_level_prof_marks` int NOT NULL,
  `second_level_prof_remarks` varchar(255) NOT NULL,
  `second_level_prof_marks` int NOT NULL,
  `canadian_work_exp_remarks` varchar(255) NOT NULL,
  `canadian_work_exp_marks` int NOT NULL,
  `level_of_edu_acc_remarks` varchar(255) NOT NULL,
  `level_of_edu_acc_marks` int NOT NULL,
  `canadian_work_exp_acc_remarks` varchar(255) NOT NULL,
  `canadian_work_exp_acc_marks` int NOT NULL,
  `offcial_lang_prof_remarks` varchar(255) NOT NULL,
  `offcial_lang_prof_marks` int NOT NULL,
  `level_of_edu_lang_abl_remarks` varchar(255) NOT NULL,
  `level_of_edu_lang_abl_marks` int NOT NULL,
  `foreign_work_exp_remarks` varchar(255) NOT NULL,
  `foreign_work_exp_marks` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_expense`
--

CREATE TABLE `dm_expense` (
  `id` int NOT NULL,
  `date` date NOT NULL,
  `particular` varchar(555) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `vat` decimal(10,2) NOT NULL,
  `addBy` int NOT NULL,
  `remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `region` int NOT NULL,
  `branch` int NOT NULL,
  `receipt` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `is_approval` int NOT NULL,
  `mgmt_approval` int NOT NULL,
  `expense_type` int NOT NULL,
  `transaction_type` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_expense_cash`
--

CREATE TABLE `dm_expense_cash` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `cash` double(10,2) NOT NULL,
  `branch` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_expense_cash_record`
--

CREATE TABLE `dm_expense_cash_record` (
  `id` int NOT NULL,
  `expense_id` int NOT NULL,
  `amount` double(10,2) NOT NULL,
  `amount_spend` double(10,2) NOT NULL,
  `balance` double(10,2) NOT NULL,
  `emp_id` int NOT NULL,
  `branch` int NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_fee`
--

CREATE TABLE `dm_fee` (
  `id` int NOT NULL,
  `service` int DEFAULT NULL,
  `country` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `currency` int DEFAULT NULL,
  `upfront` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prof_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `firstMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `secondMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `thirdMonth` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prof_fee_month` decimal(10,2) NOT NULL DEFAULT '0.00',
  `firstStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `secondStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `thirdStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `forthStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fifthStage` double(10,2) NOT NULL,
  `prof_fee_stage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_finance_invoice`
--

CREATE TABLE `dm_finance_invoice` (
  `id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `ag_no` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice` int NOT NULL,
  `created` int NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4687`
--

CREATE TABLE `dm_form_4687` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `migrate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_range` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `immigration_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `your_preferred_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `done` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4688`
--

CREATE TABLE `dm_form_4688` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `migrate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_range` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `immigration_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `your_preferred_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `done` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4689`
--

CREATE TABLE `dm_form_4689` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `migrate` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age_range` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `immigration_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `your_preferred_location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `done` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4690`
--

CREATE TABLE `dm_form_4690` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `your_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4691`
--

CREATE TABLE `dm_form_4691` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `your_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_form_4695`
--

CREATE TABLE `dm_form_4695` (
  `id` bigint NOT NULL,
  `db4_status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment_or_message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `form_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_gary_contract`
--

CREATE TABLE `dm_gary_contract` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `contract` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `contract_signed` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_groups`
--

CREATE TABLE `dm_groups` (
  `id` int NOT NULL,
  `team_id` int NOT NULL,
  `desgination_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_hourly_lead_counts`
--

CREATE TABLE `dm_hourly_lead_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_job_search_qualification`
--

CREATE TABLE `dm_job_search_qualification` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL,
  `created_by` date NOT NULL,
  `created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_ops_company_interview`
--

CREATE TABLE `dm_js_ops_company_interview` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `request_letter_received` int NOT NULL,
  `Passport_sent_to_embassy` int NOT NULL,
  `passport_received_from_embassy` int NOT NULL,
  `document_file` int NOT NULL,
  `created_by` int NOT NULL,
  `created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_ops_lang_prof`
--

CREATE TABLE `dm_js_ops_lang_prof` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `tab` int DEFAULT '0',
  `langTest` varchar(255) DEFAULT NULL,
  `spLangTest` varchar(50) DEFAULT NULL,
  `testStatus` varchar(255) DEFAULT NULL,
  `expiryDate` varchar(55) DEFAULT NULL,
  `testDate` varchar(55) DEFAULT NULL,
  `testScore` varchar(255) DEFAULT NULL,
  `rating` varchar(10) DEFAULT NULL,
  `reading` varchar(10) DEFAULT NULL,
  `writing` varchar(10) DEFAULT NULL,
  `listening` varchar(10) DEFAULT NULL,
  `speaking` varchar(10) DEFAULT NULL,
  `meetingreq` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_ops_monthly_status`
--

CREATE TABLE `dm_js_ops_monthly_status` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `invitation_received_date` int NOT NULL,
  `last_date_of_submission` int NOT NULL,
  `documents_received_from_client` int NOT NULL,
  `documents_status` int NOT NULL,
  `application_submission_date` int NOT NULL,
  `application_status` int NOT NULL,
  `additional_requirement_sent_to_client` int NOT NULL,
  `document_file` int NOT NULL,
  `created` int NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_ops_nomination`
--

CREATE TABLE `dm_js_ops_nomination` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `date_of_landing` int NOT NULL,
  `service` int NOT NULL,
  `document_file` int NOT NULL,
  `created` int NOT NULL,
  `created_by` int NOT NULL,
  `tab` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_ops_prescreening`
--

CREATE TABLE `dm_js_ops_prescreening` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `prescreening_date` date NOT NULL,
  `prescreening_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `interview_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_js_resume_writing`
--

CREATE TABLE `dm_js_resume_writing` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `resume_date` date NOT NULL,
  `resume_draft` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_passport` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `education` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `education_document` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `national_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `level_one_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `level_two_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `final_copy_resume` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tab` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_leads_emailers`
--

CREATE TABLE `dm_leads_emailers` (
  `id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` int NOT NULL,
  `created` date NOT NULL,
  `sent` int NOT NULL,
  `month` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lead_counts`
--

CREATE TABLE `dm_lead_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lead_live_chat_counts`
--

CREATE TABLE `dm_lead_live_chat_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lead_lp_counts`
--

CREATE TABLE `dm_lead_lp_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lead_shj_counts`
--

CREATE TABLE `dm_lead_shj_counts` (
  `id` int NOT NULL,
  `branch_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `lead_count` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_leave_history`
--

CREATE TABLE `dm_leave_history` (
  `id` int NOT NULL,
  `custId` int NOT NULL,
  `applyDate` date NOT NULL,
  `fromDate` date NOT NULL,
  `toDate` date NOT NULL,
  `type` varchar(255) NOT NULL,
  `approvBy` varchar(555) NOT NULL,
  `requestedTo` varchar(255) NOT NULL,
  `requested_time_from` time NOT NULL,
  `requested_time_to` time NOT NULL,
  `remark` text NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `file` varchar(50) NOT NULL,
  `reject` varchar(100) NOT NULL,
  `reject_remarks` longtext NOT NULL,
  `notf` int NOT NULL,
  `approved_date` date NOT NULL,
  `reject_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_leave_type`
--

CREATE TABLE `dm_leave_type` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_library`
--

CREATE TABLE `dm_library` (
  `id` int NOT NULL,
  `groups` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `files` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `file_type` int NOT NULL,
  `file_of_folder` int NOT NULL,
  `folder_id` int NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_library_folders`
--

CREATE TABLE `dm_library_folders` (
  `id` int NOT NULL,
  `folder_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_live_chat_leads`
--

CREATE TABLE `dm_live_chat_leads` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` int NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `businesstype` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `emp_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `lead_remark` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lmia_brief`
--

CREATE TABLE `dm_lmia_brief` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `third_party_amt` double(10,2) NOT NULL,
  `dm_amt` double(10,2) NOT NULL,
  `tax_amt` double(10,2) NOT NULL,
  `refund_amt` double(10,2) NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_lmia_payment_adjustments`
--

CREATE TABLE `dm_lmia_payment_adjustments` (
  `id` int NOT NULL,
  `lead_Id` int NOT NULL,
  `stage_1` double(10,2) NOT NULL,
  `stage_2` double(10,2) NOT NULL,
  `stage_3` double(10,2) NOT NULL,
  `stage_4` double(10,2) NOT NULL,
  `stage_5` double(10,2) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_logs`
--

CREATE TABLE `dm_logs` (
  `id` int NOT NULL,
  `date/time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `action` varchar(255) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `done by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_new_client`
--

CREATE TABLE `dm_new_client` (
  `id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_sent` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_observation_file`
--

CREATE TABLE `dm_observation_file` (
  `id` int NOT NULL,
  `country` int NOT NULL,
  `service` int NOT NULL,
  `file` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_official_emails`
--

CREATE TABLE `dm_official_emails` (
  `id` int NOT NULL,
  `branch` int NOT NULL,
  `frontend` varchar(255) NOT NULL,
  `backend` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_old_data`
--

CREATE TABLE `dm_old_data` (
  `id` int NOT NULL,
  `col_0` varchar(255) NOT NULL,
  `col_1` varchar(255) NOT NULL,
  `col_2` varchar(255) NOT NULL,
  `col_3` varchar(255) NOT NULL,
  `col_4` varchar(255) NOT NULL,
  `col_5` varchar(255) NOT NULL,
  `col_6` varchar(255) NOT NULL,
  `col_7` varchar(255) NOT NULL,
  `col_8` varchar(255) NOT NULL,
  `col_9` varchar(255) NOT NULL,
  `col_10` varchar(255) NOT NULL,
  `col_11` varchar(255) NOT NULL,
  `col_12` varchar(255) NOT NULL,
  `col_13` varchar(255) NOT NULL,
  `col_14` varchar(255) NOT NULL,
  `col_15` varchar(255) NOT NULL,
  `col_16` varchar(255) NOT NULL,
  `col_17` varchar(255) NOT NULL,
  `col_18` varchar(255) NOT NULL,
  `col_19` varchar(255) NOT NULL,
  `col_20` varchar(255) NOT NULL,
  `col_21` varchar(255) NOT NULL,
  `col_22` varchar(255) NOT NULL,
  `col_23` varchar(255) NOT NULL,
  `col_24` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_old_payment`
--

CREATE TABLE `dm_old_payment` (
  `id` int NOT NULL,
  `agreeNo` varchar(111) DEFAULT NULL,
  `recieptno` int NOT NULL,
  `paydate` varchar(50) NOT NULL,
  `payCategory` varchar(55) DEFAULT NULL,
  `payMethod` varchar(55) DEFAULT NULL,
  `payTotal` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `taxAmt` decimal(10,2) NOT NULL,
  `payBalance` decimal(10,2) NOT NULL,
  `payAmt` decimal(10,2) NOT NULL,
  `totPayAmt` decimal(10,2) NOT NULL,
  `totBalance` decimal(10,2) NOT NULL,
  `nextPayAmt` decimal(10,2) NOT NULL,
  `nextPayDate` varchar(50) NOT NULL,
  `demdRemark` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_operation_allocations`
--

CREATE TABLE `dm_operation_allocations` (
  `id` int NOT NULL,
  `case_officer` int NOT NULL,
  `branch` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL,
  `is_deleted` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_business_documents`
--

CREATE TABLE `dm_ops_business_documents` (
  `id` int NOT NULL,
  `opsId` int DEFAULT NULL,
  `doc_type` varchar(100) DEFAULT NULL,
  `doc_uploaded_for` varchar(255) DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `name` varchar(555) DEFAULT NULL,
  `file` varchar(555) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `download_file` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_business_dos`
--

CREATE TABLE `dm_ops_business_dos` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `LOSissuanceDate` date NOT NULL,
  `LOSexpiryDate` date NOT NULL,
  `designated_entity_name` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `PRFilingDate` date NOT NULL,
  `LOSFile` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `comments` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_busines_canada`
--

CREATE TABLE `dm_ops_busines_canada` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `ecaReceDate` varchar(55) NOT NULL,
  `ecaPackage` varchar(255) NOT NULL,
  `ecaDocStatus` varchar(255) NOT NULL,
  `ecaAssmBody` varchar(255) NOT NULL,
  `ecaApplyDate` varchar(55) NOT NULL,
  `ecaPayMode` varchar(255) NOT NULL,
  `ecaTranSent` varchar(255) NOT NULL,
  `ecaTranStatus` varchar(255) NOT NULL,
  `ecaStatus` varchar(255) NOT NULL,
  `compDate` varchar(55) NOT NULL,
  `expVisit` varchar(255) NOT NULL,
  `expAgent` varchar(255) NOT NULL,
  `expCounty` varchar(255) NOT NULL,
  `expSdate` varchar(55) NOT NULL,
  `expEdate` varchar(55) NOT NULL,
  `ndPA` varchar(55) NOT NULL,
  `ndSpouse` varchar(55) NOT NULL,
  `ndDepend` varchar(55) NOT NULL,
  `pgPA` varchar(55) NOT NULL,
  `pgSpouse` varchar(55) NOT NULL,
  `pgDepend` varchar(55) NOT NULL,
  `piPA` varchar(55) NOT NULL,
  `piSpouse` varchar(55) NOT NULL,
  `piDepend` varchar(55) NOT NULL,
  `eiReceDate` varchar(55) NOT NULL,
  `eiRewDate` varchar(55) NOT NULL,
  `eiFinDate` varchar(55) NOT NULL,
  `eiSentDate` varchar(55) NOT NULL,
  `eiConfDate` varchar(55) NOT NULL,
  `eiSubDate` varchar(55) NOT NULL,
  `eiInvtDate` varchar(55) NOT NULL,
  `eiValdDate` varchar(55) NOT NULL,
  `visaPaySts` varchar(55) NOT NULL,
  `visaPayDate` varchar(55) NOT NULL,
  `docGivDate` varchar(55) NOT NULL,
  `docRecDate` varchar(55) NOT NULL,
  `docStatus` varchar(55) NOT NULL,
  `docRewDate` varchar(55) NOT NULL,
  `docFowDate` varchar(55) NOT NULL,
  `docFeeDate` varchar(55) NOT NULL,
  `docRepDate` varchar(55) NOT NULL,
  `visaReqRecDate` varchar(55) NOT NULL,
  `visaValdDate` varchar(55) NOT NULL,
  `visaInfDate` varchar(55) NOT NULL,
  `visaApptDate` varchar(55) NOT NULL,
  `visaDocRecDate` varchar(55) NOT NULL,
  `visaDocRewDate` varchar(55) NOT NULL,
  `visaDocSubDate` varchar(55) NOT NULL,
  `visaConSentDate` varchar(55) NOT NULL,
  `intwRecDate` varchar(55) NOT NULL,
  `intSchDate` varchar(55) NOT NULL,
  `intInfmDate` varchar(55) NOT NULL,
  `intFixdDate` varchar(55) NOT NULL,
  `intBrfDate` varchar(55) NOT NULL,
  `intDocDate` varchar(55) NOT NULL,
  `intDocRecDate` varchar(55) NOT NULL,
  `intPrep` varchar(55) NOT NULL,
  `intResult` varchar(55) NOT NULL,
  `paReceDate` varchar(55) NOT NULL,
  `paAgreDate` varchar(55) NOT NULL,
  `paSentDate` varchar(55) NOT NULL,
  `paConfDate` varchar(55) NOT NULL,
  `waRecDate` varchar(55) NOT NULL,
  `waInfDate` varchar(55) NOT NULL,
  `waFixDate` varchar(55) NOT NULL,
  `waHandDate` varchar(55) NOT NULL,
  `waDocRecDate` varchar(55) NOT NULL,
  `waDocRewDate` varchar(55) NOT NULL,
  `waDocSignDate` varchar(55) NOT NULL,
  `waAppFinDate` varchar(55) NOT NULL,
  `waAppSubDate` varchar(55) NOT NULL,
  `waAppSentDate` varchar(55) NOT NULL,
  `waFileRecDate` varchar(55) NOT NULL,
  `waReqRecDate` varchar(55) NOT NULL,
  `waMedRecDate` varchar(55) NOT NULL,
  `waMedSubDate` varchar(55) NOT NULL,
  `waPapRecDate` varchar(55) NOT NULL,
  `remark` text NOT NULL,
  `tab1File` varchar(255) NOT NULL,
  `tab2File` varchar(255) NOT NULL,
  `tab3File` varchar(255) NOT NULL,
  `tab4File` varchar(255) NOT NULL,
  `tab5File` varchar(255) NOT NULL,
  `tab6File` varchar(255) NOT NULL,
  `tab7File` varchar(255) NOT NULL,
  `tab8File` varchar(255) NOT NULL,
  `tab9File` varchar(255) NOT NULL,
  `tab10File` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_busines_poland`
--

CREATE TABLE `dm_ops_busines_poland` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `tvApplyDate` varchar(55) NOT NULL,
  `tvResltDate` varchar(55) NOT NULL,
  `tvApprDate` varchar(55) NOT NULL,
  `tvStatus` varchar(55) NOT NULL,
  `poVisitDate` varchar(55) NOT NULL,
  `poRtrnDate` varchar(55) NOT NULL,
  `poStatus` varchar(55) NOT NULL,
  `crRegDate` varchar(55) NOT NULL,
  `crStatus` varchar(55) NOT NULL,
  `baOpenDate` varchar(55) NOT NULL,
  `baStatus` varchar(55) NOT NULL,
  `fundTranDate` varchar(55) NOT NULL,
  `fundStatus` varchar(55) NOT NULL,
  `afPA` varchar(55) NOT NULL,
  `afSpouse` varchar(55) NOT NULL,
  `afDepend` varchar(55) NOT NULL,
  `visaReqRecDate` varchar(55) NOT NULL,
  `visaValdDate` varchar(55) NOT NULL,
  `visaInfDate` varchar(55) NOT NULL,
  `visaApptDate` varchar(55) NOT NULL,
  `visaDocRecDate` varchar(55) NOT NULL,
  `visaDocRewDate` varchar(55) NOT NULL,
  `visaDocSubDate` varchar(55) NOT NULL,
  `visaConSentDate` varchar(55) NOT NULL,
  `waHandDate` varchar(55) NOT NULL,
  `waDocRecDate` varchar(55) NOT NULL,
  `waDocRewDate` varchar(55) NOT NULL,
  `waDocSignDate` varchar(55) NOT NULL,
  `waAppFinDate` varchar(55) NOT NULL,
  `waAppSubDate` varchar(55) NOT NULL,
  `waFormRecDate` varchar(55) NOT NULL,
  `passPA` varchar(55) NOT NULL,
  `passSpouse` varchar(55) NOT NULL,
  `passDepnd` varchar(55) NOT NULL,
  `passStatus` varchar(55) NOT NULL,
  `rvPA` varchar(55) NOT NULL,
  `rvSpouse` varchar(55) NOT NULL,
  `rvDepnd` varchar(55) NOT NULL,
  `rvStatus` varchar(55) NOT NULL,
  `idPA` varchar(55) NOT NULL,
  `idSpouse` varchar(55) NOT NULL,
  `idDepnd` varchar(55) NOT NULL,
  `idStatus` varchar(55) NOT NULL,
  `bioPA` varchar(55) NOT NULL,
  `bioSpouse` varchar(55) NOT NULL,
  `bioDepnd` varchar(55) NOT NULL,
  `bioStatus` varchar(55) NOT NULL,
  `schePA` varchar(55) NOT NULL,
  `scheSpouse` varchar(55) NOT NULL,
  `scheDepnd` varchar(55) NOT NULL,
  `scheStatus` varchar(55) NOT NULL,
  `insurPA` varchar(55) NOT NULL,
  `insurSpouse` varchar(55) NOT NULL,
  `insurDepnd` varchar(55) NOT NULL,
  `insurStatus` varchar(55) NOT NULL,
  `nocPA` varchar(55) NOT NULL,
  `nocSpouse` varchar(55) NOT NULL,
  `nocDepnd` varchar(55) NOT NULL,
  `nocStatus` varchar(55) NOT NULL,
  `itinPA` varchar(55) NOT NULL,
  `itinSpouse` varchar(55) NOT NULL,
  `itinDepnd` varchar(55) NOT NULL,
  `itinStatus` varchar(55) NOT NULL,
  `purPA` varchar(55) NOT NULL,
  `purSpouse` varchar(55) NOT NULL,
  `purDepnd` varchar(55) NOT NULL,
  `purStatus` varchar(55) NOT NULL,
  `pbsPA` varchar(55) NOT NULL,
  `pbsSpouse` varchar(55) NOT NULL,
  `pbsDepnd` varchar(55) NOT NULL,
  `pbsStatus` varchar(55) NOT NULL,
  `bbsPA` varchar(55) NOT NULL,
  `bbsSpouse` varchar(55) NOT NULL,
  `bbsDepnd` varchar(55) NOT NULL,
  `bbsStatus` varchar(55) NOT NULL,
  `licePA` varchar(55) NOT NULL,
  `liceSpouse` varchar(55) NOT NULL,
  `liceDepnd` varchar(55) NOT NULL,
  `liceStatus` varchar(55) NOT NULL,
  `estaPA` varchar(55) NOT NULL,
  `estaSpouse` varchar(55) NOT NULL,
  `estaDepnd` varchar(55) NOT NULL,
  `estaStatus` varchar(55) NOT NULL,
  `partPA` varchar(55) NOT NULL,
  `partSpouse` varchar(55) NOT NULL,
  `partDepnd` varchar(55) NOT NULL,
  `partStatus` varchar(55) NOT NULL,
  `nocOtherPA` varchar(55) NOT NULL,
  `nocOtherSpouse` varchar(55) NOT NULL,
  `nocOtherDepnd` varchar(55) NOT NULL,
  `nocOtherStatus` varchar(55) NOT NULL,
  `remark` text NOT NULL,
  `tab1File` varchar(255) NOT NULL,
  `tab2File` varchar(255) NOT NULL,
  `tab3File` varchar(255) NOT NULL,
  `tab4File` varchar(255) NOT NULL,
  `tab5File` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_busines_uk`
--

CREATE TABLE `dm_ops_busines_uk` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `passPA` varchar(55) NOT NULL,
  `passSpouse` varchar(55) NOT NULL,
  `passDepnd` varchar(55) NOT NULL,
  `idPA` varchar(55) NOT NULL,
  `idSpouse` varchar(55) NOT NULL,
  `idDepnd` varchar(55) NOT NULL,
  `birthPA` varchar(55) NOT NULL,
  `birthSpouse` varchar(55) NOT NULL,
  `birthDepnd` varchar(55) NOT NULL,
  `eduPA` varchar(55) NOT NULL,
  `eduSpouse` varchar(55) NOT NULL,
  `eduDepnd` varchar(55) NOT NULL,
  `pbsPA` varchar(55) NOT NULL,
  `pbsSpouse` varchar(55) NOT NULL,
  `pbsDepnd` varchar(55) NOT NULL,
  `pbcPA` varchar(55) NOT NULL,
  `pbcSpouse` varchar(55) NOT NULL,
  `pbcDepnd` varchar(55) NOT NULL,
  `tplPA` varchar(55) NOT NULL,
  `tplSpouse` varchar(55) NOT NULL,
  `tplDepnd` varchar(55) NOT NULL,
  `tpbPA` varchar(55) NOT NULL,
  `tpbSpouse` varchar(55) NOT NULL,
  `tpbDepnd` varchar(55) NOT NULL,
  `tpsPA` varchar(55) NOT NULL,
  `tpsSpouse` varchar(55) NOT NULL,
  `tpsDepnd` varchar(55) NOT NULL,
  `tpbsPA` varchar(55) NOT NULL,
  `tpbsSpouse` varchar(55) NOT NULL,
  `tpbsDepnd` varchar(55) NOT NULL,
  `tpbcPA` varchar(55) NOT NULL,
  `tpbcSpouse` varchar(55) NOT NULL,
  `tpbcDepnd` varchar(55) NOT NULL,
  `visaReqRecDate` varchar(55) NOT NULL,
  `visaValdDate` varchar(55) NOT NULL,
  `visaInfDate` varchar(55) NOT NULL,
  `visaApptDate` varchar(55) NOT NULL,
  `visaDocRecDate` varchar(55) NOT NULL,
  `visaDocRewDate` varchar(55) NOT NULL,
  `visaDocSubDate` varchar(55) NOT NULL,
  `visaConSentDate` varchar(55) NOT NULL,
  `intwRecDate` varchar(55) NOT NULL,
  `intSchDate` varchar(55) NOT NULL,
  `intInfmDate` varchar(55) NOT NULL,
  `intFixdDate` varchar(55) NOT NULL,
  `intBrfDate` varchar(55) NOT NULL,
  `intDocDate` varchar(55) NOT NULL,
  `intDocRecDate` varchar(55) NOT NULL,
  `intPrep` varchar(55) NOT NULL,
  `intResult` varchar(55) NOT NULL,
  `waHandDate` varchar(55) NOT NULL,
  `waDocRecDate` varchar(55) NOT NULL,
  `waDocRewDate` varchar(55) NOT NULL,
  `waDocSignDate` varchar(55) NOT NULL,
  `waAppFinDate` varchar(55) NOT NULL,
  `waAppSubDate` varchar(55) NOT NULL,
  `waFormRecDate` varchar(55) NOT NULL,
  `remark` text NOT NULL,
  `tab1File` varchar(255) NOT NULL,
  `tab2File` varchar(255) NOT NULL,
  `tab3File` varchar(255) NOT NULL,
  `tab4File` varchar(255) NOT NULL,
  `tab5File` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_busines_usa`
--

CREATE TABLE `dm_ops_busines_usa` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `escAgre` varchar(55) NOT NULL,
  `escAgreDate` varchar(55) NOT NULL,
  `passCopy` varchar(55) NOT NULL,
  `passCopyDate` varchar(55) NOT NULL,
  `escAgreCopy` varchar(55) NOT NULL,
  `escAgreCopyDate` varchar(55) NOT NULL,
  `acouDets` varchar(55) NOT NULL,
  `acouDetsDate` varchar(55) NOT NULL,
  `wireTrans` varchar(55) NOT NULL,
  `wireTransDate` varchar(55) NOT NULL,
  `profFund` varchar(55) NOT NULL,
  `profFundDate` varchar(55) NOT NULL,
  `subAgre` varchar(55) NOT NULL,
  `subAgreDate` varchar(55) NOT NULL,
  `g28` varchar(55) NOT NULL,
  `g28Date` varchar(55) NOT NULL,
  `i526` varchar(55) NOT NULL,
  `i526Date` varchar(55) NOT NULL,
  `w8Ben` varchar(55) NOT NULL,
  `w8BenDate` varchar(55) NOT NULL,
  `passPA` varchar(55) NOT NULL,
  `passSpouse` varchar(55) NOT NULL,
  `passDepnd` varchar(55) NOT NULL,
  `idPA` varchar(55) NOT NULL,
  `idSpouse` varchar(55) NOT NULL,
  `idDepnd` varchar(55) NOT NULL,
  `birthPA` varchar(55) NOT NULL,
  `birthSpouse` varchar(55) NOT NULL,
  `birthDepnd` varchar(55) NOT NULL,
  `eduPA` varchar(55) NOT NULL,
  `eduSpouse` varchar(55) NOT NULL,
  `eduDepnd` varchar(55) NOT NULL,
  `pbsPA` varchar(55) NOT NULL,
  `resmPA` varchar(55) NOT NULL,
  `nDocPA` varchar(55) NOT NULL,
  `nDocSpouse` varchar(55) NOT NULL,
  `nDocDepnd` varchar(55) NOT NULL,
  `nwrPA` varchar(55) NOT NULL,
  `nwrSpouse` varchar(55) NOT NULL,
  `nwrDepnd` varchar(55) NOT NULL,
  `pifPA` varchar(55) NOT NULL,
  `pifSpouse` varchar(55) NOT NULL,
  `pifDepnd` varchar(55) NOT NULL,
  `i526FeePA` varchar(55) NOT NULL,
  `nvcFeePA` varchar(55) NOT NULL,
  `nvcFeeSpouse` varchar(55) NOT NULL,
  `nvcFeeDepent` varchar(55) NOT NULL,
  `ds260PA` varchar(55) NOT NULL,
  `ds260Spouse` varchar(55) NOT NULL,
  `ds260Depent` varchar(55) NOT NULL,
  `ds260Sts` varchar(55) NOT NULL,
  `passCopyPA` varchar(55) NOT NULL,
  `passCopySpouse` varchar(55) NOT NULL,
  `passCopyDepent` varchar(55) NOT NULL,
  `passCopySts` varchar(55) NOT NULL,
  `birthCertPA` varchar(55) NOT NULL,
  `birthCertSpouse` varchar(55) NOT NULL,
  `birthCertDepent` varchar(55) NOT NULL,
  `birthCertSts` varchar(55) NOT NULL,
  `marCertPA` varchar(55) NOT NULL,
  `marCertSpouse` varchar(55) NOT NULL,
  `marCertDepent` varchar(55) NOT NULL,
  `marCertSts` varchar(55) NOT NULL,
  `natIdPA` varchar(55) NOT NULL,
  `natIdSpouse` varchar(55) NOT NULL,
  `natIdDepent` varchar(55) NOT NULL,
  `natIdSts` varchar(55) NOT NULL,
  `resProfPA` varchar(55) NOT NULL,
  `resProfSpouse` varchar(55) NOT NULL,
  `resProfDepent` varchar(55) NOT NULL,
  `resProfSts` varchar(55) NOT NULL,
  `pasPhotoPA` varchar(55) NOT NULL,
  `pasPhotoSpouse` varchar(55) NOT NULL,
  `pasPhotoDepent` varchar(55) NOT NULL,
  `pasPhotoSts` varchar(55) NOT NULL,
  `polCertPA` varchar(55) NOT NULL,
  `polCertSpouse` varchar(55) NOT NULL,
  `polCertDepent` varchar(55) NOT NULL,
  `polCertSts` varchar(55) NOT NULL,
  `visaReqRecDate` varchar(55) NOT NULL,
  `visaValdDate` varchar(55) NOT NULL,
  `visaInfDate` varchar(55) NOT NULL,
  `visaApptDate` varchar(55) NOT NULL,
  `visaDocRecDate` varchar(55) NOT NULL,
  `visaDocRewDate` varchar(55) NOT NULL,
  `visaDocSubDate` varchar(55) NOT NULL,
  `visaConSentDate` varchar(55) NOT NULL,
  `intwRecDate` varchar(55) NOT NULL,
  `intSchDate` varchar(55) NOT NULL,
  `intInfmDate` varchar(55) NOT NULL,
  `intFixdDate` varchar(55) NOT NULL,
  `intBrfDate` varchar(55) NOT NULL,
  `intDocDate` varchar(55) NOT NULL,
  `intDocRecDate` varchar(55) NOT NULL,
  `intPrep` varchar(55) NOT NULL,
  `intResult` varchar(55) NOT NULL,
  `waHandDate` varchar(55) NOT NULL,
  `waDocRecDate` varchar(55) NOT NULL,
  `waDocRewDate` varchar(55) NOT NULL,
  `waDocSignDate` varchar(55) NOT NULL,
  `waAppFinDate` varchar(55) NOT NULL,
  `waAppSubDate` varchar(55) NOT NULL,
  `waFormRecDate` varchar(55) NOT NULL,
  `remark` text NOT NULL,
  `tab1File` varchar(255) NOT NULL,
  `tab2File` varchar(255) NOT NULL,
  `tab3File` varchar(255) NOT NULL,
  `tab4File` varchar(255) NOT NULL,
  `tab5File` varchar(255) NOT NULL,
  `tab6File` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_conversation`
--

CREATE TABLE `dm_ops_conversation` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `date` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `conversation` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci,
  `emp` int NOT NULL DEFAULT '0',
  `automated` int NOT NULL DEFAULT '0',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `followup` date NOT NULL,
  `status` int NOT NULL,
  `followup_remarks` longtext NOT NULL,
  `conversation_status` varchar(50) NOT NULL,
  `status_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_conversation_old`
--

CREATE TABLE `dm_ops_conversation_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(111) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `conversation` text,
  `emp` int DEFAULT NULL,
  `followup` date NOT NULL,
  `status` int NOT NULL,
  `status_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_documents`
--

CREATE TABLE `dm_ops_documents` (
  `id` int NOT NULL,
  `opsId` int DEFAULT NULL,
  `doc_type` varchar(100) DEFAULT NULL,
  `doc_uploaded_for` varchar(255) DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `name` varchar(555) DEFAULT NULL,
  `file` varchar(555) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `download_file` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_documents_old`
--

CREATE TABLE `dm_ops_documents_old` (
  `id` int NOT NULL,
  `opsId` int NOT NULL,
  `agreeNo` varchar(111) NOT NULL,
  `tab` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `file` varchar(555) NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_lang_prof`
--

CREATE TABLE `dm_ops_lang_prof` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `tab` int DEFAULT '0',
  `langTest` varchar(255) DEFAULT NULL,
  `spLangTest` varchar(50) DEFAULT NULL,
  `testStatus` varchar(255) DEFAULT NULL,
  `expiryDate` varchar(55) DEFAULT NULL,
  `testDate` varchar(55) DEFAULT NULL,
  `testScore` varchar(255) DEFAULT NULL,
  `rating` varchar(10) DEFAULT NULL,
  `reading` varchar(10) DEFAULT NULL,
  `writing` varchar(10) DEFAULT NULL,
  `listening` varchar(10) DEFAULT NULL,
  `speaking` varchar(10) DEFAULT NULL,
  `meetingreq` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_lang_prof_old`
--

CREATE TABLE `dm_ops_lang_prof_old` (
  `id` int NOT NULL,
  `agreeNo` int NOT NULL,
  `tab` int NOT NULL,
  `langTest` varchar(255) NOT NULL,
  `spLangTest` varchar(100) NOT NULL,
  `testStatus` varchar(255) NOT NULL,
  `expiryDate` varchar(55) NOT NULL,
  `testDate` varchar(55) NOT NULL,
  `testScore` varchar(255) NOT NULL,
  `rating` varchar(10) NOT NULL,
  `reading` varchar(10) NOT NULL,
  `writing` varchar(10) NOT NULL,
  `listening` varchar(10) NOT NULL,
  `speaking` varchar(10) NOT NULL,
  `meetingreq` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_lang_prof_spouse`
--

CREATE TABLE `dm_ops_lang_prof_spouse` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `tab` int DEFAULT NULL,
  `langTest` varchar(255) DEFAULT NULL,
  `testStatus` varchar(255) DEFAULT NULL,
  `expiryDate` varchar(55) DEFAULT NULL,
  `testDate` varchar(55) DEFAULT NULL,
  `testScore` varchar(255) DEFAULT NULL,
  `rating` varchar(10) DEFAULT NULL,
  `reading` varchar(10) DEFAULT NULL,
  `writing` varchar(10) DEFAULT NULL,
  `listening` varchar(10) DEFAULT NULL,
  `speaking` varchar(10) DEFAULT NULL,
  `meetingreq` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_lang_prof_spouse_old`
--

CREATE TABLE `dm_ops_lang_prof_spouse_old` (
  `id` int NOT NULL,
  `agreeNo` int NOT NULL,
  `tab` int NOT NULL,
  `langTest` varchar(255) NOT NULL,
  `testStatus` varchar(255) NOT NULL,
  `expiryDate` varchar(55) NOT NULL,
  `testDate` varchar(55) NOT NULL,
  `testScore` varchar(255) NOT NULL,
  `rating` varchar(10) NOT NULL,
  `reading` varchar(10) NOT NULL,
  `writing` varchar(10) NOT NULL,
  `listening` varchar(10) NOT NULL,
  `speaking` varchar(10) NOT NULL,
  `meetingreq` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_lmia`
--

CREATE TABLE `dm_ops_lmia` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `noc` date NOT NULL,
  `lmia_submit_date` date NOT NULL,
  `lmia_status` varchar(100) NOT NULL,
  `date_of_approved` date NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_medical_request`
--

CREATE TABLE `dm_ops_medical_request` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `MedicalRequestDate` date NOT NULL,
  `CompletionDate` date NOT NULL,
  `SubmissionDate` date NOT NULL,
  `comments` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_poland_application`
--

CREATE TABLE `dm_ops_poland_application` (
  `id` int NOT NULL,
  `tab` int DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `docSubDate` date DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `visaStatus` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `agent` varchar(20) NOT NULL,
  `amount_to_agent` double(10,2) NOT NULL,
  `appointment_status` varchar(20) NOT NULL,
  `appointment_date` date NOT NULL,
  `place` varchar(50) NOT NULL,
  `created` date DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_poland_jol`
--

CREATE TABLE `dm_ops_poland_jol` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `jol_received` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `jol_received_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `loc_pay` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_poland_loc`
--

CREATE TABLE `dm_ops_poland_loc` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `loc_received` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loc_received_date` date NOT NULL,
  `loc_designation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loc_company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loc_salary` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `handover_status` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `handover_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `wp_pay` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia`
--

CREATE TABLE `dm_ops_skill_australia` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `langTest` varchar(255) NOT NULL,
  `testStatus` varchar(255) NOT NULL,
  `expiryDate` varchar(55) NOT NULL,
  `testDate` varchar(55) NOT NULL,
  `testScore` varchar(255) NOT NULL,
  `reading` float NOT NULL,
  `writing` float NOT NULL,
  `listening` float NOT NULL,
  `speaking` float NOT NULL,
  `spLangTest` varchar(255) NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL,
  `eoiLodgDate` varchar(55) NOT NULL,
  `eoiExpDate` varchar(55) NOT NULL,
  `eoiPoint` varchar(255) NOT NULL,
  `eoiStatus` varchar(255) NOT NULL,
  `eoiFund` varchar(255) NOT NULL,
  `eoiState` varchar(555) NOT NULL,
  `nomState` varchar(555) NOT NULL,
  `nomSubDate` varchar(55) NOT NULL,
  `nomExpDate` varchar(55) NOT NULL,
  `itaDate` varchar(55) NOT NULL,
  `itaExpDate` varchar(55) NOT NULL,
  `visaSubDate` varchar(55) NOT NULL,
  `medExam` varchar(255) NOT NULL,
  `policeClear` varchar(255) NOT NULL,
  `visaStatus` varchar(255) NOT NULL,
  `landDate` varchar(55) NOT NULL,
  `landService` varchar(555) NOT NULL,
  `remark` text NOT NULL,
  `langFile` varchar(255) NOT NULL,
  `skilFile` varchar(255) NOT NULL,
  `eoiFile` varchar(255) NOT NULL,
  `nomFile` varchar(255) NOT NULL,
  `visaFile` varchar(255) NOT NULL,
  `landFile` varchar(255) NOT NULL,
  `langTests` varchar(30) NOT NULL,
  `testStatuss` varchar(30) NOT NULL,
  `expiryDates` varchar(30) NOT NULL,
  `testDates` varchar(30) NOT NULL,
  `testScores` varchar(30) NOT NULL,
  `readings` float NOT NULL,
  `writings` float NOT NULL,
  `listenings` float NOT NULL,
  `speakings` float NOT NULL,
  `langFiles` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia_assess`
--

CREATE TABLE `dm_ops_skill_australia_assess` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia_assess_old`
--

CREATE TABLE `dm_ops_skill_australia_assess_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `skilFile` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia_assess_spouse`
--

CREATE TABLE `dm_ops_skill_australia_assess_spouse` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia_assess_spouse_old`
--

CREATE TABLE `dm_ops_skill_australia_assess_spouse_old` (
  `id` int NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `skilFile` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_australia_old`
--

CREATE TABLE `dm_ops_skill_australia_old` (
  `id` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `langTest` varchar(255) NOT NULL,
  `testStatus` varchar(255) NOT NULL,
  `expiryDate` varchar(55) NOT NULL,
  `testDate` varchar(55) NOT NULL,
  `testScore` varchar(255) NOT NULL,
  `reading` float NOT NULL,
  `writing` float NOT NULL,
  `listening` float NOT NULL,
  `speaking` float NOT NULL,
  `spLangTest` varchar(255) NOT NULL,
  `anzCode` varchar(255) NOT NULL,
  `chklistDate` varchar(55) NOT NULL,
  `resultDate` varchar(30) NOT NULL,
  `assmAuthority` varchar(255) NOT NULL,
  `assmSubDate` varchar(55) NOT NULL,
  `assmStatus` varchar(255) NOT NULL,
  `spSkillAssm` varchar(255) NOT NULL,
  `eoiLodgDate` varchar(55) NOT NULL,
  `eoiExpDate` varchar(55) NOT NULL,
  `eoiPoint` varchar(255) NOT NULL,
  `eoiStatus` varchar(255) NOT NULL,
  `eoiFund` varchar(255) NOT NULL,
  `eoiState` varchar(555) NOT NULL,
  `nomState` varchar(555) NOT NULL,
  `nomSubDate` varchar(55) NOT NULL,
  `nomExpDate` varchar(55) NOT NULL,
  `itaDate` varchar(55) NOT NULL,
  `itaExpDate` varchar(55) NOT NULL,
  `visaSubDate` varchar(55) NOT NULL,
  `medExam` varchar(255) NOT NULL,
  `policeClear` varchar(255) NOT NULL,
  `visaStatus` varchar(255) NOT NULL,
  `landDate` varchar(55) NOT NULL,
  `landService` varchar(555) NOT NULL,
  `remark` text NOT NULL,
  `langFile` varchar(255) NOT NULL,
  `skilFile` varchar(255) NOT NULL,
  `eoiFile` varchar(255) NOT NULL,
  `nomFile` varchar(255) NOT NULL,
  `visaFile` varchar(255) NOT NULL,
  `landFile` varchar(255) NOT NULL,
  `langTests` varchar(30) NOT NULL,
  `testStatuss` varchar(30) NOT NULL,
  `expiryDates` varchar(30) NOT NULL,
  `testDates` varchar(30) NOT NULL,
  `testScores` varchar(30) NOT NULL,
  `readings` float NOT NULL,
  `writings` float NOT NULL,
  `listenings` float NOT NULL,
  `speakings` float NOT NULL,
  `langFiles` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_canada_eca`
--

CREATE TABLE `dm_ops_skill_canada_eca` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `ecaReceDate` varchar(55) NOT NULL,
  `ecaPackage` varchar(255) NOT NULL,
  `ecaDocStatus` varchar(255) NOT NULL,
  `ecaAssmBody` varchar(255) NOT NULL,
  `ecaApplyDate` varchar(55) NOT NULL,
  `ecaPayMode` varchar(255) NOT NULL,
  `ecaTranSent` varchar(255) NOT NULL,
  `ecaTranStatus` varchar(255) NOT NULL,
  `ecaStatus` varchar(255) NOT NULL,
  `compDate` varchar(55) NOT NULL,
  `ecaFile` varchar(555) NOT NULL,
  `spQualify` varchar(255) NOT NULL,
  `specaReceDate` varchar(55) NOT NULL,
  `specaPackage` varchar(255) NOT NULL,
  `specaDocStatus` varchar(255) NOT NULL,
  `specaAssmBody` varchar(255) NOT NULL,
  `specaApplyDate` varchar(55) NOT NULL,
  `specaPayMode` varchar(255) NOT NULL,
  `specaTranSent` varchar(255) NOT NULL,
  `specaTranStatus` varchar(255) NOT NULL,
  `specaStatus` varchar(255) NOT NULL,
  `spcompDate` varchar(55) NOT NULL,
  `spEcaFile` varchar(555) NOT NULL,
  `visaReqDate` varchar(55) NOT NULL,
  `passSentDate` varchar(55) NOT NULL,
  `passReceDate` varchar(55) NOT NULL,
  `visaFile` varchar(255) NOT NULL,
  `landDate` varchar(55) NOT NULL,
  `landService` varchar(555) NOT NULL,
  `landFile` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `qualification` varchar(50) NOT NULL,
  `specialization` varchar(50) NOT NULL,
  `university` varchar(50) NOT NULL,
  `comments` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_canada_ee`
--

CREATE TABLE `dm_ops_skill_canada_ee` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `eeDocReceDate` varchar(55) NOT NULL,
  `eeDocSts` varchar(255) NOT NULL,
  `eePoint` varchar(255) NOT NULL,
  `eeNoc` varchar(255) NOT NULL,
  `eeSecNoc` varchar(255) NOT NULL,
  `eeProfLauDate` varchar(55) NOT NULL,
  `eeProfExpDate` varchar(55) NOT NULL,
  `eeScore` varchar(255) NOT NULL,
  `eestatus` varchar(30) NOT NULL,
  `eeFile` varchar(255) NOT NULL,
  `pnpLaun` varchar(255) NOT NULL,
  `pnpSubDate` varchar(55) NOT NULL,
  `pnpExpDate` varchar(55) NOT NULL,
  `pnpStatus` varchar(255) NOT NULL,
  `pnpFile` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_canada_ita`
--

CREATE TABLE `dm_ops_skill_canada_ita` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `itaReceDate` varchar(55) NOT NULL,
  `itaSubLastDate` varchar(55) NOT NULL,
  `itaDocReceDate` varchar(55) NOT NULL,
  `itaDocSts` varchar(255) NOT NULL,
  `itaSubDate` varchar(55) NOT NULL,
  `itaSts` varchar(255) NOT NULL,
  `itaAddiReqDate` varchar(55) NOT NULL,
  `itaexpdate` varchar(50) NOT NULL,
  `itaFile` varchar(255) NOT NULL,
  `visaReqDate` varchar(55) NOT NULL,
  `passSentDate` varchar(55) NOT NULL,
  `passReceDate` varchar(55) NOT NULL,
  `visaFile` varchar(255) NOT NULL,
  `landDate` varchar(55) NOT NULL,
  `landService` varchar(555) NOT NULL,
  `landFile` varchar(255) NOT NULL,
  `remark` text NOT NULL,
  `qualification` varchar(50) NOT NULL,
  `specialization` varchar(50) NOT NULL,
  `university` varchar(50) NOT NULL,
  `comments` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_skill_canada_old`
--

CREATE TABLE `dm_ops_skill_canada_old` (
  `id` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `ecaReceDate` varchar(55) NOT NULL,
  `ecaPackage` varchar(255) NOT NULL,
  `ecaDocStatus` varchar(255) NOT NULL,
  `ecaAssmBody` varchar(255) NOT NULL,
  `ecaApplyDate` varchar(55) NOT NULL,
  `ecaPayMode` varchar(255) NOT NULL,
  `ecaTranSent` varchar(255) NOT NULL,
  `ecaTranStatus` varchar(255) NOT NULL,
  `ecaStatus` varchar(255) NOT NULL,
  `compDate` varchar(55) NOT NULL,
  `ecaFile` varchar(555) NOT NULL,
  `spQualify` varchar(255) NOT NULL,
  `specaReceDate` varchar(55) NOT NULL,
  `specaPackage` varchar(255) NOT NULL,
  `specaDocStatus` varchar(255) NOT NULL,
  `specaAssmBody` varchar(255) NOT NULL,
  `specaApplyDate` varchar(55) NOT NULL,
  `specaPayMode` varchar(255) NOT NULL,
  `specaTranSent` varchar(255) NOT NULL,
  `specaTranStatus` varchar(255) NOT NULL,
  `specaStatus` varchar(255) NOT NULL,
  `spcompDate` varchar(55) NOT NULL,
  `spEcaFile` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `langTest` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `testStatus` varchar(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `expiryDate` varchar(55) NOT NULL,
  `testDate` varchar(55) NOT NULL,
  `testScore` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `spLangTest` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `langFile` varchar(255) NOT NULL,
  `eeDocReceDate` varchar(55) NOT NULL,
  `eeDocSts` varchar(255) NOT NULL,
  `eePoint` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `eeNoc` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `eeSecNoc` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `eeProfLauDate` varchar(55) NOT NULL,
  `eeProfExpDate` varchar(55) NOT NULL,
  `eeScore` varchar(255) NOT NULL,
  `eestatus` varchar(30) NOT NULL,
  `eeFile` varchar(255) NOT NULL,
  `pnpLaun` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `pnpSubDate` varchar(55) NOT NULL,
  `pnpExpDate` varchar(55) NOT NULL,
  `pnpStatus` varchar(255) NOT NULL,
  `pnpFile` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `itaReceDate` varchar(55) NOT NULL,
  `itaSubLastDate` varchar(55) NOT NULL,
  `itaDocReceDate` varchar(55) NOT NULL,
  `itaDocSts` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `itaSubDate` varchar(55) NOT NULL,
  `itaSts` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `itaAddiReqDate` varchar(55) NOT NULL,
  `itaFile` varchar(255) NOT NULL,
  `visaReqDate` varchar(55) NOT NULL,
  `passSentDate` varchar(55) NOT NULL,
  `passReceDate` varchar(55) NOT NULL,
  `visaFile` varchar(255) NOT NULL,
  `landDate` varchar(55) NOT NULL,
  `landService` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `landFile` varchar(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `remark` text NOT NULL,
  `qualification` varchar(50) NOT NULL,
  `specialization` varchar(50) NOT NULL,
  `university` varchar(50) NOT NULL,
  `rating` varchar(10) NOT NULL,
  `reading` varchar(10) NOT NULL,
  `writing` varchar(10) NOT NULL,
  `listening` varchar(10) NOT NULL,
  `speaking` varchar(10) NOT NULL,
  `statusS` varchar(20) NOT NULL,
  `expirydateS` varchar(20) NOT NULL,
  `readingS` varchar(10) NOT NULL,
  `writingS` varchar(10) NOT NULL,
  `listeningS` varchar(10) NOT NULL,
  `speakingS` varchar(10) NOT NULL,
  `testdateS` varchar(20) NOT NULL,
  `testscoreS` varchar(10) NOT NULL,
  `meetingreq` varchar(10) NOT NULL,
  `meetingreqS` varchar(10) NOT NULL,
  `comments` varchar(255) NOT NULL,
  `exp_status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_student_visa`
--

CREATE TABLE `dm_ops_student_visa` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `retnDate` varchar(55) NOT NULL,
  `agreeNo` varchar(255) NOT NULL,
  `docSubDate` varchar(55) NOT NULL,
  `planTravDate` varchar(55) NOT NULL,
  `descountry` varchar(55) NOT NULL,
  `university` varchar(555) NOT NULL,
  `docReceDate` varchar(55) NOT NULL,
  `appSub` varchar(555) NOT NULL,
  `appStatus` varchar(55) NOT NULL,
  `remark1` text NOT NULL,
  `docFile` varchar(255) NOT NULL,
  `appFile` varchar(255) NOT NULL,
  `remark2` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_updated_by`
--

CREATE TABLE `dm_ops_updated_by` (
  `lead_id` int NOT NULL,
  `counselor_id` int NOT NULL,
  `date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_visit_visa`
--

CREATE TABLE `dm_ops_visit_visa` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `retnDate` varchar(55) DEFAULT NULL,
  `agreeNo` varchar(255) DEFAULT NULL,
  `docSubDate` varchar(55) DEFAULT NULL,
  `planTravDate` varchar(55) DEFAULT NULL,
  `descountry` varchar(55) DEFAULT NULL,
  `university` varchar(555) DEFAULT NULL,
  `docReceDate` varchar(55) DEFAULT NULL,
  `appSub` varchar(555) DEFAULT NULL,
  `appStatus` varchar(55) DEFAULT NULL,
  `remark1` text,
  `docFile` varchar(255) DEFAULT NULL,
  `appFile` varchar(255) DEFAULT NULL,
  `remark2` varchar(255) DEFAULT NULL,
  `remark_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_ops_visit_visa_application`
--

CREATE TABLE `dm_ops_visit_visa_application` (
  `id` int NOT NULL,
  `tab` int DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `docReceDate` date DEFAULT NULL,
  `appSubDate` date DEFAULT NULL,
  `appSub` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `appStatus` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `num_of_applicants` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created` date DEFAULT NULL,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_op_team_allocations`
--

CREATE TABLE `dm_op_team_allocations` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `teams` varchar(255) NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_pay_history`
--

CREATE TABLE `dm_pay_history` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `counselor_receipt` varchar(255) NOT NULL,
  `tabby` double(10,2) NOT NULL,
  `date` date DEFAULT NULL,
  `payMethod` varchar(555) DEFAULT NULL,
  `payoption` varchar(25) NOT NULL,
  `paycardoption` varchar(100) NOT NULL,
  `payNextDate` date NOT NULL,
  `payBalance` double(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payCategory` varchar(255) DEFAULT NULL,
  `payment_remarks` longtext NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `remark` text,
  `canDate` date DEFAULT NULL,
  `thirdPartyAmt` double(10,2) NOT NULL,
  `dmAmt` double(10,2) NOT NULL,
  `dmTax` double(10,2) NOT NULL,
  `dmRefundAmt` double(10,2) NOT NULL,
  `curValue` int NOT NULL,
  `refNumber` varchar(255) NOT NULL,
  `created_by` int NOT NULL,
  `stage` varchar(100) NOT NULL,
  `totaltillnow` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_pay_history_cross_branch`
--

CREATE TABLE `dm_pay_history_cross_branch` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `counselor_receipt` varchar(255) NOT NULL,
  `date` date DEFAULT NULL,
  `payMethod` varchar(555) DEFAULT NULL,
  `payBalance` double(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payCategory` varchar(255) DEFAULT NULL,
  `payment_remarks` longtext NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `remark` text,
  `canDate` date DEFAULT NULL,
  `thirdPartyAmt` double(10,2) NOT NULL,
  `dmAmt` double(10,2) NOT NULL,
  `dmTax` double(10,2) NOT NULL,
  `dmRefundAmt` double(10,2) NOT NULL,
  `curValue` int NOT NULL,
  `refNumber` varchar(255) NOT NULL,
  `created_by` int NOT NULL,
  `stage` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_pnp`
--

CREATE TABLE `dm_pnp` (
  `id` int NOT NULL,
  `opsid` int NOT NULL,
  `leadid` int NOT NULL,
  `pnp` varchar(50) NOT NULL,
  `pts` int NOT NULL,
  `eoisubdate` varchar(50) NOT NULL,
  `eoiexpdate` varchar(50) NOT NULL,
  `noiexpdate` varchar(50) NOT NULL,
  `noisubdate` varchar(50) NOT NULL,
  `noirecdate` varchar(50) NOT NULL,
  `nomawdate` varchar(30) NOT NULL,
  `nomexpdate` varchar(30) NOT NULL,
  `status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_pnp_old`
--

CREATE TABLE `dm_pnp_old` (
  `id` int NOT NULL,
  `opsid` int NOT NULL,
  `agreeNo` varchar(111) NOT NULL,
  `pnp` varchar(50) NOT NULL,
  `subdate` varchar(50) NOT NULL,
  `expdate` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `pts` varchar(50) NOT NULL,
  `eoisubdate` varchar(50) NOT NULL,
  `noiexpdate` varchar(50) NOT NULL,
  `noisubdate` varchar(50) NOT NULL,
  `eoiexpdate` varchar(50) NOT NULL,
  `noirecdate` varchar(50) NOT NULL,
  `nomawdate` varchar(50) NOT NULL,
  `nomexpdate` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_poland_work_permit`
--

CREATE TABLE `dm_poland_work_permit` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `docs_received` date NOT NULL,
  `designation` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_renewal` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_payment` double(10,2) NOT NULL,
  `job_applied_date` date NOT NULL,
  `job_offer_rec_date` date NOT NULL,
  `job_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_hard_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_permit_rec_date` date NOT NULL,
  `work_permit_hard_rec_date` date NOT NULL,
  `app_country_name` int NOT NULL,
  `salary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `final_pay` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_pol_biometrics`
--

CREATE TABLE `dm_pol_biometrics` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `country` int NOT NULL,
  `bio_status` varchar(100) NOT NULL,
  `biometrics_appointment_date` date NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_program_type`
--

CREATE TABLE `dm_program_type` (
  `id` int NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_refunds`
--

CREATE TABLE `dm_refunds` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `refund_amount` double(10,2) NOT NULL,
  `refund_file` varchar(255) NOT NULL,
  `refund_approved_by` int NOT NULL,
  `refund_date` date NOT NULL,
  `refund_department` int NOT NULL,
  `revenue_adjust` int NOT NULL,
  `revenue_deduct` int NOT NULL,
  `refund_approved_date` date NOT NULL,
  `refund_remarks` longtext NOT NULL,
  `refund_type` varchar(100) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_region`
--

CREATE TABLE `dm_region` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_role`
--

CREATE TABLE `dm_role` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `hierarchy` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `type` varchar(55) NOT NULL,
  `department_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_service`
--

CREATE TABLE `dm_service` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `flag` varchar(100) DEFAULT NULL,
  `slogan_logo` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_source`
--

CREATE TABLE `dm_source` (
  `id` int NOT NULL,
  `name` varchar(555) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `sub_source` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_stages`
--

CREATE TABLE `dm_stages` (
  `id` int NOT NULL,
  `stage` varchar(100) NOT NULL,
  `duration` int NOT NULL,
  `duration_type` varchar(10) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created` date NOT NULL,
  `is_deleted` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_success_stories`
--

CREATE TABLE `dm_success_stories` (
  `id` int NOT NULL,
  `folder_id` int NOT NULL,
  `files` varchar(255) NOT NULL,
  `sub_folder_id` int NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `is_deleted` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_success_stories_folder`
--

CREATE TABLE `dm_success_stories_folder` (
  `id` int NOT NULL,
  `parent_id` int NOT NULL,
  `folder` varchar(255) NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `is_deleted` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_sv_admissions`
--

CREATE TABLE `dm_sv_admissions` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `tab` int NOT NULL,
  `doc_rec_date` date NOT NULL,
  `doc_status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `docs_sent_through` date NOT NULL,
  `mode` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `university_name` text CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `program_applied` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `admission_status` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `adminssion_intake` date NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_sv_cic`
--

CREATE TABLE `dm_sv_cic` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `tab` int NOT NULL,
  `doc_rec_date` date NOT NULL,
  `docs_status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `nationality` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `application_sub_date` date NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_sv_credentials`
--

CREATE TABLE `dm_sv_credentials` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `eeuid` varchar(50) DEFAULT NULL,
  `eeusrpsswrd` varchar(50) DEFAULT NULL,
  `eeregemail` varchar(50) DEFAULT NULL,
  `eeregpsswrd` varchar(50) DEFAULT NULL,
  `eesecq1` varchar(200) DEFAULT NULL,
  `ee1` varchar(200) DEFAULT NULL,
  `eesecq2` varchar(200) DEFAULT NULL,
  `ee2` varchar(200) DEFAULT NULL,
  `eesecq3` varchar(200) DEFAULT NULL,
  `ee3` varchar(200) DEFAULT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_target_dates`
--

CREATE TABLE `dm_target_dates` (
  `id` int NOT NULL,
  `month` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` int NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_task`
--

CREATE TABLE `dm_task` (
  `id` int NOT NULL,
  `task` varchar(555) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `date_created` varchar(30) DEFAULT NULL,
  `stage` int NOT NULL DEFAULT '0',
  `asignTo` int NOT NULL DEFAULT '0',
  `asignBy` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT '0',
  `doc` varchar(30) DEFAULT NULL,
  `notf` int NOT NULL DEFAULT '0',
  `created` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_teams`
--

CREATE TABLE `dm_teams` (
  `id` int NOT NULL,
  `team` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_third_party_payments`
--

CREATE TABLE `dm_third_party_payments` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `payment` double(10,2) NOT NULL,
  `payment_proof` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax` double(10,2) NOT NULL,
  `balance` double(10,2) NOT NULL,
  `approved` int NOT NULL,
  `approved_by` int NOT NULL,
  `approved_date` date NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL,
  `reject_remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_training_updates`
--

CREATE TABLE `dm_training_updates` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_user_branches`
--

CREATE TABLE `dm_user_branches` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_user_teams`
--

CREATE TABLE `dm_user_teams` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `team_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vendors`
--

CREATE TABLE `dm_vendors` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vendor_documents`
--

CREATE TABLE `dm_vendor_documents` (
  `id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `doc_type` varchar(100) DEFAULT NULL,
  `doc_uploaded_for` varchar(255) DEFAULT NULL,
  `leadId` int DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `name` varchar(555) DEFAULT NULL,
  `file` varchar(555) DEFAULT NULL,
  `created` date DEFAULT NULL,
  `created_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `remarks` longtext,
  `download_file` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vendor_invoice`
--

CREATE TABLE `dm_vendor_invoice` (
  `id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `ag_no` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice` int NOT NULL,
  `created` int NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vv_applicant_fees`
--

CREATE TABLE `dm_vv_applicant_fees` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `number_of_applicants` int NOT NULL,
  `amount` double(10,2) NOT NULL,
  `tax` double(10,2) NOT NULL,
  `total` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vv_biometrics`
--

CREATE TABLE `dm_vv_biometrics` (
  `id` int NOT NULL,
  `leadId` int NOT NULL,
  `bio_name` varchar(255) NOT NULL,
  `bio_age` varchar(50) NOT NULL,
  `biometrics_submission` varchar(100) NOT NULL,
  `country` int NOT NULL,
  `no_of_applicant` int NOT NULL,
  `bio_status` varchar(100) NOT NULL,
  `biometrics_appointment_date` date NOT NULL,
  `status` int NOT NULL,
  `created_by` int NOT NULL,
  `created` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_vv_credentials`
--

CREATE TABLE `dm_vv_credentials` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `eeuid` varchar(50) DEFAULT NULL,
  `eeusrpsswrd` varchar(50) DEFAULT NULL,
  `eeregemail` varchar(50) DEFAULT NULL,
  `eeregpsswrd` varchar(50) DEFAULT NULL,
  `eesecq1` varchar(200) DEFAULT NULL,
  `ee1` varchar(200) DEFAULT NULL,
  `eesecq2` varchar(200) DEFAULT NULL,
  `ee2` varchar(200) DEFAULT NULL,
  `eesecq3` varchar(200) DEFAULT NULL,
  `ee3` varchar(200) DEFAULT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `dm_welcome_email`
--

CREATE TABLE `dm_welcome_email` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `teer_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_from` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `to` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `cc` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `bcc` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_welcome_email_docs`
--

CREATE TABLE `dm_welcome_email_docs` (
  `id` int NOT NULL,
  `lead_id` int NOT NULL,
  `docs` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `docs_for` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` int NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_wp_cases`
--

CREATE TABLE `dm_wp_cases` (
  `id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `approve` int NOT NULL,
  `stage_2_approve` int NOT NULL,
  `stage_3_approve` int NOT NULL,
  `stage_2_denied` int NOT NULL,
  `stage_3_denied` int NOT NULL,
  `declined` int NOT NULL,
  `ag_no` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `amount_stage_2` decimal(10,2) NOT NULL,
  `amount_stage_3` decimal(10,2) NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL,
  `batch_id` int NOT NULL,
  `account_approve` int NOT NULL,
  `account_approve_two` int NOT NULL,
  `account_approve_three` int NOT NULL,
  `ops_approve` int NOT NULL,
  `ops_approve_two` int NOT NULL,
  `ops_approve_three` int NOT NULL,
  `stage_2_file` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage_3_file` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejection` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dm_wp_fee`
--

CREATE TABLE `dm_wp_fee` (
  `id` int NOT NULL,
  `service` int DEFAULT NULL,
  `country` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `currency` int DEFAULT NULL,
  `firstStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `secondStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `thirdStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `forthStage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fifthStage` decimal(10,2) NOT NULL,
  `status` int NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ecacredentials`
--

CREATE TABLE `ecacredentials` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `ecauid` varchar(50) DEFAULT NULL,
  `ecausrpsswrd` varchar(50) DEFAULT NULL,
  `regemail` varchar(50) DEFAULT NULL,
  `regpsswrd` varchar(50) DEFAULT NULL,
  `secq` varchar(300) DEFAULT NULL,
  `seca` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ecacredentials_old`
--

CREATE TABLE `ecacredentials_old` (
  `id` int NOT NULL,
  `agreeNo` int DEFAULT NULL,
  `ecauid` varchar(50) DEFAULT NULL,
  `ecausrpsswrd` varchar(50) DEFAULT NULL,
  `regemail` varchar(50) DEFAULT NULL,
  `regpsswrd` varchar(50) DEFAULT NULL,
  `secq` varchar(300) DEFAULT NULL,
  `seca` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ecacredentials_spouse`
--

CREATE TABLE `ecacredentials_spouse` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `ecauid` varchar(50) DEFAULT NULL,
  `ecausrpsswrd` varchar(50) DEFAULT NULL,
  `regemail` varchar(50) DEFAULT NULL,
  `regpsswrd` varchar(50) DEFAULT NULL,
  `secq` varchar(300) DEFAULT NULL,
  `seca` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ecacredentials_spouse_old`
--

CREATE TABLE `ecacredentials_spouse_old` (
  `id` int NOT NULL,
  `agreeNo` int DEFAULT NULL,
  `ecauid` varchar(50) DEFAULT NULL,
  `ecausrpsswrd` varchar(50) DEFAULT NULL,
  `regemail` varchar(50) DEFAULT NULL,
  `regpsswrd` varchar(50) DEFAULT NULL,
  `secq` varchar(300) DEFAULT NULL,
  `seca` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `eecredentials`
--

CREATE TABLE `eecredentials` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `eeuid` varchar(50) DEFAULT NULL,
  `eeusrpsswrd` varchar(50) DEFAULT NULL,
  `eeregemail` varchar(50) DEFAULT NULL,
  `eeregpsswrd` varchar(50) DEFAULT NULL,
  `eesecq1` varchar(200) DEFAULT NULL,
  `ee1` varchar(200) DEFAULT NULL,
  `eesecq2` varchar(200) DEFAULT NULL,
  `ee2` varchar(200) DEFAULT NULL,
  `eesecq3` varchar(200) DEFAULT NULL,
  `ee3` varchar(200) DEFAULT NULL,
  `eesecq4` varchar(200) DEFAULT NULL,
  `ee4` varchar(200) DEFAULT NULL,
  `recq1` varchar(200) DEFAULT NULL,
  `eer1` varchar(200) DEFAULT NULL,
  `recq2` varchar(200) DEFAULT NULL,
  `eer2` varchar(200) DEFAULT NULL,
  `recq3` varchar(200) DEFAULT NULL,
  `eer3` varchar(200) DEFAULT NULL,
  `recq4` varchar(200) DEFAULT NULL,
  `eer4` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `eecredentials_old`
--

CREATE TABLE `eecredentials_old` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `eeuid` varchar(50) DEFAULT NULL,
  `eeusrpsswrd` varchar(50) DEFAULT NULL,
  `eeregemail` varchar(50) DEFAULT NULL,
  `eeregpsswrd` varchar(50) DEFAULT NULL,
  `eesecq1` varchar(200) DEFAULT NULL,
  `ee1` varchar(200) DEFAULT NULL,
  `eesecq2` varchar(200) DEFAULT NULL,
  `ee2` varchar(200) DEFAULT NULL,
  `eesecq3` varchar(200) DEFAULT NULL,
  `ee3` varchar(200) DEFAULT NULL,
  `eesecq4` varchar(200) DEFAULT NULL,
  `ee4` varchar(200) DEFAULT NULL,
  `recq1` varchar(200) DEFAULT NULL,
  `eer1` varchar(200) DEFAULT NULL,
  `recq2` varchar(200) DEFAULT NULL,
  `eer2` varchar(200) DEFAULT NULL,
  `recq3` varchar(200) DEFAULT NULL,
  `eer3` varchar(200) DEFAULT NULL,
  `recq4` varchar(200) DEFAULT NULL,
  `eer4` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `eeprofile`
--

CREATE TABLE `eeprofile` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `docrec` varchar(30) DEFAULT NULL,
  `docstat` varchar(30) DEFAULT NULL,
  `pcfswp` varchar(30) DEFAULT NULL,
  `noc` varchar(30) DEFAULT NULL,
  `snoc` varchar(200) NOT NULL,
  `pldate` varchar(30) DEFAULT NULL,
  `pfexp` varchar(30) DEFAULT NULL,
  `crs` varchar(30) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `eeprofile_old`
--

CREATE TABLE `eeprofile_old` (
  `id` int NOT NULL,
  `agreeNo` int DEFAULT NULL,
  `docrec` varchar(30) DEFAULT NULL,
  `docstat` varchar(30) DEFAULT NULL,
  `pcfswp` varchar(30) DEFAULT NULL,
  `noc` varchar(30) DEFAULT NULL,
  `pldate` varchar(30) DEFAULT NULL,
  `pfexp` varchar(30) DEFAULT NULL,
  `crs` varchar(30) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `type` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `escalation_logs`
--

CREATE TABLE `escalation_logs` (
  `id` int NOT NULL,
  `lead` int DEFAULT NULL,
  `emp` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `expense_type`
--

CREATE TABLE `expense_type` (
  `id` int NOT NULL,
  `expense_type` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `created_by` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `gary_prospectss`
--

CREATE TABLE `gary_prospectss` (
  `id` int NOT NULL,
  `ag_no` int DEFAULT NULL,
  `date` varchar(20) DEFAULT NULL,
  `old_new` varchar(20) DEFAULT NULL,
  `noc` varchar(100) DEFAULT NULL,
  `counselorid` int DEFAULT NULL,
  `terence` int DEFAULT NULL,
  `date_edit` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `gary_work_docs`
--

CREATE TABLE `gary_work_docs` (
  `id` int NOT NULL,
  `ag_no` int DEFAULT NULL,
  `docs` varchar(70) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ielts`
--

CREATE TABLE `ielts` (
  `id` int NOT NULL,
  `timing` varchar(250) DEFAULT NULL,
  `link` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ielts_report`
--

CREATE TABLE `ielts_report` (
  `id` int NOT NULL,
  `date` varchar(50) NOT NULL,
  `start` varchar(100) DEFAULT NULL,
  `end` varchar(100) DEFAULT NULL,
  `remarks` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `itaremarks`
--

CREATE TABLE `itaremarks` (
  `id` int NOT NULL,
  `leadId` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL,
  `remarks` text NOT NULL,
  `addedby` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lead_logs`
--

CREATE TABLE `lead_logs` (
  `id` int NOT NULL,
  `date/time` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `leadid` int DEFAULT NULL,
  `ACTION` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lead_shuffle_logs`
--

CREATE TABLE `lead_shuffle_logs` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `date` varchar(100) DEFAULT NULL,
  `transfrom` int DEFAULT NULL,
  `transto` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `lp_leads`
--

CREATE TABLE `lp_leads` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lp` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `created` date NOT NULL,
  `emp_id` int NOT NULL,
  `lead_id` int NOT NULL,
  `lead_remark` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch` int NOT NULL,
  `education` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `age` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets`
--

CREATE TABLE `master_sheets` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_ECA`
--

CREATE TABLE `master_sheets_ECA` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_EIP`
--

CREATE TABLE `master_sheets_EIP` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_eoi_australia`
--

CREATE TABLE `master_sheets_eoi_australia` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_EU`
--

CREATE TABLE `master_sheets_EU` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_ITA`
--

CREATE TABLE `master_sheets_ITA` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_PNP`
--

CREATE TABLE `master_sheets_PNP` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_SA`
--

CREATE TABLE `master_sheets_SA` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_skill_assessment`
--

CREATE TABLE `master_sheets_skill_assessment` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_VV`
--

CREATE TABLE `master_sheets_VV` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `master_sheets_XPS`
--

CREATE TABLE `master_sheets_XPS` (
  `id` int NOT NULL,
  `userid` int DEFAULT NULL,
  `file` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `old_data_1`
--

CREATE TABLE `old_data_1` (
  `id` int NOT NULL,
  `Agno` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `SignupDate` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ClientName` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Mobile` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Email` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Country` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Branch` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `TotalPackage` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PaidAmount` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PendingAmount` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Counselor` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CPO1` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CPO2` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `EcaStatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `SpouseEca` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `IETSstatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `EEstatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Noc` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CRS` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `StatusLastUpdated` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PnpSubmitted` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Decision` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Remarks` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `flag` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `old_data_2`
--

CREATE TABLE `old_data_2` (
  `temp_id` int NOT NULL,
  `id` double DEFAULT NULL,
  `agreeNo` varchar(111) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sign_up_date` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `renDate` date NOT NULL,
  `renExpiryDate` date NOT NULL,
  `renew_type` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `client_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mobile` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `branch` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `total_package` double DEFAULT NULL,
  `paid_amount` double DEFAULT NULL,
  `pending_amount` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `counselor` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `old_data_auh`
--

CREATE TABLE `old_data_auh` (
  `id` int NOT NULL,
  `Agno` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `SignupDate` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `ClientName` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Mobile` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Email` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Country` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Branch` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `TotalPackage` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PaidAmount` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PendingAmount` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Counselor` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CPO1` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CPO2` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `EcaStatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `SpouseEca` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `IETSstatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `EEstatus` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Noc` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `CRS` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `StatusLastUpdated` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `PnpSubmitted` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Decision` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `Remarks` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `flag` varchar(25) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `old_data_pun`
--

CREATE TABLE `old_data_pun` (
  `temp_id` int NOT NULL,
  `id` double DEFAULT NULL,
  `sign_up_date` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `agreeNo` double DEFAULT NULL,
  `client_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mobile` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `counselor` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `old_data_shj`
--

CREATE TABLE `old_data_shj` (
  `temp_id` int NOT NULL,
  `id` double DEFAULT NULL,
  `agreeNo` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sign_up_date` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `client_name` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `mobile` double DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `counselor` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `status` varchar(150) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ops_business_remarks`
--

CREATE TABLE `ops_business_remarks` (
  `id` int NOT NULL,
  `leadId` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `added_by` varchar(30) DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `remark` text,
  `followup_remark_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ops_logs`
--

CREATE TABLE `ops_logs` (
  `id` int NOT NULL,
  `lead` int DEFAULT NULL,
  `ag_no` int DEFAULT NULL,
  `emp` int DEFAULT NULL,
  `timestamp` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ops_remarks`
--

CREATE TABLE `ops_remarks` (
  `id` int NOT NULL,
  `leadId` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `added_by` varchar(30) DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `remark` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ops_remarks_old`
--

CREATE TABLE `ops_remarks_old` (
  `id` int NOT NULL,
  `agreeNo` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `added_by` varchar(30) DEFAULT NULL,
  `tab` int DEFAULT NULL,
  `remark` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `qualification`
--

CREATE TABLE `qualification` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `qualification_old`
--

CREATE TABLE `qualification_old` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `qualification_spouse`
--

CREATE TABLE `qualification_spouse` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `qualification_spouse_old`
--

CREATE TABLE `qualification_spouse_old` (
  `id` int NOT NULL,
  `leadid` int DEFAULT NULL,
  `qualifctn` varchar(30) DEFAULT NULL,
  `specilization` varchar(100) DEFAULT NULL,
  `university` varchar(100) DEFAULT NULL,
  `assesment_body` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `rating` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `student_leads_logs`
--

CREATE TABLE `student_leads_logs` (
  `id` int NOT NULL,
  `Counsilor` int DEFAULT NULL,
  `lead` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `target`
--

CREATE TABLE `target` (
  `id` int NOT NULL,
  `counsilorid` int DEFAULT NULL,
  `branch` int NOT NULL,
  `month` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `appointment` int DEFAULT NULL,
  `sales` int DEFAULT NULL,
  `branch_sales` int DEFAULT NULL,
  `leads` int DEFAULT NULL,
  `cold` int DEFAULT NULL,
  `target_date_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `task_remarks`
--

CREATE TABLE `task_remarks` (
  `id` int NOT NULL,
  `taskid` int DEFAULT NULL,
  `date` varchar(30) DEFAULT NULL,
  `remarks` text,
  `emp` varchar(150) DEFAULT NULL,
  `notf` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_2916`
--

CREATE TABLE `wp_cf7db_2916` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3232`
--

CREATE TABLE `wp_cf7db_3232` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_862055` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3284`
--

CREATE TABLE `wp_cf7db_3284` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3606`
--

CREATE TABLE `wp_cf7db_3606` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_52` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_86105` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `text_34684` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_58` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3848`
--

CREATE TABLE `wp_cf7db_3848` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3870`
--

CREATE TABLE `wp_cf7db_3870` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_862055` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_404` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_3881`
--

CREATE TABLE `wp_cf7db_3881` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_3065` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_359` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_35926` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_55692` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_404` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_4077`
--

CREATE TABLE `wp_cf7db_4077` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name_52` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_592` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_88965` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `text_301504` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_55986021` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_4086`
--

CREATE TABLE `wp_cf7db_4086` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_name_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_861_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_message_car` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `file_898_cf7dbp_file` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_5499`
--

CREATE TABLE `wp_cf7db_5499` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_862055` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_cf7db_5500`
--

CREATE TABLE `wp_cf7db_5500` (
  `id` bigint NOT NULL,
  `cf7dbp_status` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cyour_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `tel_862055` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `your_email` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `menu_404` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `hidden_field_1` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `form_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`),
  ADD KEY `counsilorid` (`counsilorid`);

--
-- Indexes for table `appointment_counteries`
--
ALTER TABLE `appointment_counteries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `auditor_followups`
--
ALTER TABLE `auditor_followups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `auditor_meetings`
--
ALTER TABLE `auditor_meetings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `aus_eoi`
--
ALTER TABLE `aus_eoi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `aus_eoi_old`
--
ALTER TABLE `aus_eoi_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `aus_nom`
--
ALTER TABLE `aus_nom`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `aus_nom_old`
--
ALTER TABLE `aus_nom_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `branch_target`
--
ALTER TABLE `branch_target`
  ADD PRIMARY KEY (`id`),
  ADD KEY `counsilorid` (`branch`);

--
-- Indexes for table `business_ass_payment`
--
ALTER TABLE `business_ass_payment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `canada_status`
--
ALTER TABLE `canada_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `client_status`
--
ALTER TABLE `client_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `client_status_old`
--
ALTER TABLE `client_status_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_auh_email_leads`
--
ALTER TABLE `dmc_auh_email_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_forum_email_leads`
--
ALTER TABLE `dmc_forum_email_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_forum_leads`
--
ALTER TABLE `dmc_forum_leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `id` (`id`),
  ADD KEY `fk_branch` (`branch`),
  ADD KEY `fk_counsilor` (`Counsilor`),
  ADD KEY `fk_assignto` (`assignTo`),
  ADD KEY `fk_caseofficer` (`case_officer`);

--
-- Indexes for table `dmc_forum_leads_assesments`
--
ALTER TABLE `dmc_forum_leads_assesments`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dmc_forum_leads_assesment_desgn`
--
ALTER TABLE `dmc_forum_leads_assesment_desgn`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skillId` (`skillId`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dmc_forum_leads_assesment_edu`
--
ALTER TABLE `dmc_forum_leads_assesment_edu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skillId` (`skillId`),
  ADD KEY `leadId` (`leadId`),
  ADD KEY `leadId_2` (`leadId`);

--
-- Indexes for table `dmc_forum_leads_contracts`
--
ALTER TABLE `dmc_forum_leads_contracts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`),
  ADD KEY `leadId_2` (`leadId`);

--
-- Indexes for table `dmc_forum_leads_fee`
--
ALTER TABLE `dmc_forum_leads_fee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead` (`lead`);

--
-- Indexes for table `dmc_forum_leads_observations`
--
ALTER TABLE `dmc_forum_leads_observations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dmc_forum_leads_observation_old`
--
ALTER TABLE `dmc_forum_leads_observation_old`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq` (`agreeNo`);

--
-- Indexes for table `dmc_forum_leads_remarks`
--
ALTER TABLE `dmc_forum_leads_remarks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead` (`lead`);

--
-- Indexes for table `dmc_forum_leads_remark_g`
--
ALTER TABLE `dmc_forum_leads_remark_g`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_forum_leads_remark_olds`
--
ALTER TABLE `dmc_forum_leads_remark_olds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_new_add_leads`
--
ALTER TABLE `dmc_new_add_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dmc_new_add_po_leads`
--
ALTER TABLE `dmc_new_add_po_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_3party_payment`
--
ALTER TABLE `dm_3party_payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`),
  ADD KEY `leadId_2` (`leadId`);

--
-- Indexes for table `dm_3party_payment_det`
--
ALTER TABLE `dm_3party_payment_det`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payId` (`payId`);

--
-- Indexes for table `dm_3party_payment_old`
--
ALTER TABLE `dm_3party_payment_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_accounts`
--
ALTER TABLE `dm_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `dm_additional_documents`
--
ALTER TABLE `dm_additional_documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_admin`
--
ALTER TABLE `dm_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_appointments`
--
ALTER TABLE `dm_appointments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_appointment_remarks`
--
ALTER TABLE `dm_appointment_remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_auditor_counts`
--
ALTER TABLE `dm_auditor_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_auditor_reviews`
--
ALTER TABLE `dm_auditor_reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_b2b`
--
ALTER TABLE `dm_b2b`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_b2b_invoices`
--
ALTER TABLE `dm_b2b_invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_batch`
--
ALTER TABLE `dm_batch`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_branch`
--
ALTER TABLE `dm_branch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_branch_allocations`
--
ALTER TABLE `dm_branch_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_business_fee`
--
ALTER TABLE `dm_business_fee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_business_payment_plan`
--
ALTER TABLE `dm_business_payment_plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_business_portugal_payment_plan`
--
ALTER TABLE `dm_business_portugal_payment_plan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_campaigns`
--
ALTER TABLE `dm_campaigns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_2916`
--
ALTER TABLE `dm_cf7db_2916`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_3232`
--
ALTER TABLE `dm_cf7db_3232`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_3606`
--
ALTER TABLE `dm_cf7db_3606`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_3848`
--
ALTER TABLE `dm_cf7db_3848`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_3870`
--
ALTER TABLE `dm_cf7db_3870`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_4077`
--
ALTER TABLE `dm_cf7db_4077`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_cf7db_4088`
--
ALTER TABLE `dm_cf7db_4088`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_clients`
--
ALTER TABLE `dm_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_client_conversations`
--
ALTER TABLE `dm_client_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_client_edu`
--
ALTER TABLE `dm_client_edu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `dm_client_logs`
--
ALTER TABLE `dm_client_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_client_personal`
--
ALTER TABLE `dm_client_personal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `dm_client_personal_old`
--
ALTER TABLE `dm_client_personal_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_commercial_invoices`
--
ALTER TABLE `dm_commercial_invoices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_contract_file`
--
ALTER TABLE `dm_contract_file`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_counsilor_allocations`
--
ALTER TABLE `dm_counsilor_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_countries`
--
ALTER TABLE `dm_countries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_countries_type_program`
--
ALTER TABLE `dm_countries_type_program`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_country_proces`
--
ALTER TABLE `dm_country_proces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_currency`
--
ALTER TABLE `dm_currency`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_department`
--
ALTER TABLE `dm_department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_dup_live_chat_leads`
--
ALTER TABLE `dm_dup_live_chat_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_dup_lp_leads`
--
ALTER TABLE `dm_dup_lp_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_eip_aipp`
--
ALTER TABLE `dm_eip_aipp`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_eip_mcdii`
--
ALTER TABLE `dm_eip_mcdii`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_eip_rnip`
--
ALTER TABLE `dm_eip_rnip`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_email_attachments`
--
ALTER TABLE `dm_email_attachments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_email_templates`
--
ALTER TABLE `dm_email_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_employee`
--
ALTER TABLE `dm_employee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `dm_employee_role_fk` (`role`);

--
-- Indexes for table `dm_employee_attendance`
--
ALTER TABLE `dm_employee_attendance`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_employee_logs`
--
ALTER TABLE `dm_employee_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_employee_logs_old`
--
ALTER TABLE `dm_employee_logs_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_employer`
--
ALTER TABLE `dm_employer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_emp_sims`
--
ALTER TABLE `dm_emp_sims`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_emp_stocks`
--
ALTER TABLE `dm_emp_stocks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_enquiry`
--
ALTER TABLE `dm_enquiry`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_europe_cases`
--
ALTER TABLE `dm_europe_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pol_ops_lead` (`lead_id`);

--
-- Indexes for table `dm_europe_cases_verification`
--
ALTER TABLE `dm_europe_cases_verification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_europe_payment_adjustments`
--
ALTER TABLE `dm_europe_payment_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pol_pay_adj` (`lead_id`);

--
-- Indexes for table `dm_europe_payment_operations`
--
ALTER TABLE `dm_europe_payment_operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pol_pay_adj` (`lead_id`);

--
-- Indexes for table `dm_europe_vendors_payments`
--
ALTER TABLE `dm_europe_vendors_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_evaluations`
--
ALTER TABLE `dm_evaluations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_evaluations_skills`
--
ALTER TABLE `dm_evaluations_skills`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_expense`
--
ALTER TABLE `dm_expense`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_expense_cash`
--
ALTER TABLE `dm_expense_cash`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_expense_cash_record`
--
ALTER TABLE `dm_expense_cash_record`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_fee`
--
ALTER TABLE `dm_fee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fkfee_service_key` (`service`),
  ADD KEY `fkfee_country_key` (`country`),
  ADD KEY `fkfee_branch_key` (`branch`),
  ADD KEY `fkfee_currency_key` (`currency`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `dm_finance_invoice`
--
ALTER TABLE `dm_finance_invoice`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4687`
--
ALTER TABLE `dm_form_4687`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4688`
--
ALTER TABLE `dm_form_4688`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4689`
--
ALTER TABLE `dm_form_4689`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4690`
--
ALTER TABLE `dm_form_4690`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4691`
--
ALTER TABLE `dm_form_4691`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_form_4695`
--
ALTER TABLE `dm_form_4695`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_gary_contract`
--
ALTER TABLE `dm_gary_contract`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `dm_groups`
--
ALTER TABLE `dm_groups`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_hourly_lead_counts`
--
ALTER TABLE `dm_hourly_lead_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_job_search_qualification`
--
ALTER TABLE `dm_job_search_qualification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_js_ops_company_interview`
--
ALTER TABLE `dm_js_ops_company_interview`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_js_ops_lang_prof`
--
ALTER TABLE `dm_js_ops_lang_prof`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_js_ops_monthly_status`
--
ALTER TABLE `dm_js_ops_monthly_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_js_ops_nomination`
--
ALTER TABLE `dm_js_ops_nomination`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_js_ops_prescreening`
--
ALTER TABLE `dm_js_ops_prescreening`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_js_resume_writing`
--
ALTER TABLE `dm_js_resume_writing`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_leads_emailers`
--
ALTER TABLE `dm_leads_emailers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lead_counts`
--
ALTER TABLE `dm_lead_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lead_live_chat_counts`
--
ALTER TABLE `dm_lead_live_chat_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lead_lp_counts`
--
ALTER TABLE `dm_lead_lp_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lead_shj_counts`
--
ALTER TABLE `dm_lead_shj_counts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_leave_history`
--
ALTER TABLE `dm_leave_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_leave_type`
--
ALTER TABLE `dm_leave_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_library`
--
ALTER TABLE `dm_library`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_library_folders`
--
ALTER TABLE `dm_library_folders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_live_chat_leads`
--
ALTER TABLE `dm_live_chat_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lmia_brief`
--
ALTER TABLE `dm_lmia_brief`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_lmia_payment_adjustments`
--
ALTER TABLE `dm_lmia_payment_adjustments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_logs`
--
ALTER TABLE `dm_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_new_client`
--
ALTER TABLE `dm_new_client`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_observation_file`
--
ALTER TABLE `dm_observation_file`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_official_emails`
--
ALTER TABLE `dm_official_emails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_old_data`
--
ALTER TABLE `dm_old_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_old_payment`
--
ALTER TABLE `dm_old_payment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_operation_allocations`
--
ALTER TABLE `dm_operation_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_business_documents`
--
ALTER TABLE `dm_ops_business_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_business_dos`
--
ALTER TABLE `dm_ops_business_dos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_busines_canada`
--
ALTER TABLE `dm_ops_busines_canada`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_busines_poland`
--
ALTER TABLE `dm_ops_busines_poland`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_busines_uk`
--
ALTER TABLE `dm_ops_busines_uk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_busines_usa`
--
ALTER TABLE `dm_ops_busines_usa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_conversation`
--
ALTER TABLE `dm_ops_conversation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `dm_ops_conversation_old`
--
ALTER TABLE `dm_ops_conversation_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_documents`
--
ALTER TABLE `dm_ops_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_documents_old`
--
ALTER TABLE `dm_ops_documents_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_lang_prof`
--
ALTER TABLE `dm_ops_lang_prof`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_lang_prof_old`
--
ALTER TABLE `dm_ops_lang_prof_old`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `dm_ops_lang_prof_spouse`
--
ALTER TABLE `dm_ops_lang_prof_spouse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_lang_prof_spouse_old`
--
ALTER TABLE `dm_ops_lang_prof_spouse_old`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `dm_ops_lmia`
--
ALTER TABLE `dm_ops_lmia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_medical_request`
--
ALTER TABLE `dm_ops_medical_request`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_poland_application`
--
ALTER TABLE `dm_ops_poland_application`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_poland_jol`
--
ALTER TABLE `dm_ops_poland_jol`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_poland_loc`
--
ALTER TABLE `dm_ops_poland_loc`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_skill_australia`
--
ALTER TABLE `dm_ops_skill_australia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_australia_assess`
--
ALTER TABLE `dm_ops_skill_australia_assess`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_australia_assess_old`
--
ALTER TABLE `dm_ops_skill_australia_assess_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_skill_australia_assess_spouse`
--
ALTER TABLE `dm_ops_skill_australia_assess_spouse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_australia_assess_spouse_old`
--
ALTER TABLE `dm_ops_skill_australia_assess_spouse_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_skill_australia_old`
--
ALTER TABLE `dm_ops_skill_australia_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_skill_canada_eca`
--
ALTER TABLE `dm_ops_skill_canada_eca`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_canada_ee`
--
ALTER TABLE `dm_ops_skill_canada_ee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_canada_ita`
--
ALTER TABLE `dm_ops_skill_canada_ita`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_skill_canada_old`
--
ALTER TABLE `dm_ops_skill_canada_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_ops_student_visa`
--
ALTER TABLE `dm_ops_student_visa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_visit_visa`
--
ALTER TABLE `dm_ops_visit_visa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_ops_visit_visa_application`
--
ALTER TABLE `dm_ops_visit_visa_application`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_op_team_allocations`
--
ALTER TABLE `dm_op_team_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_pay_history`
--
ALTER TABLE `dm_pay_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_pay_history_cross_branch`
--
ALTER TABLE `dm_pay_history_cross_branch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_pnp`
--
ALTER TABLE `dm_pnp`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`),
  ADD KEY `dm_pnp_ibfk_1` (`opsid`);

--
-- Indexes for table `dm_pnp_old`
--
ALTER TABLE `dm_pnp_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_poland_work_permit`
--
ALTER TABLE `dm_poland_work_permit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_pol_biometrics`
--
ALTER TABLE `dm_pol_biometrics`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_program_type`
--
ALTER TABLE `dm_program_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_refunds`
--
ALTER TABLE `dm_refunds`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_region`
--
ALTER TABLE `dm_region`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_role`
--
ALTER TABLE `dm_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_service`
--
ALTER TABLE `dm_service`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_source`
--
ALTER TABLE `dm_source`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_stages`
--
ALTER TABLE `dm_stages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_success_stories`
--
ALTER TABLE `dm_success_stories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_success_stories_folder`
--
ALTER TABLE `dm_success_stories_folder`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_sv_admissions`
--
ALTER TABLE `dm_sv_admissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_sv_cic`
--
ALTER TABLE `dm_sv_cic`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_sv_credentials`
--
ALTER TABLE `dm_sv_credentials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_target_dates`
--
ALTER TABLE `dm_target_dates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_task`
--
ALTER TABLE `dm_task`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_teams`
--
ALTER TABLE `dm_teams`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_third_party_payments`
--
ALTER TABLE `dm_third_party_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_training_updates`
--
ALTER TABLE `dm_training_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `dm_user_branches`
--
ALTER TABLE `dm_user_branches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_user_teams`
--
ALTER TABLE `dm_user_teams`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_vendors`
--
ALTER TABLE `dm_vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dm_vendor_documents`
--
ALTER TABLE `dm_vendor_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadId` (`leadId`);

--
-- Indexes for table `dm_vendor_invoice`
--
ALTER TABLE `dm_vendor_invoice`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_vv_applicant_fees`
--
ALTER TABLE `dm_vv_applicant_fees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_vv_biometrics`
--
ALTER TABLE `dm_vv_biometrics`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_vv_credentials`
--
ALTER TABLE `dm_vv_credentials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_welcome_email`
--
ALTER TABLE `dm_welcome_email`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_welcome_email_docs`
--
ALTER TABLE `dm_welcome_email_docs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_wp_cases`
--
ALTER TABLE `dm_wp_cases`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm_wp_fee`
--
ALTER TABLE `dm_wp_fee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`);

--
-- Indexes for table `ecacredentials`
--
ALTER TABLE `ecacredentials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ecacredentials_old`
--
ALTER TABLE `ecacredentials_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ecacredentials_spouse`
--
ALTER TABLE `ecacredentials_spouse`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ecacredentials_spouse_old`
--
ALTER TABLE `ecacredentials_spouse_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `eecredentials`
--
ALTER TABLE `eecredentials`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `eecredentials_old`
--
ALTER TABLE `eecredentials_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `eeprofile`
--
ALTER TABLE `eeprofile`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `eeprofile_old`
--
ALTER TABLE `eeprofile_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `escalation_logs`
--
ALTER TABLE `escalation_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expense_type`
--
ALTER TABLE `expense_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gary_prospectss`
--
ALTER TABLE `gary_prospectss`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gary_work_docs`
--
ALTER TABLE `gary_work_docs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gary_work_docs_ibfk_1` (`ag_no`);

--
-- Indexes for table `ielts`
--
ALTER TABLE `ielts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ielts_report`
--
ALTER TABLE `ielts_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `itaremarks`
--
ALTER TABLE `itaremarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lead_logs`
--
ALTER TABLE `lead_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leadid` (`leadid`);

--
-- Indexes for table `lead_shuffle_logs`
--
ALTER TABLE `lead_shuffle_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lp_leads`
--
ALTER TABLE `lp_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `master_sheets`
--
ALTER TABLE `master_sheets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_ECA`
--
ALTER TABLE `master_sheets_ECA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_EIP`
--
ALTER TABLE `master_sheets_EIP`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_eoi_australia`
--
ALTER TABLE `master_sheets_eoi_australia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_EU`
--
ALTER TABLE `master_sheets_EU`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_ITA`
--
ALTER TABLE `master_sheets_ITA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_PNP`
--
ALTER TABLE `master_sheets_PNP`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_SA`
--
ALTER TABLE `master_sheets_SA`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_skill_assessment`
--
ALTER TABLE `master_sheets_skill_assessment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_VV`
--
ALTER TABLE `master_sheets_VV`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `master_sheets_XPS`
--
ALTER TABLE `master_sheets_XPS`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userid` (`userid`);

--
-- Indexes for table `old_data_1`
--
ALTER TABLE `old_data_1`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `old_data_2`
--
ALTER TABLE `old_data_2`
  ADD PRIMARY KEY (`temp_id`);

--
-- Indexes for table `old_data_auh`
--
ALTER TABLE `old_data_auh`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `old_data_pun`
--
ALTER TABLE `old_data_pun`
  ADD PRIMARY KEY (`temp_id`);

--
-- Indexes for table `old_data_shj`
--
ALTER TABLE `old_data_shj`
  ADD PRIMARY KEY (`temp_id`);

--
-- Indexes for table `ops_business_remarks`
--
ALTER TABLE `ops_business_remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ops_logs`
--
ALTER TABLE `ops_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ops_remarks`
--
ALTER TABLE `ops_remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ops_remarks_old`
--
ALTER TABLE `ops_remarks_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qualification`
--
ALTER TABLE `qualification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qualification_old`
--
ALTER TABLE `qualification_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qualification_spouse`
--
ALTER TABLE `qualification_spouse`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `qualification_spouse_old`
--
ALTER TABLE `qualification_spouse_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student_leads_logs`
--
ALTER TABLE `student_leads_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Counsilor` (`Counsilor`);

--
-- Indexes for table `target`
--
ALTER TABLE `target`
  ADD PRIMARY KEY (`id`),
  ADD KEY `counsilorid` (`counsilorid`);

--
-- Indexes for table `task_remarks`
--
ALTER TABLE `task_remarks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_2916`
--
ALTER TABLE `wp_cf7db_2916`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3232`
--
ALTER TABLE `wp_cf7db_3232`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3284`
--
ALTER TABLE `wp_cf7db_3284`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3606`
--
ALTER TABLE `wp_cf7db_3606`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3848`
--
ALTER TABLE `wp_cf7db_3848`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3870`
--
ALTER TABLE `wp_cf7db_3870`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_3881`
--
ALTER TABLE `wp_cf7db_3881`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_4077`
--
ALTER TABLE `wp_cf7db_4077`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_4086`
--
ALTER TABLE `wp_cf7db_4086`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_5499`
--
ALTER TABLE `wp_cf7db_5499`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_cf7db_5500`
--
ALTER TABLE `wp_cf7db_5500`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `appointment_counteries`
--
ALTER TABLE `appointment_counteries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auditor_followups`
--
ALTER TABLE `auditor_followups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auditor_meetings`
--
ALTER TABLE `auditor_meetings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aus_eoi`
--
ALTER TABLE `aus_eoi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aus_eoi_old`
--
ALTER TABLE `aus_eoi_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aus_nom`
--
ALTER TABLE `aus_nom`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aus_nom_old`
--
ALTER TABLE `aus_nom_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branch_target`
--
ALTER TABLE `branch_target`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_ass_payment`
--
ALTER TABLE `business_ass_payment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `canada_status`
--
ALTER TABLE `canada_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `client_status`
--
ALTER TABLE `client_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `client_status_old`
--
ALTER TABLE `client_status_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_auh_email_leads`
--
ALTER TABLE `dmc_auh_email_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_email_leads`
--
ALTER TABLE `dmc_forum_email_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads`
--
ALTER TABLE `dmc_forum_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_assesments`
--
ALTER TABLE `dmc_forum_leads_assesments`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_assesment_desgn`
--
ALTER TABLE `dmc_forum_leads_assesment_desgn`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_assesment_edu`
--
ALTER TABLE `dmc_forum_leads_assesment_edu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_contracts`
--
ALTER TABLE `dmc_forum_leads_contracts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_fee`
--
ALTER TABLE `dmc_forum_leads_fee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_observations`
--
ALTER TABLE `dmc_forum_leads_observations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_observation_old`
--
ALTER TABLE `dmc_forum_leads_observation_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_remarks`
--
ALTER TABLE `dmc_forum_leads_remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_remark_g`
--
ALTER TABLE `dmc_forum_leads_remark_g`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_forum_leads_remark_olds`
--
ALTER TABLE `dmc_forum_leads_remark_olds`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_new_add_leads`
--
ALTER TABLE `dmc_new_add_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dmc_new_add_po_leads`
--
ALTER TABLE `dmc_new_add_po_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_3party_payment`
--
ALTER TABLE `dm_3party_payment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_3party_payment_det`
--
ALTER TABLE `dm_3party_payment_det`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_3party_payment_old`
--
ALTER TABLE `dm_3party_payment_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_accounts`
--
ALTER TABLE `dm_accounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_additional_documents`
--
ALTER TABLE `dm_additional_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_admin`
--
ALTER TABLE `dm_admin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_appointments`
--
ALTER TABLE `dm_appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_appointment_remarks`
--
ALTER TABLE `dm_appointment_remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_auditor_counts`
--
ALTER TABLE `dm_auditor_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_auditor_reviews`
--
ALTER TABLE `dm_auditor_reviews`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_b2b`
--
ALTER TABLE `dm_b2b`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_b2b_invoices`
--
ALTER TABLE `dm_b2b_invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_batch`
--
ALTER TABLE `dm_batch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_branch`
--
ALTER TABLE `dm_branch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_branch_allocations`
--
ALTER TABLE `dm_branch_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_business_fee`
--
ALTER TABLE `dm_business_fee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_business_payment_plan`
--
ALTER TABLE `dm_business_payment_plan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_business_portugal_payment_plan`
--
ALTER TABLE `dm_business_portugal_payment_plan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_campaigns`
--
ALTER TABLE `dm_campaigns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_2916`
--
ALTER TABLE `dm_cf7db_2916`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_3232`
--
ALTER TABLE `dm_cf7db_3232`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_3606`
--
ALTER TABLE `dm_cf7db_3606`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_3848`
--
ALTER TABLE `dm_cf7db_3848`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_3870`
--
ALTER TABLE `dm_cf7db_3870`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_4077`
--
ALTER TABLE `dm_cf7db_4077`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_cf7db_4088`
--
ALTER TABLE `dm_cf7db_4088`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_clients`
--
ALTER TABLE `dm_clients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_client_conversations`
--
ALTER TABLE `dm_client_conversations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_client_edu`
--
ALTER TABLE `dm_client_edu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_client_logs`
--
ALTER TABLE `dm_client_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_client_personal`
--
ALTER TABLE `dm_client_personal`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_client_personal_old`
--
ALTER TABLE `dm_client_personal_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_commercial_invoices`
--
ALTER TABLE `dm_commercial_invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_contract_file`
--
ALTER TABLE `dm_contract_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_counsilor_allocations`
--
ALTER TABLE `dm_counsilor_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_countries`
--
ALTER TABLE `dm_countries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_countries_type_program`
--
ALTER TABLE `dm_countries_type_program`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_country_proces`
--
ALTER TABLE `dm_country_proces`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_currency`
--
ALTER TABLE `dm_currency`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_department`
--
ALTER TABLE `dm_department`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_dup_live_chat_leads`
--
ALTER TABLE `dm_dup_live_chat_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_dup_lp_leads`
--
ALTER TABLE `dm_dup_lp_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_eip_aipp`
--
ALTER TABLE `dm_eip_aipp`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_eip_mcdii`
--
ALTER TABLE `dm_eip_mcdii`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_eip_rnip`
--
ALTER TABLE `dm_eip_rnip`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_email_attachments`
--
ALTER TABLE `dm_email_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_email_templates`
--
ALTER TABLE `dm_email_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_employee`
--
ALTER TABLE `dm_employee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_employee_attendance`
--
ALTER TABLE `dm_employee_attendance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_employee_logs`
--
ALTER TABLE `dm_employee_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_employee_logs_old`
--
ALTER TABLE `dm_employee_logs_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_employer`
--
ALTER TABLE `dm_employer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_emp_sims`
--
ALTER TABLE `dm_emp_sims`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_emp_stocks`
--
ALTER TABLE `dm_emp_stocks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_enquiry`
--
ALTER TABLE `dm_enquiry`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_europe_cases`
--
ALTER TABLE `dm_europe_cases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_europe_cases_verification`
--
ALTER TABLE `dm_europe_cases_verification`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_europe_payment_adjustments`
--
ALTER TABLE `dm_europe_payment_adjustments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_europe_payment_operations`
--
ALTER TABLE `dm_europe_payment_operations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_europe_vendors_payments`
--
ALTER TABLE `dm_europe_vendors_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_evaluations`
--
ALTER TABLE `dm_evaluations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_evaluations_skills`
--
ALTER TABLE `dm_evaluations_skills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_expense`
--
ALTER TABLE `dm_expense`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_expense_cash`
--
ALTER TABLE `dm_expense_cash`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_expense_cash_record`
--
ALTER TABLE `dm_expense_cash_record`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_fee`
--
ALTER TABLE `dm_fee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_finance_invoice`
--
ALTER TABLE `dm_finance_invoice`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4687`
--
ALTER TABLE `dm_form_4687`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4688`
--
ALTER TABLE `dm_form_4688`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4689`
--
ALTER TABLE `dm_form_4689`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4690`
--
ALTER TABLE `dm_form_4690`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4691`
--
ALTER TABLE `dm_form_4691`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_form_4695`
--
ALTER TABLE `dm_form_4695`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_gary_contract`
--
ALTER TABLE `dm_gary_contract`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_groups`
--
ALTER TABLE `dm_groups`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_hourly_lead_counts`
--
ALTER TABLE `dm_hourly_lead_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_job_search_qualification`
--
ALTER TABLE `dm_job_search_qualification`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_ops_company_interview`
--
ALTER TABLE `dm_js_ops_company_interview`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_ops_lang_prof`
--
ALTER TABLE `dm_js_ops_lang_prof`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_ops_monthly_status`
--
ALTER TABLE `dm_js_ops_monthly_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_ops_nomination`
--
ALTER TABLE `dm_js_ops_nomination`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_ops_prescreening`
--
ALTER TABLE `dm_js_ops_prescreening`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_js_resume_writing`
--
ALTER TABLE `dm_js_resume_writing`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_leads_emailers`
--
ALTER TABLE `dm_leads_emailers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lead_counts`
--
ALTER TABLE `dm_lead_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lead_live_chat_counts`
--
ALTER TABLE `dm_lead_live_chat_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lead_lp_counts`
--
ALTER TABLE `dm_lead_lp_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lead_shj_counts`
--
ALTER TABLE `dm_lead_shj_counts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_leave_history`
--
ALTER TABLE `dm_leave_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_leave_type`
--
ALTER TABLE `dm_leave_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_library`
--
ALTER TABLE `dm_library`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_library_folders`
--
ALTER TABLE `dm_library_folders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_live_chat_leads`
--
ALTER TABLE `dm_live_chat_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lmia_brief`
--
ALTER TABLE `dm_lmia_brief`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_lmia_payment_adjustments`
--
ALTER TABLE `dm_lmia_payment_adjustments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_logs`
--
ALTER TABLE `dm_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_new_client`
--
ALTER TABLE `dm_new_client`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_observation_file`
--
ALTER TABLE `dm_observation_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_official_emails`
--
ALTER TABLE `dm_official_emails`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_old_data`
--
ALTER TABLE `dm_old_data`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_old_payment`
--
ALTER TABLE `dm_old_payment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_operation_allocations`
--
ALTER TABLE `dm_operation_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_business_documents`
--
ALTER TABLE `dm_ops_business_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_business_dos`
--
ALTER TABLE `dm_ops_business_dos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_busines_canada`
--
ALTER TABLE `dm_ops_busines_canada`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_busines_poland`
--
ALTER TABLE `dm_ops_busines_poland`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_busines_uk`
--
ALTER TABLE `dm_ops_busines_uk`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_busines_usa`
--
ALTER TABLE `dm_ops_busines_usa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_conversation`
--
ALTER TABLE `dm_ops_conversation`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_conversation_old`
--
ALTER TABLE `dm_ops_conversation_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_documents`
--
ALTER TABLE `dm_ops_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_documents_old`
--
ALTER TABLE `dm_ops_documents_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_lang_prof`
--
ALTER TABLE `dm_ops_lang_prof`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_lang_prof_old`
--
ALTER TABLE `dm_ops_lang_prof_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_lang_prof_spouse`
--
ALTER TABLE `dm_ops_lang_prof_spouse`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_lang_prof_spouse_old`
--
ALTER TABLE `dm_ops_lang_prof_spouse_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_lmia`
--
ALTER TABLE `dm_ops_lmia`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_medical_request`
--
ALTER TABLE `dm_ops_medical_request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_poland_application`
--
ALTER TABLE `dm_ops_poland_application`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_poland_jol`
--
ALTER TABLE `dm_ops_poland_jol`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_poland_loc`
--
ALTER TABLE `dm_ops_poland_loc`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia`
--
ALTER TABLE `dm_ops_skill_australia`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia_assess`
--
ALTER TABLE `dm_ops_skill_australia_assess`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia_assess_old`
--
ALTER TABLE `dm_ops_skill_australia_assess_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia_assess_spouse`
--
ALTER TABLE `dm_ops_skill_australia_assess_spouse`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia_assess_spouse_old`
--
ALTER TABLE `dm_ops_skill_australia_assess_spouse_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_australia_old`
--
ALTER TABLE `dm_ops_skill_australia_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_canada_eca`
--
ALTER TABLE `dm_ops_skill_canada_eca`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_canada_ee`
--
ALTER TABLE `dm_ops_skill_canada_ee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_canada_ita`
--
ALTER TABLE `dm_ops_skill_canada_ita`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_skill_canada_old`
--
ALTER TABLE `dm_ops_skill_canada_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_student_visa`
--
ALTER TABLE `dm_ops_student_visa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_visit_visa`
--
ALTER TABLE `dm_ops_visit_visa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_ops_visit_visa_application`
--
ALTER TABLE `dm_ops_visit_visa_application`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_op_team_allocations`
--
ALTER TABLE `dm_op_team_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_pay_history`
--
ALTER TABLE `dm_pay_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_pay_history_cross_branch`
--
ALTER TABLE `dm_pay_history_cross_branch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_pnp`
--
ALTER TABLE `dm_pnp`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_pnp_old`
--
ALTER TABLE `dm_pnp_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_poland_work_permit`
--
ALTER TABLE `dm_poland_work_permit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_pol_biometrics`
--
ALTER TABLE `dm_pol_biometrics`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_program_type`
--
ALTER TABLE `dm_program_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_refunds`
--
ALTER TABLE `dm_refunds`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_region`
--
ALTER TABLE `dm_region`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_role`
--
ALTER TABLE `dm_role`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_service`
--
ALTER TABLE `dm_service`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_source`
--
ALTER TABLE `dm_source`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_stages`
--
ALTER TABLE `dm_stages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_success_stories`
--
ALTER TABLE `dm_success_stories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_success_stories_folder`
--
ALTER TABLE `dm_success_stories_folder`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_sv_admissions`
--
ALTER TABLE `dm_sv_admissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_sv_cic`
--
ALTER TABLE `dm_sv_cic`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_sv_credentials`
--
ALTER TABLE `dm_sv_credentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_target_dates`
--
ALTER TABLE `dm_target_dates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_task`
--
ALTER TABLE `dm_task`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_teams`
--
ALTER TABLE `dm_teams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_third_party_payments`
--
ALTER TABLE `dm_third_party_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_training_updates`
--
ALTER TABLE `dm_training_updates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_user_branches`
--
ALTER TABLE `dm_user_branches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_user_teams`
--
ALTER TABLE `dm_user_teams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vendors`
--
ALTER TABLE `dm_vendors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vendor_documents`
--
ALTER TABLE `dm_vendor_documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vendor_invoice`
--
ALTER TABLE `dm_vendor_invoice`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vv_applicant_fees`
--
ALTER TABLE `dm_vv_applicant_fees`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vv_biometrics`
--
ALTER TABLE `dm_vv_biometrics`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_vv_credentials`
--
ALTER TABLE `dm_vv_credentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_welcome_email`
--
ALTER TABLE `dm_welcome_email`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_welcome_email_docs`
--
ALTER TABLE `dm_welcome_email_docs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_wp_cases`
--
ALTER TABLE `dm_wp_cases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dm_wp_fee`
--
ALTER TABLE `dm_wp_fee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ecacredentials`
--
ALTER TABLE `ecacredentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ecacredentials_old`
--
ALTER TABLE `ecacredentials_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ecacredentials_spouse`
--
ALTER TABLE `ecacredentials_spouse`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ecacredentials_spouse_old`
--
ALTER TABLE `ecacredentials_spouse_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eecredentials`
--
ALTER TABLE `eecredentials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eecredentials_old`
--
ALTER TABLE `eecredentials_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eeprofile`
--
ALTER TABLE `eeprofile`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eeprofile_old`
--
ALTER TABLE `eeprofile_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `escalation_logs`
--
ALTER TABLE `escalation_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_type`
--
ALTER TABLE `expense_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gary_prospectss`
--
ALTER TABLE `gary_prospectss`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gary_work_docs`
--
ALTER TABLE `gary_work_docs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ielts`
--
ALTER TABLE `ielts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ielts_report`
--
ALTER TABLE `ielts_report`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itaremarks`
--
ALTER TABLE `itaremarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lead_logs`
--
ALTER TABLE `lead_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lead_shuffle_logs`
--
ALTER TABLE `lead_shuffle_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lp_leads`
--
ALTER TABLE `lp_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets`
--
ALTER TABLE `master_sheets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_ECA`
--
ALTER TABLE `master_sheets_ECA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_EIP`
--
ALTER TABLE `master_sheets_EIP`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_eoi_australia`
--
ALTER TABLE `master_sheets_eoi_australia`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_EU`
--
ALTER TABLE `master_sheets_EU`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_ITA`
--
ALTER TABLE `master_sheets_ITA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_PNP`
--
ALTER TABLE `master_sheets_PNP`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_SA`
--
ALTER TABLE `master_sheets_SA`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_skill_assessment`
--
ALTER TABLE `master_sheets_skill_assessment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_VV`
--
ALTER TABLE `master_sheets_VV`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `master_sheets_XPS`
--
ALTER TABLE `master_sheets_XPS`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `old_data_1`
--
ALTER TABLE `old_data_1`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `old_data_2`
--
ALTER TABLE `old_data_2`
  MODIFY `temp_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `old_data_auh`
--
ALTER TABLE `old_data_auh`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `old_data_pun`
--
ALTER TABLE `old_data_pun`
  MODIFY `temp_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `old_data_shj`
--
ALTER TABLE `old_data_shj`
  MODIFY `temp_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ops_business_remarks`
--
ALTER TABLE `ops_business_remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ops_logs`
--
ALTER TABLE `ops_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ops_remarks`
--
ALTER TABLE `ops_remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ops_remarks_old`
--
ALTER TABLE `ops_remarks_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qualification`
--
ALTER TABLE `qualification`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qualification_old`
--
ALTER TABLE `qualification_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qualification_spouse`
--
ALTER TABLE `qualification_spouse`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qualification_spouse_old`
--
ALTER TABLE `qualification_spouse_old`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `student_leads_logs`
--
ALTER TABLE `student_leads_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `target`
--
ALTER TABLE `target`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_remarks`
--
ALTER TABLE `task_remarks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_2916`
--
ALTER TABLE `wp_cf7db_2916`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3232`
--
ALTER TABLE `wp_cf7db_3232`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3284`
--
ALTER TABLE `wp_cf7db_3284`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3606`
--
ALTER TABLE `wp_cf7db_3606`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3848`
--
ALTER TABLE `wp_cf7db_3848`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3870`
--
ALTER TABLE `wp_cf7db_3870`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_3881`
--
ALTER TABLE `wp_cf7db_3881`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_4077`
--
ALTER TABLE `wp_cf7db_4077`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_4086`
--
ALTER TABLE `wp_cf7db_4086`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_5499`
--
ALTER TABLE `wp_cf7db_5499`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_cf7db_5500`
--
ALTER TABLE `wp_cf7db_5500`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aus_eoi`
--
ALTER TABLE `aus_eoi`
  ADD CONSTRAINT `aus_eoi_ibfk_1` FOREIGN KEY (`leadid`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `aus_nom`
--
ALTER TABLE `aus_nom`
  ADD CONSTRAINT `aus_nom_ibfk_1` FOREIGN KEY (`leadid`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dmc_forum_leads`
--
ALTER TABLE `dmc_forum_leads`
  ADD CONSTRAINT `fk_assignto` FOREIGN KEY (`assignTo`) REFERENCES `dm_employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_branch` FOREIGN KEY (`branch`) REFERENCES `dm_branch` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_caseofficer` FOREIGN KEY (`case_officer`) REFERENCES `dm_employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_counsilor` FOREIGN KEY (`Counsilor`) REFERENCES `dm_employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dmc_forum_leads_assesments`
--
ALTER TABLE `dmc_forum_leads_assesments`
  ADD CONSTRAINT `dmc_forum_leads_assesments_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dmc_forum_leads_assesment_desgn`
--
ALTER TABLE `dmc_forum_leads_assesment_desgn`
  ADD CONSTRAINT `dmc_forum_leads_assesment_desgn_ibfk_1` FOREIGN KEY (`skillId`) REFERENCES `dmc_forum_leads_assesments` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `dmc_forum_leads_assesment_desgn_ibfk_2` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dmc_forum_leads_assesment_edu`
--
ALTER TABLE `dmc_forum_leads_assesment_edu`
  ADD CONSTRAINT `dmc_forum_leads_assesment_edu_ibfk_1` FOREIGN KEY (`skillId`) REFERENCES `dmc_forum_leads_assesments` (`Id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `dmc_forum_leads_assesment_edu_ibfk_2` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dmc_forum_leads_contracts`
--
ALTER TABLE `dmc_forum_leads_contracts`
  ADD CONSTRAINT `dmc_forum_leads_contracts_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dmc_forum_leads_fee`
--
ALTER TABLE `dmc_forum_leads_fee`
  ADD CONSTRAINT `dmc_forum_leads_fee_ibfk_1` FOREIGN KEY (`lead`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dmc_forum_leads_observations`
--
ALTER TABLE `dmc_forum_leads_observations`
  ADD CONSTRAINT `dmc_forum_leads_observations_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dmc_forum_leads_remarks`
--
ALTER TABLE `dmc_forum_leads_remarks`
  ADD CONSTRAINT `dmc_forum_leads_remarks_ibfk_1` FOREIGN KEY (`lead`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_3party_payment`
--
ALTER TABLE `dm_3party_payment`
  ADD CONSTRAINT `dm_3party_payment_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_3party_payment_det`
--
ALTER TABLE `dm_3party_payment_det`
  ADD CONSTRAINT `dm_3party_payment_det_ibfk_1` FOREIGN KEY (`payId`) REFERENCES `dm_3party_payment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_clients`
--
ALTER TABLE `dm_clients`
  ADD CONSTRAINT `dm_clients_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dm_client_conversations`
--
ALTER TABLE `dm_client_conversations`
  ADD CONSTRAINT `dm_client_conversations_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dm_employee`
--
ALTER TABLE `dm_employee`
  ADD CONSTRAINT `dm_employee_role_fk` FOREIGN KEY (`role`) REFERENCES `dm_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_europe_cases`
--
ALTER TABLE `dm_europe_cases`
  ADD CONSTRAINT `fk_pol_ops_lead` FOREIGN KEY (`lead_id`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dm_europe_payment_adjustments`
--
ALTER TABLE `dm_europe_payment_adjustments`
  ADD CONSTRAINT `fk_pol_pay_adj` FOREIGN KEY (`lead_id`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dm_fee`
--
ALTER TABLE `dm_fee`
  ADD CONSTRAINT `fkfee_branch_key` FOREIGN KEY (`branch`) REFERENCES `dm_branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fkfee_country_key` FOREIGN KEY (`country`) REFERENCES `dm_country_proces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fkfee_currency_key` FOREIGN KEY (`currency`) REFERENCES `dm_currency` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fkfee_service_key` FOREIGN KEY (`service`) REFERENCES `dm_service` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_ops_documents`
--
ALTER TABLE `dm_ops_documents`
  ADD CONSTRAINT `dm_ops_documents_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `dm_pay_history`
--
ALTER TABLE `dm_pay_history`
  ADD CONSTRAINT `dm_pay_history_ibfk_1` FOREIGN KEY (`leadId`) REFERENCES `dmc_forum_leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dm_pnp`
--
ALTER TABLE `dm_pnp`
  ADD CONSTRAINT `dm_pnp_ibfk_2` FOREIGN KEY (`leadid`) REFERENCES `dmc_forum_leads` (`id`);

--
-- Constraints for table `gary_work_docs`
--
ALTER TABLE `gary_work_docs`
  ADD CONSTRAINT `gary_work_docs_ibfk_1` FOREIGN KEY (`ag_no`) REFERENCES `dmc_forum_leads_contracts` (`id`);

--
-- Constraints for table `student_leads_logs`
--
ALTER TABLE `student_leads_logs`
  ADD CONSTRAINT `student_leads_logs_ibfk_1` FOREIGN KEY (`Counsilor`) REFERENCES `dm_employee` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
