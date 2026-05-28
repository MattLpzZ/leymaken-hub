import { FolderKanban, Timer } from 'lucide-react'
import { Tabs, TabList, Tab, TabPanel } from '@/components/Tabs'
import ProjectList from './tabs/ProjectList'
import TimeTracker from './tabs/TimeTracker'

export default function ProjectsPage() {
  return (
    <Tabs defaultTab="projects">
      <TabList>
        <Tab id="projects"  label="Proyectos"      icon={<FolderKanban size={14} />} />
        <Tab id="time"      label="Time Tracking"  icon={<Timer size={14} />} />
      </TabList>
      <TabPanel id="projects"> <ProjectList /> </TabPanel>
      <TabPanel id="time">     <TimeTracker /> </TabPanel>
    </Tabs>
  )
}
