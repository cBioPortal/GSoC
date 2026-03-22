/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var loaderUtils = require('loader-utils');
var SourceNode = require('source-map').SourceNode;
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var FOOTER = '/*** EXPORTS FROM exports-loader ***/\n';
module.exports = function(content, sourceMap) {
    if (this.cacheable) this.cacheable();
    var query = loaderUtils.getOptions(this) || {};
    var exports = [];
    var keys = Object.keys(query);

    content = content.replace(/\/\/testIt([^f]*)function ([^\(]*)/gim, function(
        $0,
        $2,
        $1
    ) {
        var params = $2.replace(/\n/g, '');
        return `var old_${$1} = ${$1}; ${$1} = exports.${$1} = 
        function(){ 
            return window._handleTestReports(arguments,old_${$1},'${params}',this);
        };
        ${$0.replace(/\/\/testIt[^f]*/m, '')}`;
    });

    if (keys.length == 1 && typeof query[keys[0]] == 'boolean') {
        //console.log("exporting 1");
        exports.push('module.exports = ' + keys[0] + ';');
    } else {
        //console.log("exporting 2");
        keys.forEach(function(name) {
            var mod = name;
            if (typeof query[name] == 'string') {
                mod = query[name];
            }
            //console.log("exporting", name);
            exports.push(
                'exports[' + JSON.stringify(name) + '] = (' + mod + ');'
            );
        });
    }
    if (sourceMap) {
        var currentRequest = loaderUtils.getCurrentRequest(this);
        var node = SourceNode.fromStringWithSourceMap(
            content,
            new SourceMapConsumer(sourceMap)
        );
        node.add('\n\n' + FOOTER + exports.join('\n'));
        var result = node.toStringWithSourceMap({
            file: currentRequest,
        });
        this.callback(null, result.code, result.map.toJSON());
        return;
    }

    return content + '\n\n' + FOOTER + exports.join('\n');
};
