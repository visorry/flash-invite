"use client"

import { useState } from 'react'
import NextLink from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, Users, Link, Eye, Zap, Forward, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function TutorialPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tutorial & Guide</h1>
        <p className="text-muted-foreground">
          Learn how to use FlashInvite to manage your Telegram groups and bots
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">Important: Follow Steps Exactly</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Please follow each step in the exact order shown below to avoid errors. Skipping steps or doing them out of order may cause issues.
            </p>
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-4">
        {/* Add Your Bot */}
        <AccordionItem value="add-bot" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Add Your Bot</h3>
                <p className="text-sm text-muted-foreground">Connect your Telegram bot to FlashInvite</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Create a Bot with BotFather</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Open Telegram and search for <code className="bg-muted px-1 py-0.5 rounded">@BotFather</code>. 
                    Send <code className="bg-muted px-1 py-0.5 rounded">/newbot</code> and follow the instructions to create your bot.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">Get Your Bot Token</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    BotFather will give you a token that looks like <code className="bg-muted px-1 py-0.5 rounded">123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11</code>. 
                    Copy this token.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Start Using Your Bot</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your bot is now ready! Proceed to the next section to add it to your Telegram groups.
                  </p>
                </div>
              </div>

              <NextLink href="/dashboard/bots" className="block mt-4">
                <Button className="w-full">
                  <Bot className="h-4 w-4 mr-2" />
                  Go to My Bots
                </Button>
              </NextLink>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Add Your Groups */}
        <AccordionItem value="add-groups" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Add Your Groups</h3>
                <p className="text-sm text-muted-foreground">Connect your Telegram groups to manage them</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Add Bot to Your Group</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Open your Telegram group, tap the group name → <strong>Add Members</strong> → Search for your bot and add it.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">Make Bot an Administrator</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tap the group name → <strong>Administrators</strong> → <strong>Add Administrator</strong> → Select your bot.
                    Give it necessary permissions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">View Your Groups (Automatic Detection)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once the bot is granted admin privileges, your group will automatically appear in <strong>Dashboard → My Bots</strong>. 
                    Click "View Details" on your bot, then click the "Refresh" button to see all groups where the bot has admin access. 
                    Groups typically appear within a few seconds, or you can manually refresh if needed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">4</Badge>
                <div>
                  <p className="font-medium">Alternative: Manual Group Addition</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If your group doesn't appear automatically, you can add it manually. Navigate to <strong>Dashboard → Groups → Add Group</strong>, 
                    select your bot, and enter the group's Telegram ID or username. This method is useful for troubleshooting or adding specific groups.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Important Requirements</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      The bot must be added as an <strong>administrator</strong> in your group. Regular member status is insufficient. 
                      Groups will only be detected and manageable through FlashInvite once the bot has been granted administrative privileges.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <NextLink href="/dashboard/bots" className="flex-1">
                  <Button className="w-full" variant="outline">
                    <Bot className="h-4 w-4 mr-2" />
                    View My Bots
                  </Button>
                </NextLink>
                <NextLink href="/dashboard/groups/add" className="flex-1">
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Add Group Manually
                  </Button>
                </NextLink>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Generate Subscription Link */}
        <AccordionItem value="subscription-link" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Link className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Generate Subscription Link</h3>
                <p className="text-sm text-muted-foreground">Create time-based invite links for your groups</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Go to Invites</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Navigate to <strong>Dashboard → Invites</strong> and click "Create Invite Link".
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">Configure Link Settings</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your group and choose duration (1 day, 1 week, 1 month, etc.).
                    The system will calculate the token cost based on duration.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Share the Link</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy the generated bot link and share it. When users click it, they'll be added to your group for the specified duration.
                    After the time expires, they'll be automatically removed.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                <div className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Pro Tip</p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      You can create multiple links with different durations for the same group. 
                      Track link usage and member activity in the Members section.
                    </p>
                  </div>
                </div>
              </div>

              <NextLink href="/dashboard/invites" className="block mt-4">
                <Button className="w-full">
                  <Link className="h-4 w-4 mr-2" />
                  Go to Invites
                </Button>
              </NextLink>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* View Your Members */}
        <AccordionItem value="view-members" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">View Your Members</h3>
                <p className="text-sm text-muted-foreground">Monitor and manage group members</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                <div>
                  <p className="font-medium">Access Members Dashboard</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to <strong>Dashboard → Members</strong> to see all users who joined through your invite links.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                <div>
                  <p className="font-medium">View Member Details</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    See member information including: username, join date, expiry date, which invite link they used, and current status.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                <div>
                  <p className="font-medium">Track Activity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monitor when members will be removed, view join logs, and track subscription renewals.
                  </p>
                </div>
              </div>

              <NextLink href="/dashboard/members" className="block mt-4">
                <Button className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Go to Members
                </Button>
              </NextLink>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Automate Groups */}
        <AccordionItem value="automate-groups" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Automate Groups</h3>
                <p className="text-sm text-muted-foreground">Set up automation rules for your groups</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-6 space-y-6">
            {/* Auto Forward Messages */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Forward className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Auto Forward Messages</h4>
              </div>

              <div className="space-y-3 ml-7">
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                  <div>
                    <p className="font-medium">Add Bot as Admin in Source Group</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong className="text-amber-600 dark:text-amber-400">Critical:</strong> The bot must be added as an administrator 
                      in the <strong>source group</strong> (where messages originate) FIRST. The bot cannot see messages posted before it was added.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                  <div>
                    <p className="font-medium">Add Bot as Admin in Destination Group</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The bot also needs admin rights in the destination group to post messages.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                  <div>
                    <p className="font-medium">Create Forward Rule</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to <strong>Dashboard → Forwarding</strong> → "Create Rule". Select the bot first, then select source and destination groups, 
                      configure filters (media types, keywords), and set forwarding mode (realtime or scheduled).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">4</Badge>
                  <div>
                    <p className="font-medium">Post New Messages</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only messages posted <strong>after</strong> the bot was added as admin will be forwarded. 
                      The bot cannot access or forward previous messages.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">Important Limitation</p>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                        Telegram bots can only see messages sent <strong>after</strong> they join a group. 
                        If you want to forward existing messages, you must add the bot as admin first, 
                        then post new content. Historical messages cannot be accessed.
                      </p>
                    </div>
                  </div>
                </div>

                <NextLink href="/dashboard/forward-rules" className="block mt-4">
                  <Button className="w-full">
                    <Forward className="h-4 w-4 mr-2" />
                    Go to Forwarding
                  </Button>
                </NextLink>
              </div>
            </div>

            {/* Custom Auto Approval */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Custom Auto Approval Members</h4>
              </div>

              <div className="space-y-3 ml-7">
                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">1</Badge>
                  <div>
                    <p className="font-medium">Enable Join Requests</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      In your Telegram group settings, enable "Approve New Members" to require approval for join requests.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">2</Badge>
                  <div>
                    <p className="font-medium">Create Auto Approval Rule</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Go to <strong>Dashboard → Auto Approval</strong> → "Create Rule". Select your group and configure approval settings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">3</Badge>
                  <div>
                    <p className="font-medium">Configure Filters</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set filters like: require premium account, require username, minimum account age, 
                      blocked countries, or instant/delayed approval.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0">4</Badge>
                  <div>
                    <p className="font-medium">Optional Welcome Message</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enable welcome messages to greet approved members automatically with a custom message.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Approval Modes</p>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 mt-1 space-y-1 list-disc list-inside">
                        <li><strong>Instant:</strong> Approve immediately if filters pass</li>
                        <li><strong>Delayed:</strong> Wait specified time before approving</li>
                        <li><strong>Captcha:</strong> Require user to solve captcha (coming soon)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <NextLink href="/dashboard/auto-approval" className="block mt-4">
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Go to Auto Approval
                  </Button>
                </NextLink>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Need Help Section */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Need More Help?
          </CardTitle>
          <CardDescription>
            If you have questions or need assistance, feel free to reach out to our support team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact us at <a href="mailto:support@flashinvite.com" className="text-primary hover:underline">support@flashinvite.com</a> or 
            join our support group on Telegram.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
