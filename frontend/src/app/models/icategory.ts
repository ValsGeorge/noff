import { ITask } from './itask';

export interface ICategory {
    id: string;
    name: string;
    task: ITask[];
    order: number;
    isEditing: boolean;
}
