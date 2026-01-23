'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsForm } from '@/components/admin/settings-form'
import { TeamList } from '@/components/admin/team-list'
import { Card } from '@/components/ui/card'
import { Settings, Users } from 'lucide-react'
import type { Organization } from '@/lib/types'

interface SettingsTabsProps {
  organization: Organization
}

export function SettingsTabs({ organization }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">
          <Settings className="h-4 w-4 mr-2" />
          General
        </TabsTrigger>
        <TabsTrigger value="team">
          <Users className="h-4 w-4 mr-2" />
          Team
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="p-6">
          <SettingsForm organization={organization} />
        </Card>
      </TabsContent>

      <TabsContent value="team">
        <Card className="p-6">
          <TeamList />
        </Card>
      </TabsContent>
    </Tabs>
  )
}

