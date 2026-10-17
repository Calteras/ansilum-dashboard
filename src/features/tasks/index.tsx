import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import { TasksProvider } from './components/tasks-provider'
import { TasksTable } from './components/tasks-table'
import { tasks } from './data/tasks'

export function Tasks() {
  return (
    <TasksProvider>
      <AppHeader />

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeader
          title='Tasks'
          description='Tasks due this month'
          actions={<TasksPrimaryButtons />}
        />
        <TasksTable data={tasks} />
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
