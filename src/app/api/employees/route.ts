import { NextRequest, NextResponse } from 'next/server'
import { CrmEmployee, CrmRole, CrmBranch, CrmRegion } from '@/models'
import { Op } from 'sequelize'
import { requireAuth, isAuthError } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  // Read-only listing also accepts counselors.manage - Branch Manager holds
  // that permission (not employees.manage) but still needs to list their
  // branch's counselors, e.g. to populate the Leads page's counselor filter.
  const auth = requireAuth(request, ['employees.manage', 'counselors.manage'])
  if (isAuthError(auth)) return auth
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const branch = searchParams.get('branch')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } }
      ]
    }

    if (role) {
      where.role = parseInt(role)
    }

    if (branch) {
      where.branch = parseInt(branch)
    }

    if (status) {
      where.status = parseInt(status)
    }

    const [employees, total] = await Promise.all([
      CrmEmployee.findAll({
        where,
        offset: skip,
        limit: limit,
        order: [['name', 'ASC']]
      }),
      CrmEmployee.count({ where })
    ])

    return NextResponse.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['employees.manage'])
  if (isAuthError(auth)) return auth
  try {
    const data = await request.json()

    const employee = await CrmEmployee.create({
      ...data,
      status: data.status || 1,
      crea: 1, // Should be current user ID
      wfh: data.wfh || 0
    });

    // Reload with associations
    const employeeWithRelations = await CrmEmployee.findByPk(employee.id, {
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'type']
        },
        {
          association: 'branch',
          attributes: ['id', 'name']
        },
        {
          association: 'region',
          attributes: ['id', 'name']
        }
      ]
    });

    return NextResponse.json(employeeWithRelations, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
