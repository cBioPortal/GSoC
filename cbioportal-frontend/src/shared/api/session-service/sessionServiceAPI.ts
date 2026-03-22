import * as request from 'superagent';
import { getSessionUrl } from '../urls';
import {
    CustomChart,
    CustomChartData,
    PageSettingsData,
    PageSettingsUpdateRequest,
    StudyPageSettings,
    VirtualStudy,
} from './sessionServiceModels';
import { PageType } from 'shared/userSession/PageType';
import { PageSettingsIdentifier } from 'shared/userSession/PageSettingsIdentifier';
import _ from 'lodash';

export default class sessionServiceAPI {
    getVirtualStudyServiceUrl() {
        return `${getSessionUrl()}/virtual_study`;
    }

    getPublicVirtualStudyServiceUrl() {
        return getSessionUrl('api/public_virtual_studies');
    }

    getSessionServiceUrl() {
        return `${getSessionUrl()}/main_session`;
    }

    getUserSettingUrl() {
        return `${getSessionUrl()}/settings`;
    }

    getCustomDataUrl() {
        return `${getSessionUrl()}/custom_data`;
    }
    //Virtual Study API's - START
    /**
     * Retrieve Virtual Studies
     */
    getUserVirtualStudies(): Promise<Array<VirtualStudy>> {
        return (
            request
                .get(this.getVirtualStudyServiceUrl())
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    getPublicVirtualStudies(): Promise<Array<VirtualStudy>> {
        return (
            request
                .get(this.getPublicVirtualStudyServiceUrl())
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    getVirtualStudy(id: string): Promise<VirtualStudy> {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    deleteVirtualStudy(id: string) {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/delete/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
        );
    }

    addVirtualStudy(id: string) {
        return (
            request
                .get(`${this.getVirtualStudyServiceUrl()}/add/${id}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
        );
    }

    saveVirtualStudy(object: any, save: boolean) {
        return request
            .post(this.getVirtualStudyServiceUrl() + (save ? '/save' : ''))
            .send(object)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }
    //Virtual Study API's - END
    //main session API's - START
    saveSession(data: any) {
        return request
            .post(this.getSessionServiceUrl())
            .send(data)
            .then((res: any) => {
                return res.body;
            });
    }

    getSession(sessionId: string) {
        return (
            request
                .get(`${this.getSessionServiceUrl()}/${sessionId}`)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    /**
     * @returns {StudyPageSettings} including ID fields
     */
    fetchStudyPageSettings(
        studyIds: string[]
    ): Promise<StudyPageSettings | undefined> {
        return this.fetchPageSettings<StudyPageSettings>({
            page: PageType.STUDY_VIEW,
            origin: studyIds,
        });
    }

    /**
     * main session API's - END
     * StudyPage Settings API's - START
     * @returns {PageSettingsData} with or without id fields
     */
    fetchPageSettings<T extends PageSettingsData>(
        id: PageSettingsIdentifier,
        omitId?: boolean
    ): Promise<T | undefined> {
        return (
            request
                .post(`${this.getUserSettingUrl()}/fetch`)
                .send(id)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    //can be undefined if nothing was saved previously
                    const settings = res.body;
                    return omitId
                        ? _.omit(settings, Object.keys(id))
                        : settings;
                })
        );
    }

    updateUserSettings(data: PageSettingsUpdateRequest) {
        return (
            request
                .post(this.getUserSettingUrl())
                .send(data)
                // @ts-ignore: this method comes from caching plugin and isn't in typing
                .forceUpdate(true)
                .then((res: any) => {
                    return res.body;
                })
        );
    }

    //StudyPage Settings API's - END
    //Custom Chart API's - START
    saveCustomData(data: CustomChartData) {
        return request
            .post(this.getCustomDataUrl())
            .send(data)
            .then((res: any) => {
                let result = res.body;
                return {
                    id: result.id,
                };
            });
    }

    getCustomData(id: string): Promise<CustomChart> {
        return request
            .get(`${this.getCustomDataUrl()}/${id}`)
            .then((res: any) => res.body);
    }

    getCustomDataForStudies(studyIds: string[]): Promise<CustomChart[]> {
        return request
            .post(`${this.getCustomDataUrl()}/fetch`)
            .send(studyIds)
            .then((res: any) => {
                return res.body;
            });
    }

    public deleteCustomData(id: string) {
        return request
            .get(`${this.getCustomDataUrl()}/delete/${id}`)
            .then(() => {});
    }

    public addCustomDataToUser(id: string) {
        return request
            .get(`${this.getCustomDataUrl()}/add/${id}`)
            .then(() => {});
    }
    //Custom Chart API's - END
}
