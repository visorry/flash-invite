"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Gift, Sparkles, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const WELCOME_BONUS_SHOWN_KEY = 'welcome_bonus_shown'

interface WelcomeBonusPopupProps {
  userId: string
}

export function WelcomeBonusPopup({ userId }: WelcomeBonusPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [bonusAmount, setBonusAmount] = useState(100) // Default, will be fetched from config
  const queryClient = useQueryClient()

  useEffect(() => {
    const checkWelcomeBonusEligibility = async () => {
      // Check if popup was already shown
      const alreadyShown = localStorage.getItem(`${WELCOME_BONUS_SHOWN_KEY}_${userId}`)
      if (alreadyShown) {
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        
        // Fetch welcome bonus config (public endpoint)
        const configResponse = await fetch(`${apiUrl}/api/v1/tokens/welcome-bonus-config`, {
          credentials: 'include',
        })
        
        if (configResponse.ok) {
          const configData = await configResponse.json()
          if (configData.data?.amount) {
            setBonusAmount(configData.data.amount)
          }
        }
        
        // Check if user already has the bonus
        const statusResponse = await fetch(`${apiUrl}/api/v1/tokens/welcome-bonus-status`, {
          credentials: 'include',
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          if (statusData.data?.hasReceived) {
            // User already claimed, don't show popup
            localStorage.setItem(`${WELCOME_BONUS_SHOWN_KEY}_${userId}`, 'true')
            return
          }
          
          // User is eligible for welcome bonus - show popup
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Failed to check welcome bonus eligibility:', error)
      }
    }

    if (userId) {
      checkWelcomeBonusEligibility()
    }
  }, [userId])

  const handleClaim = async () => {
    setIsClaiming(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/v1/tokens/claim-welcome-bonus`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.data && !data.data.alreadyClaimed) {
          setIsClaimed(true)
          toast.success(`🎉 ${data.data.tokensGranted || bonusAmount} tokens added to your account!`)
          
          // Invalidate token balance and transactions queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['tokens', 'balance'] })
          queryClient.invalidateQueries({ queryKey: ['tokens', 'transactions'] })
          
          // Mark as shown in localStorage
          localStorage.setItem(`${WELCOME_BONUS_SHOWN_KEY}_${userId}`, 'true')
          
          // Close after a short delay
          setTimeout(() => {
            setIsOpen(false)
          }, 1500)
        } else {
          toast.error('Welcome bonus already claimed')
          setIsOpen(false)
        }
      } else {
        toast.error('Failed to claim welcome bonus')
      }
    } catch (error) {
      console.error('Failed to claim welcome bonus:', error)
      toast.error('Failed to claim welcome bonus')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* GitHub green themed icon */}
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                <Coins className="h-10 w-10 text-primary relative z-10" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to FlashInvite! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            As a special welcome gift, we're giving you
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Token amount with GitHub green styling */}
          <div className="text-center relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            <div className="relative">
              <div className="text-6xl font-bold text-primary">
                {bonusAmount}
              </div>
              <div className="text-xl font-semibold text-muted-foreground mt-2 flex items-center justify-center gap-2">
                <Coins className="h-5 w-5" />
                Free Tokens
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground max-w-sm px-4">
            Use these tokens to create invite links, manage your bots, and explore all the amazing features!
          </div>

          <Button
            onClick={handleClaim}
            disabled={isClaimed || isClaiming}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            {isClaimed ? (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Claimed!
              </>
            ) : isClaiming ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-5 w-5" />
                Claim Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
