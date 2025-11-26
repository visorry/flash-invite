import { NotFoundError, BadRequestError } from '../../errors/http-exception'
import db from '@super-invite/db'

const getAllBundles = async () => {
    return db.tokenBundle.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
    })
}

const createBundle = async (data: {
    name: string
    description?: string
    tokens: number
    price: number
    currency?: string
    isActive?: boolean
}) => {
    return db.tokenBundle.create({
        data: {
            name: data.name,
            description: data.description,
            tokens: data.tokens,
            price: data.price,
            currency: data.currency || 'INR',
            isActive: data.isActive ?? true,
        },
    })
}

const updateBundle = async (id: string, data: {
    name?: string
    description?: string
    tokens?: number
    price?: number
    currency?: string
    isActive?: boolean
}) => {
    const bundle = await db.tokenBundle.findUnique({
        where: { id },
    })

    if (!bundle || bundle.deletedAt) {
        throw new NotFoundError('Token bundle not found')
    }

    return db.tokenBundle.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.tokens !== undefined && { tokens: data.tokens }),
            ...(data.price !== undefined && { price: data.price }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
    })
}

const deleteBundle = async (id: string) => {
    const bundle = await db.tokenBundle.findUnique({
        where: { id },
    })

    if (!bundle || bundle.deletedAt) {
        throw new NotFoundError('Token bundle not found')
    }

    return db.tokenBundle.update({
        where: { id },
        data: { deletedAt: new Date() },
    })
}

const toggleActive = async (id: string) => {
    const bundle = await db.tokenBundle.findUnique({
        where: { id },
    })

    if (!bundle || bundle.deletedAt) {
        throw new NotFoundError('Token bundle not found')
    }

    return db.tokenBundle.update({
        where: { id },
        data: { isActive: !bundle.isActive },
    })
}

export default {
    getAllBundles,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleActive,
}
