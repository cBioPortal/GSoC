import { assert } from 'chai';
import {
    trimOffHtmlTagEntities,
    LESS_THAN_HTML_ENTITY,
    GREATER_THAN_HTML_ENTITY,
} from './StringUtils';

describe('trimOffHtmlTagEntities', () => {
    it('gives correct result on various inputs', () => {
        assert.equal(
            trimOffHtmlTagEntities(
                `${LESS_THAN_HTML_ENTITY}i${GREATER_THAN_HTML_ENTITY}test${LESS_THAN_HTML_ENTITY}/i${GREATER_THAN_HTML_ENTITY}`
            ),
            'test'
        );
        assert.equal(
            trimOffHtmlTagEntities(
                `${LESS_THAN_HTML_ENTITY}i class="test-class" id="test" ${GREATER_THAN_HTML_ENTITY}test${LESS_THAN_HTML_ENTITY}/i${GREATER_THAN_HTML_ENTITY}`
            ),
            'test'
        );
        assert.equal('', '');
        assert.equal(
            trimOffHtmlTagEntities(
                `${LESS_THAN_HTML_ENTITY}i${GREATER_THAN_HTML_ENTITY}test${LESS_THAN_HTML_ENTITY}/i${GREATER_THAN_HTML_ENTITY} followed with another ${LESS_THAN_HTML_ENTITY}div${GREATER_THAN_HTML_ENTITY}test${LESS_THAN_HTML_ENTITY}/div${GREATER_THAN_HTML_ENTITY}`
            ),
            'test followed with another test'
        );
    });
    it('should not trim off other html entities', () => {
        assert.equal(trimOffHtmlTagEntities(`&amp;test`), '&amp;test');
    });
});
