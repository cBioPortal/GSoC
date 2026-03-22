import * as request from 'superagent';

import { Omit } from '../../lib/TypeScriptUtils';
import { getSessionUrl } from '../urls';
import { ComparisonSession, Group, GroupData } from './sessionServiceModels';

export default class ComparisonGroupClient {
    fetchComparisonGroupsServiceUrl() {
        return `${getSessionUrl()}/groups/fetch`;
    }

    getComparisonGroupServiceUrl() {
        return `${getSessionUrl()}/group`;
    }

    getComparisonSessionServiceUrl() {
        return `${getSessionUrl()}/comparison_session`;
    }
    // Groups
    public addGroup(group: GroupData): Promise<{ id: string }> {
        return request
            .post(this.getComparisonGroupServiceUrl())
            .send(group)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    public getGroup(id: string) {
        return request
            .get(`${this.getComparisonGroupServiceUrl()}/${id}`)
            .then((res: any) => res.body);
    }

    public async getGroupsForStudies(studyIds: string[]): Promise<Group[]> {
        return request
            .post(this.fetchComparisonGroupsServiceUrl())
            .send(studyIds)
            .then((res: any) => {
                return res.body;
            });
    }

    public deleteGroup(id: string) {
        return request
            .get(`${this.getComparisonGroupServiceUrl()}/delete/${id}`)
            .then(() => {});
    }

    public addGroupToUser(id: string) {
        return request
            .get(`${this.getComparisonGroupServiceUrl()}/add/${id}`)
            .then(() => {});
    }

    // Group Comparison Sessions
    public addComparisonSession(
        session: Omit<ComparisonSession, 'id'>
    ): Promise<{ id: string }> {
        return request
            .post(this.getComparisonSessionServiceUrl())
            .send(session)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    public async getComparisonSession(id: string): Promise<ComparisonSession> {
        const storedValue: {
            id: string;
            data: Omit<ComparisonSession, 'id'>;
        } = await request
            .get(`${this.getComparisonSessionServiceUrl()}/${id}`)
            .then((res: any) => res.body);

        return Object.assign(storedValue.data, { id: storedValue.id });
    }
}
