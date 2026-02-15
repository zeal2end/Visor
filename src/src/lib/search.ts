import Fuse from 'fuse.js';
import { Task } from '../store/types';

export function fuzzySearchTasks(tasks: Task[], query: string): Task[] {
    if (!query.trim()) return [];
    const fuse = new Fuse(tasks, {
        keys: ['content'],
        threshold: 0.4,
        ignoreLocation: true,
    });
    return fuse.search(query).map(r => r.item);
}
