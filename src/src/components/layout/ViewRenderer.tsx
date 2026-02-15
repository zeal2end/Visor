import { useStore } from '../../store';
import { ViewEntry, Task, Project, TASK_STATUS_CONFIG } from '../../store/types';
import { TaskItem } from '../tasks/TaskItem';
import { Kbd } from '../common/Kbd';
import { fuzzySearchTasks } from '../../lib/search';

// --- Date helpers ---

function formatDueLabel(dueAt: number): { label: string; isOverdue: boolean; isToday: boolean } {
    const now = new Date();
    const due = new Date(dueAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
    if (diffDays === 0) return { label: 'today', isOverdue: false, isToday: true };
    if (diffDays === 1) return { label: 'tomorrow', isOverdue: false, isToday: false };
    if (diffDays <= 7) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return { label: days[due.getDay()], isOverdue: false, isToday: false };
    }
    return { label: due.toLocaleDateString([], { month: 'short', day: 'numeric' }), isOverdue: false, isToday: false };
}

// --- View Renderer ---

export function ViewRenderer({ view }: { view: ViewEntry }) {
    switch (view.type) {
        case 'home': return <HomeView />;
        case 'agenda': return <AgendaView />;
        case 'project': return <ProjectView projectId={view.projectId} />;
        case 'thread': return <ThreadView projectId={view.projectId} parentTaskId={view.parentTaskId} />;
        case 'templates': return <TemplatesView />;
        case 'journal': return <JournalView projectId={view.projectId} />;
        case 'help': return <HelpView />;
        case 'search': return <SearchView query={view.query} />;
        case 'detail': return <DetailView taskId={view.taskId} />;
        case 'project-settings': return <ProjectSettingsView projectId={view.projectId} />;
    }
}

// --- Home View ---

function HomeView() {
    const { tasks, projects, getProjectStats, getAgendaTasks, selectedItemIndex, pushView } = useStore();
    const projectStats = getProjectStats();
    const agenda = getAgendaTasks();

    const totalPending = Object.values(tasks).filter(t => !t.archived && !t.completed).length;

    let globalIdx = 0;

    return (
        <div className="home-view">
            <div className="home-header">
                <h2 className="home-title">Visor</h2>
                <div className="home-stats">
                    <span className="home-stat"><strong>{totalPending}</strong> pending</span>
                    <span className="home-stat-sep">&middot;</span>
                    <span className="home-stat"><strong>{projectStats.length}</strong> projects</span>
                </div>
            </div>

            {agenda.doing.length > 0 && (
                <div className="view-section">
                    <h4 className="view-heading home-heading-doing">In Progress</h4>
                    <div className="home-task-list">
                        {agenda.doing.map(task => (
                            <HomeTaskRow key={task.id} task={task} project={projects[task.projectId]} isSelected={globalIdx++ === selectedItemIndex} />
                        ))}
                    </div>
                </div>
            )}

            {(agenda.overdue.length > 0 || agenda.today.length > 0) && (
                <div className="view-section">
                    {agenda.overdue.length > 0 && (
                        <>
                            <h4 className="view-heading home-heading-overdue">Overdue</h4>
                            <div className="home-task-list">
                                {agenda.overdue.map(task => (
                                    <HomeTaskRow key={task.id} task={task} project={projects[task.projectId]} isSelected={globalIdx++ === selectedItemIndex} />
                                ))}
                            </div>
                        </>
                    )}
                    {agenda.today.length > 0 && (
                        <>
                            <h4 className="view-heading home-heading-today" style={{ marginTop: agenda.overdue.length > 0 ? 12 : 0 }}>Due Today</h4>
                            <div className="home-task-list">
                                {agenda.today.map(task => (
                                    <HomeTaskRow key={task.id} task={task} project={projects[task.projectId]} isSelected={globalIdx++ === selectedItemIndex} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="view-section">
                <h4 className="view-heading">Projects</h4>
                <div className="home-project-list">
                    {projectStats.map(({ project, total, pending, progress }) => {
                        const isSelected = globalIdx++ === selectedItemIndex;
                        return (
                            <div
                                key={project.id}
                                className={`home-project-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => pushView({ type: 'project', projectId: project.id })}
                            >
                                <span className="home-project-dot" style={{ background: project.color }} />
                                <span className="home-project-name">{project.name}</span>
                                <span className="home-project-counts">
                                    {total === 0 ? (
                                        <span className="home-project-empty">empty</span>
                                    ) : (
                                        <>
                                            <span className="home-project-bar" style={{ width: 40 }}>
                                                <span className="home-project-bar-fill" style={{ width: `${progress}%`, background: project.color }} />
                                            </span>
                                            {pending > 0 && <span className="home-project-pending">{pending}</span>}
                                        </>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function HomeTaskRow({ task, project, isSelected }: { task: Task; project?: Project; isSelected: boolean }) {
    const { navigateToTask } = useStore();
    const dueInfo = task.dueAt ? formatDueLabel(task.dueAt) : null;
    const status = TASK_STATUS_CONFIG[task.status || 'TODO'];

    return (
        <div className={`home-task-row ${isSelected ? 'selected' : ''}`} onClick={() => navigateToTask(task.id)}>
            <span className="home-task-status" style={{ color: status.color }}>{status.icon}</span>
            <span className="home-task-content">{task.content}</span>
            <span className="home-task-meta">
                {dueInfo && (
                    <span className={`home-task-due ${dueInfo.isOverdue ? 'overdue' : ''} ${dueInfo.isToday ? 'due-today' : ''}`}>
                        {dueInfo.label}
                    </span>
                )}
                {project && <span className="home-task-project" style={{ borderColor: project.color, color: project.color }}>{project.slug}</span>}
            </span>
        </div>
    );
}

// --- Agenda View ---

function AgendaView() {
    const { getAgendaTasks, projects, selectedItemIndex, cycleTaskStatus } = useStore();
    const agenda = getAgendaTasks();
    let runningIndex = 0;

    const renderSection = (title: string, tasks: Task[], headingClass?: string) => {
        if (tasks.length === 0) return null;
        const startIdx = runningIndex;
        runningIndex += tasks.length;
        return (
            <div className="view-section" key={title}>
                <h4 className={`view-heading ${headingClass || ''}`}>{title}</h4>
                <div className="agenda-task-list">
                    {tasks.map((task, i) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            isSelected={startIdx + i === selectedItemIndex}
                            onComplete={() => cycleTaskStatus(task.id)}
                            projectSlug={projects[task.projectId]?.slug}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const allTasks = [...agenda.doing, ...agenda.overdue, ...agenda.today, ...agenda.thisWeek, ...agenda.upcoming];

    return (
        <div className="agenda-view">
            <h3 className="agenda-title">Agenda</h3>
            {allTasks.length === 0 ? (
                <div className="agenda-empty">
                    <p>No upcoming deadlines or scheduled tasks.</p>
                    <p className="agenda-hint">Add <code>!today</code> or <code>@mon</code> to tasks for deadlines.</p>
                </div>
            ) : (
                <>
                    {renderSection('In Progress', agenda.doing, 'home-heading-doing')}
                    {renderSection('Overdue', agenda.overdue, 'home-heading-overdue')}
                    {renderSection('Today', agenda.today, 'home-heading-today')}
                    {renderSection('This Week', agenda.thisWeek)}
                    {renderSection('Upcoming', agenda.upcoming)}
                </>
            )}
        </div>
    );
}

// --- Project View ---

function ProjectView({ projectId }: { projectId: string }) {
    const { projects, tasks, getViewItems, selectedItemIndex, cycleTaskStatus } = useStore();
    const project = projects[projectId];
    const items = getViewItems();

    if (!project) return <div className="view-empty">Project not found</div>;

    if (items.length === 0) {
        return (
            <div className="project-view">
                <div className="project-empty">
                    <p>No tasks in {project.name}.</p>
                    <p className="project-empty-hint">Press <Kbd keys="i" size="sm" /> to add a task.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="project-view">
            {items.map((item, i) => {
                if (item.type !== 'task') return null;
                const task = item.data;
                const hasChildren = project.taskOrder.some(id => {
                    const t = tasks[id];
                    return t && !t.archived && t.parentId === task.id;
                });
                const childCount = hasChildren ? project.taskOrder.filter(id => {
                    const t = tasks[id];
                    return t && !t.archived && t.parentId === task.id;
                }).length : 0;

                return (
                    <TaskItem
                        key={task.id}
                        task={task}
                        isSelected={i === selectedItemIndex}
                        onComplete={() => cycleTaskStatus(task.id)}
                        hasChildren={hasChildren}
                        childCount={childCount}
                    />
                );
            })}
        </div>
    );
}

// --- Thread View ---

function ThreadView({ projectId, parentTaskId }: { projectId: string; parentTaskId: string }) {
    const { projects, tasks, getProjectTasks, selectedItemIndex, cycleTaskStatus } = useStore();
    const project = projects[projectId];
    const parentTask = tasks[parentTaskId];
    const childTasks = getProjectTasks(projectId, parentTaskId);

    if (!project || !parentTask) return <div className="view-empty">Not found</div>;

    return (
        <div className="thread-view">
            <div className="thread-header">
                <span className="thread-parent-content">{parentTask.content}</span>
                {parentTask.notes && <p className="thread-notes">{parentTask.notes}</p>}
            </div>

            {childTasks.length === 0 ? (
                <div className="project-empty">
                    <p>No subtasks yet.</p>
                    <p className="project-empty-hint">Press <Kbd keys="i" size="sm" /> to add a subtask.</p>
                </div>
            ) : (
                childTasks.map((task, i) => {
                    const hasChildren = project.taskOrder.some(id => {
                        const t = tasks[id];
                        return t && !t.archived && t.parentId === task.id;
                    });
                    const childCount = hasChildren ? project.taskOrder.filter(id => {
                        const t = tasks[id];
                        return t && !t.archived && t.parentId === task.id;
                    }).length : 0;

                    return (
                        <TaskItem
                            key={task.id}
                            task={task}
                            isSelected={i === selectedItemIndex}
                            onComplete={() => cycleTaskStatus(task.id)}
                            hasChildren={hasChildren}
                            childCount={childCount}
                        />
                    );
                })
            )}
        </div>
    );
}

// --- Templates View ---

function TemplatesView() {
    const { templates, selectedItemIndex } = useStore();

    if (templates.length === 0) {
        return (
            <div className="templates-view">
                <h3 className="templates-title">Templates</h3>
                <div className="templates-empty">
                    <p>No templates saved yet.</p>
                    <p className="templates-hint">Navigate to a project, then run <code>&gt; template save name</code></p>
                </div>
            </div>
        );
    }

    return (
        <div className="templates-view">
            <h3 className="templates-title">Templates</h3>
            <div className="templates-list">
                {templates.map((tmpl, i) => (
                    <div key={tmpl.id} className={`template-row ${i === selectedItemIndex ? 'selected' : ''}`}>
                        <span className="template-name">{tmpl.name}</span>
                        <span className="template-count">{tmpl.tasks.length} tasks</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Journal View ---

function JournalView({ projectId }: { projectId: string }) {
    const { logEntries, projects } = useStore();
    const project = projects[projectId];

    const entries = [...logEntries].filter(e => e.projectId === projectId).reverse();

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (isToday) return time;
        return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
    };

    return (
        <div className="journal-view">
            <h3 className="journal-title">Journal \u2014 {project?.name || 'Inbox'}</h3>
            {entries.length === 0 ? (
                <div className="journal-empty">
                    <p>No entries yet.</p>
                    <p className="journal-hint">Press <Kbd keys=":" size="sm" /> to write a journal entry.</p>
                </div>
            ) : (
                <div className="journal-entries">
                    {entries.map(entry => (
                        <div key={entry.id} className="journal-entry">
                            <span className="journal-time">{formatTime(entry.createdAt)}</span>
                            <span className="journal-content">{entry.content}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Help View ---

function HelpView() {
    return (
        <div className="help-view">
            <h3 className="help-title">Help</h3>

            <div className="view-section">
                <h4 className="view-heading">Browse Mode</h4>
                <div className="hint-list">
                    <div className="hint-item"><span style={{ display: 'inline-flex', gap: '3px' }}><Kbd keys="j" /><Kbd keys="k" /></span><span>Navigate up / down</span></div>
                    <div className="hint-item"><Kbd keys="h" /><span>Go back</span></div>
                    <div className="hint-item"><span style={{ display: 'inline-flex', gap: '3px' }}><Kbd keys="l" /><Kbd keys="Enter" /></span><span>Go deeper / edit</span></div>
                    <div className="hint-item"><Kbd keys="Space" /><span>Cycle task status</span></div>
                    <div className="hint-item"><Kbd keys="x" /><span>Archive task</span></div>
                    <div className="hint-item"><Kbd keys="e" /><span>Edit task</span></div>
                    <div className="hint-item"><Kbd keys="u" /><span>Undo</span></div>
                    <div className="hint-item"><Kbd keys="ESC" /><span>Hide visor</span></div>
                </div>
            </div>

            <div className="view-section">
                <h4 className="view-heading">Input Modes</h4>
                <div className="hint-list">
                    <div className="hint-item"><Kbd keys="i" /><span>Add task</span></div>
                    <div className="hint-item"><Kbd keys=">" /><span>Run command</span></div>
                    <div className="hint-item"><Kbd keys="?" /><span>Search tasks</span></div>
                    <div className="hint-item"><Kbd keys=":" /><span>Journal entry</span></div>
                </div>
            </div>

            <div className="view-section">
                <h4 className="view-heading">Commands</h4>
                <div className="hint-list">
                    <div className="hint-item"><code>&gt; home</code><span>Go to dashboard</span></div>
                    <div className="hint-item"><code>&gt; agenda</code><span>View deadlines</span></div>
                    <div className="hint-item"><code>&gt; use slug</code><span>Open project</span></div>
                    <div className="hint-item"><code>&gt; focus N</code><span>Timer (N min)</span></div>
                    <div className="hint-item"><code>&gt; journal</code><span>View journal</span></div>
                    <div className="hint-item"><code>&gt; templates</code><span>Manage templates</span></div>
                    <div className="hint-item"><code>&gt; help</code><span>This view</span></div>
                </div>
            </div>
        </div>
    );
}

// --- Search View ---

function SearchView({ query }: { query: string }) {
    const { tasks, projects, selectedItemIndex, cycleTaskStatus } = useStore();

    const activeTasks = Object.values(tasks).filter(t => !t.archived);
    const results = fuzzySearchTasks(activeTasks, query).slice(0, 30);

    return (
        <div className="search-view">
            <h3 className="search-title">Search: &ldquo;{query}&rdquo;</h3>
            {results.length === 0 ? (
                <div className="search-empty">No tasks match &ldquo;{query}&rdquo;</div>
            ) : (
                <div className="search-results">
                    {results.map((task, i) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            isSelected={i === selectedItemIndex}
                            onComplete={() => cycleTaskStatus(task.id)}
                            projectSlug={projects[task.projectId]?.slug}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- Project Settings View ---

function ProjectSettingsView({ projectId }: { projectId: string }) {
    const { projects } = useStore();
    const project = projects[projectId];

    if (!project) return <div className="view-empty">Project not found</div>;

    return (
        <div className="project-settings-view">
            <h3 className="project-settings-title">Project Settings</h3>
            <div className="detail-field">
                <span className="detail-label">Name</span>
                <span className="detail-value">{project.name}</span>
            </div>
            <div className="detail-field">
                <span className="detail-label">Slug</span>
                <span className="detail-value">{project.slug}</span>
            </div>
            <div className="detail-field">
                <span className="detail-label">Color</span>
                <span className="detail-value">
                    <span className="home-project-dot" style={{ background: project.color, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                    {project.color}
                </span>
            </div>
            <div className="detail-field">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-hints">
                <p><code>&gt; rename {project.slug} New Name</code> — rename project</p>
                <p><code>&gt; color {project.slug} #hex</code> — change color</p>
                {!project.isInbox && <p><code>&gt; delete {project.slug}</code> — delete project</p>}
            </div>
        </div>
    );
}

// --- Detail View ---

function DetailView({ taskId }: { taskId: string }) {
    const { tasks, projects } = useStore();
    const task = tasks[taskId];

    if (!task) return <div className="view-empty">Task not found</div>;

    const project = projects[task.projectId];
    const status = TASK_STATUS_CONFIG[task.status || 'TODO'];

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const recurrenceLabel = task.recurrence ? (
        task.recurrence.type === 'daily' ? 'Every day' :
        task.recurrence.type === 'weekdays' ? 'Every weekday' :
        task.recurrence.type === 'monthly' ? 'Every month' :
        task.recurrence.type === 'weekly' && task.recurrence.dayOfWeek !== undefined
            ? `Every ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][task.recurrence.dayOfWeek]}`
            : 'Every week'
    ) : null;

    return (
        <div className="detail-view">
            <div className="detail-header">
                <span className="detail-status" style={{ color: status.color }}>{status.icon}</span>
                <span className="detail-content">{task.content}</span>
            </div>
            <div className="detail-meta">
                <div className="detail-field">
                    <span className="detail-label">Status</span>
                    <span className="detail-value" style={{ color: status.color }}>{status.label}</span>
                </div>
                {project && (
                    <div className="detail-field">
                        <span className="detail-label">Project</span>
                        <span className="detail-value">
                            <span className="home-project-dot" style={{ background: project.color, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                            {project.name}
                        </span>
                    </div>
                )}
                <div className="detail-field">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDate(task.createdAt)}</span>
                </div>
                {task.dueAt && (
                    <div className="detail-field">
                        <span className="detail-label">Due</span>
                        <span className="detail-value">{formatDate(task.dueAt)}</span>
                    </div>
                )}
                {task.scheduled && (
                    <div className="detail-field">
                        <span className="detail-label">Scheduled</span>
                        <span className="detail-value">{formatDate(task.scheduled)}</span>
                    </div>
                )}
                {recurrenceLabel && (
                    <div className="detail-field">
                        <span className="detail-label">Repeats</span>
                        <span className="detail-value">{recurrenceLabel}</span>
                    </div>
                )}
            </div>
            <div className="detail-notes-section">
                <span className="detail-label">Notes</span>
                {task.notes ? (
                    <p className="detail-notes">{task.notes}</p>
                ) : (
                    <p className="detail-notes-empty">No notes. Press <Kbd keys="n" size="sm" /> to add.</p>
                )}
            </div>
            <div className="detail-hints">
                <p><Kbd keys="e" size="sm" /> edit &nbsp; <Kbd keys="n" size="sm" /> notes &nbsp; <Kbd keys="Space" size="sm" /> status &nbsp; <Kbd keys="Shift+Enter" size="sm" /> subtask &nbsp; <Kbd keys="h" size="sm" /> back</p>
            </div>
        </div>
    );
}
