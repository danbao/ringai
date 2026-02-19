import {nanoid} from 'nanoid';

export function generateUniqId(size?: number): string {
    return nanoid(size);
}
