"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useState } from 'react'
import { Plus, Edit, Trash2, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function TokenBundlesManagement() {
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingBundle, setEditingBundle] = useState<any>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [bundleToDelete, setBundleToDelete] = useState<any>(null)
    const [seedDialogOpen, setSeedDialogOpen] = useState(false)

    const { data: bundles, isLoading } = useQuery({
        queryKey: ['admin', 'token-bundles'],
        queryFn: async () => {
            return api.admin.tokenBundles.list()
        },
    })

    const seedMutation = useMutation({
        mutationFn: async () => {
            return api.admin.seed.tokenBundles()
        },
        onSuccess: (result: any) => {
            toast.success(`Seed complete! Created: ${result.created}, Skipped: ${result.skipped}`)
            if (result.errors?.length > 0) {
                toast.error(`${result.errors.length} errors occurred`)
                console.error('Seed errors:', result.errors)
            }
            queryClient.invalidateQueries({ queryKey: ['admin', 'token-bundles'] })
            setSeedDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Seed failed')
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.admin.tokenBundles.create(data)
        },
        onSuccess: () => {
            toast.success('Token bundle created successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'token-bundles'] })
            setIsCreateOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create token bundle')
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return api.admin.tokenBundles.update(id, data)
        },
        onSuccess: () => {
            toast.success('Token bundle updated successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'token-bundles'] })
            setEditingBundle(null)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update token bundle')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.admin.tokenBundles.delete(id)
        },
        onSuccess: () => {
            toast.success('Token bundle deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'token-bundles'] })
            setDeleteDialogOpen(false)
            setBundleToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete token bundle')
        },
    })

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.admin.tokenBundles.toggle(id)
        },
        onSuccess: () => {
            toast.success('Token bundle status updated')
            queryClient.invalidateQueries({ queryKey: ['admin', 'token-bundles'] })
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update status')
        },
    })

    const handleDeleteClick = (bundle: any) => {
        setBundleToDelete(bundle)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (bundleToDelete) {
            deleteMutation.mutate(bundleToDelete.id)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl md:text-2xl font-bold">Token Bundles</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setSeedDialogOpen(true)}
                        disabled={seedMutation.isPending}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        {seedMutation.isPending ? 'Seeding...' : 'Seed Default Bundles'}
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full sm:w-auto" size="sm">
                                <Plus className="h-4 w-4" />
                                Create Bundle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Token Bundle</DialogTitle>
                            </DialogHeader>
                            <BundleForm onSubmit={(data) => createMutation.mutate(data)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {(bundles as any)?.map((bundle: any) => (
                    <Card key={bundle.id} className={`overflow-hidden ${!bundle.isActive ? 'opacity-75' : ''}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm md:text-base font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Coins className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 text-yellow-500" />
                                    <span className="truncate">{bundle.name}</span>
                                </span>
                                <Badge variant={bundle.isActive ? 'default' : 'secondary'} className="text-xs cursor-pointer" onClick={() => toggleMutation.mutate(bundle.id)}>
                                    {bundle.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 md:space-y-3 pt-0">
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-bold text-base md:text-lg">₹{bundle.price}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Tokens</span>
                                <span className="font-medium">{bundle.tokens}</span>
                            </div>
                            {bundle.description && (
                                <p className="text-xs text-muted-foreground pt-2 border-t line-clamp-2">
                                    {bundle.description}
                                </p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Dialog open={editingBundle?.id === bundle.id} onOpenChange={(open) => !open && setEditingBundle(null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditingBundle(bundle)}>
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Token Bundle</DialogTitle>
                                        </DialogHeader>
                                        <BundleForm
                                            initialData={bundle}
                                            onSubmit={(data) => updateMutation.mutate({ id: bundle.id, data })}
                                        />
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => handleDeleteClick(bundle)}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Seed Confirmation Dialog */}
            <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Seed Default Token Bundles</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create default token bundles if they don't already exist.
                            Existing bundles will not be affected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => seedMutation.mutate()}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Bundle Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Token Bundle</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the bundle "{bundleToDelete?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function BundleForm({ initialData, onSubmit }: { initialData?: any; onSubmit: (data: any) => void }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price || 0,
        tokens: initialData?.tokens || 0,
        isActive: initialData?.isActive ?? true,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Bundle Name *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tokens">Tokens Amount *</Label>
                    <Input
                        id="tokens"
                        type="number"
                        min="1"
                        value={formData.tokens}
                        onChange={(e) => setFormData({ ...formData, tokens: parseInt(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
            </div>

            <Button type="submit" className="w-full">
                {initialData ? 'Update Bundle' : 'Create Bundle'}
            </Button>
        </form>
    )
}
