"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const INTERVAL_LABELS = {
    0: 'Monthly',
    1: 'Yearly',
    2: 'Lifetime',
}

export default function PlansManagement() {
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [seedDialogOpen, setSeedDialogOpen] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [planToDelete, setPlanToDelete] = useState<any>(null)

    const { data: plans, isLoading } = useQuery({
        queryKey: ['admin', 'plans'],
        queryFn: async () => {
            return api.admin.listPlans()
        },
    })

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.admin.createPlan(data)
        },
        onSuccess: () => {
            toast.success('Plan created successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
            setIsCreateOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create plan')
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return api.admin.updatePlan(id, data)
        },
        onSuccess: () => {
            toast.success('Plan updated successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
            setEditingPlan(null)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update plan')
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.admin.deletePlan(id)
        },
        onSuccess: () => {
            toast.success('Plan deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
            setDeleteDialogOpen(false)
            setPlanToDelete(null)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete plan')
        },
    })

    const seedMutation = useMutation({
        mutationFn: async () => {
            return api.admin.seed.plans()
        },
        onSuccess: (result: any) => {
            toast.success(`Seed complete! Created: ${result.created}, Skipped: ${result.skipped}`)
            if (result.errors?.length > 0) {
                toast.error(`${result.errors.length} errors occurred`)
                console.error('Seed errors:', result.errors)
            }
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
            setSeedDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Seed failed')
        },
    })

    const resetMutation = useMutation({
        mutationFn: async () => {
            return api.admin.reset.plans()
        },
        onSuccess: (result: any) => {
            toast.success(`Reset complete! Deleted: ${result.deleted}, Created: ${result.created}`)
            if (result.errors?.length > 0) {
                toast.error(`${result.errors.length} errors occurred`)
                console.error('Reset errors:', result.errors)
            }
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] })
            setResetDialogOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.message || 'Reset failed')
        },
    })

    const handleDeleteClick = (plan: any) => {
        setPlanToDelete(plan)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (planToDelete) {
            deleteMutation.mutate(planToDelete.id)
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
                <h2 className="text-xl md:text-2xl font-bold">Plans Management</h2>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setSeedDialogOpen(true)}
                        disabled={seedMutation.isPending}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        {seedMutation.isPending ? 'Seeding...' : 'Seed Default Plans'}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setResetDialogOpen(true)}
                        disabled={resetMutation.isPending}
                        size="sm"
                        className="w-full sm:w-auto"
                    >
                        {resetMutation.isPending ? 'Resetting...' : 'Reset All Plans'}
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full sm:w-auto" size="sm">
                                <Plus className="h-4 w-4" />
                                Create Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Plan</DialogTitle>
                            </DialogHeader>
                            <PlanForm onSubmit={(data) => createMutation.mutate(data)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {(plans as any)?.map((plan: any) => (
                    <Card key={plan.id} className={`overflow-hidden ${plan.price === 0 ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm md:text-base font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                    <span className="truncate">{plan.name}</span>
                                </span>
                                {plan.price === 0 && <Badge variant="secondary" className="text-xs">Free</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 md:space-y-3 pt-0">
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-bold text-base md:text-lg">₹{plan.price}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Interval</span>
                                <Badge className="text-xs">{INTERVAL_LABELS[plan.interval as keyof typeof INTERVAL_LABELS]}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Tokens</span>
                                <span className="font-medium">{plan.tokensIncluded}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={plan.isActive ? 'default' : 'secondary'} className="text-xs">
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            {plan.description && (
                                <p className="text-xs text-muted-foreground pt-2 border-t line-clamp-2">
                                    {plan.description}
                                </p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditingPlan(plan)}>
                                            <Edit className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Plan</DialogTitle>
                                        </DialogHeader>
                                        <PlanForm
                                            initialData={plan}
                                            onSubmit={(data) => updateMutation.mutate({ id: plan.id, data })}
                                        />
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    onClick={() => handleDeleteClick(plan)}
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
                        <AlertDialogTitle>Seed Default Plans</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create default subscription plans if they don't already exist.
                            Existing plans will not be affected.
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

            {/* Reset Confirmation Dialog */}
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ Reset All Plans</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p className="font-semibold text-destructive">
                                WARNING: This action cannot be undone!
                            </p>
                            <p>
                                This will permanently delete ALL existing plans and recreate the default plans.
                                Any custom plans you've created will be lost.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => resetMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, Reset All Plans
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Plan Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the plan "{planToDelete?.name}"?
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

function PlanForm({ initialData, onSubmit }: { initialData?: any; onSubmit: (data: any) => void }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        type: initialData?.type || 0,
        interval: initialData?.interval || 0,
        price: initialData?.price || 0,
        tokensIncluded: initialData?.tokensIncluded || 0,
        maxGroups: initialData?.maxGroups || null,
        maxInvitesPerDay: initialData?.maxInvitesPerDay || null,
        isActive: initialData?.isActive ?? true,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="interval">Billing Interval *</Label>
                    <Select
                        value={formData.interval.toString()}
                        onValueChange={(value) => setFormData({ ...formData, interval: parseInt(value) })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Monthly</SelectItem>
                            <SelectItem value="1">Yearly</SelectItem>
                            <SelectItem value="2">Lifetime</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tokensIncluded">Tokens Included *</Label>
                    <Input
                        id="tokensIncluded"
                        type="number"
                        min="0"
                        value={formData.tokensIncluded}
                        onChange={(e) => setFormData({ ...formData, tokensIncluded: parseInt(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="maxGroups">Max Groups (optional)</Label>
                    <Input
                        id="maxGroups"
                        type="number"
                        min="0"
                        value={formData.maxGroups || ''}
                        onChange={(e) => setFormData({ ...formData, maxGroups: e.target.value ? parseInt(e.target.value) : null })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maxInvitesPerDay">Max Invites/Day (optional)</Label>
                    <Input
                        id="maxInvitesPerDay"
                        type="number"
                        min="0"
                        value={formData.maxInvitesPerDay || ''}
                        onChange={(e) => setFormData({ ...formData, maxInvitesPerDay: e.target.value ? parseInt(e.target.value) : null })}
                    />
                </div>
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
                {initialData ? 'Update Plan' : 'Create Plan'}
            </Button>
        </form>
    )
}
