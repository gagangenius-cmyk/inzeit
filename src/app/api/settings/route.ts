import { NextRequest, NextResponse } from 'next/server';
import { QueryTypes } from 'sequelize';
import { sequelize, connectDB } from '@/lib/sequelize';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

let dbReady = false;
const ensureDB = async () => { if (!dbReady) { await connectDB(); dbReady = true; } };

let prefsTableReady: Promise<void> | null = null;
const ensurePreferencesTable = async () => {
  if (!prefsTableReady) {
    prefsTableReady = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS crm_employee_preferences (
          employee_id INT NOT NULL PRIMARY KEY,
          email_notifications TINYINT NOT NULL DEFAULT 1,
          lead_alerts TINYINT NOT NULL DEFAULT 1,
          appointment_reminders TINYINT NOT NULL DEFAULT 1,
          payment_alerts TINYINT NOT NULL DEFAULT 1,
          whatsapp_template TEXT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      // Table may already exist from before whatsapp_template was added.
      try {
        await sequelize.query(`ALTER TABLE crm_employee_preferences ADD COLUMN whatsapp_template TEXT NULL`);
      } catch (error) {
        const code = (error as { original?: { code?: string } })?.original?.code;
        if (code !== 'ER_DUP_FIELDNAME') throw error;
      }
    })().catch((error) => {
      prefsTableReady = null;
      throw error;
    });
  }
  await prefsTableReady;
};

const defaults = {
  emailNotifications: true,
  leadAlerts: true,
  appointmentReminders: true,
  paymentAlerts: true,
  whatsappTemplate: '',
};

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  await ensurePreferencesTable();
  const userId = auth.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [row] = await sequelize.query<any>(
    `SELECT email_notifications, lead_alerts, appointment_reminders, payment_alerts, whatsapp_template
     FROM crm_employee_preferences WHERE employee_id = :userId LIMIT 1`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  const preferences = row ? {
    emailNotifications: !!row.email_notifications,
    leadAlerts: !!row.lead_alerts,
    appointmentReminders: !!row.appointment_reminders,
    paymentAlerts: !!row.payment_alerts,
    whatsappTemplate: row.whatsapp_template || '',
  } : defaults;

  return NextResponse.json({ success: true, preferences });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request);
  if (isAuthError(auth)) return auth;

  await ensureDB();
  await ensurePreferencesTable();
  const userId = auth.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const preferences = { ...defaults, ...body };

  await sequelize.query(
    `INSERT INTO crm_employee_preferences
       (employee_id, email_notifications, lead_alerts, appointment_reminders, payment_alerts, whatsapp_template)
     VALUES (:userId, :email, :leads, :appointments, :payments, :whatsappTemplate)
     ON DUPLICATE KEY UPDATE
       email_notifications = VALUES(email_notifications),
       lead_alerts = VALUES(lead_alerts),
       appointment_reminders = VALUES(appointment_reminders),
       payment_alerts = VALUES(payment_alerts),
       whatsapp_template = VALUES(whatsapp_template)`,
    {
      replacements: {
        userId,
        email: preferences.emailNotifications ? 1 : 0,
        leads: preferences.leadAlerts ? 1 : 0,
        appointments: preferences.appointmentReminders ? 1 : 0,
        payments: preferences.paymentAlerts ? 1 : 0,
        whatsappTemplate: preferences.whatsappTemplate || '',
      },
    }
  );

  return NextResponse.json({ success: true });
}
