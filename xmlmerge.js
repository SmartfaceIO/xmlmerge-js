/**
 * Created by zhs007 on 2014/12/4.
 */

var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;
var fs = require('fs');
//var logger = require('./logger');
var csv2obj = require("heyutils").csv2obj;

function addChild(obj, child) {
    obj.appendChild(child);
}

function findNodeAttr(obj, attrName) {
    var attrs = obj.attributes;

    if (attrs)
        for (var i = 0; i < attrs.length; ++i) {
            if (attrs[i].nodeName == attrName) {
                return attrs[i];
            }
        }

    return null;
}

function isEquNode(obj1, obj2, config) {
    if (obj1.nodeName == obj2.nodeName) {
        var max = config.length;
        for (var i = 0; i < max; ++i) {
            if (config[i].nodename == obj1.nodeName || config[i].nodename === "*") {
                if (config[i].attrname == '*') {
                    return true;
                }

                var attr1 = findNodeAttr(obj1, config[i].attrname);
                if (attr1 == null && config[i].nodename !== "*") {
                    return false;
                }

                var attr2 = findNodeAttr(obj2, config[i].attrname);
                if (attr2 == null && config[i].nodename !== "*") {
                    return false;
                }

                if(!attr1 && !attr2)
                    return true;

                if (attr1.value == attr2.value) {
                    return true;
                }

                return false;
            }
        }
    }

    return false;
}

function findSameChild(obj, child, config) {
    var nums = obj.childNodes.length;
    var childs = obj.childNodes;
    for (var i = 0; i < nums; ++i) {
        var curobj = childs[i];
        if (isEquNode(curobj, child, config)) {
            return curobj;
        }
    }

    return null;
}

function mergeObj(obj1, obj2, config) {
    var isequ = isEquNode(obj1, obj2, config);
    if (!isequ) {
        return ;
    }

    if (!obj1.hasChildNodes() || !obj2.hasChildNodes()) {
        return ;
    }

    var nums2 = obj2.childNodes.length;
    var childs2 = obj2.childNodes;

    for (var i = 0; i < nums2; ++i) {
        var curobj = childs2[i];
        if (curobj.nodeName == '#text') {
            if (obj1.childNodes[i]) {
                obj1.childNodes[i].nodeValue = curobj.nodeValue;
                obj1.childNodes[i].data = curobj.data;
            } else {
                obj1.childNodes[i] = curobj.cloneNode(true);
            }
            continue ;
        }

        //logger.normal.log('info', 'obj2 ', curobj.nodeName);

        var obj1child = findSameChild(obj1, curobj, config);
        if (obj1child != null) {
            //logger.normal.log('info', 'merge ', curobj.nodeName);

            mergeObj(obj1child, curobj, config);
        }
        else {
            addChild(obj1, curobj);
        }
    }
}

function merge(str1, str2, config, callback) {
    var obj1 = new DOMParser().parseFromString(str1);
    var obj2 = new DOMParser().parseFromString(str2);

    mergeObj(obj1.documentElement, obj2.documentElement, config);

    var str = new XMLSerializer().serializeToString(obj1);
    callback(str);
}

function mergeWithFile(src1, src2, dest, cfg, callback) {
    fs.readFile(src1, function(err, data) {
        var str1 = data.toString();

        fs.readFile(src2, function(err, data) {
            var str2 = data.toString();

            fs.readFile(cfg, function(err, data) {

                config = csv2obj.csv2obj(data.toString());

                merge(str1, str2, config, function (xml) {
                    fs.writeFile(dest, xml, function (err) {
                        callback();
                    });
                });
            });
        });
    });
}

exports.merge = merge;
exports.mergeWithFile = mergeWithFile;
//exports.mergeAndroidManifest = mergeAndroidManifest;
