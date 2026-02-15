import { useRef, useEffect } from 'react';
import { Task, TASK_STATUS_CONFIG } from '../../store/types';

interface TaskItemProps {
    task: Task;
    isSelected: boolean;
    onComplete: () => void;
    hasChildren?: boolean;
    childCount?: number;
    projectSlug?: string;
}

function formatDue(dueAt: number): { label: string; isOverdue: boolean; isToday: boolean } {
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

export function TaskItem({ task, isSelected, onComplete, hasChildren, childCount, projectSlug }: TaskItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const status = task.status || 'TODO';
    const statusConfig = TASK_STATUS_CONFIG[status];
    const isDone = status === 'DONE' || status === 'CANCELLED';

    useEffect(() => {
        if (isSelected && ref.current) {
            ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [isSelected]);

    const dueInfo = task.dueAt ? formatDue(task.dueAt) : null;
    const scheduledInfo = task.scheduled ? formatDue(task.scheduled) : null;

    return (
        <div
            ref={ref}
            className={`task-item ${isSelected ? 'selected' : ''} ${isDone ? 'completed' : ''} task-status-${status.toLowerCase()}`}
            onClick={onComplete}
        >
            <span className="task-status-icon" style={{ color: statusConfig.color }} title={statusConfig.label}>
                {statusConfig.icon}
            </span>
            <span className="task-content">{task.content}</span>
            {hasChildren && (
                <span className="task-children-indicator">{'\u25B8'} {childCount}</span>
            )}
            {status === 'DOING' && <span className="task-status-badge doing">DOING</span>}
            {status === 'WAITING' && <span className="task-status-badge waiting">WAIT</span>}
            {scheduledInfo && !isDone && (
                <span className="task-scheduled">{'\u25B8'} {scheduledInfo.label}</span>
            )}
            {dueInfo && !isDone && (
                <span className={`task-due ${dueInfo.isOverdue ? 'overdue' : ''} ${dueInfo.isToday ? 'due-today' : ''}`}>
                    {'\u25C6'} {dueInfo.label}
                </span>
            )}
            {projectSlug && (
                <span className="task-project-slug">{projectSlug}</span>
            )}
        </div>
    );
}
