import { NextRequest, NextResponse } from 'next/server'
import { CrmRegion, CrmBranch, CrmEmployee } from '@/models'
import { Op } from 'sequelize'
import { requireAuth, isAuthError } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage'])
  if (isAuthError(auth)) return auth
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } }
      ]
    }

    if (status) {
      where.status = parseInt(status)
    }

    const [regions, total] = await Promise.all([
      CrmRegion.findAll({
        where,
        offset: skip,
        limit: limit,
        order: [['name', 'ASC']]
      }),
      CrmRegion.count({ where })
    ])

    // Add counts to each region
    const regionsWithCounts = await Promise.all(
      regions.map(async (region) => {
        const [branchCount, employeeCount] = await Promise.all([
          CrmBranch.count({ where: { region: region.getDataValue('id') } }),
          CrmEmployee.count({ where: { region: region.getDataValue('id') } })
        ])

        return {
          ...region.toJSON(),
          branchCount,
          employeeCount
        }
      })
    )

    return NextResponse.json({
      regions: regionsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['branches.manage'])
  if (isAuthError(auth)) return auth
  try {
    const data = await request.json()

    const region = await CrmRegion.create({
      ...data,
      status: data.status || 1
    });

    const regionWithRelations = await CrmRegion.findByPk(region.id, {
      include: [CrmBranch, CrmEmployee]
    });

    return NextResponse.json(regionWithRelations, { status: 201 })
  } catch (error) {
    console.error('Error creating region:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
