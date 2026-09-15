'use client';

import { useState, useEffect } from 'react';
import EmailTemplateManager from '@/components/email/EmailTemplateManager';
import EmailDeliveryLogPanel from '@/components/email/EmailDeliveryLogPanel';

export default function EmailTemplatesPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Email Template System</h1>
            <p className="text-gray-600 mt-2">Create, manage, and send email templates to bulk users</p>
          </div>
          <EmailTemplateManager />
          <EmailDeliveryLogPanel />
        </div>
  );
}
