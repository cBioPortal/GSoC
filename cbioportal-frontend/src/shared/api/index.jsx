import Swagger from 'swagger-client';
import { getLoadConfig } from 'config/config';

const clientPromise = new Swagger({
    url: `http://${getLoadConfig().apiRoot}/v2/api-docs`,
    usePromise: true,
});
export default clientPromise;
