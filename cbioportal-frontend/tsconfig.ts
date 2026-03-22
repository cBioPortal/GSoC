/**
 * @license
 * Copyright 2017 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { join as joinPaths } from 'path';

import { findRule } from '../ruleLoader';
import { hasOwnProperty } from '../utils';

export const rules = {
    // TypeScript Specific

    'adjacent-overload-signatures': true,
    'ban-types': {
        options: [
            ['Object', 'Avoid using the `Object` type. Did you mean `object`?'],
            [
                'Boolean',
                'Avoid using the `Boolean` type. Did you mean `boolean`?',
            ],
            ['Number', 'Avoid using the `Number` type. Did you mean `number`?'],
            ['String', 'Avoid using the `String` type. Did you mean `string`?'],
            ['Symbol', 'Avoid using the `Symbol` type. Did you mean `symbol`?'],
        ],
    },
    'member-access': [true, 'check-accessor', 'check-constructor'],
    'member-ordering': [
        true,
        {
            order: 'statics-first',
            alphabetize: false,
        },
    ],
    'no-any': false,
    'no-empty-interface': false,
    'no-import-side-effect': true,
    // Technically this is not the strictest setting, but don't want to conflict with "typedef"
    'no-inferrable-types': [true, 'ignore-params'],
    'no-internal-module': true,
    'no-magic-numbers': false,
    'no-namespace': true,
    'no-non-null-assertion': false,
    'no-reference': true,
    'no-var-requires': true,
    'only-arrow-functions': false,
    'prefer-for-of': true,
    'promise-function-async': true,
    typedef: [
        true,
        'call-signature',
        'arrow-call-signature',
        'parameter',
        'arrow-parameter',
        'property-declaration',
        'variable-declaration',
        'member-variable-declaration',
    ],
    'typedef-whitespace': [
        false,
        {
            'call-signature': 'nospace',
            'index-signature': 'nospace',
            parameter: 'nospace',
            'property-declaration': 'nospace',
            'variable-declaration': 'nospace',
        },
        {
            'call-signature': 'onespace',
            'index-signature': 'onespace',
            parameter: 'onespace',
            'property-declaration': 'onespace',
            'variable-declaration': 'onespace',
        },
    ],
    'unified-signatures': true,

    // Functionality
    'await-promise': true,
    // "ban": no sensible default
    curly: true,
    forin: true,
    // "import-blacklist": no sensible default
    'label-position': true,
    'no-arg': true,
    'no-bitwise': false,
    'no-conditional-assignment': true,
    'no-console': true,
    'no-construct': false,
    'no-debugger': true,
    'no-duplicate-super': true,
    'no-duplicate-variable': true,
    'no-empty': true,
    'no-eval': true,
    'no-floating-promises': true,
    'no-for-in-array': true,
    'no-inferred-empty-object-type': true,
    'no-invalid-template-strings': true,
    // "no-invalid-this": Won't this be deprecated?
    'no-misused-new': true,
    'no-null-keyword': false,
    'no-object-literal-type-assertion': true,
    'no-shadowed-variable': true,
    'no-string-literal': false,
    'no-string-throw': true,
    'no-sparse-arrays': true,
    'no-unbound-method': true,
    'no-unsafe-any': true,
    'no-unsafe-finally': true,
    'no-unused-expression': true,
    'no-unused-variable': true,
    'no-use-before-declare': true,
    'no-var-keyword': true,
    'no-void-expression': true,
    radix: true,
    'restrict-plus-operands': false,
    'strict-boolean-expressions': false,
    'strict-type-predicates': true,
    'switch-default': false,
    'triple-equals': true,
    'use-isnan': true,

    // Maintainability

    'cyclomatic-complexity': true,
    eofline: false,
    indent: [true, 'spaces'],
    'linebreak-style': [true, 'LF'],
    'max-classes-per-file': [true, 3],
    'max-file-line-count': [true, 1000],
    'max-line-length': [true, 120],
    'no-default-export': false,
    'no-irregular-whitespace': true,
    'no-mergeable-namespace': true,
    'no-require-imports': false,
    'no-trailing-whitespace': true,
    'object-literal-sort-keys': false,
    'prefer-const': true,
    'trailing-comma': [
        false,
        {
            multiline: 'always',
            singleline: 'never',
        },
    ],

    // Style

    align: [true, 'parameters', 'arguments', 'statements'],
    'array-type': [true, 'array'],
    'arrow-parens': false,
    'arrow-return-shorthand': [true],
    'callable-types': true,
    'class-name': true,
    'comment-format': [false, 'check-space', 'check-uppercase'],
    'completed-docs': false,
    // "file-header": No sensible default
    deprecation: true,
    'import-spacing': true,
    'interface-name': true,
    'interface-over-type-literal': false,
    'jsdoc-format': false,
    'match-default-export-name': false,
    'new-parens': true,
    'newline-before-return': false,
    'no-angle-bracket-type-assertion': true,
    'no-boolean-literal-compare': false,
    'no-consecutive-blank-lines': false,
    'no-parameter-properties': true,
    'no-reference-import': true,
    'no-unnecessary-callback-wrapper': false,
    'no-unnecessary-initializer': true,
    'no-unnecessary-qualifier': true,
    'no-unnecessary-type-assertion': true,
    'number-literal-format': true,
    'object-literal-key-quotes': [false, 'consistent-as-needed'],
    'object-literal-shorthand': false,
    'one-line': [
        false,
        'check-catch',
        'check-else',
        'check-finally',
        'check-open-brace',
        'check-whitespace',
    ],
    'one-variable-per-declaration': false,
    'ordered-imports': [
        false,
        {
            'import-sources-order': 'case-insensitive',
            'named-imports-order': 'case-insensitive',
        },
    ],
    'prefer-function-over-method': false,
    'prefer-method-signature': false,
    'prefer-switch': true,
    'prefer-template': false,
    quotemark: [false, 'double', 'avoid-escape'],
    'return-undefined': true,
    semicolon: [true, 'always'],
    'space-before-function-paren': [
        false,
        {
            anonymous: 'never',
            asyncArrow: 'always',
            constructor: 'never',
            method: 'never',
            named: 'never',
        },
    ],
    'variable-name': [false, 'ban-keywords', 'check-format'],
    whitespace: [
        false,
        'check-branch',
        'check-decl',
        'check-operator',
        'check-module',
        'check-separator',
        'check-type',
        'check-typecast',
        'check-preblock',
    ],
};

export const RULES_EXCLUDED_FROM_ALL_CONFIG = [
    'ban',
    'fileHeader',
    'importBlacklist',
    'noInvalidThis',
    'noSwitchCaseFallThrough',
    'typeofCompare',
];

// Exclude typescript-only rules from jsRules, otherwise it's identical.
export const jsRules: { [key: string]: any } = {};
for (const key in rules) {
    if (!hasOwnProperty(rules, key)) {
        continue;
    }

    const Rule = findRule(key, joinPaths(__dirname, '..', 'rules'));
    if (Rule === 'not-found') {
        throw new Error(`Couldn't find rule '${key}'.`);
    }
    if (!Rule.metadata.typescriptOnly) {
        jsRules[key] = (rules as any)[key];
    }
}
