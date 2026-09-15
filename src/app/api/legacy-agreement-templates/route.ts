import { NextRequest, NextResponse } from 'next/server';
import {
  listLegacyAgreementTemplates,
  readLegacyAgreementTemplate,
  type LegacyAgreementSection,
} from '@/lib/legacyAgreementTemplates';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

function parseSection(value: string | null): LegacyAgreementSection | undefined {
  if (value === 'contract' || value === 'annexureA' || value === 'annexureB') return value;
  return undefined;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['agreements.view']);
  if (isAuthError(auth)) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const section = parseSection(searchParams.get('section'));

    if (action === 'content') {
      const file = searchParams.get('file');
      if (!section || !file) {
        return NextResponse.json(
          { success: false, error: 'section and file are required for template content' },
          { status: 400 }
        );
      }

      const content = await readLegacyAgreementTemplate(section, file);
      return NextResponse.json({ success: true, section, file, content });
    }

    const templates = await listLegacyAgreementTemplates(section);
    return NextResponse.json({
      success: true,
      source: {
        contract: 'D:\\xampp\\htdocs\\dm\\en_contract',
        annexureA: 'D:\\xampp\\htdocs\\dm\\en_annexure_a',
        annexureB: 'D:\\xampp\\htdocs\\dm\\en_annexure_b',
      },
      templates,
      counts: templates.reduce((acc, template) => {
        acc[template.section] = (acc[template.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error('Error loading legacy agreement templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load legacy agreement templates' },
      { status: 500 }
    );
  }
}
