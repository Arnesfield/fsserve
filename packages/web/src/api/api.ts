import ky from 'ky';
import { meta } from '../config/meta';

export const api = ky.create({ prefixUrl: meta.baseUrl });
