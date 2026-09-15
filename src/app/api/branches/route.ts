import { NextRequest, NextResponse } from 'next/server'
import { CrmBranch, CrmRegion, CrmEmployee } from '@/models'
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
    const region = searchParams.get('region')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { branch: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ]
    }

    if (region) {
      where.region = parseInt(region)
    }

    if (status) {
      where.status = parseInt(status)
    }

    const [branches, total] = await Promise.all([
      CrmBranch.findAll({
        where,
        offset: skip,
        limit: limit,
        order: [['name', 'ASC']]
      }),
      CrmBranch.count({ where })
    ])

    return NextResponse.json({
      branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
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

    const branch = await CrmBranch.create({
      ...data,
      status: data.status || 1
    });

    // Reload with associations
    const branchWithRelations = await CrmBranch.findByPk(branch.id, {
      include: [
        {
          model: CrmRegion,
          as: 'regionInfo',
          attributes: ['id', 'name']
        }
      ]
    });

    return NextResponse.json(branchWithRelations, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
