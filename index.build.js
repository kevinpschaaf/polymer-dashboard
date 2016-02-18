(function () {
window.WebComponents = window.WebComponents || { flags: {} };
var file = 'webcomponents-lite.js';
var script = document.querySelector('script[src*="' + file + '"]');
var flags = {};
if (!flags.noOpts) {
location.search.slice(1).split('&').forEach(function (option) {
var parts = option.split('=');
var match;
if (parts[0] && (match = parts[0].match(/wc-(.+)/))) {
flags[match[1]] = parts[1] || true;
}
});
if (script) {
for (var i = 0, a; a = script.attributes[i]; i++) {
if (a.name !== 'src') {
flags[a.name] = a.value || true;
}
}
}
if (flags.log && flags.log.split) {
var parts = flags.log.split(',');
flags.log = {};
parts.forEach(function (f) {
flags.log[f] = true;
});
} else {
flags.log = {};
}
}
if (flags.register) {
window.CustomElements = window.CustomElements || { flags: {} };
window.CustomElements.flags.register = flags.register;
}
WebComponents.flags = flags;
}());
(function (scope) {
'use strict';
var hasWorkingUrl = false;
if (!scope.forceJURL) {
try {
var u = new URL('b', 'http://a');
u.pathname = 'c%20d';
hasWorkingUrl = u.href === 'http://a/c%20d';
} catch (e) {
}
}
if (hasWorkingUrl)
return;
var relative = Object.create(null);
relative['ftp'] = 21;
relative['file'] = 0;
relative['gopher'] = 70;
relative['http'] = 80;
relative['https'] = 443;
relative['ws'] = 80;
relative['wss'] = 443;
var relativePathDotMapping = Object.create(null);
relativePathDotMapping['%2e'] = '.';
relativePathDotMapping['.%2e'] = '..';
relativePathDotMapping['%2e.'] = '..';
relativePathDotMapping['%2e%2e'] = '..';
function isRelativeScheme(scheme) {
return relative[scheme] !== undefined;
}
function invalid() {
clear.call(this);
this._isInvalid = true;
}
function IDNAToASCII(h) {
if ('' == h) {
invalid.call(this);
}
return h.toLowerCase();
}
function percentEscape(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
63,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
function percentEscapeQuery(c) {
var unicode = c.charCodeAt(0);
if (unicode > 32 && unicode < 127 && [
34,
35,
60,
62,
96
].indexOf(unicode) == -1) {
return c;
}
return encodeURIComponent(c);
}
var EOF = undefined, ALPHA = /[a-zA-Z]/, ALPHANUMERIC = /[a-zA-Z0-9\+\-\.]/;
function parse(input, stateOverride, base) {
function err(message) {
errors.push(message);
}
var state = stateOverride || 'scheme start', cursor = 0, buffer = '', seenAt = false, seenBracket = false, errors = [];
loop:
while ((input[cursor - 1] != EOF || cursor == 0) && !this._isInvalid) {
var c = input[cursor];
switch (state) {
case 'scheme start':
if (c && ALPHA.test(c)) {
buffer += c.toLowerCase();
state = 'scheme';
} else if (!stateOverride) {
buffer = '';
state = 'no scheme';
continue;
} else {
err('Invalid scheme.');
break loop;
}
break;
case 'scheme':
if (c && ALPHANUMERIC.test(c)) {
buffer += c.toLowerCase();
} else if (':' == c) {
this._scheme = buffer;
buffer = '';
if (stateOverride) {
break loop;
}
if (isRelativeScheme(this._scheme)) {
this._isRelative = true;
}
if ('file' == this._scheme) {
state = 'relative';
} else if (this._isRelative && base && base._scheme == this._scheme) {
state = 'relative or authority';
} else if (this._isRelative) {
state = 'authority first slash';
} else {
state = 'scheme data';
}
} else if (!stateOverride) {
buffer = '';
cursor = 0;
state = 'no scheme';
continue;
} else if (EOF == c) {
break loop;
} else {
err('Code point not allowed in scheme: ' + c);
break loop;
}
break;
case 'scheme data':
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
} else {
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._schemeData += percentEscape(c);
}
}
break;
case 'no scheme':
if (!base || !isRelativeScheme(base._scheme)) {
err('Missing scheme.');
invalid.call(this);
} else {
state = 'relative';
continue;
}
break;
case 'relative or authority':
if ('/' == c && '/' == input[cursor + 1]) {
state = 'authority ignore slashes';
} else {
err('Expected /, got: ' + c);
state = 'relative';
continue;
}
break;
case 'relative':
this._isRelative = true;
if ('file' != this._scheme)
this._scheme = base._scheme;
if (EOF == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._username = base._username;
this._password = base._password;
break loop;
} else if ('/' == c || '\\' == c) {
if ('\\' == c)
err('\\ is an invalid code point.');
state = 'relative slash';
} else if ('?' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = '?';
this._username = base._username;
this._password = base._password;
state = 'query';
} else if ('#' == c) {
this._host = base._host;
this._port = base._port;
this._path = base._path.slice();
this._query = base._query;
this._fragment = '#';
this._username = base._username;
this._password = base._password;
state = 'fragment';
} else {
var nextC = input[cursor + 1];
var nextNextC = input[cursor + 2];
if ('file' != this._scheme || !ALPHA.test(c) || nextC != ':' && nextC != '|' || EOF != nextNextC && '/' != nextNextC && '\\' != nextNextC && '?' != nextNextC && '#' != nextNextC) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
this._path = base._path.slice();
this._path.pop();
}
state = 'relative path';
continue;
}
break;
case 'relative slash':
if ('/' == c || '\\' == c) {
if ('\\' == c) {
err('\\ is an invalid code point.');
}
if ('file' == this._scheme) {
state = 'file host';
} else {
state = 'authority ignore slashes';
}
} else {
if ('file' != this._scheme) {
this._host = base._host;
this._port = base._port;
this._username = base._username;
this._password = base._password;
}
state = 'relative path';
continue;
}
break;
case 'authority first slash':
if ('/' == c) {
state = 'authority second slash';
} else {
err('Expected \'/\', got: ' + c);
state = 'authority ignore slashes';
continue;
}
break;
case 'authority second slash':
state = 'authority ignore slashes';
if ('/' != c) {
err('Expected \'/\', got: ' + c);
continue;
}
break;
case 'authority ignore slashes':
if ('/' != c && '\\' != c) {
state = 'authority';
continue;
} else {
err('Expected authority, got: ' + c);
}
break;
case 'authority':
if ('@' == c) {
if (seenAt) {
err('@ already seen.');
buffer += '%40';
}
seenAt = true;
for (var i = 0; i < buffer.length; i++) {
var cp = buffer[i];
if ('\t' == cp || '\n' == cp || '\r' == cp) {
err('Invalid whitespace in authority.');
continue;
}
if (':' == cp && null === this._password) {
this._password = '';
continue;
}
var tempC = percentEscape(cp);
null !== this._password ? this._password += tempC : this._username += tempC;
}
buffer = '';
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
cursor -= buffer.length;
buffer = '';
state = 'host';
continue;
} else {
buffer += c;
}
break;
case 'file host':
if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
if (buffer.length == 2 && ALPHA.test(buffer[0]) && (buffer[1] == ':' || buffer[1] == '|')) {
state = 'relative path';
} else if (buffer.length == 0) {
state = 'relative path start';
} else {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
}
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid whitespace in file host.');
} else {
buffer += c;
}
break;
case 'host':
case 'hostname':
if (':' == c && !seenBracket) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'port';
if ('hostname' == stateOverride) {
break loop;
}
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c) {
this._host = IDNAToASCII.call(this, buffer);
buffer = '';
state = 'relative path start';
if (stateOverride) {
break loop;
}
continue;
} else if ('\t' != c && '\n' != c && '\r' != c) {
if ('[' == c) {
seenBracket = true;
} else if (']' == c) {
seenBracket = false;
}
buffer += c;
} else {
err('Invalid code point in host/hostname: ' + c);
}
break;
case 'port':
if (/[0-9]/.test(c)) {
buffer += c;
} else if (EOF == c || '/' == c || '\\' == c || '?' == c || '#' == c || stateOverride) {
if ('' != buffer) {
var temp = parseInt(buffer, 10);
if (temp != relative[this._scheme]) {
this._port = temp + '';
}
buffer = '';
}
if (stateOverride) {
break loop;
}
state = 'relative path start';
continue;
} else if ('\t' == c || '\n' == c || '\r' == c) {
err('Invalid code point in port: ' + c);
} else {
invalid.call(this);
}
break;
case 'relative path start':
if ('\\' == c)
err('\'\\\' not allowed in path.');
state = 'relative path';
if ('/' != c && '\\' != c) {
continue;
}
break;
case 'relative path':
if (EOF == c || '/' == c || '\\' == c || !stateOverride && ('?' == c || '#' == c)) {
if ('\\' == c) {
err('\\ not allowed in relative path.');
}
var tmp;
if (tmp = relativePathDotMapping[buffer.toLowerCase()]) {
buffer = tmp;
}
if ('..' == buffer) {
this._path.pop();
if ('/' != c && '\\' != c) {
this._path.push('');
}
} else if ('.' == buffer && '/' != c && '\\' != c) {
this._path.push('');
} else if ('.' != buffer) {
if ('file' == this._scheme && this._path.length == 0 && buffer.length == 2 && ALPHA.test(buffer[0]) && buffer[1] == '|') {
buffer = buffer[0] + ':';
}
this._path.push(buffer);
}
buffer = '';
if ('?' == c) {
this._query = '?';
state = 'query';
} else if ('#' == c) {
this._fragment = '#';
state = 'fragment';
}
} else if ('\t' != c && '\n' != c && '\r' != c) {
buffer += percentEscape(c);
}
break;
case 'query':
if (!stateOverride && '#' == c) {
this._fragment = '#';
state = 'fragment';
} else if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._query += percentEscapeQuery(c);
}
break;
case 'fragment':
if (EOF != c && '\t' != c && '\n' != c && '\r' != c) {
this._fragment += c;
}
break;
}
cursor++;
}
}
function clear() {
this._scheme = '';
this._schemeData = '';
this._username = '';
this._password = null;
this._host = '';
this._port = '';
this._path = [];
this._query = '';
this._fragment = '';
this._isInvalid = false;
this._isRelative = false;
}
function jURL(url, base) {
if (base !== undefined && !(base instanceof jURL))
base = new jURL(String(base));
this._url = url;
clear.call(this);
var input = url.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
parse.call(this, input, null, base);
}
jURL.prototype = {
toString: function () {
return this.href;
},
get href() {
if (this._isInvalid)
return this._url;
var authority = '';
if ('' != this._username || null != this._password) {
authority = this._username + (null != this._password ? ':' + this._password : '') + '@';
}
return this.protocol + (this._isRelative ? '//' + authority + this.host : '') + this.pathname + this._query + this._fragment;
},
set href(href) {
clear.call(this);
parse.call(this, href);
},
get protocol() {
return this._scheme + ':';
},
set protocol(protocol) {
if (this._isInvalid)
return;
parse.call(this, protocol + ':', 'scheme start');
},
get host() {
return this._isInvalid ? '' : this._port ? this._host + ':' + this._port : this._host;
},
set host(host) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, host, 'host');
},
get hostname() {
return this._host;
},
set hostname(hostname) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, hostname, 'hostname');
},
get port() {
return this._port;
},
set port(port) {
if (this._isInvalid || !this._isRelative)
return;
parse.call(this, port, 'port');
},
get pathname() {
return this._isInvalid ? '' : this._isRelative ? '/' + this._path.join('/') : this._schemeData;
},
set pathname(pathname) {
if (this._isInvalid || !this._isRelative)
return;
this._path = [];
parse.call(this, pathname, 'relative path start');
},
get search() {
return this._isInvalid || !this._query || '?' == this._query ? '' : this._query;
},
set search(search) {
if (this._isInvalid || !this._isRelative)
return;
this._query = '?';
if ('?' == search[0])
search = search.slice(1);
parse.call(this, search, 'query');
},
get hash() {
return this._isInvalid || !this._fragment || '#' == this._fragment ? '' : this._fragment;
},
set hash(hash) {
if (this._isInvalid)
return;
this._fragment = '#';
if ('#' == hash[0])
hash = hash.slice(1);
parse.call(this, hash, 'fragment');
},
get origin() {
var host;
if (this._isInvalid || !this._scheme) {
return '';
}
switch (this._scheme) {
case 'data':
case 'file':
case 'javascript':
case 'mailto':
return 'null';
}
host = this.host;
if (!host) {
return '';
}
return this._scheme + '://' + host;
}
};
var OriginalURL = scope.URL;
if (OriginalURL) {
jURL.createObjectURL = function (blob) {
return OriginalURL.createObjectURL.apply(OriginalURL, arguments);
};
jURL.revokeObjectURL = function (url) {
OriginalURL.revokeObjectURL(url);
};
}
scope.URL = jURL;
}(self));
if (typeof WeakMap === 'undefined') {
(function () {
var defineProperty = Object.defineProperty;
var counter = Date.now() % 1000000000;
var WeakMap = function () {
this.name = '__st' + (Math.random() * 1000000000 >>> 0) + (counter++ + '__');
};
WeakMap.prototype = {
set: function (key, value) {
var entry = key[this.name];
if (entry && entry[0] === key)
entry[1] = value;
else
defineProperty(key, this.name, {
value: [
key,
value
],
writable: true
});
return this;
},
get: function (key) {
var entry;
return (entry = key[this.name]) && entry[0] === key ? entry[1] : undefined;
},
'delete': function (key) {
var entry = key[this.name];
if (!entry || entry[0] !== key)
return false;
entry[0] = entry[1] = undefined;
return true;
},
has: function (key) {
var entry = key[this.name];
if (!entry)
return false;
return entry[0] === key;
}
};
window.WeakMap = WeakMap;
}());
}
(function (global) {
if (global.JsMutationObserver) {
return;
}
var registrationsTable = new WeakMap();
var setImmediate;
if (/Trident|Edge/.test(navigator.userAgent)) {
setImmediate = setTimeout;
} else if (window.setImmediate) {
setImmediate = window.setImmediate;
} else {
var setImmediateQueue = [];
var sentinel = String(Math.random());
window.addEventListener('message', function (e) {
if (e.data === sentinel) {
var queue = setImmediateQueue;
setImmediateQueue = [];
queue.forEach(function (func) {
func();
});
}
});
setImmediate = function (func) {
setImmediateQueue.push(func);
window.postMessage(sentinel, '*');
};
}
var isScheduled = false;
var scheduledObservers = [];
function scheduleCallback(observer) {
scheduledObservers.push(observer);
if (!isScheduled) {
isScheduled = true;
setImmediate(dispatchCallbacks);
}
}
function wrapIfNeeded(node) {
return window.ShadowDOMPolyfill && window.ShadowDOMPolyfill.wrapIfNeeded(node) || node;
}
function dispatchCallbacks() {
isScheduled = false;
var observers = scheduledObservers;
scheduledObservers = [];
observers.sort(function (o1, o2) {
return o1.uid_ - o2.uid_;
});
var anyNonEmpty = false;
observers.forEach(function (observer) {
var queue = observer.takeRecords();
removeTransientObserversFor(observer);
if (queue.length) {
observer.callback_(queue, observer);
anyNonEmpty = true;
}
});
if (anyNonEmpty)
dispatchCallbacks();
}
function removeTransientObserversFor(observer) {
observer.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
if (!registrations)
return;
registrations.forEach(function (registration) {
if (registration.observer === observer)
registration.removeTransientObservers();
});
});
}
function forEachAncestorAndObserverEnqueueRecord(target, callback) {
for (var node = target; node; node = node.parentNode) {
var registrations = registrationsTable.get(node);
if (registrations) {
for (var j = 0; j < registrations.length; j++) {
var registration = registrations[j];
var options = registration.options;
if (node !== target && !options.subtree)
continue;
var record = callback(options);
if (record)
registration.enqueue(record);
}
}
}
}
var uidCounter = 0;
function JsMutationObserver(callback) {
this.callback_ = callback;
this.nodes_ = [];
this.records_ = [];
this.uid_ = ++uidCounter;
}
JsMutationObserver.prototype = {
observe: function (target, options) {
target = wrapIfNeeded(target);
if (!options.childList && !options.attributes && !options.characterData || options.attributeOldValue && !options.attributes || options.attributeFilter && options.attributeFilter.length && !options.attributes || options.characterDataOldValue && !options.characterData) {
throw new SyntaxError();
}
var registrations = registrationsTable.get(target);
if (!registrations)
registrationsTable.set(target, registrations = []);
var registration;
for (var i = 0; i < registrations.length; i++) {
if (registrations[i].observer === this) {
registration = registrations[i];
registration.removeListeners();
registration.options = options;
break;
}
}
if (!registration) {
registration = new Registration(this, target, options);
registrations.push(registration);
this.nodes_.push(target);
}
registration.addListeners();
},
disconnect: function () {
this.nodes_.forEach(function (node) {
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
var registration = registrations[i];
if (registration.observer === this) {
registration.removeListeners();
registrations.splice(i, 1);
break;
}
}
}, this);
this.records_ = [];
},
takeRecords: function () {
var copyOfRecords = this.records_;
this.records_ = [];
return copyOfRecords;
}
};
function MutationRecord(type, target) {
this.type = type;
this.target = target;
this.addedNodes = [];
this.removedNodes = [];
this.previousSibling = null;
this.nextSibling = null;
this.attributeName = null;
this.attributeNamespace = null;
this.oldValue = null;
}
function copyMutationRecord(original) {
var record = new MutationRecord(original.type, original.target);
record.addedNodes = original.addedNodes.slice();
record.removedNodes = original.removedNodes.slice();
record.previousSibling = original.previousSibling;
record.nextSibling = original.nextSibling;
record.attributeName = original.attributeName;
record.attributeNamespace = original.attributeNamespace;
record.oldValue = original.oldValue;
return record;
}
var currentRecord, recordWithOldValue;
function getRecord(type, target) {
return currentRecord = new MutationRecord(type, target);
}
function getRecordWithOldValue(oldValue) {
if (recordWithOldValue)
return recordWithOldValue;
recordWithOldValue = copyMutationRecord(currentRecord);
recordWithOldValue.oldValue = oldValue;
return recordWithOldValue;
}
function clearRecords() {
currentRecord = recordWithOldValue = undefined;
}
function recordRepresentsCurrentMutation(record) {
return record === recordWithOldValue || record === currentRecord;
}
function selectRecord(lastRecord, newRecord) {
if (lastRecord === newRecord)
return lastRecord;
if (recordWithOldValue && recordRepresentsCurrentMutation(lastRecord))
return recordWithOldValue;
return null;
}
function Registration(observer, target, options) {
this.observer = observer;
this.target = target;
this.options = options;
this.transientObservedNodes = [];
}
Registration.prototype = {
enqueue: function (record) {
var records = this.observer.records_;
var length = records.length;
if (records.length > 0) {
var lastRecord = records[length - 1];
var recordToReplaceLast = selectRecord(lastRecord, record);
if (recordToReplaceLast) {
records[length - 1] = recordToReplaceLast;
return;
}
} else {
scheduleCallback(this.observer);
}
records[length] = record;
},
addListeners: function () {
this.addListeners_(this.target);
},
addListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.addEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.addEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.addEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.addEventListener('DOMNodeRemoved', this, true);
},
removeListeners: function () {
this.removeListeners_(this.target);
},
removeListeners_: function (node) {
var options = this.options;
if (options.attributes)
node.removeEventListener('DOMAttrModified', this, true);
if (options.characterData)
node.removeEventListener('DOMCharacterDataModified', this, true);
if (options.childList)
node.removeEventListener('DOMNodeInserted', this, true);
if (options.childList || options.subtree)
node.removeEventListener('DOMNodeRemoved', this, true);
},
addTransientObserver: function (node) {
if (node === this.target)
return;
this.addListeners_(node);
this.transientObservedNodes.push(node);
var registrations = registrationsTable.get(node);
if (!registrations)
registrationsTable.set(node, registrations = []);
registrations.push(this);
},
removeTransientObservers: function () {
var transientObservedNodes = this.transientObservedNodes;
this.transientObservedNodes = [];
transientObservedNodes.forEach(function (node) {
this.removeListeners_(node);
var registrations = registrationsTable.get(node);
for (var i = 0; i < registrations.length; i++) {
if (registrations[i] === this) {
registrations.splice(i, 1);
break;
}
}
}, this);
},
handleEvent: function (e) {
e.stopImmediatePropagation();
switch (e.type) {
case 'DOMAttrModified':
var name = e.attrName;
var namespace = e.relatedNode.namespaceURI;
var target = e.target;
var record = new getRecord('attributes', target);
record.attributeName = name;
record.attributeNamespace = namespace;
var oldValue = e.attrChange === MutationEvent.ADDITION ? null : e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.attributes)
return;
if (options.attributeFilter && options.attributeFilter.length && options.attributeFilter.indexOf(name) === -1 && options.attributeFilter.indexOf(namespace) === -1) {
return;
}
if (options.attributeOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMCharacterDataModified':
var target = e.target;
var record = getRecord('characterData', target);
var oldValue = e.prevValue;
forEachAncestorAndObserverEnqueueRecord(target, function (options) {
if (!options.characterData)
return;
if (options.characterDataOldValue)
return getRecordWithOldValue(oldValue);
return record;
});
break;
case 'DOMNodeRemoved':
this.addTransientObserver(e.target);
case 'DOMNodeInserted':
var changedNode = e.target;
var addedNodes, removedNodes;
if (e.type === 'DOMNodeInserted') {
addedNodes = [changedNode];
removedNodes = [];
} else {
addedNodes = [];
removedNodes = [changedNode];
}
var previousSibling = changedNode.previousSibling;
var nextSibling = changedNode.nextSibling;
var record = getRecord('childList', e.target.parentNode);
record.addedNodes = addedNodes;
record.removedNodes = removedNodes;
record.previousSibling = previousSibling;
record.nextSibling = nextSibling;
forEachAncestorAndObserverEnqueueRecord(e.relatedNode, function (options) {
if (!options.childList)
return;
return record;
});
}
clearRecords();
}
};
global.JsMutationObserver = JsMutationObserver;
if (!global.MutationObserver) {
global.MutationObserver = JsMutationObserver;
JsMutationObserver._isPolyfilled = true;
}
}(self));
if (typeof HTMLTemplateElement === 'undefined') {
(function () {
var TEMPLATE_TAG = 'template';
var contentDoc = document.implementation.createHTMLDocument('template');
var canDecorate = true;
HTMLTemplateElement = function () {
};
HTMLTemplateElement.prototype = Object.create(HTMLElement.prototype);
HTMLTemplateElement.decorate = function (template) {
if (template.content) {
return;
}
template.content = contentDoc.createDocumentFragment();
var child;
while (child = template.firstChild) {
template.content.appendChild(child);
}
if (canDecorate) {
try {
Object.defineProperty(template, 'innerHTML', {
get: function () {
var o = '';
for (var e = this.content.firstChild; e; e = e.nextSibling) {
o += e.outerHTML || escapeData(e.data);
}
return o;
},
set: function (text) {
contentDoc.body.innerHTML = text;
HTMLTemplateElement.bootstrap(contentDoc);
while (this.content.firstChild) {
this.content.removeChild(this.content.firstChild);
}
while (contentDoc.body.firstChild) {
this.content.appendChild(contentDoc.body.firstChild);
}
},
configurable: true
});
} catch (err) {
canDecorate = false;
}
}
HTMLTemplateElement.bootstrap(template.content);
};
HTMLTemplateElement.bootstrap = function (doc) {
var templates = doc.querySelectorAll(TEMPLATE_TAG);
for (var i = 0, l = templates.length, t; i < l && (t = templates[i]); i++) {
HTMLTemplateElement.decorate(t);
}
};
document.addEventListener('DOMContentLoaded', function () {
HTMLTemplateElement.bootstrap(document);
});
var createElement = document.createElement;
document.createElement = function () {
'use strict';
var el = createElement.apply(document, arguments);
if (el.localName == 'template') {
HTMLTemplateElement.decorate(el);
}
return el;
};
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '\xA0':
return '&nbsp;';
}
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
}());
}
(function (scope) {
'use strict';
if (!window.performance) {
var start = Date.now();
window.performance = {
now: function () {
return Date.now() - start;
}
};
}
if (!window.requestAnimationFrame) {
window.requestAnimationFrame = function () {
var nativeRaf = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
return nativeRaf ? function (callback) {
return nativeRaf(function () {
callback(performance.now());
});
} : function (callback) {
return window.setTimeout(callback, 1000 / 60);
};
}();
}
if (!window.cancelAnimationFrame) {
window.cancelAnimationFrame = function () {
return window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function (id) {
clearTimeout(id);
};
}();
}
var workingDefaultPrevented = function () {
var e = document.createEvent('Event');
e.initEvent('foo', true, true);
e.preventDefault();
return e.defaultPrevented;
}();
if (!workingDefaultPrevented) {
var origPreventDefault = Event.prototype.preventDefault;
Event.prototype.preventDefault = function () {
if (!this.cancelable) {
return;
}
origPreventDefault.call(this);
Object.defineProperty(this, 'defaultPrevented', {
get: function () {
return true;
},
configurable: true
});
};
}
var isIE = /Trident/.test(navigator.userAgent);
if (!window.CustomEvent || isIE && typeof window.CustomEvent !== 'function') {
window.CustomEvent = function (inType, params) {
params = params || {};
var e = document.createEvent('CustomEvent');
e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
return e;
};
window.CustomEvent.prototype = window.Event.prototype;
}
if (!window.Event || isIE && typeof window.Event !== 'function') {
var origEvent = window.Event;
window.Event = function (inType, params) {
params = params || {};
var e = document.createEvent('Event');
e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
return e;
};
window.Event.prototype = origEvent.prototype;
}
}(window.WebComponents));
window.HTMLImports = window.HTMLImports || { flags: {} };
(function (scope) {
var IMPORT_LINK_TYPE = 'import';
var useNative = Boolean(IMPORT_LINK_TYPE in document.createElement('link'));
var hasShadowDOMPolyfill = Boolean(window.ShadowDOMPolyfill);
var wrap = function (node) {
return hasShadowDOMPolyfill ? window.ShadowDOMPolyfill.wrapIfNeeded(node) : node;
};
var rootDocument = wrap(document);
var currentScriptDescriptor = {
get: function () {
var script = window.HTMLImports.currentScript || document.currentScript || (document.readyState !== 'complete' ? document.scripts[document.scripts.length - 1] : null);
return wrap(script);
},
configurable: true
};
Object.defineProperty(document, '_currentScript', currentScriptDescriptor);
Object.defineProperty(rootDocument, '_currentScript', currentScriptDescriptor);
var isIE = /Trident/.test(navigator.userAgent);
function whenReady(callback, doc) {
doc = doc || rootDocument;
whenDocumentReady(function () {
watchImportsLoad(callback, doc);
}, doc);
}
var requiredReadyState = isIE ? 'complete' : 'interactive';
var READY_EVENT = 'readystatechange';
function isDocumentReady(doc) {
return doc.readyState === 'complete' || doc.readyState === requiredReadyState;
}
function whenDocumentReady(callback, doc) {
if (!isDocumentReady(doc)) {
var checkReady = function () {
if (doc.readyState === 'complete' || doc.readyState === requiredReadyState) {
doc.removeEventListener(READY_EVENT, checkReady);
whenDocumentReady(callback, doc);
}
};
doc.addEventListener(READY_EVENT, checkReady);
} else if (callback) {
callback();
}
}
function markTargetLoaded(event) {
event.target.__loaded = true;
}
function watchImportsLoad(callback, doc) {
var imports = doc.querySelectorAll('link[rel=import]');
var parsedCount = 0, importCount = imports.length, newImports = [], errorImports = [];
function checkDone() {
if (parsedCount == importCount && callback) {
callback({
allImports: imports,
loadedImports: newImports,
errorImports: errorImports
});
}
}
function loadedImport(e) {
markTargetLoaded(e);
newImports.push(this);
parsedCount++;
checkDone();
}
function errorLoadingImport(e) {
errorImports.push(this);
parsedCount++;
checkDone();
}
if (importCount) {
for (var i = 0, imp; i < importCount && (imp = imports[i]); i++) {
if (isImportLoaded(imp)) {
newImports.push(this);
parsedCount++;
checkDone();
} else {
imp.addEventListener('load', loadedImport);
imp.addEventListener('error', errorLoadingImport);
}
}
} else {
checkDone();
}
}
function isImportLoaded(link) {
return useNative ? link.__loaded || link.import && link.import.readyState !== 'loading' : link.__importParsed;
}
if (useNative) {
new MutationObserver(function (mxns) {
for (var i = 0, l = mxns.length, m; i < l && (m = mxns[i]); i++) {
if (m.addedNodes) {
handleImports(m.addedNodes);
}
}
}).observe(document.head, { childList: true });
function handleImports(nodes) {
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (isImport(n)) {
handleImport(n);
}
}
}
function isImport(element) {
return element.localName === 'link' && element.rel === 'import';
}
function handleImport(element) {
var loaded = element.import;
if (loaded) {
markTargetLoaded({ target: element });
} else {
element.addEventListener('load', markTargetLoaded);
element.addEventListener('error', markTargetLoaded);
}
}
(function () {
if (document.readyState === 'loading') {
var imports = document.querySelectorAll('link[rel=import]');
for (var i = 0, l = imports.length, imp; i < l && (imp = imports[i]); i++) {
handleImport(imp);
}
}
}());
}
whenReady(function (detail) {
window.HTMLImports.ready = true;
window.HTMLImports.readyTime = new Date().getTime();
var evt = rootDocument.createEvent('CustomEvent');
evt.initCustomEvent('HTMLImportsLoaded', true, true, detail);
rootDocument.dispatchEvent(evt);
});
scope.IMPORT_LINK_TYPE = IMPORT_LINK_TYPE;
scope.useNative = useNative;
scope.rootDocument = rootDocument;
scope.whenReady = whenReady;
scope.isIE = isIE;
}(window.HTMLImports));
(function (scope) {
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
}(window.HTMLImports));
window.HTMLImports.addModule(function (scope) {
var CSS_URL_REGEXP = /(url\()([^)]*)(\))/g;
var CSS_IMPORT_REGEXP = /(@import[\s]+(?!url\())([^;]*)(;)/g;
var path = {
resolveUrlsInStyle: function (style, linkUrl) {
var doc = style.ownerDocument;
var resolver = doc.createElement('a');
style.textContent = this.resolveUrlsInCssText(style.textContent, linkUrl, resolver);
return style;
},
resolveUrlsInCssText: function (cssText, linkUrl, urlObj) {
var r = this.replaceUrls(cssText, urlObj, linkUrl, CSS_URL_REGEXP);
r = this.replaceUrls(r, urlObj, linkUrl, CSS_IMPORT_REGEXP);
return r;
},
replaceUrls: function (text, urlObj, linkUrl, regexp) {
return text.replace(regexp, function (m, pre, url, post) {
var urlPath = url.replace(/["']/g, '');
if (linkUrl) {
urlPath = new URL(urlPath, linkUrl).href;
}
urlObj.href = urlPath;
urlPath = urlObj.href;
return pre + '\'' + urlPath + '\'' + post;
});
}
};
scope.path = path;
});
window.HTMLImports.addModule(function (scope) {
var xhr = {
async: true,
ok: function (request) {
return request.status >= 200 && request.status < 300 || request.status === 304 || request.status === 0;
},
load: function (url, next, nextContext) {
var request = new XMLHttpRequest();
if (scope.flags.debug || scope.flags.bust) {
url += '?' + Math.random();
}
request.open('GET', url, xhr.async);
request.addEventListener('readystatechange', function (e) {
if (request.readyState === 4) {
var redirectedUrl = null;
try {
var locationHeader = request.getResponseHeader('Location');
if (locationHeader) {
redirectedUrl = locationHeader.substr(0, 1) === '/' ? location.origin + locationHeader : locationHeader;
}
} catch (e) {
console.error(e.message);
}
next.call(nextContext, !xhr.ok(request) && request, request.response || request.responseText, redirectedUrl);
}
});
request.send();
return request;
},
loadDocument: function (url, next, nextContext) {
this.load(url, next, nextContext).responseType = 'document';
}
};
scope.xhr = xhr;
});
window.HTMLImports.addModule(function (scope) {
var xhr = scope.xhr;
var flags = scope.flags;
var Loader = function (onLoad, onComplete) {
this.cache = {};
this.onload = onLoad;
this.oncomplete = onComplete;
this.inflight = 0;
this.pending = {};
};
Loader.prototype = {
addNodes: function (nodes) {
this.inflight += nodes.length;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
this.require(n);
}
this.checkDone();
},
addNode: function (node) {
this.inflight++;
this.require(node);
this.checkDone();
},
require: function (elt) {
var url = elt.src || elt.href;
elt.__nodeUrl = url;
if (!this.dedupe(url, elt)) {
this.fetch(url, elt);
}
},
dedupe: function (url, elt) {
if (this.pending[url]) {
this.pending[url].push(elt);
return true;
}
var resource;
if (this.cache[url]) {
this.onload(url, elt, this.cache[url]);
this.tail();
return true;
}
this.pending[url] = [elt];
return false;
},
fetch: function (url, elt) {
flags.load && console.log('fetch', url, elt);
if (!url) {
setTimeout(function () {
this.receive(url, elt, { error: 'href must be specified' }, null);
}.bind(this), 0);
} else if (url.match(/^data:/)) {
var pieces = url.split(',');
var header = pieces[0];
var body = pieces[1];
if (header.indexOf(';base64') > -1) {
body = atob(body);
} else {
body = decodeURIComponent(body);
}
setTimeout(function () {
this.receive(url, elt, null, body);
}.bind(this), 0);
} else {
var receiveXhr = function (err, resource, redirectedUrl) {
this.receive(url, elt, err, resource, redirectedUrl);
}.bind(this);
xhr.load(url, receiveXhr);
}
},
receive: function (url, elt, err, resource, redirectedUrl) {
this.cache[url] = resource;
var $p = this.pending[url];
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
this.onload(url, p, resource, err, redirectedUrl);
this.tail();
}
this.pending[url] = null;
},
tail: function () {
--this.inflight;
this.checkDone();
},
checkDone: function () {
if (!this.inflight) {
this.oncomplete();
}
}
};
scope.Loader = Loader;
});
window.HTMLImports.addModule(function (scope) {
var Observer = function (addCallback) {
this.addCallback = addCallback;
this.mo = new MutationObserver(this.handler.bind(this));
};
Observer.prototype = {
handler: function (mutations) {
for (var i = 0, l = mutations.length, m; i < l && (m = mutations[i]); i++) {
if (m.type === 'childList' && m.addedNodes.length) {
this.addedNodes(m.addedNodes);
}
}
},
addedNodes: function (nodes) {
if (this.addCallback) {
this.addCallback(nodes);
}
for (var i = 0, l = nodes.length, n, loading; i < l && (n = nodes[i]); i++) {
if (n.children && n.children.length) {
this.addedNodes(n.children);
}
}
},
observe: function (root) {
this.mo.observe(root, {
childList: true,
subtree: true
});
}
};
scope.Observer = Observer;
});
window.HTMLImports.addModule(function (scope) {
var path = scope.path;
var rootDocument = scope.rootDocument;
var flags = scope.flags;
var isIE = scope.isIE;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = 'link[rel=' + IMPORT_LINK_TYPE + ']';
var importParser = {
documentSelectors: IMPORT_SELECTOR,
importsSelectors: [
IMPORT_SELECTOR,
'link[rel=stylesheet]:not([type])',
'style:not([type])',
'script:not([type])',
'script[type="application/javascript"]',
'script[type="text/javascript"]'
].join(','),
map: {
link: 'parseLink',
script: 'parseScript',
style: 'parseStyle'
},
dynamicElements: [],
parseNext: function () {
var next = this.nextToParse();
if (next) {
this.parse(next);
}
},
parse: function (elt) {
if (this.isParsed(elt)) {
flags.parse && console.log('[%s] is already parsed', elt.localName);
return;
}
var fn = this[this.map[elt.localName]];
if (fn) {
this.markParsing(elt);
fn.call(this, elt);
}
},
parseDynamic: function (elt, quiet) {
this.dynamicElements.push(elt);
if (!quiet) {
this.parseNext();
}
},
markParsing: function (elt) {
flags.parse && console.log('parsing', elt);
this.parsingElement = elt;
},
markParsingComplete: function (elt) {
elt.__importParsed = true;
this.markDynamicParsingComplete(elt);
if (elt.__importElement) {
elt.__importElement.__importParsed = true;
this.markDynamicParsingComplete(elt.__importElement);
}
this.parsingElement = null;
flags.parse && console.log('completed', elt);
},
markDynamicParsingComplete: function (elt) {
var i = this.dynamicElements.indexOf(elt);
if (i >= 0) {
this.dynamicElements.splice(i, 1);
}
},
parseImport: function (elt) {
elt.import = elt.__doc;
if (window.HTMLImports.__importsParsingHook) {
window.HTMLImports.__importsParsingHook(elt);
}
if (elt.import) {
elt.import.__importParsed = true;
}
this.markParsingComplete(elt);
if (elt.__resource && !elt.__error) {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
} else {
elt.dispatchEvent(new CustomEvent('error', { bubbles: false }));
}
if (elt.__pending) {
var fn;
while (elt.__pending.length) {
fn = elt.__pending.shift();
if (fn) {
fn({ target: elt });
}
}
}
this.parseNext();
},
parseLink: function (linkElt) {
if (nodeIsImport(linkElt)) {
this.parseImport(linkElt);
} else {
linkElt.href = linkElt.href;
this.parseGeneric(linkElt);
}
},
parseStyle: function (elt) {
var src = elt;
elt = cloneStyle(elt);
src.__appliedElement = elt;
elt.__importElement = src;
this.parseGeneric(elt);
},
parseGeneric: function (elt) {
this.trackElement(elt);
this.addElementToDocument(elt);
},
rootImportForElement: function (elt) {
var n = elt;
while (n.ownerDocument.__importLink) {
n = n.ownerDocument.__importLink;
}
return n;
},
addElementToDocument: function (elt) {
var port = this.rootImportForElement(elt.__importElement || elt);
port.parentNode.insertBefore(elt, port);
},
trackElement: function (elt, callback) {
var self = this;
var done = function (e) {
elt.removeEventListener('load', done);
elt.removeEventListener('error', done);
if (callback) {
callback(e);
}
self.markParsingComplete(elt);
self.parseNext();
};
elt.addEventListener('load', done);
elt.addEventListener('error', done);
if (isIE && elt.localName === 'style') {
var fakeLoad = false;
if (elt.textContent.indexOf('@import') == -1) {
fakeLoad = true;
} else if (elt.sheet) {
fakeLoad = true;
var csr = elt.sheet.cssRules;
var len = csr ? csr.length : 0;
for (var i = 0, r; i < len && (r = csr[i]); i++) {
if (r.type === CSSRule.IMPORT_RULE) {
fakeLoad = fakeLoad && Boolean(r.styleSheet);
}
}
}
if (fakeLoad) {
setTimeout(function () {
elt.dispatchEvent(new CustomEvent('load', { bubbles: false }));
});
}
}
},
parseScript: function (scriptElt) {
var script = document.createElement('script');
script.__importElement = scriptElt;
script.src = scriptElt.src ? scriptElt.src : generateScriptDataUrl(scriptElt);
scope.currentScript = scriptElt;
this.trackElement(script, function (e) {
if (script.parentNode) {
script.parentNode.removeChild(script);
}
scope.currentScript = null;
});
this.addElementToDocument(script);
},
nextToParse: function () {
this._mayParse = [];
return !this.parsingElement && (this.nextToParseInDoc(rootDocument) || this.nextToParseDynamic());
},
nextToParseInDoc: function (doc, link) {
if (doc && this._mayParse.indexOf(doc) < 0) {
this._mayParse.push(doc);
var nodes = doc.querySelectorAll(this.parseSelectorsForNode(doc));
for (var i = 0, l = nodes.length, p = 0, n; i < l && (n = nodes[i]); i++) {
if (!this.isParsed(n)) {
if (this.hasResource(n)) {
return nodeIsImport(n) ? this.nextToParseInDoc(n.__doc, n) : n;
} else {
return;
}
}
}
}
return link;
},
nextToParseDynamic: function () {
return this.dynamicElements[0];
},
parseSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentSelectors : this.importsSelectors;
},
isParsed: function (node) {
return node.__importParsed;
},
needsDynamicParsing: function (elt) {
return this.dynamicElements.indexOf(elt) >= 0;
},
hasResource: function (node) {
if (nodeIsImport(node) && node.__doc === undefined) {
return false;
}
return true;
}
};
function nodeIsImport(elt) {
return elt.localName === 'link' && elt.rel === IMPORT_LINK_TYPE;
}
function generateScriptDataUrl(script) {
var scriptContent = generateScriptContent(script);
return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(scriptContent);
}
function generateScriptContent(script) {
return script.textContent + generateSourceMapHint(script);
}
function generateSourceMapHint(script) {
var owner = script.ownerDocument;
owner.__importedScripts = owner.__importedScripts || 0;
var moniker = script.ownerDocument.baseURI;
var num = owner.__importedScripts ? '-' + owner.__importedScripts : '';
owner.__importedScripts++;
return '\n//# sourceURL=' + moniker + num + '.js\n';
}
function cloneStyle(style) {
var clone = style.ownerDocument.createElement('style');
clone.textContent = style.textContent;
path.resolveUrlsInStyle(clone);
return clone;
}
scope.parser = importParser;
scope.IMPORT_SELECTOR = IMPORT_SELECTOR;
});
window.HTMLImports.addModule(function (scope) {
var flags = scope.flags;
var IMPORT_LINK_TYPE = scope.IMPORT_LINK_TYPE;
var IMPORT_SELECTOR = scope.IMPORT_SELECTOR;
var rootDocument = scope.rootDocument;
var Loader = scope.Loader;
var Observer = scope.Observer;
var parser = scope.parser;
var importer = {
documents: {},
documentPreloadSelectors: IMPORT_SELECTOR,
importsPreloadSelectors: [IMPORT_SELECTOR].join(','),
loadNode: function (node) {
importLoader.addNode(node);
},
loadSubtree: function (parent) {
var nodes = this.marshalNodes(parent);
importLoader.addNodes(nodes);
},
marshalNodes: function (parent) {
return parent.querySelectorAll(this.loadSelectorsForNode(parent));
},
loadSelectorsForNode: function (node) {
var doc = node.ownerDocument || node;
return doc === rootDocument ? this.documentPreloadSelectors : this.importsPreloadSelectors;
},
loaded: function (url, elt, resource, err, redirectedUrl) {
flags.load && console.log('loaded', url, elt);
elt.__resource = resource;
elt.__error = err;
if (isImportLink(elt)) {
var doc = this.documents[url];
if (doc === undefined) {
doc = err ? null : makeDocument(resource, redirectedUrl || url);
if (doc) {
doc.__importLink = elt;
this.bootDocument(doc);
}
this.documents[url] = doc;
}
elt.__doc = doc;
}
parser.parseNext();
},
bootDocument: function (doc) {
this.loadSubtree(doc);
this.observer.observe(doc);
parser.parseNext();
},
loadedAll: function () {
parser.parseNext();
}
};
var importLoader = new Loader(importer.loaded.bind(importer), importer.loadedAll.bind(importer));
importer.observer = new Observer();
function isImportLink(elt) {
return isLinkRel(elt, IMPORT_LINK_TYPE);
}
function isLinkRel(elt, rel) {
return elt.localName === 'link' && elt.getAttribute('rel') === rel;
}
function hasBaseURIAccessor(doc) {
return !!Object.getOwnPropertyDescriptor(doc, 'baseURI');
}
function makeDocument(resource, url) {
var doc = document.implementation.createHTMLDocument(IMPORT_LINK_TYPE);
doc._URL = url;
var base = doc.createElement('base');
base.setAttribute('href', url);
if (!doc.baseURI && !hasBaseURIAccessor(doc)) {
Object.defineProperty(doc, 'baseURI', { value: url });
}
var meta = doc.createElement('meta');
meta.setAttribute('charset', 'utf-8');
doc.head.appendChild(meta);
doc.head.appendChild(base);
doc.body.innerHTML = resource;
if (window.HTMLTemplateElement && HTMLTemplateElement.bootstrap) {
HTMLTemplateElement.bootstrap(doc);
}
return doc;
}
if (!document.baseURI) {
var baseURIDescriptor = {
get: function () {
var base = document.querySelector('base');
return base ? base.href : window.location.href;
},
configurable: true
};
Object.defineProperty(document, 'baseURI', baseURIDescriptor);
Object.defineProperty(rootDocument, 'baseURI', baseURIDescriptor);
}
scope.importer = importer;
scope.importLoader = importLoader;
});
window.HTMLImports.addModule(function (scope) {
var parser = scope.parser;
var importer = scope.importer;
var dynamic = {
added: function (nodes) {
var owner, parsed, loading;
for (var i = 0, l = nodes.length, n; i < l && (n = nodes[i]); i++) {
if (!owner) {
owner = n.ownerDocument;
parsed = parser.isParsed(owner);
}
loading = this.shouldLoadNode(n);
if (loading) {
importer.loadNode(n);
}
if (this.shouldParseNode(n) && parsed) {
parser.parseDynamic(n, loading);
}
}
},
shouldLoadNode: function (node) {
return node.nodeType === 1 && matches.call(node, importer.loadSelectorsForNode(node));
},
shouldParseNode: function (node) {
return node.nodeType === 1 && matches.call(node, parser.parseSelectorsForNode(node));
}
};
importer.observer.addCallback = dynamic.added.bind(dynamic);
var matches = HTMLElement.prototype.matches || HTMLElement.prototype.matchesSelector || HTMLElement.prototype.webkitMatchesSelector || HTMLElement.prototype.mozMatchesSelector || HTMLElement.prototype.msMatchesSelector;
});
(function (scope) {
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (scope.useNative) {
return;
}
initializeModules();
var rootDocument = scope.rootDocument;
function bootstrap() {
window.HTMLImports.importer.bootDocument(rootDocument);
}
if (document.readyState === 'complete' || document.readyState === 'interactive' && !window.attachEvent) {
bootstrap();
} else {
document.addEventListener('DOMContentLoaded', bootstrap);
}
}(window.HTMLImports));
window.CustomElements = window.CustomElements || { flags: {} };
(function (scope) {
var flags = scope.flags;
var modules = [];
var addModule = function (module) {
modules.push(module);
};
var initializeModules = function () {
modules.forEach(function (module) {
module(scope);
});
};
scope.addModule = addModule;
scope.initializeModules = initializeModules;
scope.hasNative = Boolean(document.registerElement);
scope.isIE = /Trident/.test(navigator.userAgent);
scope.useNative = !flags.register && scope.hasNative && !window.ShadowDOMPolyfill && (!window.HTMLImports || window.HTMLImports.useNative);
}(window.CustomElements));
window.CustomElements.addModule(function (scope) {
var IMPORT_LINK_TYPE = window.HTMLImports ? window.HTMLImports.IMPORT_LINK_TYPE : 'none';
function forSubtree(node, cb) {
findAllElements(node, function (e) {
if (cb(e)) {
return true;
}
forRoots(e, cb);
});
forRoots(node, cb);
}
function findAllElements(node, find, data) {
var e = node.firstElementChild;
if (!e) {
e = node.firstChild;
while (e && e.nodeType !== Node.ELEMENT_NODE) {
e = e.nextSibling;
}
}
while (e) {
if (find(e, data) !== true) {
findAllElements(e, find, data);
}
e = e.nextElementSibling;
}
return null;
}
function forRoots(node, cb) {
var root = node.shadowRoot;
while (root) {
forSubtree(root, cb);
root = root.olderShadowRoot;
}
}
function forDocumentTree(doc, cb) {
_forDocumentTree(doc, cb, []);
}
function _forDocumentTree(doc, cb, processingDocuments) {
doc = window.wrap(doc);
if (processingDocuments.indexOf(doc) >= 0) {
return;
}
processingDocuments.push(doc);
var imports = doc.querySelectorAll('link[rel=' + IMPORT_LINK_TYPE + ']');
for (var i = 0, l = imports.length, n; i < l && (n = imports[i]); i++) {
if (n.import) {
_forDocumentTree(n.import, cb, processingDocuments);
}
}
cb(doc);
}
scope.forDocumentTree = forDocumentTree;
scope.forSubtree = forSubtree;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
var forSubtree = scope.forSubtree;
var forDocumentTree = scope.forDocumentTree;
function addedNode(node, isAttached) {
return added(node, isAttached) || addedSubtree(node, isAttached);
}
function added(node, isAttached) {
if (scope.upgrade(node, isAttached)) {
return true;
}
if (isAttached) {
attached(node);
}
}
function addedSubtree(node, isAttached) {
forSubtree(node, function (e) {
if (added(e, isAttached)) {
return true;
}
});
}
var hasThrottledAttached = window.MutationObserver._isPolyfilled && flags['throttle-attached'];
scope.hasPolyfillMutations = hasThrottledAttached;
scope.hasThrottledAttached = hasThrottledAttached;
var isPendingMutations = false;
var pendingMutations = [];
function deferMutation(fn) {
pendingMutations.push(fn);
if (!isPendingMutations) {
isPendingMutations = true;
setTimeout(takeMutations);
}
}
function takeMutations() {
isPendingMutations = false;
var $p = pendingMutations;
for (var i = 0, l = $p.length, p; i < l && (p = $p[i]); i++) {
p();
}
pendingMutations = [];
}
function attached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_attached(element);
});
} else {
_attached(element);
}
}
function _attached(element) {
if (element.__upgraded__ && !element.__attached) {
element.__attached = true;
if (element.attachedCallback) {
element.attachedCallback();
}
}
}
function detachedNode(node) {
detached(node);
forSubtree(node, function (e) {
detached(e);
});
}
function detached(element) {
if (hasThrottledAttached) {
deferMutation(function () {
_detached(element);
});
} else {
_detached(element);
}
}
function _detached(element) {
if (element.__upgraded__ && element.__attached) {
element.__attached = false;
if (element.detachedCallback) {
element.detachedCallback();
}
}
}
function inDocument(element) {
var p = element;
var doc = window.wrap(document);
while (p) {
if (p == doc) {
return true;
}
p = p.parentNode || p.nodeType === Node.DOCUMENT_FRAGMENT_NODE && p.host;
}
}
function watchShadow(node) {
if (node.shadowRoot && !node.shadowRoot.__watched) {
flags.dom && console.log('watching shadow-root for: ', node.localName);
var root = node.shadowRoot;
while (root) {
observe(root);
root = root.olderShadowRoot;
}
}
}
function handler(root, mutations) {
if (flags.dom) {
var mx = mutations[0];
if (mx && mx.type === 'childList' && mx.addedNodes) {
if (mx.addedNodes) {
var d = mx.addedNodes[0];
while (d && d !== document && !d.host) {
d = d.parentNode;
}
var u = d && (d.URL || d._URL || d.host && d.host.localName) || '';
u = u.split('/?').shift().split('/').pop();
}
}
console.group('mutations (%d) [%s]', mutations.length, u || '');
}
var isAttached = inDocument(root);
mutations.forEach(function (mx) {
if (mx.type === 'childList') {
forEach(mx.addedNodes, function (n) {
if (!n.localName) {
return;
}
addedNode(n, isAttached);
});
forEach(mx.removedNodes, function (n) {
if (!n.localName) {
return;
}
detachedNode(n);
});
}
});
flags.dom && console.groupEnd();
}
function takeRecords(node) {
node = window.wrap(node);
if (!node) {
node = window.wrap(document);
}
while (node.parentNode) {
node = node.parentNode;
}
var observer = node.__observer;
if (observer) {
handler(node, observer.takeRecords());
takeMutations();
}
}
var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
function observe(inRoot) {
if (inRoot.__observer) {
return;
}
var observer = new MutationObserver(handler.bind(this, inRoot));
observer.observe(inRoot, {
childList: true,
subtree: true
});
inRoot.__observer = observer;
}
function upgradeDocument(doc) {
doc = window.wrap(doc);
flags.dom && console.group('upgradeDocument: ', doc.baseURI.split('/').pop());
var isMainDocument = doc === window.wrap(document);
addedNode(doc, isMainDocument);
observe(doc);
flags.dom && console.groupEnd();
}
function upgradeDocumentTree(doc) {
forDocumentTree(doc, upgradeDocument);
}
var originalCreateShadowRoot = Element.prototype.createShadowRoot;
if (originalCreateShadowRoot) {
Element.prototype.createShadowRoot = function () {
var root = originalCreateShadowRoot.call(this);
window.CustomElements.watchShadow(this);
return root;
};
}
scope.watchShadow = watchShadow;
scope.upgradeDocumentTree = upgradeDocumentTree;
scope.upgradeDocument = upgradeDocument;
scope.upgradeSubtree = addedSubtree;
scope.upgradeAll = addedNode;
scope.attached = attached;
scope.takeRecords = takeRecords;
});
window.CustomElements.addModule(function (scope) {
var flags = scope.flags;
function upgrade(node, isAttached) {
if (node.localName === 'template') {
if (window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(node);
}
}
if (!node.__upgraded__ && node.nodeType === Node.ELEMENT_NODE) {
var is = node.getAttribute('is');
var definition = scope.getRegisteredDefinition(node.localName) || scope.getRegisteredDefinition(is);
if (definition) {
if (is && definition.tag == node.localName || !is && !definition.extends) {
return upgradeWithDefinition(node, definition, isAttached);
}
}
}
}
function upgradeWithDefinition(element, definition, isAttached) {
flags.upgrade && console.group('upgrade:', element.localName);
if (definition.is) {
element.setAttribute('is', definition.is);
}
implementPrototype(element, definition);
element.__upgraded__ = true;
created(element);
if (isAttached) {
scope.attached(element);
}
scope.upgradeSubtree(element, isAttached);
flags.upgrade && console.groupEnd();
return element;
}
function implementPrototype(element, definition) {
if (Object.__proto__) {
element.__proto__ = definition.prototype;
} else {
customMixin(element, definition.prototype, definition.native);
element.__proto__ = definition.prototype;
}
}
function customMixin(inTarget, inSrc, inNative) {
var used = {};
var p = inSrc;
while (p !== inNative && p !== HTMLElement.prototype) {
var keys = Object.getOwnPropertyNames(p);
for (var i = 0, k; k = keys[i]; i++) {
if (!used[k]) {
Object.defineProperty(inTarget, k, Object.getOwnPropertyDescriptor(p, k));
used[k] = 1;
}
}
p = Object.getPrototypeOf(p);
}
}
function created(element) {
if (element.createdCallback) {
element.createdCallback();
}
}
scope.upgrade = upgrade;
scope.upgradeWithDefinition = upgradeWithDefinition;
scope.implementPrototype = implementPrototype;
});
window.CustomElements.addModule(function (scope) {
var isIE = scope.isIE;
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeAll = scope.upgradeAll;
var upgradeWithDefinition = scope.upgradeWithDefinition;
var implementPrototype = scope.implementPrototype;
var useNative = scope.useNative;
function register(name, options) {
var definition = options || {};
if (!name) {
throw new Error('document.registerElement: first argument `name` must not be empty');
}
if (name.indexOf('-') < 0) {
throw new Error('document.registerElement: first argument (\'name\') must contain a dash (\'-\'). Argument provided was \'' + String(name) + '\'.');
}
if (isReservedTag(name)) {
throw new Error('Failed to execute \'registerElement\' on \'Document\': Registration failed for type \'' + String(name) + '\'. The type name is invalid.');
}
if (getRegisteredDefinition(name)) {
throw new Error('DuplicateDefinitionError: a type with name \'' + String(name) + '\' is already registered');
}
if (!definition.prototype) {
definition.prototype = Object.create(HTMLElement.prototype);
}
definition.__name = name.toLowerCase();
definition.lifecycle = definition.lifecycle || {};
definition.ancestry = ancestry(definition.extends);
resolveTagName(definition);
resolvePrototypeChain(definition);
overrideAttributeApi(definition.prototype);
registerDefinition(definition.__name, definition);
definition.ctor = generateConstructor(definition);
definition.ctor.prototype = definition.prototype;
definition.prototype.constructor = definition.ctor;
if (scope.ready) {
upgradeDocumentTree(document);
}
return definition.ctor;
}
function overrideAttributeApi(prototype) {
if (prototype.setAttribute._polyfilled) {
return;
}
var setAttribute = prototype.setAttribute;
prototype.setAttribute = function (name, value) {
changeAttribute.call(this, name, value, setAttribute);
};
var removeAttribute = prototype.removeAttribute;
prototype.removeAttribute = function (name) {
changeAttribute.call(this, name, null, removeAttribute);
};
prototype.setAttribute._polyfilled = true;
}
function changeAttribute(name, value, operation) {
name = name.toLowerCase();
var oldValue = this.getAttribute(name);
operation.apply(this, arguments);
var newValue = this.getAttribute(name);
if (this.attributeChangedCallback && newValue !== oldValue) {
this.attributeChangedCallback(name, oldValue, newValue);
}
}
function isReservedTag(name) {
for (var i = 0; i < reservedTagList.length; i++) {
if (name === reservedTagList[i]) {
return true;
}
}
}
var reservedTagList = [
'annotation-xml',
'color-profile',
'font-face',
'font-face-src',
'font-face-uri',
'font-face-format',
'font-face-name',
'missing-glyph'
];
function ancestry(extnds) {
var extendee = getRegisteredDefinition(extnds);
if (extendee) {
return ancestry(extendee.extends).concat([extendee]);
}
return [];
}
function resolveTagName(definition) {
var baseTag = definition.extends;
for (var i = 0, a; a = definition.ancestry[i]; i++) {
baseTag = a.is && a.tag;
}
definition.tag = baseTag || definition.__name;
if (baseTag) {
definition.is = definition.__name;
}
}
function resolvePrototypeChain(definition) {
if (!Object.__proto__) {
var nativePrototype = HTMLElement.prototype;
if (definition.is) {
var inst = document.createElement(definition.tag);
nativePrototype = Object.getPrototypeOf(inst);
}
var proto = definition.prototype, ancestor;
var foundPrototype = false;
while (proto) {
if (proto == nativePrototype) {
foundPrototype = true;
}
ancestor = Object.getPrototypeOf(proto);
if (ancestor) {
proto.__proto__ = ancestor;
}
proto = ancestor;
}
if (!foundPrototype) {
console.warn(definition.tag + ' prototype not found in prototype chain for ' + definition.is);
}
definition.native = nativePrototype;
}
}
function instantiate(definition) {
return upgradeWithDefinition(domCreateElement(definition.tag), definition);
}
var registry = {};
function getRegisteredDefinition(name) {
if (name) {
return registry[name.toLowerCase()];
}
}
function registerDefinition(name, definition) {
registry[name] = definition;
}
function generateConstructor(definition) {
return function () {
return instantiate(definition);
};
}
var HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
function createElementNS(namespace, tag, typeExtension) {
if (namespace === HTML_NAMESPACE) {
return createElement(tag, typeExtension);
} else {
return domCreateElementNS(namespace, tag);
}
}
function createElement(tag, typeExtension) {
if (tag) {
tag = tag.toLowerCase();
}
if (typeExtension) {
typeExtension = typeExtension.toLowerCase();
}
var definition = getRegisteredDefinition(typeExtension || tag);
if (definition) {
if (tag == definition.tag && typeExtension == definition.is) {
return new definition.ctor();
}
if (!typeExtension && !definition.is) {
return new definition.ctor();
}
}
var element;
if (typeExtension) {
element = createElement(tag);
element.setAttribute('is', typeExtension);
return element;
}
element = domCreateElement(tag);
if (tag.indexOf('-') >= 0) {
implementPrototype(element, HTMLElement);
}
return element;
}
var domCreateElement = document.createElement.bind(document);
var domCreateElementNS = document.createElementNS.bind(document);
var isInstance;
if (!Object.__proto__ && !useNative) {
isInstance = function (obj, ctor) {
if (obj instanceof ctor) {
return true;
}
var p = obj;
while (p) {
if (p === ctor.prototype) {
return true;
}
p = p.__proto__;
}
return false;
};
} else {
isInstance = function (obj, base) {
return obj instanceof base;
};
}
function wrapDomMethodToForceUpgrade(obj, methodName) {
var orig = obj[methodName];
obj[methodName] = function () {
var n = orig.apply(this, arguments);
upgradeAll(n);
return n;
};
}
wrapDomMethodToForceUpgrade(Node.prototype, 'cloneNode');
wrapDomMethodToForceUpgrade(document, 'importNode');
if (isIE) {
(function () {
var importNode = document.importNode;
document.importNode = function () {
var n = importNode.apply(document, arguments);
if (n.nodeType == n.DOCUMENT_FRAGMENT_NODE) {
var f = document.createDocumentFragment();
f.appendChild(n);
return f;
} else {
return n;
}
};
}());
}
document.registerElement = register;
document.createElement = createElement;
document.createElementNS = createElementNS;
scope.registry = registry;
scope.instanceof = isInstance;
scope.reservedTagList = reservedTagList;
scope.getRegisteredDefinition = getRegisteredDefinition;
document.register = document.registerElement;
});
(function (scope) {
var useNative = scope.useNative;
var initializeModules = scope.initializeModules;
var isIE = scope.isIE;
if (useNative) {
var nop = function () {
};
scope.watchShadow = nop;
scope.upgrade = nop;
scope.upgradeAll = nop;
scope.upgradeDocumentTree = nop;
scope.upgradeSubtree = nop;
scope.takeRecords = nop;
scope.instanceof = function (obj, base) {
return obj instanceof base;
};
} else {
initializeModules();
}
var upgradeDocumentTree = scope.upgradeDocumentTree;
var upgradeDocument = scope.upgradeDocument;
if (!window.wrap) {
if (window.ShadowDOMPolyfill) {
window.wrap = window.ShadowDOMPolyfill.wrapIfNeeded;
window.unwrap = window.ShadowDOMPolyfill.unwrapIfNeeded;
} else {
window.wrap = window.unwrap = function (node) {
return node;
};
}
}
if (window.HTMLImports) {
window.HTMLImports.__importsParsingHook = function (elt) {
if (elt.import) {
upgradeDocument(wrap(elt.import));
}
};
}
function bootstrap() {
upgradeDocumentTree(window.wrap(document));
window.CustomElements.ready = true;
var requestAnimationFrame = window.requestAnimationFrame || function (f) {
setTimeout(f, 16);
};
requestAnimationFrame(function () {
setTimeout(function () {
window.CustomElements.readyTime = Date.now();
if (window.HTMLImports) {
window.CustomElements.elapsed = window.CustomElements.readyTime - window.HTMLImports.readyTime;
}
document.dispatchEvent(new CustomEvent('WebComponentsReady', { bubbles: true }));
});
});
}
if (document.readyState === 'complete' || scope.flags.eager) {
bootstrap();
} else if (document.readyState === 'interactive' && !window.attachEvent && (!window.HTMLImports || window.HTMLImports.ready)) {
bootstrap();
} else {
var loadEvent = window.HTMLImports && !window.HTMLImports.ready ? 'HTMLImportsLoaded' : 'DOMContentLoaded';
window.addEventListener(loadEvent, bootstrap);
}
}(window.CustomElements));
(function (scope) {
var style = document.createElement('style');
style.textContent = '' + 'body {' + 'transition: opacity ease-in 0.2s;' + ' } \n' + 'body[unresolved] {' + 'opacity: 0; display: block; overflow: hidden; position: relative;' + ' } \n';
var head = document.querySelector('head');
head.insertBefore(style, head.firstChild);
}(window.WebComponents));
Polymer = { dom: 'shadow' };
(function () {
function resolve() {
document.body.removeAttribute('unresolved');
}
if (window.WebComponents) {
addEventListener('WebComponentsReady', resolve);
} else {
if (document.readyState === 'interactive' || document.readyState === 'complete') {
resolve();
} else {
addEventListener('DOMContentLoaded', resolve);
}
}
}());
window.Polymer = {
Settings: function () {
var user = window.Polymer || {};
var parts = location.search.slice(1).split('&');
for (var i = 0, o; i < parts.length && (o = parts[i]); i++) {
o = o.split('=');
o[0] && (user[o[0]] = o[1] || true);
}
var wantShadow = user.dom === 'shadow';
var hasShadow = Boolean(Element.prototype.createShadowRoot);
var nativeShadow = hasShadow && !window.ShadowDOMPolyfill;
var useShadow = wantShadow && hasShadow;
var hasNativeImports = Boolean('import' in document.createElement('link'));
var useNativeImports = hasNativeImports;
var useNativeCustomElements = !window.CustomElements || window.CustomElements.useNative;
var usePolyfillProto = !useNativeCustomElements && !Object.__proto__;
return {
wantShadow: wantShadow,
hasShadow: hasShadow,
nativeShadow: nativeShadow,
useShadow: useShadow,
useNativeShadow: useShadow && nativeShadow,
useNativeImports: useNativeImports,
useNativeCustomElements: useNativeCustomElements,
usePolyfillProto: usePolyfillProto
};
}()
};
(function () {
var userPolymer = window.Polymer;
window.Polymer = function (prototype) {
if (typeof prototype === 'function') {
prototype = prototype.prototype;
}
if (!prototype) {
prototype = {};
}
var factory = desugar(prototype);
prototype = factory.prototype;
var options = { prototype: prototype };
if (prototype.extends) {
options.extends = prototype.extends;
}
Polymer.telemetry._registrate(prototype);
document.registerElement(prototype.is, options);
return factory;
};
var desugar = function (prototype) {
var base = Polymer.Base;
if (prototype.extends) {
base = Polymer.Base._getExtendedPrototype(prototype.extends);
}
prototype = Polymer.Base.chainObject(prototype, base);
prototype.registerCallback();
return prototype.constructor;
};
if (userPolymer) {
for (var i in userPolymer) {
Polymer[i] = userPolymer[i];
}
}
Polymer.Class = desugar;
}());
Polymer.telemetry = {
registrations: [],
_regLog: function (prototype) {
console.log('[' + prototype.is + ']: registered');
},
_registrate: function (prototype) {
this.registrations.push(prototype);
Polymer.log && this._regLog(prototype);
},
dumpRegistrations: function () {
this.registrations.forEach(this._regLog);
}
};
Object.defineProperty(window, 'currentImport', {
enumerable: true,
configurable: true,
get: function () {
return (document._currentScript || document.currentScript).ownerDocument;
}
});
Polymer.RenderStatus = {
_ready: false,
_callbacks: [],
whenReady: function (cb) {
if (this._ready) {
cb();
} else {
this._callbacks.push(cb);
}
},
_makeReady: function () {
this._ready = true;
for (var i = 0; i < this._callbacks.length; i++) {
this._callbacks[i]();
}
this._callbacks = [];
},
_catchFirstRender: function () {
requestAnimationFrame(function () {
Polymer.RenderStatus._makeReady();
});
},
_afterNextRenderQueue: [],
_waitingNextRender: false,
afterNextRender: function (element, fn, args) {
this._watchNextRender();
this._afterNextRenderQueue.push([
element,
fn,
args
]);
},
_watchNextRender: function () {
if (!this._waitingNextRender) {
this._waitingNextRender = true;
var fn = function () {
Polymer.RenderStatus._flushNextRender();
};
if (!this._ready) {
this.whenReady(fn);
} else {
requestAnimationFrame(fn);
}
}
},
_flushNextRender: function () {
var self = this;
setTimeout(function () {
self._flushRenderCallbacks(self._afterNextRenderQueue);
self._afterNextRenderQueue = [];
self._waitingNextRender = false;
});
},
_flushRenderCallbacks: function (callbacks) {
for (var i = 0, h; i < callbacks.length; i++) {
h = callbacks[i];
h[1].apply(h[0], h[2] || Polymer.nar);
}
}
};
if (window.HTMLImports) {
HTMLImports.whenReady(function () {
Polymer.RenderStatus._catchFirstRender();
});
} else {
Polymer.RenderStatus._catchFirstRender();
}
Polymer.ImportStatus = Polymer.RenderStatus;
Polymer.ImportStatus.whenLoaded = Polymer.ImportStatus.whenReady;
Polymer.Base = {
__isPolymerInstance__: true,
_addFeature: function (feature) {
this.extend(this, feature);
},
registerCallback: function () {
this._desugarBehaviors();
this._doBehavior('beforeRegister');
this._registerFeatures();
this._doBehavior('registered');
},
createdCallback: function () {
Polymer.telemetry.instanceCount++;
this.root = this;
this._doBehavior('created');
this._initFeatures();
},
attachedCallback: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self.isAttached = true;
self._doBehavior('attached');
});
},
detachedCallback: function () {
this.isAttached = false;
this._doBehavior('detached');
},
attributeChangedCallback: function (name, oldValue, newValue) {
this._attributeChangedImpl(name);
this._doBehavior('attributeChanged', [
name,
oldValue,
newValue
]);
},
_attributeChangedImpl: function (name) {
this._setAttributeToProperty(this, name);
},
extend: function (prototype, api) {
if (prototype && api) {
var n$ = Object.getOwnPropertyNames(api);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
this.copyOwnProperty(n, api, prototype);
}
}
return prototype || api;
},
mixin: function (target, source) {
for (var i in source) {
target[i] = source[i];
}
return target;
},
copyOwnProperty: function (name, source, target) {
var pd = Object.getOwnPropertyDescriptor(source, name);
if (pd) {
Object.defineProperty(target, name, pd);
}
},
_log: console.log.apply.bind(console.log, console),
_warn: console.warn.apply.bind(console.warn, console),
_error: console.error.apply.bind(console.error, console),
_logf: function () {
return this._logPrefix.concat([this.is]).concat(Array.prototype.slice.call(arguments, 0));
}
};
Polymer.Base._logPrefix = function () {
var color = window.chrome || /firefox/i.test(navigator.userAgent);
return color ? [
'%c[%s::%s]:',
'font-weight: bold; background-color:#EEEE00;'
] : ['[%s::%s]:'];
}();
Polymer.Base.chainObject = function (object, inherited) {
if (object && inherited && object !== inherited) {
if (!Object.__proto__) {
object = Polymer.Base.extend(Object.create(inherited), object);
}
object.__proto__ = inherited;
}
return object;
};
Polymer.Base = Polymer.Base.chainObject(Polymer.Base, HTMLElement.prototype);
if (window.CustomElements) {
Polymer.instanceof = CustomElements.instanceof;
} else {
Polymer.instanceof = function (obj, ctor) {
return obj instanceof ctor;
};
}
Polymer.isInstance = function (obj) {
return Boolean(obj && obj.__isPolymerInstance__);
};
Polymer.telemetry.instanceCount = 0;
(function () {
var modules = {};
var lcModules = {};
var findModule = function (id) {
return modules[id] || lcModules[id.toLowerCase()];
};
var DomModule = function () {
return document.createElement('dom-module');
};
DomModule.prototype = Object.create(HTMLElement.prototype);
Polymer.Base.extend(DomModule.prototype, {
constructor: DomModule,
createdCallback: function () {
this.register();
},
register: function (id) {
id = id || this.id || this.getAttribute('name') || this.getAttribute('is');
if (id) {
this.id = id;
modules[id] = this;
lcModules[id.toLowerCase()] = this;
}
},
import: function (id, selector) {
if (id) {
var m = findModule(id);
if (!m) {
forceDomModulesUpgrade();
m = findModule(id);
}
if (m && selector) {
m = m.querySelector(selector);
}
return m;
}
}
});
var cePolyfill = window.CustomElements && !CustomElements.useNative;
document.registerElement('dom-module', DomModule);
function forceDomModulesUpgrade() {
if (cePolyfill) {
var script = document._currentScript || document.currentScript;
var doc = script && script.ownerDocument || document;
var modules = doc.querySelectorAll('dom-module');
for (var i = modules.length - 1, m; i >= 0 && (m = modules[i]); i--) {
if (m.__upgraded__) {
return;
} else {
CustomElements.upgrade(m);
}
}
}
}
}());
Polymer.Base._addFeature({
_prepIs: function () {
if (!this.is) {
var module = (document._currentScript || document.currentScript).parentNode;
if (module.localName === 'dom-module') {
var id = module.id || module.getAttribute('name') || module.getAttribute('is');
this.is = id;
}
}
if (this.is) {
this.is = this.is.toLowerCase();
}
}
});
Polymer.Base._addFeature({
behaviors: [],
_desugarBehaviors: function () {
if (this.behaviors.length) {
this.behaviors = this._desugarSomeBehaviors(this.behaviors);
}
},
_desugarSomeBehaviors: function (behaviors) {
var behaviorSet = [];
behaviors = this._flattenBehaviorsList(behaviors);
for (var i = behaviors.length - 1; i >= 0; i--) {
var b = behaviors[i];
if (behaviorSet.indexOf(b) === -1) {
this._mixinBehavior(b);
behaviorSet.unshift(b);
}
}
return behaviorSet;
},
_flattenBehaviorsList: function (behaviors) {
var flat = [];
for (var i = 0; i < behaviors.length; i++) {
var b = behaviors[i];
if (b instanceof Array) {
flat = flat.concat(this._flattenBehaviorsList(b));
} else if (b) {
flat.push(b);
} else {
this._warn(this._logf('_flattenBehaviorsList', 'behavior is null, check for missing or 404 import'));
}
}
return flat;
},
_mixinBehavior: function (b) {
var n$ = Object.getOwnPropertyNames(b);
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
if (!Polymer.Base._behaviorProperties[n] && !this.hasOwnProperty(n)) {
this.copyOwnProperty(n, b, this);
}
}
},
_prepBehaviors: function () {
this._prepFlattenedBehaviors(this.behaviors);
},
_prepFlattenedBehaviors: function (behaviors) {
for (var i = 0, l = behaviors.length; i < l; i++) {
this._prepBehavior(behaviors[i]);
}
this._prepBehavior(this);
},
_doBehavior: function (name, args) {
for (var i = 0; i < this.behaviors.length; i++) {
this._invokeBehavior(this.behaviors[i], name, args);
}
this._invokeBehavior(this, name, args);
},
_invokeBehavior: function (b, name, args) {
var fn = b[name];
if (fn) {
fn.apply(this, args || Polymer.nar);
}
},
_marshalBehaviors: function () {
for (var i = 0; i < this.behaviors.length; i++) {
this._marshalBehavior(this.behaviors[i]);
}
this._marshalBehavior(this);
}
});
Polymer.Base._behaviorProperties = {
hostAttributes: true,
beforeRegister: true,
registered: true,
properties: true,
observers: true,
listeners: true,
created: true,
attached: true,
detached: true,
attributeChanged: true,
ready: true
};
Polymer.Base._addFeature({
_getExtendedPrototype: function (tag) {
return this._getExtendedNativePrototype(tag);
},
_nativePrototypes: {},
_getExtendedNativePrototype: function (tag) {
var p = this._nativePrototypes[tag];
if (!p) {
var np = this.getNativePrototype(tag);
p = this.extend(Object.create(np), Polymer.Base);
this._nativePrototypes[tag] = p;
}
return p;
},
getNativePrototype: function (tag) {
return Object.getPrototypeOf(document.createElement(tag));
}
});
Polymer.Base._addFeature({
_prepConstructor: function () {
this._factoryArgs = this.extends ? [
this.extends,
this.is
] : [this.is];
var ctor = function () {
return this._factory(arguments);
};
if (this.hasOwnProperty('extends')) {
ctor.extends = this.extends;
}
Object.defineProperty(this, 'constructor', {
value: ctor,
writable: true,
configurable: true
});
ctor.prototype = this;
},
_factory: function (args) {
var elt = document.createElement.apply(document, this._factoryArgs);
if (this.factoryImpl) {
this.factoryImpl.apply(elt, args);
}
return elt;
}
});
Polymer.nob = Object.create(null);
Polymer.Base._addFeature({
properties: {},
getPropertyInfo: function (property) {
var info = this._getPropertyInfo(property, this.properties);
if (!info) {
for (var i = 0; i < this.behaviors.length; i++) {
info = this._getPropertyInfo(property, this.behaviors[i].properties);
if (info) {
return info;
}
}
}
return info || Polymer.nob;
},
_getPropertyInfo: function (property, properties) {
var p = properties && properties[property];
if (typeof p === 'function') {
p = properties[property] = { type: p };
}
if (p) {
p.defined = true;
}
return p;
},
_prepPropertyInfo: function () {
this._propertyInfo = {};
for (var i = 0; i < this.behaviors.length; i++) {
this._addPropertyInfo(this._propertyInfo, this.behaviors[i].properties);
}
this._addPropertyInfo(this._propertyInfo, this.properties);
this._addPropertyInfo(this._propertyInfo, this._propertyEffects);
},
_addPropertyInfo: function (target, source) {
if (source) {
var t, s;
for (var i in source) {
t = target[i];
s = source[i];
if (i[0] === '_' && !s.readOnly) {
continue;
}
if (!target[i]) {
target[i] = {
type: typeof s === 'function' ? s : s.type,
readOnly: s.readOnly,
attribute: Polymer.CaseMap.camelToDashCase(i)
};
} else {
if (!t.type) {
t.type = s.type;
}
if (!t.readOnly) {
t.readOnly = s.readOnly;
}
}
}
}
}
});
Polymer.CaseMap = {
_caseMap: {},
_rx: {
dashToCamel: /-[a-z]/g,
camelToDash: /([A-Z])/g
},
dashToCamelCase: function (dash) {
return this._caseMap[dash] || (this._caseMap[dash] = dash.indexOf('-') < 0 ? dash : dash.replace(this._rx.dashToCamel, function (m) {
return m[1].toUpperCase();
}));
},
camelToDashCase: function (camel) {
return this._caseMap[camel] || (this._caseMap[camel] = camel.replace(this._rx.camelToDash, '-$1').toLowerCase());
}
};
Polymer.Base._addFeature({
_addHostAttributes: function (attributes) {
if (!this._aggregatedAttributes) {
this._aggregatedAttributes = {};
}
if (attributes) {
this.mixin(this._aggregatedAttributes, attributes);
}
},
_marshalHostAttributes: function () {
if (this._aggregatedAttributes) {
this._applyAttributes(this, this._aggregatedAttributes);
}
},
_applyAttributes: function (node, attr$) {
for (var n in attr$) {
if (!this.hasAttribute(n) && n !== 'class') {
var v = attr$[n];
this.serializeValueToAttribute(v, n, this);
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this);
},
_takeAttributesToModel: function (model) {
if (this.hasAttributes()) {
for (var i in this._propertyInfo) {
var info = this._propertyInfo[i];
if (this.hasAttribute(info.attribute)) {
this._setAttributeToProperty(model, info.attribute, i, info);
}
}
}
},
_setAttributeToProperty: function (model, attribute, property, info) {
if (!this._serializing) {
property = property || Polymer.CaseMap.dashToCamelCase(attribute);
info = info || this._propertyInfo && this._propertyInfo[property];
if (info && !info.readOnly) {
var v = this.getAttribute(attribute);
model[property] = this.deserialize(v, info.type);
}
}
},
_serializing: false,
reflectPropertyToAttribute: function (property, attribute, value) {
this._serializing = true;
value = value === undefined ? this[property] : value;
this.serializeValueToAttribute(value, attribute || Polymer.CaseMap.camelToDashCase(property));
this._serializing = false;
},
serializeValueToAttribute: function (value, attribute, node) {
var str = this.serialize(value);
node = node || this;
if (str === undefined) {
node.removeAttribute(attribute);
} else {
node.setAttribute(attribute, str);
}
},
deserialize: function (value, type) {
switch (type) {
case Number:
value = Number(value);
break;
case Boolean:
value = value !== null;
break;
case Object:
try {
value = JSON.parse(value);
} catch (x) {
}
break;
case Array:
try {
value = JSON.parse(value);
} catch (x) {
value = null;
console.warn('Polymer::Attributes: couldn`t decode Array as JSON');
}
break;
case Date:
value = new Date(value);
break;
case String:
default:
break;
}
return value;
},
serialize: function (value) {
switch (typeof value) {
case 'boolean':
return value ? '' : undefined;
case 'object':
if (value instanceof Date) {
return value;
} else if (value) {
try {
return JSON.stringify(value);
} catch (x) {
return '';
}
}
default:
return value != null ? value : undefined;
}
}
});
Polymer.version = 'master';
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_marshalBehavior: function (b) {
},
_initFeatures: function () {
this._marshalHostAttributes();
this._marshalBehaviors();
}
});
Polymer.Base._addFeature({
_prepTemplate: function () {
if (this._template === undefined) {
this._template = Polymer.DomModule.import(this.is, 'template');
}
if (this._template && this._template.hasAttribute('is')) {
this._warn(this._logf('_prepTemplate', 'top-level Polymer template ' + 'must not be a type-extension, found', this._template, 'Move inside simple <template>.'));
}
if (this._template && !this._template.content && window.HTMLTemplateElement && HTMLTemplateElement.decorate) {
HTMLTemplateElement.decorate(this._template);
}
},
_stampTemplate: function () {
if (this._template) {
this.root = this.instanceTemplate(this._template);
}
},
instanceTemplate: function (template) {
var dom = document.importNode(template._content || template.content, true);
return dom;
}
});
(function () {
var baseAttachedCallback = Polymer.Base.attachedCallback;
Polymer.Base._addFeature({
_hostStack: [],
ready: function () {
},
_registerHost: function (host) {
this.dataHost = host = host || Polymer.Base._hostStack[Polymer.Base._hostStack.length - 1];
if (host && host._clients) {
host._clients.push(this);
}
this._clients = null;
this._clientsReadied = false;
},
_beginHosting: function () {
Polymer.Base._hostStack.push(this);
if (!this._clients) {
this._clients = [];
}
},
_endHosting: function () {
Polymer.Base._hostStack.pop();
},
_tryReady: function () {
this._readied = false;
if (this._canReady()) {
this._ready();
}
},
_canReady: function () {
return !this.dataHost || this.dataHost._clientsReadied;
},
_ready: function () {
this._beforeClientsReady();
if (this._template) {
this._setupRoot();
this._readyClients();
}
this._clientsReadied = true;
this._clients = null;
this._afterClientsReady();
this._readySelf();
},
_readyClients: function () {
this._beginDistribute();
var c$ = this._clients;
if (c$) {
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._ready();
}
}
this._finishDistribute();
},
_readySelf: function () {
this._doBehavior('ready');
this._readied = true;
if (this._attachedPending) {
this._attachedPending = false;
this.attachedCallback();
}
},
_beforeClientsReady: function () {
},
_afterClientsReady: function () {
},
_beforeAttached: function () {
},
attachedCallback: function () {
if (this._readied) {
this._beforeAttached();
baseAttachedCallback.call(this);
} else {
this._attachedPending = true;
}
}
});
}());
Polymer.ArraySplice = function () {
function newSplice(index, removed, addedCount) {
return {
index: index,
removed: removed,
addedCount: addedCount
};
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function ArraySplice() {
}
ArraySplice.prototype = {
calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var rowCount = oldEnd - oldStart + 1;
var columnCount = currentEnd - currentStart + 1;
var distances = new Array(rowCount);
for (var i = 0; i < rowCount; i++) {
distances[i] = new Array(columnCount);
distances[i][0] = i;
}
for (var j = 0; j < columnCount; j++)
distances[0][j] = j;
for (i = 1; i < rowCount; i++) {
for (j = 1; j < columnCount; j++) {
if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
distances[i][j] = distances[i - 1][j - 1];
else {
var north = distances[i - 1][j] + 1;
var west = distances[i][j - 1] + 1;
distances[i][j] = north < west ? north : west;
}
}
}
return distances;
},
spliceOperationsFromEditDistances: function (distances) {
var i = distances.length - 1;
var j = distances[0].length - 1;
var current = distances[i][j];
var edits = [];
while (i > 0 || j > 0) {
if (i == 0) {
edits.push(EDIT_ADD);
j--;
continue;
}
if (j == 0) {
edits.push(EDIT_DELETE);
i--;
continue;
}
var northWest = distances[i - 1][j - 1];
var west = distances[i - 1][j];
var north = distances[i][j - 1];
var min;
if (west < north)
min = west < northWest ? west : northWest;
else
min = north < northWest ? north : northWest;
if (min == northWest) {
if (northWest == current) {
edits.push(EDIT_LEAVE);
} else {
edits.push(EDIT_UPDATE);
current = northWest;
}
i--;
j--;
} else if (min == west) {
edits.push(EDIT_DELETE);
i--;
current = west;
} else {
edits.push(EDIT_ADD);
j--;
current = north;
}
}
edits.reverse();
return edits;
},
calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
var prefixCount = 0;
var suffixCount = 0;
var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
if (currentStart == 0 && oldStart == 0)
prefixCount = this.sharedPrefix(current, old, minLength);
if (currentEnd == current.length && oldEnd == old.length)
suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
currentStart += prefixCount;
oldStart += prefixCount;
currentEnd -= suffixCount;
oldEnd -= suffixCount;
if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
return [];
if (currentStart == currentEnd) {
var splice = newSplice(currentStart, [], 0);
while (oldStart < oldEnd)
splice.removed.push(old[oldStart++]);
return [splice];
} else if (oldStart == oldEnd)
return [newSplice(currentStart, [], currentEnd - currentStart)];
var ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
splice = undefined;
var splices = [];
var index = currentStart;
var oldIndex = oldStart;
for (var i = 0; i < ops.length; i++) {
switch (ops[i]) {
case EDIT_LEAVE:
if (splice) {
splices.push(splice);
splice = undefined;
}
index++;
oldIndex++;
break;
case EDIT_UPDATE:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
case EDIT_ADD:
if (!splice)
splice = newSplice(index, [], 0);
splice.addedCount++;
index++;
break;
case EDIT_DELETE:
if (!splice)
splice = newSplice(index, [], 0);
splice.removed.push(old[oldIndex]);
oldIndex++;
break;
}
}
if (splice) {
splices.push(splice);
}
return splices;
},
sharedPrefix: function (current, old, searchLength) {
for (var i = 0; i < searchLength; i++)
if (!this.equals(current[i], old[i]))
return i;
return searchLength;
},
sharedSuffix: function (current, old, searchLength) {
var index1 = current.length;
var index2 = old.length;
var count = 0;
while (count < searchLength && this.equals(current[--index1], old[--index2]))
count++;
return count;
},
calculateSplices: function (current, previous) {
return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
},
equals: function (currentValue, previousValue) {
return currentValue === previousValue;
}
};
return new ArraySplice();
}();
Polymer.domInnerHTML = function () {
var escapeAttrRegExp = /[&\u00A0"]/g;
var escapeDataRegExp = /[&\u00A0<>]/g;
function escapeReplace(c) {
switch (c) {
case '&':
return '&amp;';
case '<':
return '&lt;';
case '>':
return '&gt;';
case '"':
return '&quot;';
case '\xA0':
return '&nbsp;';
}
}
function escapeAttr(s) {
return s.replace(escapeAttrRegExp, escapeReplace);
}
function escapeData(s) {
return s.replace(escapeDataRegExp, escapeReplace);
}
function makeSet(arr) {
var set = {};
for (var i = 0; i < arr.length; i++) {
set[arr[i]] = true;
}
return set;
}
var voidElements = makeSet([
'area',
'base',
'br',
'col',
'command',
'embed',
'hr',
'img',
'input',
'keygen',
'link',
'meta',
'param',
'source',
'track',
'wbr'
]);
var plaintextParents = makeSet([
'style',
'script',
'xmp',
'iframe',
'noembed',
'noframes',
'plaintext',
'noscript'
]);
function getOuterHTML(node, parentNode, composed) {
switch (node.nodeType) {
case Node.ELEMENT_NODE:
var tagName = node.localName;
var s = '<' + tagName;
var attrs = node.attributes;
for (var i = 0, attr; attr = attrs[i]; i++) {
s += ' ' + attr.name + '="' + escapeAttr(attr.value) + '"';
}
s += '>';
if (voidElements[tagName]) {
return s;
}
return s + getInnerHTML(node, composed) + '</' + tagName + '>';
case Node.TEXT_NODE:
var data = node.data;
if (parentNode && plaintextParents[parentNode.localName]) {
return data;
}
return escapeData(data);
case Node.COMMENT_NODE:
return '<!--' + node.data + '-->';
default:
console.error(node);
throw new Error('not implemented');
}
}
function getInnerHTML(node, composed) {
if (node instanceof HTMLTemplateElement)
node = node.content;
var s = '';
var c$ = Polymer.dom(node).childNodes;
for (var i = 0, l = c$.length, child; i < l && (child = c$[i]); i++) {
s += getOuterHTML(child, node, composed);
}
return s;
}
return { getInnerHTML: getInnerHTML };
}();
(function () {
'use strict';
var nativeInsertBefore = Element.prototype.insertBefore;
var nativeAppendChild = Element.prototype.appendChild;
var nativeRemoveChild = Element.prototype.removeChild;
Polymer.TreeApi = {
arrayCopyChildNodes: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstChild; n; n = n.nextSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopyChildren: function (parent) {
var copy = [], i = 0;
for (var n = parent.firstElementChild; n; n = n.nextElementSibling) {
copy[i++] = n;
}
return copy;
},
arrayCopy: function (a$) {
var l = a$.length;
var copy = new Array(l);
for (var i = 0; i < l; i++) {
copy[i] = a$[i];
}
return copy;
}
};
Polymer.TreeApi.Logical = {
hasParentNode: function (node) {
return Boolean(node.__dom && node.__dom.parentNode);
},
hasChildNodes: function (node) {
return Boolean(node.__dom && node.__dom.childNodes !== undefined);
},
getChildNodes: function (node) {
return this.hasChildNodes(node) ? this._getChildNodes(node) : node.childNodes;
},
_getChildNodes: function (node) {
if (!node.__dom.childNodes) {
node.__dom.childNodes = [];
for (var n = node.__dom.firstChild; n; n = n.__dom.nextSibling) {
node.__dom.childNodes.push(n);
}
}
return node.__dom.childNodes;
},
getParentNode: function (node) {
return node.__dom && node.__dom.parentNode !== undefined ? node.__dom.parentNode : node.parentNode;
},
getFirstChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? node.__dom.firstChild : node.firstChild;
},
getLastChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? node.__dom.lastChild : node.lastChild;
},
getNextSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? node.__dom.nextSibling : node.nextSibling;
},
getPreviousSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? node.__dom.previousSibling : node.previousSibling;
},
getFirstElementChild: function (node) {
return node.__dom && node.__dom.firstChild !== undefined ? this._getFirstElementChild(node) : node.firstElementChild;
},
_getFirstElementChild: function (node) {
var n = node.__dom.firstChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getLastElementChild: function (node) {
return node.__dom && node.__dom.lastChild !== undefined ? this._getLastElementChild(node) : node.lastElementChild;
},
_getLastElementChild: function (node) {
var n = node.__dom.lastChild;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
getNextElementSibling: function (node) {
return node.__dom && node.__dom.nextSibling !== undefined ? this._getNextElementSibling(node) : node.nextElementSibling;
},
_getNextElementSibling: function (node) {
var n = node.__dom.nextSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.nextSibling;
}
return n;
},
getPreviousElementSibling: function (node) {
return node.__dom && node.__dom.previousSibling !== undefined ? this._getPreviousElementSibling(node) : node.previousElementSibling;
},
_getPreviousElementSibling: function (node) {
var n = node.__dom.previousSibling;
while (n && n.nodeType !== Node.ELEMENT_NODE) {
n = n.__dom.previousSibling;
}
return n;
},
saveChildNodes: function (node) {
if (!this.hasChildNodes(node)) {
node.__dom = node.__dom || {};
node.__dom.firstChild = node.firstChild;
node.__dom.lastChild = node.lastChild;
node.__dom.childNodes = [];
for (var n = node.firstChild; n; n = n.nextSibling) {
n.__dom = n.__dom || {};
n.__dom.parentNode = node;
node.__dom.childNodes.push(n);
n.__dom.nextSibling = n.nextSibling;
n.__dom.previousSibling = n.previousSibling;
}
}
},
recordInsertBefore: function (node, container, ref_node) {
container.__dom.childNodes = null;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
for (var n = node.firstChild; n; n = n.nextSibling) {
this._linkNode(n, container, ref_node);
}
} else {
this._linkNode(node, container, ref_node);
}
},
_linkNode: function (node, container, ref_node) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (ref_node) {
ref_node.__dom = ref_node.__dom || {};
}
node.__dom.previousSibling = ref_node ? ref_node.__dom.previousSibling : container.__dom.lastChild;
if (node.__dom.previousSibling) {
node.__dom.previousSibling.__dom.nextSibling = node;
}
node.__dom.nextSibling = ref_node;
if (node.__dom.nextSibling) {
node.__dom.nextSibling.__dom.previousSibling = node;
}
node.__dom.parentNode = container;
if (ref_node) {
if (ref_node === container.__dom.firstChild) {
container.__dom.firstChild = node;
}
} else {
container.__dom.lastChild = node;
if (!container.__dom.firstChild) {
container.__dom.firstChild = node;
}
}
container.__dom.childNodes = null;
},
recordRemoveChild: function (node, container) {
node.__dom = node.__dom || {};
container.__dom = container.__dom || {};
if (node === container.__dom.firstChild) {
container.__dom.firstChild = node.__dom.nextSibling;
}
if (node === container.__dom.lastChild) {
container.__dom.lastChild = node.__dom.previousSibling;
}
var p = node.__dom.previousSibling;
var n = node.__dom.nextSibling;
if (p) {
p.__dom.nextSibling = n;
}
if (n) {
n.__dom.previousSibling = p;
}
node.__dom.parentNode = node.__dom.previousSibling = node.__dom.nextSibling = undefined;
container.__dom.childNodes = null;
}
};
Polymer.TreeApi.Composed = {
getChildNodes: function (node) {
return Polymer.TreeApi.arrayCopyChildNodes(node);
},
getParentNode: function (node) {
return node.parentNode;
},
clearChildNodes: function (node) {
node.textContent = '';
},
insertBefore: function (parentNode, newChild, refChild) {
return nativeInsertBefore.call(parentNode, newChild, refChild || null);
},
appendChild: function (parentNode, newChild) {
return nativeAppendChild.call(parentNode, newChild);
},
removeChild: function (parentNode, node) {
return nativeRemoveChild.call(parentNode, node);
}
};
}());
Polymer.DomApi = function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = function (node) {
this.node = needsToWrap ? DomApi.wrap(node) : node;
};
var needsToWrap = Settings.hasShadow && !Settings.nativeShadow;
DomApi.wrap = window.wrap ? window.wrap : function (node) {
return node;
};
DomApi.prototype = {
flush: function () {
Polymer.dom.flush();
},
deepContains: function (node) {
if (this.node.contains(node)) {
return true;
}
var n = node;
var doc = node.ownerDocument;
while (n && n !== doc && n !== this.node) {
n = Polymer.dom(n).parentNode || n.host;
}
return n === this.node;
},
queryDistributedElements: function (selector) {
var c$ = this.getEffectiveChildNodes();
var list = [];
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE && DomApi.matchesSelector.call(c, selector)) {
list.push(c);
}
}
return list;
},
getEffectiveChildNodes: function () {
var list = [];
var c$ = this.childNodes;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.localName === CONTENT) {
var d$ = dom(c).getDistributedNodes();
for (var j = 0; j < d$.length; j++) {
list.push(d$[j]);
}
} else {
list.push(c);
}
}
return list;
},
observeNodes: function (callback) {
if (callback) {
if (!this.observer) {
this.observer = this.node.localName === CONTENT ? new DomApi.DistributedNodesObserver(this) : new DomApi.EffectiveNodesObserver(this);
}
return this.observer.addListener(callback);
}
},
unobserveNodes: function (handle) {
if (this.observer) {
this.observer.removeListener(handle);
}
},
notifyObserver: function () {
if (this.observer) {
this.observer.notify();
}
},
_query: function (matcher, node, halter) {
node = node || this.node;
var list = [];
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
return list;
},
_queryElements: function (elements, matcher, halter, list) {
for (var i = 0, l = elements.length, c; i < l && (c = elements[i]); i++) {
if (c.nodeType === Node.ELEMENT_NODE) {
if (this._queryElement(c, matcher, halter, list)) {
return true;
}
}
}
},
_queryElement: function (node, matcher, halter, list) {
var result = matcher(node);
if (result) {
list.push(node);
}
if (halter && halter(result)) {
return result;
}
this._queryElements(TreeApi.Logical.getChildNodes(node), matcher, halter, list);
}
};
var CONTENT = DomApi.CONTENT = 'content';
var dom = DomApi.factory = function (node) {
node = node || document;
if (!node.__domApi) {
node.__domApi = new DomApi.ctor(node);
}
return node.__domApi;
};
DomApi.hasApi = function (node) {
return Boolean(node.__domApi);
};
DomApi.ctor = DomApi;
Polymer.dom = function (obj, patch) {
if (obj instanceof Event) {
return Polymer.EventApi.factory(obj);
} else {
return DomApi.factory(obj, patch);
}
};
var p = Element.prototype;
DomApi.matchesSelector = p.matches || p.matchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector || p.webkitMatchesSelector;
return DomApi;
}();
(function () {
'use strict';
var Settings = Polymer.Settings;
var DomApi = Polymer.DomApi;
var dom = DomApi.factory;
var TreeApi = Polymer.TreeApi;
var getInnerHTML = Polymer.domInnerHTML.getInnerHTML;
var CONTENT = DomApi.CONTENT;
if (Settings.useShadow) {
return;
}
var nativeCloneNode = Element.prototype.cloneNode;
var nativeImportNode = Document.prototype.importNode;
Polymer.Base.extend(DomApi.prototype, {
_lazyDistribute: function (host) {
if (host.shadyRoot && host.shadyRoot._distributionClean) {
host.shadyRoot._distributionClean = false;
Polymer.dom.addDebouncer(host.debounce('_distribute', host._distributeContent));
}
},
appendChild: function (node) {
return this.insertBefore(node);
},
insertBefore: function (node, ref_node) {
if (ref_node && TreeApi.Logical.getParentNode(ref_node) !== this.node) {
throw Error('The ref_node to be inserted before is not a child ' + 'of this node');
}
if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
if (DomApi.hasApi(parent)) {
dom(parent).notifyObserver();
}
this._removeNode(node);
} else {
this._removeOwnerShadyRoot(node);
}
}
if (!this._addNode(node, ref_node)) {
if (ref_node) {
ref_node = ref_node.localName === CONTENT ? this._firstComposedNode(ref_node) : ref_node;
}
var container = this.node._isShadyRoot ? this.node.host : this.node;
if (ref_node) {
TreeApi.Composed.insertBefore(container, node, ref_node);
} else {
TreeApi.Composed.appendChild(container, node);
}
}
this.notifyObserver();
return node;
},
_addNode: function (node, ref_node) {
var root = this.getOwnerRoot();
if (root) {
var ipAdded = this._maybeAddInsertionPoint(node, this.node);
if (!root._invalidInsertionPoints) {
root._invalidInsertionPoints = ipAdded;
}
this._addNodeToHost(root.host, node);
}
if (TreeApi.Logical.hasChildNodes(this.node)) {
TreeApi.Logical.recordInsertBefore(node, this.node, ref_node);
}
var handled = this._maybeDistribute(node) || this.node.shadyRoot;
if (handled) {
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
while (node.firstChild) {
TreeApi.Composed.removeChild(node, node.firstChild);
}
} else {
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
return handled;
},
removeChild: function (node) {
if (TreeApi.Logical.getParentNode(node) !== this.node) {
throw Error('The node to be removed is not a child of this node: ' + node);
}
if (!this._removeNode(node)) {
var container = this.node._isShadyRoot ? this.node.host : this.node;
var parent = TreeApi.Composed.getParentNode(node);
if (container === parent) {
TreeApi.Composed.removeChild(container, node);
}
}
this.notifyObserver();
return node;
},
_removeNode: function (node) {
var logicalParent = TreeApi.Logical.hasParentNode(node) && TreeApi.Logical.getParentNode(node);
var distributed;
var root = this._ownerShadyRootForNode(node);
if (logicalParent) {
distributed = dom(node)._maybeDistributeParent();
TreeApi.Logical.recordRemoveChild(node, logicalParent);
if (root && this._removeDistributedChildren(root, node)) {
root._invalidInsertionPoints = true;
this._lazyDistribute(root.host);
}
}
this._removeOwnerShadyRoot(node);
if (root) {
this._removeNodeFromHost(root.host, node);
}
return distributed;
},
replaceChild: function (node, ref_node) {
this.insertBefore(node, ref_node);
this.removeChild(ref_node);
return node;
},
_hasCachedOwnerRoot: function (node) {
return Boolean(node._ownerShadyRoot !== undefined);
},
getOwnerRoot: function () {
return this._ownerShadyRootForNode(this.node);
},
_ownerShadyRootForNode: function (node) {
if (!node) {
return;
}
var root = node._ownerShadyRoot;
if (root === undefined) {
if (node._isShadyRoot) {
root = node;
} else {
var parent = TreeApi.Logical.getParentNode(node);
if (parent) {
root = parent._isShadyRoot ? parent : this._ownerShadyRootForNode(parent);
} else {
root = null;
}
}
if (root || document.documentElement.contains(node)) {
node._ownerShadyRoot = root;
}
}
return root;
},
_maybeDistribute: function (node) {
var fragContent = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent && dom(node).querySelector(CONTENT);
var wrappedContent = fragContent && TreeApi.Logical.getParentNode(fragContent).nodeType !== Node.DOCUMENT_FRAGMENT_NODE;
var hasContent = fragContent || node.localName === CONTENT;
if (hasContent) {
var root = this.getOwnerRoot();
if (root) {
this._lazyDistribute(root.host);
}
}
var needsDist = this._nodeNeedsDistribution(this.node);
if (needsDist) {
this._lazyDistribute(this.node);
}
return needsDist || hasContent && !wrappedContent;
},
_maybeAddInsertionPoint: function (node, parent) {
var added;
if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && !node.__noContent) {
var c$ = dom(node).querySelectorAll(CONTENT);
for (var i = 0, n, np, na; i < c$.length && (n = c$[i]); i++) {
np = TreeApi.Logical.getParentNode(n);
if (np === node) {
np = parent;
}
na = this._maybeAddInsertionPoint(n, np);
added = added || na;
}
} else if (node.localName === CONTENT) {
TreeApi.Logical.saveChildNodes(parent);
TreeApi.Logical.saveChildNodes(node);
added = true;
}
return added;
},
_updateInsertionPoints: function (host) {
var i$ = host.shadyRoot._insertionPoints = dom(host.shadyRoot).querySelectorAll(CONTENT);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(TreeApi.Logical.getParentNode(c));
}
},
_nodeNeedsDistribution: function (node) {
return node && node.shadyRoot && DomApi.hasInsertionPoint(node.shadyRoot);
},
_addNodeToHost: function (host, node) {
if (host._elementAdd) {
host._elementAdd(node);
}
},
_removeNodeFromHost: function (host, node) {
if (host._elementRemove) {
host._elementRemove(node);
}
},
_removeDistributedChildren: function (root, container) {
var hostNeedsDist;
var ip$ = root._insertionPoints;
for (var i = 0; i < ip$.length; i++) {
var content = ip$[i];
if (this._contains(container, content)) {
var dc$ = dom(content).getDistributedNodes();
for (var j = 0; j < dc$.length; j++) {
hostNeedsDist = true;
var node = dc$[j];
var parent = TreeApi.Composed.getParentNode(node);
if (parent) {
TreeApi.Composed.removeChild(parent, node);
}
}
}
}
return hostNeedsDist;
},
_contains: function (container, node) {
while (node) {
if (node == container) {
return true;
}
node = TreeApi.Logical.getParentNode(node);
}
},
_removeOwnerShadyRoot: function (node) {
if (this._hasCachedOwnerRoot(node)) {
var c$ = TreeApi.Logical.getChildNodes(node);
for (var i = 0, l = c$.length, n; i < l && (n = c$[i]); i++) {
this._removeOwnerShadyRoot(n);
}
}
node._ownerShadyRoot = undefined;
},
_firstComposedNode: function (content) {
var n$ = dom(content).getDistributedNodes();
for (var i = 0, l = n$.length, n, p$; i < l && (n = n$[i]); i++) {
p$ = dom(n).getDestinationInsertionPoints();
if (p$[p$.length - 1] === content) {
return n;
}
}
},
querySelector: function (selector) {
var result = this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node, function (n) {
return Boolean(n);
})[0];
return result || null;
},
querySelectorAll: function (selector) {
return this._query(function (n) {
return DomApi.matchesSelector.call(n, selector);
}, this.node);
},
getDestinationInsertionPoints: function () {
return this.node._destinationInsertionPoints || [];
},
getDistributedNodes: function () {
return this.node._distributedNodes || [];
},
_clear: function () {
while (this.childNodes.length) {
this.removeChild(this.childNodes[0]);
}
},
setAttribute: function (name, value) {
this.node.setAttribute(name, value);
this._maybeDistributeParent();
},
removeAttribute: function (name) {
this.node.removeAttribute(name);
this._maybeDistributeParent();
},
_maybeDistributeParent: function () {
if (this._nodeNeedsDistribution(this.parentNode)) {
this._lazyDistribute(this.parentNode);
return true;
}
},
cloneNode: function (deep) {
var n = nativeCloneNode.call(this.node, false);
if (deep) {
var c$ = this.childNodes;
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(c$[i]).cloneNode(true);
d.appendChild(nc);
}
}
return n;
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
var n = nativeImportNode.call(doc, externalNode, false);
if (deep) {
var c$ = TreeApi.Logical.getChildNodes(externalNode);
var d = dom(n);
for (var i = 0, nc; i < c$.length; i++) {
nc = dom(doc).importNode(c$[i], true);
d.appendChild(nc);
}
}
return n;
},
_getComposedInnerHTML: function () {
return getInnerHTML(this.node, true);
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var active = document.activeElement;
if (!active) {
return null;
}
var isShadyRoot = !!this.node._isShadyRoot;
if (this.node !== document) {
if (!isShadyRoot) {
return null;
}
if (this.node.host === active || !this.node.host.contains(active)) {
return null;
}
}
var activeRoot = dom(active).getOwnerRoot();
while (activeRoot && activeRoot !== this.node) {
active = activeRoot.host;
activeRoot = dom(active).getOwnerRoot();
}
if (this.node === document) {
return activeRoot ? null : active;
} else {
return activeRoot === this.node ? active : null;
}
},
configurable: true
},
childNodes: {
get: function () {
var c$ = TreeApi.Logical.getChildNodes(this.node);
return Array.isArray(c$) ? c$ : TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
if (TreeApi.Logical.hasChildNodes(this.node)) {
return Array.prototype.filter.call(this.childNodes, function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
} else {
return TreeApi.arrayCopyChildren(this.node);
}
},
configurable: true
},
parentNode: {
get: function () {
return TreeApi.Logical.getParentNode(this.node);
},
configurable: true
},
firstChild: {
get: function () {
return TreeApi.Logical.getFirstChild(this.node);
},
configurable: true
},
lastChild: {
get: function () {
return TreeApi.Logical.getLastChild(this.node);
},
configurable: true
},
nextSibling: {
get: function () {
return TreeApi.Logical.getNextSibling(this.node);
},
configurable: true
},
previousSibling: {
get: function () {
return TreeApi.Logical.getPreviousSibling(this.node);
},
configurable: true
},
firstElementChild: {
get: function () {
return TreeApi.Logical.getFirstElementChild(this.node);
},
configurable: true
},
lastElementChild: {
get: function () {
return TreeApi.Logical.getLastElementChild(this.node);
},
configurable: true
},
nextElementSibling: {
get: function () {
return TreeApi.Logical.getNextElementSibling(this.node);
},
configurable: true
},
previousElementSibling: {
get: function () {
return TreeApi.Logical.getPreviousElementSibling(this.node);
},
configurable: true
},
textContent: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return this.node.textContent;
} else {
var tc = [];
for (var i = 0, cn = this.childNodes, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(c.textContent);
}
}
return tc.join('');
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
this.node.textContent = text;
} else {
this._clear();
if (text) {
this.appendChild(document.createTextNode(text));
}
}
},
configurable: true
},
innerHTML: {
get: function () {
var nt = this.node.nodeType;
if (nt === Node.TEXT_NODE || nt === Node.COMMENT_NODE) {
return null;
} else {
return getInnerHTML(this.node);
}
},
set: function (text) {
var nt = this.node.nodeType;
if (nt !== Node.TEXT_NODE || nt !== Node.COMMENT_NODE) {
this._clear();
var d = document.createElement('div');
d.innerHTML = text;
var c$ = TreeApi.arrayCopyChildNodes(d);
for (var i = 0; i < c$.length; i++) {
this.appendChild(c$[i]);
}
}
},
configurable: true
}
});
DomApi.hasInsertionPoint = function (root) {
return Boolean(root && root._insertionPoints.length);
};
}());
(function () {
'use strict';
var Settings = Polymer.Settings;
var TreeApi = Polymer.TreeApi;
var DomApi = Polymer.DomApi;
if (!Settings.useShadow) {
return;
}
Polymer.Base.extend(DomApi.prototype, {
querySelectorAll: function (selector) {
return TreeApi.arrayCopy(this.node.querySelectorAll(selector));
},
getOwnerRoot: function () {
var n = this.node;
while (n) {
if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
return n;
}
n = n.parentNode;
}
},
importNode: function (externalNode, deep) {
var doc = this.node instanceof Document ? this.node : this.node.ownerDocument;
return doc.importNode(externalNode, deep);
},
getDestinationInsertionPoints: function () {
var n$ = this.node.getDestinationInsertionPoints && this.node.getDestinationInsertionPoints();
return n$ ? TreeApi.arrayCopy(n$) : [];
},
getDistributedNodes: function () {
var n$ = this.node.getDistributedNodes && this.node.getDistributedNodes();
return n$ ? TreeApi.arrayCopy(n$) : [];
}
});
Object.defineProperties(DomApi.prototype, {
activeElement: {
get: function () {
var node = DomApi.wrap(this.node);
var activeElement = node.activeElement;
return node.contains(activeElement) ? activeElement : null;
},
configurable: true
},
childNodes: {
get: function () {
return TreeApi.arrayCopyChildNodes(this.node);
},
configurable: true
},
children: {
get: function () {
return TreeApi.arrayCopyChildren(this.node);
},
configurable: true
},
textContent: {
get: function () {
return this.node.textContent;
},
set: function (value) {
return this.node.textContent = value;
},
configurable: true
},
innerHTML: {
get: function () {
return this.node.innerHTML;
},
set: function (value) {
return this.node.innerHTML = value;
},
configurable: true
}
});
var forwardMethods = function (m$) {
for (var i = 0; i < m$.length; i++) {
forwardMethod(m$[i]);
}
};
var forwardMethod = function (method) {
DomApi.prototype[method] = function () {
return this.node[method].apply(this.node, arguments);
};
};
forwardMethods([
'cloneNode',
'appendChild',
'insertBefore',
'removeChild',
'replaceChild',
'setAttribute',
'removeAttribute',
'querySelector'
]);
var forwardProperties = function (f$) {
for (var i = 0; i < f$.length; i++) {
forwardProperty(f$[i]);
}
};
var forwardProperty = function (name) {
Object.defineProperty(DomApi.prototype, name, {
get: function () {
return this.node[name];
},
configurable: true
});
};
forwardProperties([
'parentNode',
'firstChild',
'lastChild',
'nextSibling',
'previousSibling',
'firstElementChild',
'lastElementChild',
'nextElementSibling',
'previousElementSibling'
]);
}());
Polymer.Base.extend(Polymer.dom, {
_flushGuard: 0,
_FLUSH_MAX: 100,
_needsTakeRecords: !Polymer.Settings.useNativeCustomElements,
_debouncers: [],
_staticFlushList: [],
_finishDebouncer: null,
flush: function () {
this._flushGuard = 0;
this._prepareFlush();
while (this._debouncers.length && this._flushGuard < this._FLUSH_MAX) {
while (this._debouncers.length) {
this._debouncers.shift().complete();
}
if (this._finishDebouncer) {
this._finishDebouncer.complete();
}
this._prepareFlush();
this._flushGuard++;
}
if (this._flushGuard >= this._FLUSH_MAX) {
console.warn('Polymer.dom.flush aborted. Flush may not be complete.');
}
},
_prepareFlush: function () {
if (this._needsTakeRecords) {
CustomElements.takeRecords();
}
for (var i = 0; i < this._staticFlushList.length; i++) {
this._staticFlushList[i]();
}
},
addStaticFlush: function (fn) {
this._staticFlushList.push(fn);
},
removeStaticFlush: function (fn) {
var i = this._staticFlushList.indexOf(fn);
if (i >= 0) {
this._staticFlushList.splice(i, 1);
}
},
addDebouncer: function (debouncer) {
this._debouncers.push(debouncer);
this._finishDebouncer = Polymer.Debounce(this._finishDebouncer, this._finishFlush);
},
_finishFlush: function () {
Polymer.dom._debouncers = [];
}
});
Polymer.EventApi = function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.Event = function (event) {
this.event = event;
};
if (Settings.useShadow) {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.path[0];
},
get localTarget() {
return this.event.target;
},
get path() {
return this.event.path;
}
};
} else {
DomApi.Event.prototype = {
get rootTarget() {
return this.event.target;
},
get localTarget() {
var current = this.event.currentTarget;
var currentRoot = current && Polymer.dom(current).getOwnerRoot();
var p$ = this.path;
for (var i = 0; i < p$.length; i++) {
if (Polymer.dom(p$[i]).getOwnerRoot() === currentRoot) {
return p$[i];
}
}
},
get path() {
if (!this.event._path) {
var path = [];
var current = this.rootTarget;
while (current) {
path.push(current);
var insertionPoints = Polymer.dom(current).getDestinationInsertionPoints();
if (insertionPoints.length) {
for (var i = 0; i < insertionPoints.length - 1; i++) {
path.push(insertionPoints[i]);
}
current = insertionPoints[insertionPoints.length - 1];
} else {
current = Polymer.dom(current).parentNode || current.host;
}
}
path.push(window);
this.event._path = path;
}
return this.event._path;
}
};
}
var factory = function (event) {
if (!event.__eventApi) {
event.__eventApi = new DomApi.Event(event);
}
return event.__eventApi;
};
return { factory: factory };
}();
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var useShadow = Polymer.Settings.useShadow;
Object.defineProperty(DomApi.prototype, 'classList', {
get: function () {
if (!this._classList) {
this._classList = new DomApi.ClassList(this);
}
return this._classList;
},
configurable: true
});
DomApi.ClassList = function (host) {
this.domApi = host;
this.node = host.node;
};
DomApi.ClassList.prototype = {
add: function () {
this.node.classList.add.apply(this.node.classList, arguments);
this._distributeParent();
},
remove: function () {
this.node.classList.remove.apply(this.node.classList, arguments);
this._distributeParent();
},
toggle: function () {
this.node.classList.toggle.apply(this.node.classList, arguments);
this._distributeParent();
},
_distributeParent: function () {
if (!useShadow) {
this.domApi._maybeDistributeParent();
}
},
contains: function () {
return this.node.classList.contains.apply(this.node.classList, arguments);
}
};
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.EffectiveNodesObserver = function (domApi) {
this.domApi = domApi;
this.node = this.domApi.node;
this._listeners = [];
};
DomApi.EffectiveNodesObserver.prototype = {
addListener: function (callback) {
if (!this._isSetup) {
this._setup();
this._isSetup = true;
}
var listener = {
fn: callback,
_nodes: []
};
this._listeners.push(listener);
this._scheduleNotify();
return listener;
},
removeListener: function (handle) {
var i = this._listeners.indexOf(handle);
if (i >= 0) {
this._listeners.splice(i, 1);
handle._nodes = [];
}
if (!this._hasListeners()) {
this._cleanup();
this._isSetup = false;
}
},
_setup: function () {
this._observeContentElements(this.domApi.childNodes);
},
_cleanup: function () {
this._unobserveContentElements(this.domApi.childNodes);
},
_hasListeners: function () {
return Boolean(this._listeners.length);
},
_scheduleNotify: function () {
if (this._debouncer) {
this._debouncer.stop();
}
this._debouncer = Polymer.Debounce(this._debouncer, this._notify);
this._debouncer.context = this;
Polymer.dom.addDebouncer(this._debouncer);
},
notify: function () {
if (this._hasListeners()) {
this._scheduleNotify();
}
},
_notify: function () {
this._beforeCallListeners();
this._callListeners();
},
_beforeCallListeners: function () {
this._updateContentElements();
},
_updateContentElements: function () {
this._observeContentElements(this.domApi.childNodes);
},
_observeContentElements: function (elements) {
for (var i = 0, n; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
n.__observeNodesMap = n.__observeNodesMap || new WeakMap();
if (!n.__observeNodesMap.has(this)) {
n.__observeNodesMap.set(this, this._observeContent(n));
}
}
}
},
_observeContent: function (content) {
var self = this;
var h = Polymer.dom(content).observeNodes(function () {
self._scheduleNotify();
});
h._avoidChangeCalculation = true;
return h;
},
_unobserveContentElements: function (elements) {
for (var i = 0, n, h; i < elements.length && (n = elements[i]); i++) {
if (this._isContent(n)) {
h = n.__observeNodesMap.get(this);
if (h) {
Polymer.dom(n).unobserveNodes(h);
n.__observeNodesMap.delete(this);
}
}
}
},
_isContent: function (node) {
return node.localName === 'content';
},
_callListeners: function () {
var o$ = this._listeners;
var nodes = this._getEffectiveNodes();
for (var i = 0, o; i < o$.length && (o = o$[i]); i++) {
var info = this._generateListenerInfo(o, nodes);
if (info || o._alwaysNotify) {
this._callListener(o, info);
}
}
},
_getEffectiveNodes: function () {
return this.domApi.getEffectiveChildNodes();
},
_generateListenerInfo: function (listener, newNodes) {
if (listener._avoidChangeCalculation) {
return true;
}
var oldNodes = listener._nodes;
var info = {
target: this.node,
addedNodes: [],
removedNodes: []
};
var splices = Polymer.ArraySplice.calculateSplices(newNodes, oldNodes);
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
info.removedNodes.push(n);
}
}
for (i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (j = s.index; j < s.index + s.addedCount; j++) {
info.addedNodes.push(newNodes[j]);
}
}
listener._nodes = newNodes;
if (info.addedNodes.length || info.removedNodes.length) {
return info;
}
},
_callListener: function (listener, info) {
return listener.fn.call(this.node, info);
},
enableShadowAttributeTracking: function () {
}
};
if (Settings.useShadow) {
var baseSetup = DomApi.EffectiveNodesObserver.prototype._setup;
var baseCleanup = DomApi.EffectiveNodesObserver.prototype._cleanup;
Polymer.Base.extend(DomApi.EffectiveNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var self = this;
this._mutationHandler = function (mxns) {
if (mxns && mxns.length) {
self._scheduleNotify();
}
};
this._observer = new MutationObserver(this._mutationHandler);
this._boundFlush = function () {
self._flush();
};
Polymer.dom.addStaticFlush(this._boundFlush);
this._observer.observe(this.node, { childList: true });
}
baseSetup.call(this);
},
_cleanup: function () {
this._observer.disconnect();
this._observer = null;
this._mutationHandler = null;
Polymer.dom.removeStaticFlush(this._boundFlush);
baseCleanup.call(this);
},
_flush: function () {
if (this._observer) {
this._mutationHandler(this._observer.takeRecords());
}
},
enableShadowAttributeTracking: function () {
if (this._observer) {
this._makeContentListenersAlwaysNotify();
this._observer.disconnect();
this._observer.observe(this.node, {
childList: true,
attributes: true,
subtree: true
});
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host && Polymer.dom(host).observer) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
},
_makeContentListenersAlwaysNotify: function () {
for (var i = 0, h; i < this._listeners.length; i++) {
h = this._listeners[i];
h._alwaysNotify = h._isContentListener;
}
}
});
}
}());
(function () {
'use strict';
var DomApi = Polymer.DomApi.ctor;
var Settings = Polymer.Settings;
DomApi.DistributedNodesObserver = function (domApi) {
DomApi.EffectiveNodesObserver.call(this, domApi);
};
DomApi.DistributedNodesObserver.prototype = Object.create(DomApi.EffectiveNodesObserver.prototype);
Polymer.Base.extend(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
},
_cleanup: function () {
},
_beforeCallListeners: function () {
},
_getEffectiveNodes: function () {
return this.domApi.getDistributedNodes();
}
});
if (Settings.useShadow) {
Polymer.Base.extend(DomApi.DistributedNodesObserver.prototype, {
_setup: function () {
if (!this._observer) {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
var self = this;
this._observer = Polymer.dom(host).observeNodes(function () {
self._scheduleNotify();
});
this._observer._isContentListener = true;
if (this._hasAttrSelect()) {
Polymer.dom(host).observer.enableShadowAttributeTracking();
}
}
}
},
_hasAttrSelect: function () {
var select = this.node.getAttribute('select');
return select && select.match(/[[.]+/);
},
_cleanup: function () {
var root = this.domApi.getOwnerRoot();
var host = root && root.host;
if (host) {
Polymer.dom(host).unobserveNodes(this._observer);
}
this._observer = null;
}
});
}
}());
(function () {
var DomApi = Polymer.DomApi;
var TreeApi = Polymer.TreeApi;
Polymer.Base._addFeature({
_prepShady: function () {
this._useContent = this._useContent || Boolean(this._template);
},
_setupShady: function () {
this.shadyRoot = null;
if (!this.__domApi) {
this.__domApi = null;
}
if (!this.__dom) {
this.__dom = null;
}
if (!this._ownerShadyRoot) {
this._ownerShadyRoot = undefined;
}
},
_poolContent: function () {
if (this._useContent) {
TreeApi.Logical.saveChildNodes(this);
}
},
_setupRoot: function () {
if (this._useContent) {
this._createLocalRoot();
if (!this.dataHost) {
upgradeLogicalChildren(TreeApi.Logical.getChildNodes(this));
}
}
},
_createLocalRoot: function () {
this.shadyRoot = this.root;
this.shadyRoot._distributionClean = false;
this.shadyRoot._hasDistributed = false;
this.shadyRoot._isShadyRoot = true;
this.shadyRoot._dirtyRoots = [];
var i$ = this.shadyRoot._insertionPoints = !this._notes || this._notes._hasContent ? this.shadyRoot.querySelectorAll('content') : [];
TreeApi.Logical.saveChildNodes(this.shadyRoot);
for (var i = 0, c; i < i$.length; i++) {
c = i$[i];
TreeApi.Logical.saveChildNodes(c);
TreeApi.Logical.saveChildNodes(c.parentNode);
}
this.shadyRoot.host = this;
},
get domHost() {
var root = Polymer.dom(this).getOwnerRoot();
return root && root.host;
},
distributeContent: function (updateInsertionPoints) {
if (this.shadyRoot) {
this.shadyRoot._invalidInsertionPoints = this.shadyRoot._invalidInsertionPoints || updateInsertionPoints;
var host = getTopDistributingHost(this);
Polymer.dom(this)._lazyDistribute(host);
}
},
_distributeContent: function () {
if (this._useContent && !this.shadyRoot._distributionClean) {
if (this.shadyRoot._invalidInsertionPoints) {
Polymer.dom(this)._updateInsertionPoints(this);
this.shadyRoot._invalidInsertionPoints = false;
}
this._beginDistribute();
this._distributeDirtyRoots();
this._finishDistribute();
}
},
_beginDistribute: function () {
if (this._useContent && DomApi.hasInsertionPoint(this.shadyRoot)) {
this._resetDistribution();
this._distributePool(this.shadyRoot, this._collectPool());
}
},
_distributeDirtyRoots: function () {
var c$ = this.shadyRoot._dirtyRoots;
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
c._distributeContent();
}
this.shadyRoot._dirtyRoots = [];
},
_finishDistribute: function () {
if (this._useContent) {
this.shadyRoot._distributionClean = true;
if (DomApi.hasInsertionPoint(this.shadyRoot)) {
this._composeTree();
notifyContentObservers(this.shadyRoot);
} else {
if (!this.shadyRoot._hasDistributed) {
TreeApi.Composed.clearChildNodes(this);
this.appendChild(this.shadyRoot);
} else {
var children = this._composeNode(this);
this._updateChildNodes(this, children);
}
}
if (!this.shadyRoot._hasDistributed) {
notifyInitialDistribution(this);
}
this.shadyRoot._hasDistributed = true;
}
},
elementMatches: function (selector, node) {
node = node || this;
return DomApi.matchesSelector.call(node, selector);
},
_resetDistribution: function () {
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (child._destinationInsertionPoints) {
child._destinationInsertionPoints = undefined;
}
if (isInsertionPoint(child)) {
clearDistributedDestinationInsertionPoints(child);
}
}
var root = this.shadyRoot;
var p$ = root._insertionPoints;
for (var j = 0; j < p$.length; j++) {
p$[j]._distributedNodes = [];
}
},
_collectPool: function () {
var pool = [];
var children = TreeApi.Logical.getChildNodes(this);
for (var i = 0; i < children.length; i++) {
var child = children[i];
if (isInsertionPoint(child)) {
pool.push.apply(pool, child._distributedNodes);
} else {
pool.push(child);
}
}
return pool;
},
_distributePool: function (node, pool) {
var p$ = node._insertionPoints;
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
this._distributeInsertionPoint(p, pool);
maybeRedistributeParent(p, this);
}
},
_distributeInsertionPoint: function (content, pool) {
var anyDistributed = false;
for (var i = 0, l = pool.length, node; i < l; i++) {
node = pool[i];
if (!node) {
continue;
}
if (this._matchesContentSelect(node, content)) {
distributeNodeInto(node, content);
pool[i] = undefined;
anyDistributed = true;
}
}
if (!anyDistributed) {
var children = TreeApi.Logical.getChildNodes(content);
for (var j = 0; j < children.length; j++) {
distributeNodeInto(children[j], content);
}
}
},
_composeTree: function () {
this._updateChildNodes(this, this._composeNode(this));
var p$ = this.shadyRoot._insertionPoints;
for (var i = 0, l = p$.length, p, parent; i < l && (p = p$[i]); i++) {
parent = TreeApi.Logical.getParentNode(p);
if (!parent._useContent && parent !== this && parent !== this.shadyRoot) {
this._updateChildNodes(parent, this._composeNode(parent));
}
}
},
_composeNode: function (node) {
var children = [];
var c$ = TreeApi.Logical.getChildNodes(node.shadyRoot || node);
for (var i = 0; i < c$.length; i++) {
var child = c$[i];
if (isInsertionPoint(child)) {
var distributedNodes = child._distributedNodes;
for (var j = 0; j < distributedNodes.length; j++) {
var distributedNode = distributedNodes[j];
if (isFinalDestination(child, distributedNode)) {
children.push(distributedNode);
}
}
} else {
children.push(child);
}
}
return children;
},
_updateChildNodes: function (container, children) {
var composed = TreeApi.Composed.getChildNodes(container);
var splices = Polymer.ArraySplice.calculateSplices(children, composed);
for (var i = 0, d = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0, n; j < s.removed.length && (n = s.removed[j]); j++) {
if (TreeApi.Composed.getParentNode(n) === container) {
TreeApi.Composed.removeChild(container, n);
}
composed.splice(s.index + d, 1);
}
d -= s.addedCount;
}
for (var i = 0, s, next; i < splices.length && (s = splices[i]); i++) {
next = composed[s.index];
for (j = s.index, n; j < s.index + s.addedCount; j++) {
n = children[j];
TreeApi.Composed.insertBefore(container, n, next);
composed.splice(j, 0, n);
}
}
},
_matchesContentSelect: function (node, contentElement) {
var select = contentElement.getAttribute('select');
if (!select) {
return true;
}
select = select.trim();
if (!select) {
return true;
}
if (!(node instanceof Element)) {
return false;
}
var validSelectors = /^(:not\()?[*.#[a-zA-Z_|]/;
if (!validSelectors.test(select)) {
return false;
}
return this.elementMatches(select, node);
},
_elementAdd: function () {
},
_elementRemove: function () {
}
});
function distributeNodeInto(child, insertionPoint) {
insertionPoint._distributedNodes.push(child);
var points = child._destinationInsertionPoints;
if (!points) {
child._destinationInsertionPoints = [insertionPoint];
} else {
points.push(insertionPoint);
}
}
function clearDistributedDestinationInsertionPoints(content) {
var e$ = content._distributedNodes;
if (e$) {
for (var i = 0; i < e$.length; i++) {
var d = e$[i]._destinationInsertionPoints;
if (d) {
d.splice(d.indexOf(content) + 1, d.length);
}
}
}
}
function maybeRedistributeParent(content, host) {
var parent = TreeApi.Logical.getParentNode(content);
if (parent && parent.shadyRoot && DomApi.hasInsertionPoint(parent.shadyRoot) && parent.shadyRoot._distributionClean) {
parent.shadyRoot._distributionClean = false;
host.shadyRoot._dirtyRoots.push(parent);
}
}
function isFinalDestination(insertionPoint, node) {
var points = node._destinationInsertionPoints;
return points && points[points.length - 1] === insertionPoint;
}
function isInsertionPoint(node) {
return node.localName == 'content';
}
function getTopDistributingHost(host) {
while (host && hostNeedsRedistribution(host)) {
host = host.domHost;
}
return host;
}
function hostNeedsRedistribution(host) {
var c$ = TreeApi.Logical.getChildNodes(host);
for (var i = 0, c; i < c$.length; i++) {
c = c$[i];
if (c.localName && c.localName === 'content') {
return host.domHost;
}
}
}
function notifyContentObservers(root) {
for (var i = 0, c; i < root._insertionPoints.length; i++) {
c = root._insertionPoints[i];
if (DomApi.hasApi(c)) {
Polymer.dom(c).notifyObserver();
}
}
}
function notifyInitialDistribution(host) {
if (DomApi.hasApi(host)) {
Polymer.dom(host).notifyObserver();
}
}
var needsUpgrade = window.CustomElements && !CustomElements.useNative;
function upgradeLogicalChildren(children) {
if (needsUpgrade && children) {
for (var i = 0; i < children.length; i++) {
CustomElements.upgrade(children[i]);
}
}
}
}());
if (Polymer.Settings.useShadow) {
Polymer.Base._addFeature({
_poolContent: function () {
},
_beginDistribute: function () {
},
distributeContent: function () {
},
_distributeContent: function () {
},
_finishDistribute: function () {
},
_createLocalRoot: function () {
this.createShadowRoot();
this.shadowRoot.appendChild(this.root);
this.root = this.shadowRoot;
}
});
};
Polymer.Async = {
_currVal: 0,
_lastVal: 0,
_callbacks: [],
_twiddleContent: 0,
_twiddle: document.createTextNode(''),
run: function (callback, waitTime) {
if (waitTime > 0) {
return ~setTimeout(callback, waitTime);
} else {
this._twiddle.textContent = this._twiddleContent++;
this._callbacks.push(callback);
return this._currVal++;
}
},
cancel: function (handle) {
if (handle < 0) {
clearTimeout(~handle);
} else {
var idx = handle - this._lastVal;
if (idx >= 0) {
if (!this._callbacks[idx]) {
throw 'invalid async handle: ' + handle;
}
this._callbacks[idx] = null;
}
}
},
_atEndOfMicrotask: function () {
var len = this._callbacks.length;
for (var i = 0; i < len; i++) {
var cb = this._callbacks[i];
if (cb) {
try {
cb();
} catch (e) {
i++;
this._callbacks.splice(0, i);
this._lastVal += i;
this._twiddle.textContent = this._twiddleContent++;
throw e;
}
}
}
this._callbacks.splice(0, len);
this._lastVal += len;
}
};
new window.MutationObserver(function () {
Polymer.Async._atEndOfMicrotask();
}).observe(Polymer.Async._twiddle, { characterData: true });
Polymer.Debounce = function () {
var Async = Polymer.Async;
var Debouncer = function (context) {
this.context = context;
var self = this;
this.boundComplete = function () {
self.complete();
};
};
Debouncer.prototype = {
go: function (callback, wait) {
var h;
this.finish = function () {
Async.cancel(h);
};
h = Async.run(this.boundComplete, wait);
this.callback = callback;
},
stop: function () {
if (this.finish) {
this.finish();
this.finish = null;
}
},
complete: function () {
if (this.finish) {
this.stop();
this.callback.call(this.context);
}
}
};
function debounce(debouncer, callback, wait) {
if (debouncer) {
debouncer.stop();
} else {
debouncer = new Debouncer(this);
}
debouncer.go(callback, wait);
return debouncer;
}
return debounce;
}();
Polymer.Base._addFeature({
_setupDebouncers: function () {
this._debouncers = {};
},
debounce: function (jobName, callback, wait) {
return this._debouncers[jobName] = Polymer.Debounce.call(this, this._debouncers[jobName], callback, wait);
},
isDebouncerActive: function (jobName) {
var debouncer = this._debouncers[jobName];
return !!(debouncer && debouncer.finish);
},
flushDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.complete();
}
},
cancelDebouncer: function (jobName) {
var debouncer = this._debouncers[jobName];
if (debouncer) {
debouncer.stop();
}
}
});
Polymer.DomModule = document.createElement('dom-module');
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepBehaviors();
this._prepConstructor();
this._prepTemplate();
this._prepShady();
this._prepPropertyInfo();
},
_prepBehavior: function (b) {
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._registerHost();
if (this._template) {
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
}
this._marshalHostAttributes();
this._setupDebouncers();
this._marshalBehaviors();
this._tryReady();
},
_marshalBehavior: function (b) {
}
});
Polymer.nar = [];
Polymer.Annotations = {
parseAnnotations: function (template) {
var list = [];
var content = template._content || template.content;
this._parseNodeAnnotations(content, list, template.hasAttribute('strip-whitespace'));
return list;
},
_parseNodeAnnotations: function (node, list, stripWhiteSpace) {
return node.nodeType === Node.TEXT_NODE ? this._parseTextNodeAnnotation(node, list) : this._parseElementAnnotations(node, list, stripWhiteSpace);
},
_bindingRegex: function () {
var IDENT = '(?:' + '[a-zA-Z_$][\\w.:$\\-*]*' + ')';
var NUMBER = '(?:' + '[-+]?[0-9]*\\.?[0-9]+(?:[eE][-+]?[0-9]+)?' + ')';
var SQUOTE_STRING = '(?:' + '\'(?:[^\'\\\\]|\\\\.)*\'' + ')';
var DQUOTE_STRING = '(?:' + '"(?:[^"\\\\]|\\\\.)*"' + ')';
var STRING = '(?:' + SQUOTE_STRING + '|' + DQUOTE_STRING + ')';
var ARGUMENT = '(?:' + IDENT + '|' + NUMBER + '|' + STRING + '\\s*' + ')';
var ARGUMENTS = '(?:' + ARGUMENT + '(?:,\\s*' + ARGUMENT + ')*' + ')';
var ARGUMENT_LIST = '(?:' + '\\(\\s*' + '(?:' + ARGUMENTS + '?' + ')' + '\\)\\s*' + ')';
var BINDING = '(' + IDENT + '\\s*' + ARGUMENT_LIST + '?' + ')';
var OPEN_BRACKET = '(\\[\\[|{{)' + '\\s*';
var CLOSE_BRACKET = '(?:]]|}})';
var NEGATE = '(?:(!)\\s*)?';
var EXPRESSION = OPEN_BRACKET + NEGATE + BINDING + CLOSE_BRACKET;
return new RegExp(EXPRESSION, 'g');
}(),
_parseBindings: function (text) {
var re = this._bindingRegex;
var parts = [];
var lastIndex = 0;
var m;
while ((m = re.exec(text)) !== null) {
if (m.index > lastIndex) {
parts.push({ literal: text.slice(lastIndex, m.index) });
}
var mode = m[1][0];
var negate = Boolean(m[2]);
var value = m[3].trim();
var customEvent, notifyEvent, colon;
if (mode == '{' && (colon = value.indexOf('::')) > 0) {
notifyEvent = value.substring(colon + 2);
value = value.substring(0, colon);
customEvent = true;
}
parts.push({
compoundIndex: parts.length,
value: value,
mode: mode,
negate: negate,
event: notifyEvent,
customEvent: customEvent
});
lastIndex = re.lastIndex;
}
if (lastIndex && lastIndex < text.length) {
var literal = text.substring(lastIndex);
if (literal) {
parts.push({ literal: literal });
}
}
if (parts.length) {
return parts;
}
},
_literalFromParts: function (parts) {
var s = '';
for (var i = 0; i < parts.length; i++) {
var literal = parts[i].literal;
s += literal || '';
}
return s;
},
_parseTextNodeAnnotation: function (node, list) {
var parts = this._parseBindings(node.textContent);
if (parts) {
node.textContent = this._literalFromParts(parts) || ' ';
var annote = {
bindings: [{
kind: 'text',
name: 'textContent',
parts: parts,
isCompound: parts.length !== 1
}]
};
list.push(annote);
return annote;
}
},
_parseElementAnnotations: function (element, list, stripWhiteSpace) {
var annote = {
bindings: [],
events: []
};
if (element.localName === 'content') {
list._hasContent = true;
}
this._parseChildNodesAnnotations(element, annote, list, stripWhiteSpace);
if (element.attributes) {
this._parseNodeAttributeAnnotations(element, annote, list);
if (this.prepElement) {
this.prepElement(element);
}
}
if (annote.bindings.length || annote.events.length || annote.id) {
list.push(annote);
}
return annote;
},
_parseChildNodesAnnotations: function (root, annote, list, stripWhiteSpace) {
if (root.firstChild) {
var node = root.firstChild;
var i = 0;
while (node) {
var next = node.nextSibling;
if (node.localName === 'template' && !node.hasAttribute('preserve-content')) {
this._parseTemplate(node, i, list, annote);
}
if (node.nodeType === Node.TEXT_NODE) {
var n = next;
while (n && n.nodeType === Node.TEXT_NODE) {
node.textContent += n.textContent;
next = n.nextSibling;
root.removeChild(n);
n = next;
}
if (stripWhiteSpace && !node.textContent.trim()) {
root.removeChild(node);
i--;
}
}
if (node.parentNode) {
var childAnnotation = this._parseNodeAnnotations(node, list, stripWhiteSpace);
if (childAnnotation) {
childAnnotation.parent = annote;
childAnnotation.index = i;
}
}
node = next;
i++;
}
}
},
_parseTemplate: function (node, index, list, parent) {
var content = document.createDocumentFragment();
content._notes = this.parseAnnotations(node);
content.appendChild(node.content);
list.push({
bindings: Polymer.nar,
events: Polymer.nar,
templateContent: content,
parent: parent,
index: index
});
},
_parseNodeAttributeAnnotations: function (node, annotation) {
var attrs = Array.prototype.slice.call(node.attributes);
for (var i = attrs.length - 1, a; a = attrs[i]; i--) {
var n = a.name;
var v = a.value;
var b;
if (n.slice(0, 3) === 'on-') {
node.removeAttribute(n);
annotation.events.push({
name: n.slice(3),
value: v
});
} else if (b = this._parseNodeAttributeAnnotation(node, n, v)) {
annotation.bindings.push(b);
} else if (n === 'id') {
annotation.id = v;
}
}
},
_parseNodeAttributeAnnotation: function (node, name, value) {
var parts = this._parseBindings(value);
if (parts) {
var origName = name;
var kind = 'property';
if (name[name.length - 1] == '$') {
name = name.slice(0, -1);
kind = 'attribute';
}
var literal = this._literalFromParts(parts);
if (literal && kind == 'attribute') {
node.setAttribute(name, literal);
}
if (node.localName === 'input' && origName === 'value') {
node.setAttribute(origName, '');
}
node.removeAttribute(origName);
var propertyName = Polymer.CaseMap.dashToCamelCase(name);
if (kind === 'property') {
name = propertyName;
}
return {
kind: kind,
name: name,
propertyName: propertyName,
parts: parts,
literal: literal,
isCompound: parts.length !== 1
};
}
},
findAnnotatedNode: function (root, annote) {
var parent = annote.parent && Polymer.Annotations.findAnnotatedNode(root, annote.parent);
if (parent) {
for (var n = parent.firstChild, i = 0; n; n = n.nextSibling) {
if (annote.index === i++) {
return n;
}
}
} else {
return root;
}
}
};
(function () {
function resolveCss(cssText, ownerDocument) {
return cssText.replace(CSS_URL_RX, function (m, pre, url, post) {
return pre + '\'' + resolve(url.replace(/["']/g, ''), ownerDocument) + '\'' + post;
});
}
function resolveAttrs(element, ownerDocument) {
for (var name in URL_ATTRS) {
var a$ = URL_ATTRS[name];
for (var i = 0, l = a$.length, a, at, v; i < l && (a = a$[i]); i++) {
if (name === '*' || element.localName === name) {
at = element.attributes[a];
v = at && at.value;
if (v && v.search(BINDING_RX) < 0) {
at.value = a === 'style' ? resolveCss(v, ownerDocument) : resolve(v, ownerDocument);
}
}
}
}
}
function resolve(url, ownerDocument) {
if (url && url[0] === '#') {
return url;
}
var resolver = getUrlResolver(ownerDocument);
resolver.href = url;
return resolver.href || url;
}
var tempDoc;
var tempDocBase;
function resolveUrl(url, baseUri) {
if (!tempDoc) {
tempDoc = document.implementation.createHTMLDocument('temp');
tempDocBase = tempDoc.createElement('base');
tempDoc.head.appendChild(tempDocBase);
}
tempDocBase.href = baseUri;
return resolve(url, tempDoc);
}
function getUrlResolver(ownerDocument) {
return ownerDocument.__urlResolver || (ownerDocument.__urlResolver = ownerDocument.createElement('a'));
}
var CSS_URL_RX = /(url\()([^)]*)(\))/g;
var URL_ATTRS = {
'*': [
'href',
'src',
'style',
'url'
],
form: ['action']
};
var BINDING_RX = /\{\{|\[\[/;
Polymer.ResolveUrl = {
resolveCss: resolveCss,
resolveAttrs: resolveAttrs,
resolveUrl: resolveUrl
};
}());
Polymer.Base._addFeature({
_prepAnnotations: function () {
if (!this._template) {
this._notes = [];
} else {
var self = this;
Polymer.Annotations.prepElement = function (element) {
self._prepElement(element);
};
if (this._template._content && this._template._content._notes) {
this._notes = this._template._content._notes;
} else {
this._notes = Polymer.Annotations.parseAnnotations(this._template);
this._processAnnotations(this._notes);
}
Polymer.Annotations.prepElement = null;
}
},
_processAnnotations: function (notes) {
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
for (var j = 0; j < note.bindings.length; j++) {
var b = note.bindings[j];
for (var k = 0; k < b.parts.length; k++) {
var p = b.parts[k];
if (!p.literal) {
var signature = this._parseMethod(p.value);
if (signature) {
p.signature = signature;
} else {
p.model = this._modelForPath(p.value);
}
}
}
}
if (note.templateContent) {
this._processAnnotations(note.templateContent._notes);
var pp = note.templateContent._parentProps = this._discoverTemplateParentProps(note.templateContent._notes);
var bindings = [];
for (var prop in pp) {
bindings.push({
index: note.index,
kind: 'property',
name: '_parent_' + prop,
parts: [{
mode: '{',
model: prop,
value: prop
}]
});
}
note.bindings = note.bindings.concat(bindings);
}
}
},
_discoverTemplateParentProps: function (notes) {
var pp = {};
for (var i = 0, n; i < notes.length && (n = notes[i]); i++) {
for (var j = 0, b$ = n.bindings, b; j < b$.length && (b = b$[j]); j++) {
for (var k = 0, p$ = b.parts, p; k < p$.length && (p = p$[k]); k++) {
if (p.signature) {
var args = p.signature.args;
for (var kk = 0; kk < args.length; kk++) {
var model = args[kk].model;
if (model) {
pp[model] = true;
}
}
} else {
if (p.model) {
pp[p.model] = true;
}
}
}
}
if (n.templateContent) {
var tpp = n.templateContent._parentProps;
Polymer.Base.mixin(pp, tpp);
}
}
return pp;
},
_prepElement: function (element) {
Polymer.ResolveUrl.resolveAttrs(element, this._template.ownerDocument);
},
_findAnnotatedNode: Polymer.Annotations.findAnnotatedNode,
_marshalAnnotationReferences: function () {
if (this._template) {
this._marshalIdNodes();
this._marshalAnnotatedNodes();
this._marshalAnnotatedListeners();
}
},
_configureAnnotationReferences: function () {
var notes = this._notes;
var nodes = this._nodes;
for (var i = 0; i < notes.length; i++) {
var note = notes[i];
var node = nodes[i];
this._configureTemplateContent(note, node);
this._configureCompoundBindings(note, node);
}
},
_configureTemplateContent: function (note, node) {
if (note.templateContent) {
node._content = note.templateContent;
}
},
_configureCompoundBindings: function (note, node) {
var bindings = note.bindings;
for (var i = 0; i < bindings.length; i++) {
var binding = bindings[i];
if (binding.isCompound) {
var storage = node.__compoundStorage__ || (node.__compoundStorage__ = {});
var parts = binding.parts;
var literals = new Array(parts.length);
for (var j = 0; j < parts.length; j++) {
literals[j] = parts[j].literal;
}
var name = binding.name;
storage[name] = literals;
if (binding.literal && binding.kind == 'property') {
if (node._configValue) {
node._configValue(name, binding.literal);
} else {
node[name] = binding.literal;
}
}
}
}
},
_marshalIdNodes: function () {
this.$ = {};
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.id) {
this.$[a.id] = this._findAnnotatedNode(this.root, a);
}
}
},
_marshalAnnotatedNodes: function () {
if (this._notes && this._notes.length) {
var r = new Array(this._notes.length);
for (var i = 0; i < this._notes.length; i++) {
r[i] = this._findAnnotatedNode(this.root, this._notes[i]);
}
this._nodes = r;
}
},
_marshalAnnotatedListeners: function () {
for (var i = 0, l = this._notes.length, a; i < l && (a = this._notes[i]); i++) {
if (a.events && a.events.length) {
var node = this._findAnnotatedNode(this.root, a);
for (var j = 0, e$ = a.events, e; j < e$.length && (e = e$[j]); j++) {
this.listen(node, e.name, e.value);
}
}
}
}
});
Polymer.Base._addFeature({
listeners: {},
_listenListeners: function (listeners) {
var node, name, eventName;
for (eventName in listeners) {
if (eventName.indexOf('.') < 0) {
node = this;
name = eventName;
} else {
name = eventName.split('.');
node = this.$[name[0]];
name = name[1];
}
this.listen(node, name, listeners[eventName]);
}
},
listen: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (!handler) {
handler = this._createEventHandler(node, eventName, methodName);
}
if (handler._listening) {
return;
}
this._listen(node, eventName, handler);
handler._listening = true;
},
_boundListenerKey: function (eventName, methodName) {
return eventName + ':' + methodName;
},
_recordEventHandler: function (host, eventName, target, methodName, handler) {
var hbl = host.__boundListeners;
if (!hbl) {
hbl = host.__boundListeners = new WeakMap();
}
var bl = hbl.get(target);
if (!bl) {
bl = {};
hbl.set(target, bl);
}
var key = this._boundListenerKey(eventName, methodName);
bl[key] = handler;
},
_recallEventHandler: function (host, eventName, target, methodName) {
var hbl = host.__boundListeners;
if (!hbl) {
return;
}
var bl = hbl.get(target);
if (!bl) {
return;
}
var key = this._boundListenerKey(eventName, methodName);
return bl[key];
},
_createEventHandler: function (node, eventName, methodName) {
var host = this;
var handler = function (e) {
if (host[methodName]) {
host[methodName](e, e.detail);
} else {
host._warn(host._logf('_createEventHandler', 'listener method `' + methodName + '` not defined'));
}
};
handler._listening = false;
this._recordEventHandler(host, eventName, node, methodName, handler);
return handler;
},
unlisten: function (node, eventName, methodName) {
var handler = this._recallEventHandler(this, eventName, node, methodName);
if (handler) {
this._unlisten(node, eventName, handler);
handler._listening = false;
}
},
_listen: function (node, eventName, handler) {
node.addEventListener(eventName, handler);
},
_unlisten: function (node, eventName, handler) {
node.removeEventListener(eventName, handler);
}
});
(function () {
'use strict';
var wrap = Polymer.DomApi.wrap;
var HAS_NATIVE_TA = typeof document.head.style.touchAction === 'string';
var GESTURE_KEY = '__polymerGestures';
var HANDLED_OBJ = '__polymerGesturesHandled';
var TOUCH_ACTION = '__polymerGesturesTouchAction';
var TAP_DISTANCE = 25;
var TRACK_DISTANCE = 5;
var TRACK_LENGTH = 2;
var MOUSE_TIMEOUT = 2500;
var MOUSE_EVENTS = [
'mousedown',
'mousemove',
'mouseup',
'click'
];
var MOUSE_WHICH_TO_BUTTONS = [
0,
1,
4,
2
];
var MOUSE_HAS_BUTTONS = function () {
try {
return new MouseEvent('test', { buttons: 1 }).buttons === 1;
} catch (e) {
return false;
}
}();
var IS_TOUCH_ONLY = navigator.userAgent.match(/iP(?:[oa]d|hone)|Android/);
var mouseCanceller = function (mouseEvent) {
mouseEvent[HANDLED_OBJ] = { skip: true };
if (mouseEvent.type === 'click') {
var path = Polymer.dom(mouseEvent).path;
for (var i = 0; i < path.length; i++) {
if (path[i] === POINTERSTATE.mouse.target) {
return;
}
}
mouseEvent.preventDefault();
mouseEvent.stopPropagation();
}
};
function setupTeardownMouseCanceller(setup) {
for (var i = 0, en; i < MOUSE_EVENTS.length; i++) {
en = MOUSE_EVENTS[i];
if (setup) {
document.addEventListener(en, mouseCanceller, true);
} else {
document.removeEventListener(en, mouseCanceller, true);
}
}
}
function ignoreMouse() {
if (IS_TOUCH_ONLY) {
return;
}
if (!POINTERSTATE.mouse.mouseIgnoreJob) {
setupTeardownMouseCanceller(true);
}
var unset = function () {
setupTeardownMouseCanceller();
POINTERSTATE.mouse.target = null;
POINTERSTATE.mouse.mouseIgnoreJob = null;
};
POINTERSTATE.mouse.mouseIgnoreJob = Polymer.Debounce(POINTERSTATE.mouse.mouseIgnoreJob, unset, MOUSE_TIMEOUT);
}
function hasLeftMouseButton(ev) {
var type = ev.type;
if (MOUSE_EVENTS.indexOf(type) === -1) {
return false;
}
if (type === 'mousemove') {
var buttons = ev.buttons === undefined ? 1 : ev.buttons;
if (ev instanceof window.MouseEvent && !MOUSE_HAS_BUTTONS) {
buttons = MOUSE_WHICH_TO_BUTTONS[ev.which] || 0;
}
return Boolean(buttons & 1);
} else {
var button = ev.button === undefined ? 0 : ev.button;
return button === 0;
}
}
function isSyntheticClick(ev) {
if (ev.type === 'click') {
if (ev.detail === 0) {
return true;
}
var t = Gestures.findOriginalTarget(ev);
var bcr = t.getBoundingClientRect();
var x = ev.pageX, y = ev.pageY;
return !(x >= bcr.left && x <= bcr.right && (y >= bcr.top && y <= bcr.bottom));
}
return false;
}
var POINTERSTATE = {
mouse: {
target: null,
mouseIgnoreJob: null
},
touch: {
x: 0,
y: 0,
id: -1,
scrollDecided: false
}
};
function firstTouchAction(ev) {
var path = Polymer.dom(ev).path;
var ta = 'auto';
for (var i = 0, n; i < path.length; i++) {
n = path[i];
if (n[TOUCH_ACTION]) {
ta = n[TOUCH_ACTION];
break;
}
}
return ta;
}
function trackDocument(stateObj, movefn, upfn) {
stateObj.movefn = movefn;
stateObj.upfn = upfn;
document.addEventListener('mousemove', movefn);
document.addEventListener('mouseup', upfn);
}
function untrackDocument(stateObj) {
document.removeEventListener('mousemove', stateObj.movefn);
document.removeEventListener('mouseup', stateObj.upfn);
stateObj.movefn = null;
stateObj.upfn = null;
}
var Gestures = {
gestures: {},
recognizers: [],
deepTargetFind: function (x, y) {
var node = document.elementFromPoint(x, y);
var next = node;
while (next && next.shadowRoot) {
next = next.shadowRoot.elementFromPoint(x, y);
if (next) {
node = next;
}
}
return node;
},
findOriginalTarget: function (ev) {
if (ev.path) {
return ev.path[0];
}
return ev.target;
},
handleNative: function (ev) {
var handled;
var type = ev.type;
var node = wrap(ev.currentTarget);
var gobj = node[GESTURE_KEY];
if (!gobj) {
return;
}
var gs = gobj[type];
if (!gs) {
return;
}
if (!ev[HANDLED_OBJ]) {
ev[HANDLED_OBJ] = {};
if (type.slice(0, 5) === 'touch') {
var t = ev.changedTouches[0];
if (type === 'touchstart') {
if (ev.touches.length === 1) {
POINTERSTATE.touch.id = t.identifier;
}
}
if (POINTERSTATE.touch.id !== t.identifier) {
return;
}
if (!HAS_NATIVE_TA) {
if (type === 'touchstart' || type === 'touchmove') {
Gestures.handleTouchAction(ev);
}
}
if (type === 'touchend' && !ev.__polymerSimulatedTouch) {
POINTERSTATE.mouse.target = Polymer.dom(ev).rootTarget;
ignoreMouse(true);
}
}
}
handled = ev[HANDLED_OBJ];
if (handled.skip) {
return;
}
var recognizers = Gestures.recognizers;
for (var i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
if (r.flow && r.flow.start.indexOf(ev.type) > -1 && r.reset) {
r.reset();
}
}
}
for (i = 0, r; i < recognizers.length; i++) {
r = recognizers[i];
if (gs[r.name] && !handled[r.name]) {
handled[r.name] = true;
r[type](ev);
}
}
},
handleTouchAction: function (ev) {
var t = ev.changedTouches[0];
var type = ev.type;
if (type === 'touchstart') {
POINTERSTATE.touch.x = t.clientX;
POINTERSTATE.touch.y = t.clientY;
POINTERSTATE.touch.scrollDecided = false;
} else if (type === 'touchmove') {
if (POINTERSTATE.touch.scrollDecided) {
return;
}
POINTERSTATE.touch.scrollDecided = true;
var ta = firstTouchAction(ev);
var prevent = false;
var dx = Math.abs(POINTERSTATE.touch.x - t.clientX);
var dy = Math.abs(POINTERSTATE.touch.y - t.clientY);
if (!ev.cancelable) {
} else if (ta === 'none') {
prevent = true;
} else if (ta === 'pan-x') {
prevent = dy > dx;
} else if (ta === 'pan-y') {
prevent = dx > dy;
}
if (prevent) {
ev.preventDefault();
} else {
Gestures.prevent('track');
}
}
},
add: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (!gobj) {
node[GESTURE_KEY] = gobj = {};
}
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
if (IS_TOUCH_ONLY && MOUSE_EVENTS.indexOf(dep) > -1) {
continue;
}
gd = gobj[dep];
if (!gd) {
gobj[dep] = gd = { _count: 0 };
}
if (gd._count === 0) {
node.addEventListener(dep, this.handleNative);
}
gd[name] = (gd[name] || 0) + 1;
gd._count = (gd._count || 0) + 1;
}
node.addEventListener(evType, handler);
if (recognizer.touchAction) {
this.setTouchAction(node, recognizer.touchAction);
}
},
remove: function (node, evType, handler) {
node = wrap(node);
var recognizer = this.gestures[evType];
var deps = recognizer.deps;
var name = recognizer.name;
var gobj = node[GESTURE_KEY];
if (gobj) {
for (var i = 0, dep, gd; i < deps.length; i++) {
dep = deps[i];
gd = gobj[dep];
if (gd && gd[name]) {
gd[name] = (gd[name] || 1) - 1;
gd._count = (gd._count || 1) - 1;
if (gd._count === 0) {
node.removeEventListener(dep, this.handleNative);
}
}
}
}
node.removeEventListener(evType, handler);
},
register: function (recog) {
this.recognizers.push(recog);
for (var i = 0; i < recog.emits.length; i++) {
this.gestures[recog.emits[i]] = recog;
}
},
findRecognizerByEvent: function (evName) {
for (var i = 0, r; i < this.recognizers.length; i++) {
r = this.recognizers[i];
for (var j = 0, n; j < r.emits.length; j++) {
n = r.emits[j];
if (n === evName) {
return r;
}
}
}
return null;
},
setTouchAction: function (node, value) {
if (HAS_NATIVE_TA) {
node.style.touchAction = value;
}
node[TOUCH_ACTION] = value;
},
fire: function (target, type, detail) {
var ev = Polymer.Base.fire(type, detail, {
node: target,
bubbles: true,
cancelable: true
});
if (ev.defaultPrevented) {
var se = detail.sourceEvent;
if (se && se.preventDefault) {
se.preventDefault();
}
}
},
prevent: function (evName) {
var recognizer = this.findRecognizerByEvent(evName);
if (recognizer.info) {
recognizer.info.prevent = true;
}
}
};
Gestures.register({
name: 'downup',
deps: [
'mousedown',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: [
'down',
'up'
],
info: {
movefn: null,
upfn: null
},
reset: function () {
untrackDocument(this.info);
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
if (!hasLeftMouseButton(e)) {
self.fire('up', t, e);
untrackDocument(self.info);
}
};
var upfn = function upfn(e) {
if (hasLeftMouseButton(e)) {
self.fire('up', t, e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.fire('down', t, e);
},
touchstart: function (e) {
this.fire('down', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
touchend: function (e) {
this.fire('up', Gestures.findOriginalTarget(e), e.changedTouches[0]);
},
fire: function (type, target, event) {
Gestures.fire(target, type, {
x: event.clientX,
y: event.clientY,
sourceEvent: event,
prevent: function (e) {
return Gestures.prevent(e);
}
});
}
});
Gestures.register({
name: 'track',
touchAction: 'none',
deps: [
'mousedown',
'touchstart',
'touchmove',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'mouseup',
'touchend'
]
},
emits: ['track'],
info: {
x: 0,
y: 0,
state: 'start',
started: false,
moves: [],
addMove: function (move) {
if (this.moves.length > TRACK_LENGTH) {
this.moves.shift();
}
this.moves.push(move);
},
movefn: null,
upfn: null,
prevent: false
},
reset: function () {
this.info.state = 'start';
this.info.started = false;
this.info.moves = [];
this.info.x = 0;
this.info.y = 0;
this.info.prevent = false;
untrackDocument(this.info);
},
hasMovedEnough: function (x, y) {
if (this.info.prevent) {
return false;
}
if (this.info.started) {
return true;
}
var dx = Math.abs(this.info.x - x);
var dy = Math.abs(this.info.y - y);
return dx >= TRACK_DISTANCE || dy >= TRACK_DISTANCE;
},
mousedown: function (e) {
if (!hasLeftMouseButton(e)) {
return;
}
var t = Gestures.findOriginalTarget(e);
var self = this;
var movefn = function movefn(e) {
var x = e.clientX, y = e.clientY;
if (self.hasMovedEnough(x, y)) {
self.info.state = self.info.started ? e.type === 'mouseup' ? 'end' : 'track' : 'start';
if (self.info.state === 'start') {
Gestures.prevent('tap');
}
self.info.addMove({
x: x,
y: y
});
if (!hasLeftMouseButton(e)) {
self.info.state = 'end';
untrackDocument(self.info);
}
self.fire(t, e);
self.info.started = true;
}
};
var upfn = function upfn(e) {
if (self.info.started) {
movefn(e);
}
untrackDocument(self.info);
};
trackDocument(this.info, movefn, upfn);
this.info.x = e.clientX;
this.info.y = e.clientY;
},
touchstart: function (e) {
var ct = e.changedTouches[0];
this.info.x = ct.clientX;
this.info.y = ct.clientY;
},
touchmove: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
var x = ct.clientX, y = ct.clientY;
if (this.hasMovedEnough(x, y)) {
if (this.info.state === 'start') {
Gestures.prevent('tap');
}
this.info.addMove({
x: x,
y: y
});
this.fire(t, ct);
this.info.state = 'track';
this.info.started = true;
}
},
touchend: function (e) {
var t = Gestures.findOriginalTarget(e);
var ct = e.changedTouches[0];
if (this.info.started) {
this.info.state = 'end';
this.info.addMove({
x: ct.clientX,
y: ct.clientY
});
this.fire(t, ct);
}
},
fire: function (target, touch) {
var secondlast = this.info.moves[this.info.moves.length - 2];
var lastmove = this.info.moves[this.info.moves.length - 1];
var dx = lastmove.x - this.info.x;
var dy = lastmove.y - this.info.y;
var ddx, ddy = 0;
if (secondlast) {
ddx = lastmove.x - secondlast.x;
ddy = lastmove.y - secondlast.y;
}
return Gestures.fire(target, 'track', {
state: this.info.state,
x: touch.clientX,
y: touch.clientY,
dx: dx,
dy: dy,
ddx: ddx,
ddy: ddy,
sourceEvent: touch,
hover: function () {
return Gestures.deepTargetFind(touch.clientX, touch.clientY);
}
});
}
});
Gestures.register({
name: 'tap',
deps: [
'mousedown',
'click',
'touchstart',
'touchend'
],
flow: {
start: [
'mousedown',
'touchstart'
],
end: [
'click',
'touchend'
]
},
emits: ['tap'],
info: {
x: NaN,
y: NaN,
prevent: false
},
reset: function () {
this.info.x = NaN;
this.info.y = NaN;
this.info.prevent = false;
},
save: function (e) {
this.info.x = e.clientX;
this.info.y = e.clientY;
},
mousedown: function (e) {
if (hasLeftMouseButton(e)) {
this.save(e);
}
},
click: function (e) {
if (hasLeftMouseButton(e)) {
this.forward(e);
}
},
touchstart: function (e) {
this.save(e.changedTouches[0]);
},
touchend: function (e) {
this.forward(e.changedTouches[0]);
},
forward: function (e) {
var dx = Math.abs(e.clientX - this.info.x);
var dy = Math.abs(e.clientY - this.info.y);
var t = Gestures.findOriginalTarget(e);
if (isNaN(dx) || isNaN(dy) || dx <= TAP_DISTANCE && dy <= TAP_DISTANCE || isSyntheticClick(e)) {
if (!this.info.prevent) {
Gestures.fire(t, 'tap', {
x: e.clientX,
y: e.clientY,
sourceEvent: e
});
}
}
}
});
var DIRECTION_MAP = {
x: 'pan-x',
y: 'pan-y',
none: 'none',
all: 'auto'
};
Polymer.Base._addFeature({
_setupGestures: function () {
this.__polymerGestures = null;
},
_listen: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.add(node, eventName, handler);
} else {
node.addEventListener(eventName, handler);
}
},
_unlisten: function (node, eventName, handler) {
if (Gestures.gestures[eventName]) {
Gestures.remove(node, eventName, handler);
} else {
node.removeEventListener(eventName, handler);
}
},
setScrollDirection: function (direction, node) {
node = node || this;
Gestures.setTouchAction(node, DIRECTION_MAP[direction] || 'auto');
}
});
Polymer.Gestures = Gestures;
}());
Polymer.Base._addFeature({
$$: function (slctr) {
return Polymer.dom(this.root).querySelector(slctr);
},
toggleClass: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.classList.contains(name);
}
if (bool) {
Polymer.dom(node).classList.add(name);
} else {
Polymer.dom(node).classList.remove(name);
}
},
toggleAttribute: function (name, bool, node) {
node = node || this;
if (arguments.length == 1) {
bool = !node.hasAttribute(name);
}
if (bool) {
Polymer.dom(node).setAttribute(name, '');
} else {
Polymer.dom(node).removeAttribute(name);
}
},
classFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).classList.remove(name);
}
if (toElement) {
Polymer.dom(toElement).classList.add(name);
}
},
attributeFollows: function (name, toElement, fromElement) {
if (fromElement) {
Polymer.dom(fromElement).removeAttribute(name);
}
if (toElement) {
Polymer.dom(toElement).setAttribute(name, '');
}
},
getEffectiveChildNodes: function () {
return Polymer.dom(this).getEffectiveChildNodes();
},
getEffectiveChildren: function () {
var list = Polymer.dom(this).getEffectiveChildNodes();
return list.filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
getEffectiveTextContent: function () {
var cn = this.getEffectiveChildNodes();
var tc = [];
for (var i = 0, c; c = cn[i]; i++) {
if (c.nodeType !== Node.COMMENT_NODE) {
tc.push(Polymer.dom(c).textContent);
}
}
return tc.join('');
},
queryEffectiveChildren: function (slctr) {
var e$ = Polymer.dom(this).queryDistributedElements(slctr);
return e$ && e$[0];
},
queryAllEffectiveChildren: function (slctr) {
return Polymer.dom(this).queryDistributedElements(slctr);
},
getContentChildNodes: function (slctr) {
var content = Polymer.dom(this.root).querySelector(slctr || 'content');
return content ? Polymer.dom(content).getDistributedNodes() : [];
},
getContentChildren: function (slctr) {
return this.getContentChildNodes(slctr).filter(function (n) {
return n.nodeType === Node.ELEMENT_NODE;
});
},
fire: function (type, detail, options) {
options = options || Polymer.nob;
var node = options.node || this;
detail = detail === null || detail === undefined ? {} : detail;
var bubbles = options.bubbles === undefined ? true : options.bubbles;
var cancelable = Boolean(options.cancelable);
var useCache = options._useCache;
var event = this._getEvent(type, bubbles, cancelable, useCache);
event.detail = detail;
if (useCache) {
this.__eventCache[type] = null;
}
node.dispatchEvent(event);
if (useCache) {
this.__eventCache[type] = event;
}
return event;
},
__eventCache: {},
_getEvent: function (type, bubbles, cancelable, useCache) {
var event = useCache && this.__eventCache[type];
if (!event || (event.bubbles != bubbles || event.cancelable != cancelable)) {
event = new Event(type, {
bubbles: Boolean(bubbles),
cancelable: cancelable
});
}
return event;
},
async: function (callback, waitTime) {
var self = this;
return Polymer.Async.run(function () {
callback.call(self);
}, waitTime);
},
cancelAsync: function (handle) {
Polymer.Async.cancel(handle);
},
arrayDelete: function (path, item) {
var index;
if (Array.isArray(path)) {
index = path.indexOf(item);
if (index >= 0) {
return path.splice(index, 1);
}
} else {
var arr = this._get(path);
index = arr.indexOf(item);
if (index >= 0) {
return this.splice(path, index, 1);
}
}
},
transform: function (transform, node) {
node = node || this;
node.style.webkitTransform = transform;
node.style.transform = transform;
},
translate3d: function (x, y, z, node) {
node = node || this;
this.transform('translate3d(' + x + ',' + y + ',' + z + ')', node);
},
importHref: function (href, onload, onerror, optAsync) {
var l = document.createElement('link');
l.rel = 'import';
l.href = href;
optAsync = Boolean(optAsync);
if (optAsync) {
l.setAttribute('async', '');
}
var self = this;
if (onload) {
l.onload = function (e) {
return onload.call(self, e);
};
}
if (onerror) {
l.onerror = function (e) {
return onerror.call(self, e);
};
}
document.head.appendChild(l);
return l;
},
create: function (tag, props) {
var elt = document.createElement(tag);
if (props) {
for (var n in props) {
elt[n] = props[n];
}
}
return elt;
},
isLightDescendant: function (node) {
return this !== node && this.contains(node) && Polymer.dom(this).getOwnerRoot() === Polymer.dom(node).getOwnerRoot();
},
isLocalDescendant: function (node) {
return this.root === Polymer.dom(node).getOwnerRoot();
}
});
Polymer.Bind = {
_dataEventCache: {},
prepareModel: function (model) {
Polymer.Base.mixin(model, this._modelApi);
},
_modelApi: {
_notifyChange: function (source, event, value) {
value = value === undefined ? this[source] : value;
event = event || Polymer.CaseMap.camelToDashCase(source) + '-changed';
this.fire(event, { value: value }, {
bubbles: false,
cancelable: false,
_useCache: true
});
},
_propertySetter: function (property, value, effects, fromAbove) {
var old = this.__data__[property];
if (old !== value && (old === old || value === value)) {
this.__data__[property] = value;
if (typeof value == 'object') {
this._clearPath(property);
}
if (this._propertyChanged) {
this._propertyChanged(property, value, old);
}
if (effects) {
this._effectEffects(property, value, effects, old, fromAbove);
}
}
return old;
},
__setProperty: function (property, value, quiet, node) {
node = node || this;
var effects = node._propertyEffects && node._propertyEffects[property];
if (effects) {
node._propertySetter(property, value, effects, quiet);
} else {
node[property] = value;
}
},
_effectEffects: function (property, value, effects, old, fromAbove) {
for (var i = 0, l = effects.length, fx; i < l && (fx = effects[i]); i++) {
fx.fn.call(this, property, value, fx.effect, old, fromAbove);
}
},
_clearPath: function (path) {
for (var prop in this.__data__) {
if (prop.indexOf(path + '.') === 0) {
this.__data__[prop] = undefined;
}
}
}
},
ensurePropertyEffects: function (model, property) {
if (!model._propertyEffects) {
model._propertyEffects = {};
}
var fx = model._propertyEffects[property];
if (!fx) {
fx = model._propertyEffects[property] = [];
}
return fx;
},
addPropertyEffect: function (model, property, kind, effect) {
var fx = this.ensurePropertyEffects(model, property);
var propEffect = {
kind: kind,
effect: effect,
fn: Polymer.Bind['_' + kind + 'Effect']
};
fx.push(propEffect);
return propEffect;
},
createBindings: function (model) {
var fx$ = model._propertyEffects;
if (fx$) {
for (var n in fx$) {
var fx = fx$[n];
fx.sort(this._sortPropertyEffects);
this._createAccessors(model, n, fx);
}
}
},
_sortPropertyEffects: function () {
var EFFECT_ORDER = {
'compute': 0,
'annotation': 1,
'annotatedComputation': 2,
'reflect': 3,
'notify': 4,
'observer': 5,
'complexObserver': 6,
'function': 7
};
return function (a, b) {
return EFFECT_ORDER[a.kind] - EFFECT_ORDER[b.kind];
};
}(),
_createAccessors: function (model, property, effects) {
var defun = {
get: function () {
return this.__data__[property];
}
};
var setter = function (value) {
this._propertySetter(property, value, effects);
};
var info = model.getPropertyInfo && model.getPropertyInfo(property);
if (info && info.readOnly) {
if (!info.computed) {
model['_set' + this.upper(property)] = setter;
}
} else {
defun.set = setter;
}
Object.defineProperty(model, property, defun);
},
upper: function (name) {
return name[0].toUpperCase() + name.substring(1);
},
_addAnnotatedListener: function (model, index, property, path, event, negated) {
if (!model._bindListeners) {
model._bindListeners = [];
}
var fn = this._notedListenerFactory(property, path, this._isStructured(path), negated);
var eventName = event || Polymer.CaseMap.camelToDashCase(property) + '-changed';
model._bindListeners.push({
index: index,
property: property,
path: path,
changedFn: fn,
event: eventName
});
},
_isStructured: function (path) {
return path.indexOf('.') > 0;
},
_isEventBogus: function (e, target) {
return e.path && e.path[0] !== target;
},
_notedListenerFactory: function (property, path, isStructured, negated) {
return function (target, value, targetPath) {
if (targetPath) {
this._notifyPath(this._fixPath(path, property, targetPath), value);
} else {
value = target[property];
if (negated) {
value = !value;
}
if (!isStructured) {
this[path] = value;
} else {
if (this.__data__[path] != value) {
this.set(path, value);
}
}
}
};
},
prepareInstance: function (inst) {
inst.__data__ = Object.create(null);
},
setupBindListeners: function (inst) {
var b$ = inst._bindListeners;
for (var i = 0, l = b$.length, info; i < l && (info = b$[i]); i++) {
var node = inst._nodes[info.index];
this._addNotifyListener(node, inst, info.event, info.changedFn);
}
},
_addNotifyListener: function (element, context, event, changedFn) {
element.addEventListener(event, function (e) {
return context._notifyListener(changedFn, e);
});
}
};
Polymer.Base.extend(Polymer.Bind, {
_shouldAddListener: function (effect) {
return effect.name && effect.kind != 'attribute' && effect.kind != 'text' && !effect.isCompound && effect.parts[0].mode === '{';
},
_annotationEffect: function (source, value, effect) {
if (source != effect.value) {
value = this._get(effect.value);
this.__data__[effect.value] = value;
}
var calc = effect.negate ? !value : value;
if (!effect.customEvent || this._nodes[effect.index][effect.name] !== calc) {
return this._applyEffectValue(effect, calc);
}
},
_reflectEffect: function (source, value, effect) {
this.reflectPropertyToAttribute(source, effect.attribute, value);
},
_notifyEffect: function (source, value, effect, old, fromAbove) {
if (!fromAbove) {
this._notifyChange(source, effect.event, value);
}
},
_functionEffect: function (source, value, fn, old, fromAbove) {
fn.call(this, source, value, old, fromAbove);
},
_observerEffect: function (source, value, effect, old) {
var fn = this[effect.method];
if (fn) {
fn.call(this, value, old);
} else {
this._warn(this._logf('_observerEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_complexObserverEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
fn.apply(this, args);
}
} else if (effect.dynamicFn) {
} else {
this._warn(this._logf('_complexObserverEffect', 'observer method `' + effect.method + '` not defined'));
}
},
_computeEffect: function (source, value, effect) {
var fn = this[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(this, args);
this.__setProperty(effect.name, computedvalue);
}
} else if (effect.dynamicFn) {
} else {
this._warn(this._logf('_computeEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_annotatedComputationEffect: function (source, value, effect) {
var computedHost = this._rootDataHost || this;
var fn = computedHost[effect.method];
if (fn) {
var args = Polymer.Bind._marshalArgs(this.__data__, effect, source, value);
if (args) {
var computedvalue = fn.apply(computedHost, args);
if (effect.negate) {
computedvalue = !computedvalue;
}
this._applyEffectValue(effect, computedvalue);
}
} else if (effect.dynamicFn) {
} else {
computedHost._warn(computedHost._logf('_annotatedComputationEffect', 'compute method `' + effect.method + '` not defined'));
}
},
_marshalArgs: function (model, effect, path, value) {
var values = [];
var args = effect.args;
var bailoutEarly = args.length > 1 || effect.dynamicFn;
for (var i = 0, l = args.length; i < l; i++) {
var arg = args[i];
var name = arg.name;
var v;
if (arg.literal) {
v = arg.value;
} else if (arg.structured) {
v = Polymer.Base._get(name, model);
} else {
v = model[name];
}
if (bailoutEarly && v === undefined) {
return;
}
if (arg.wildcard) {
var baseChanged = name.indexOf(path + '.') === 0;
var matches = effect.trigger.name.indexOf(name) === 0 && !baseChanged;
values[i] = {
path: matches ? path : name,
value: matches ? value : v,
base: v
};
} else {
values[i] = v;
}
}
return values;
}
});
Polymer.Base._addFeature({
_addPropertyEffect: function (property, kind, effect) {
var prop = Polymer.Bind.addPropertyEffect(this, property, kind, effect);
prop.pathFn = this['_' + prop.kind + 'PathEffect'];
},
_prepEffects: function () {
Polymer.Bind.prepareModel(this);
this._addAnnotationEffects(this._notes);
},
_prepBindings: function () {
Polymer.Bind.createBindings(this);
},
_addPropertyEffects: function (properties) {
if (properties) {
for (var p in properties) {
var prop = properties[p];
if (prop.observer) {
this._addObserverEffect(p, prop.observer);
}
if (prop.computed) {
prop.readOnly = true;
this._addComputedEffect(p, prop.computed);
}
if (prop.notify) {
this._addPropertyEffect(p, 'notify', { event: Polymer.CaseMap.camelToDashCase(p) + '-changed' });
}
if (prop.reflectToAttribute) {
this._addPropertyEffect(p, 'reflect', { attribute: Polymer.CaseMap.camelToDashCase(p) });
}
if (prop.readOnly) {
Polymer.Bind.ensurePropertyEffects(this, p);
}
}
}
},
_addComputedEffect: function (name, expression) {
var sig = this._parseMethod(expression);
var dynamicFn = sig.dynamicFn;
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'compute', {
method: sig.method,
args: sig.args,
trigger: arg,
name: name,
dynamicFn: dynamicFn
});
}
if (dynamicFn) {
this._addPropertyEffect(sig.method, 'compute', {
method: sig.method,
args: sig.args,
trigger: null,
name: name,
dynamicFn: dynamicFn
});
}
},
_addObserverEffect: function (property, observer) {
this._addPropertyEffect(property, 'observer', {
method: observer,
property: property
});
},
_addComplexObserverEffects: function (observers) {
if (observers) {
for (var i = 0, o; i < observers.length && (o = observers[i]); i++) {
this._addComplexObserverEffect(o);
}
}
},
_addComplexObserverEffect: function (observer) {
var sig = this._parseMethod(observer);
if (!sig) {
throw new Error('Malformed observer expression \'' + observer + '\'');
}
var dynamicFn = sig.dynamicFn;
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
this._addPropertyEffect(arg.model, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: arg,
dynamicFn: dynamicFn
});
}
if (dynamicFn) {
this._addPropertyEffect(sig.method, 'complexObserver', {
method: sig.method,
args: sig.args,
trigger: null,
dynamicFn: dynamicFn
});
}
},
_addAnnotationEffects: function (notes) {
for (var i = 0, note; i < notes.length && (note = notes[i]); i++) {
var b$ = note.bindings;
for (var j = 0, binding; j < b$.length && (binding = b$[j]); j++) {
this._addAnnotationEffect(binding, i);
}
}
},
_addAnnotationEffect: function (note, index) {
if (Polymer.Bind._shouldAddListener(note)) {
Polymer.Bind._addAnnotatedListener(this, index, note.name, note.parts[0].value, note.parts[0].event, note.parts[0].negate);
}
for (var i = 0; i < note.parts.length; i++) {
var part = note.parts[i];
if (part.signature) {
this._addAnnotatedComputationEffect(note, part, index);
} else if (!part.literal) {
this._addPropertyEffect(part.model, 'annotation', {
kind: note.kind,
index: index,
name: note.name,
propertyName: note.propertyName,
value: part.value,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
event: part.event,
customEvent: part.customEvent,
negate: part.negate
});
}
}
},
_addAnnotatedComputationEffect: function (note, part, index) {
var sig = part.signature;
if (sig.static) {
this.__addAnnotatedComputationEffect('__static__', index, note, part, null);
} else {
for (var i = 0, arg; i < sig.args.length && (arg = sig.args[i]); i++) {
if (!arg.literal) {
this.__addAnnotatedComputationEffect(arg.model, index, note, part, arg);
}
}
if (sig.dynamicFn) {
this.__addAnnotatedComputationEffect(sig.method, index, note, part, null);
}
}
},
__addAnnotatedComputationEffect: function (property, index, note, part, trigger) {
this._addPropertyEffect(property, 'annotatedComputation', {
index: index,
isCompound: note.isCompound,
compoundIndex: part.compoundIndex,
kind: note.kind,
name: note.name,
negate: part.negate,
method: part.signature.method,
args: part.signature.args,
trigger: trigger,
dynamicFn: part.signature.dynamicFn
});
},
_parseMethod: function (expression) {
var m = expression.match(/([^\s]+?)\(([\s\S]*)\)/);
if (m) {
var sig = {
method: m[1],
static: true
};
if (this.getPropertyInfo(sig.method) !== Polymer.nob) {
sig.static = false;
sig.dynamicFn = true;
}
if (m[2].trim()) {
var args = m[2].replace(/\\,/g, '&comma;').split(',');
return this._parseArgs(args, sig);
} else {
sig.args = Polymer.nar;
return sig;
}
}
},
_parseArgs: function (argList, sig) {
sig.args = argList.map(function (rawArg) {
var arg = this._parseArg(rawArg);
if (!arg.literal) {
sig.static = false;
}
return arg;
}, this);
return sig;
},
_parseArg: function (rawArg) {
var arg = rawArg.trim().replace(/&comma;/g, ',').replace(/\\(.)/g, '$1');
var a = { name: arg };
var fc = arg[0];
if (fc === '-') {
fc = arg[1];
}
if (fc >= '0' && fc <= '9') {
fc = '#';
}
switch (fc) {
case '\'':
case '"':
a.value = arg.slice(1, -1);
a.literal = true;
break;
case '#':
a.value = Number(arg);
a.literal = true;
break;
}
if (!a.literal) {
a.model = this._modelForPath(arg);
a.structured = arg.indexOf('.') > 0;
if (a.structured) {
a.wildcard = arg.slice(-2) == '.*';
if (a.wildcard) {
a.name = arg.slice(0, -2);
}
}
}
return a;
},
_marshalInstanceEffects: function () {
Polymer.Bind.prepareInstance(this);
if (this._bindListeners) {
Polymer.Bind.setupBindListeners(this);
}
},
_applyEffectValue: function (info, value) {
var node = this._nodes[info.index];
var property = info.name;
if (info.isCompound) {
var storage = node.__compoundStorage__[property];
storage[info.compoundIndex] = value;
value = storage.join('');
}
if (info.kind == 'attribute') {
this.serializeValueToAttribute(value, property, node);
} else {
if (property === 'className') {
value = this._scopeElementClass(node, value);
}
if (property === 'textContent' || node.localName == 'input' && property == 'value') {
value = value == undefined ? '' : value;
}
var pinfo;
if (!node._propertyInfo || !(pinfo = node._propertyInfo[property]) || !pinfo.readOnly) {
this.__setProperty(property, value, false, node);
}
}
},
_executeStaticEffects: function () {
if (this._propertyEffects && this._propertyEffects.__static__) {
this._effectEffects('__static__', null, this._propertyEffects.__static__);
}
}
});
(function () {
var usePolyfillProto = Polymer.Settings.usePolyfillProto;
Polymer.Base._addFeature({
_setupConfigure: function (initialConfig) {
this._config = {};
this._handlers = [];
this._aboveConfig = null;
if (initialConfig) {
for (var i in initialConfig) {
if (initialConfig[i] !== undefined) {
this._config[i] = initialConfig[i];
}
}
}
},
_marshalAttributes: function () {
this._takeAttributesToModel(this._config);
},
_attributeChangedImpl: function (name) {
var model = this._clientsReadied ? this : this._config;
this._setAttributeToProperty(model, name);
},
_configValue: function (name, value) {
var info = this._propertyInfo[name];
if (!info || !info.readOnly) {
this._config[name] = value;
}
},
_beforeClientsReady: function () {
this._configure();
},
_configure: function () {
this._configureAnnotationReferences();
this._aboveConfig = this.mixin({}, this._config);
var config = {};
for (var i = 0; i < this.behaviors.length; i++) {
this._configureProperties(this.behaviors[i].properties, config);
}
this._configureProperties(this.properties, config);
this.mixin(config, this._aboveConfig);
this._config = config;
if (this._clients && this._clients.length) {
this._distributeConfig(this._config);
}
},
_configureProperties: function (properties, config) {
for (var i in properties) {
var c = properties[i];
if (!usePolyfillProto && this.hasOwnProperty(i)) {
config[i] = this[i];
delete this[i];
} else if (c.value !== undefined) {
var value = c.value;
if (typeof value == 'function') {
value = value.call(this, this._config);
}
config[i] = value;
}
}
},
_distributeConfig: function (config) {
var fx$ = this._propertyEffects;
if (fx$) {
for (var p in config) {
var fx = fx$[p];
if (fx) {
for (var i = 0, l = fx.length, x; i < l && (x = fx[i]); i++) {
if (x.kind === 'annotation' && !x.isCompound) {
var node = this._nodes[x.effect.index];
var name = x.effect.propertyName;
if (node._propertyEffects && node._propertyEffects[name]) {
var value = p === x.effect.value ? config[p] : this._get(x.effect.value, config);
if (x.effect.kind == 'attribute') {
value = node.deserialize(value, node._propertyInfo[name].type);
}
node._configValue(name, value);
}
}
}
}
}
}
},
_afterClientsReady: function () {
this._executeStaticEffects();
this._applyConfig(this._config, this._aboveConfig);
this._flushHandlers();
},
_applyConfig: function (config, aboveConfig) {
for (var n in config) {
if (this[n] === undefined) {
this.__setProperty(n, config[n], n in aboveConfig);
}
}
},
_notifyListener: function (fn, e) {
if (!Polymer.Bind._isEventBogus(e, e.target)) {
var value, path;
if (e.detail) {
value = e.detail.value;
path = e.detail.path;
}
if (!this._clientsReadied) {
this._queueHandler([
fn,
e.target,
value,
path
]);
} else {
return fn.call(this, e.target, value, path);
}
}
},
_queueHandler: function (args) {
this._handlers.push(args);
},
_flushHandlers: function () {
var h$ = this._handlers;
for (var i = 0, l = h$.length, h; i < l && (h = h$[i]); i++) {
h[0].call(this, h[1], h[2], h[3]);
}
this._handlers = [];
}
});
}());
(function () {
'use strict';
Polymer.Base._addFeature({
notifyPath: function (path, value, fromAbove) {
var info = {};
this._get(path, this, info);
if (info.path) {
this._notifyPath(info.path, value, fromAbove);
}
},
_notifyPath: function (path, value, fromAbove) {
var old = this._propertySetter(path, value);
if (old !== value && (old === old || value === value)) {
this._pathEffector(path, value);
if (!fromAbove) {
this._notifyPathUp(path, value);
}
return true;
}
},
_getPathParts: function (path) {
if (Array.isArray(path)) {
var parts = [];
for (var i = 0; i < path.length; i++) {
var args = path[i].toString().split('.');
for (var j = 0; j < args.length; j++) {
parts.push(args[j]);
}
}
return parts;
} else {
return path.toString().split('.');
}
},
set: function (path, value, root) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
var last = parts[parts.length - 1];
if (parts.length > 1) {
for (var i = 0; i < parts.length - 1; i++) {
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
if (!prop) {
return;
}
array = Array.isArray(prop) ? prop : null;
}
if (array) {
var coll = Polymer.Collection.get(array);
var old, key;
if (last[0] == '#') {
key = last;
old = coll.getItem(key);
last = array.indexOf(old);
coll.setItem(key, value);
} else if (parseInt(last, 10) == last) {
old = prop[last];
key = coll.getKey(old);
parts[i] = key;
coll.setItem(key, value);
}
}
prop[last] = value;
if (!root) {
this._notifyPath(parts.join('.'), value);
}
} else {
prop[path] = value;
}
},
get: function (path, root) {
return this._get(path, root);
},
_get: function (path, root, info) {
var prop = root || this;
var parts = this._getPathParts(path);
var array;
for (var i = 0; i < parts.length; i++) {
if (!prop) {
return;
}
var part = parts[i];
if (array && part[0] == '#') {
prop = Polymer.Collection.get(array).getItem(part);
} else {
prop = prop[part];
if (info && array && parseInt(part, 10) == part) {
parts[i] = Polymer.Collection.get(array).getKey(prop);
}
}
array = Array.isArray(prop) ? prop : null;
}
if (info) {
info.path = parts.join('.');
}
return prop;
},
_pathEffector: function (path, value) {
var model = this._modelForPath(path);
var fx$ = this._propertyEffects && this._propertyEffects[model];
if (fx$) {
for (var i = 0, fx; i < fx$.length && (fx = fx$[i]); i++) {
var fxFn = fx.pathFn;
if (fxFn) {
fxFn.call(this, path, value, fx.effect);
}
}
}
if (this._boundPaths) {
this._notifyBoundPaths(path, value);
}
},
_annotationPathEffect: function (path, value, effect) {
if (effect.value === path || effect.value.indexOf(path + '.') === 0) {
Polymer.Bind._annotationEffect.call(this, path, value, effect);
} else if (path.indexOf(effect.value + '.') === 0 && !effect.negate) {
var node = this._nodes[effect.index];
if (node && node._notifyPath) {
var p = this._fixPath(effect.name, effect.value, path);
node._notifyPath(p, value, true);
}
}
},
_complexObserverPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._complexObserverEffect.call(this, path, value, effect);
}
},
_computePathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._computeEffect.call(this, path, value, effect);
}
},
_annotatedComputationPathEffect: function (path, value, effect) {
if (this._pathMatchesEffect(path, effect)) {
Polymer.Bind._annotatedComputationEffect.call(this, path, value, effect);
}
},
_pathMatchesEffect: function (path, effect) {
var effectArg = effect.trigger.name;
return effectArg == path || effectArg.indexOf(path + '.') === 0 || effect.trigger.wildcard && path.indexOf(effectArg) === 0;
},
linkPaths: function (to, from) {
this._boundPaths = this._boundPaths || {};
if (from) {
this._boundPaths[to] = from;
} else {
this.unlinkPaths(to);
}
},
unlinkPaths: function (path) {
if (this._boundPaths) {
delete this._boundPaths[path];
}
},
_notifyBoundPaths: function (path, value) {
for (var a in this._boundPaths) {
var b = this._boundPaths[a];
if (path.indexOf(a + '.') == 0) {
this._notifyPath(this._fixPath(b, a, path), value);
} else if (path.indexOf(b + '.') == 0) {
this._notifyPath(this._fixPath(a, b, path), value);
}
}
},
_fixPath: function (property, root, path) {
return property + path.slice(root.length);
},
_notifyPathUp: function (path, value) {
var rootName = this._modelForPath(path);
var dashCaseName = Polymer.CaseMap.camelToDashCase(rootName);
var eventName = dashCaseName + this._EVENT_CHANGED;
this.fire(eventName, {
path: path,
value: value
}, {
bubbles: false,
_useCache: true
});
},
_modelForPath: function (path) {
var dot = path.indexOf('.');
return dot < 0 ? path : path.slice(0, dot);
},
_EVENT_CHANGED: '-changed',
notifySplices: function (path, splices) {
var info = {};
var array = this._get(path, this, info);
this._notifySplices(array, info.path, splices);
},
_notifySplices: function (array, path, splices) {
var change = {
keySplices: Polymer.Collection.applySplices(array, splices),
indexSplices: splices
};
if (!array.hasOwnProperty('splices')) {
Object.defineProperty(array, 'splices', {
configurable: true,
writable: true
});
}
array.splices = change;
this._notifyPath(path + '.splices', change);
this._notifyPath(path + '.length', array.length);
change.keySplices = null;
change.indexSplices = null;
},
_notifySplice: function (array, path, index, added, removed) {
this._notifySplices(array, path, [{
index: index,
addedCount: added,
removed: removed,
object: array,
type: 'splice'
}]);
},
push: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var len = array.length;
var ret = array.push.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, len, args.length, []);
}
return ret;
},
pop: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.pop.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, array.length, 0, [ret]);
}
return ret;
},
splice: function (path, start) {
var info = {};
var array = this._get(path, this, info);
if (start < 0) {
start = array.length - Math.floor(-start);
} else {
start = Math.floor(start);
}
if (!start) {
start = 0;
}
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.splice.apply(array, args);
var addedCount = Math.max(args.length - 2, 0);
if (addedCount || ret.length) {
this._notifySplice(array, info.path, start, addedCount, ret);
}
return ret;
},
shift: function (path) {
var info = {};
var array = this._get(path, this, info);
var hadLength = Boolean(array.length);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.shift.apply(array, args);
if (hadLength) {
this._notifySplice(array, info.path, 0, 0, [ret]);
}
return ret;
},
unshift: function (path) {
var info = {};
var array = this._get(path, this, info);
var args = Array.prototype.slice.call(arguments, 1);
var ret = array.unshift.apply(array, args);
if (args.length) {
this._notifySplice(array, info.path, 0, args.length, []);
}
return ret;
},
prepareModelNotifyPath: function (model) {
this.mixin(model, {
fire: Polymer.Base.fire,
_getEvent: Polymer.Base._getEvent,
__eventCache: Polymer.Base.__eventCache,
notifyPath: Polymer.Base.notifyPath,
_get: Polymer.Base._get,
_EVENT_CHANGED: Polymer.Base._EVENT_CHANGED,
_notifyPath: Polymer.Base._notifyPath,
_notifyPathUp: Polymer.Base._notifyPathUp,
_pathEffector: Polymer.Base._pathEffector,
_annotationPathEffect: Polymer.Base._annotationPathEffect,
_complexObserverPathEffect: Polymer.Base._complexObserverPathEffect,
_annotatedComputationPathEffect: Polymer.Base._annotatedComputationPathEffect,
_computePathEffect: Polymer.Base._computePathEffect,
_modelForPath: Polymer.Base._modelForPath,
_pathMatchesEffect: Polymer.Base._pathMatchesEffect,
_notifyBoundPaths: Polymer.Base._notifyBoundPaths,
_getPathParts: Polymer.Base._getPathParts
});
}
});
}());
Polymer.Base._addFeature({
resolveUrl: function (url) {
var module = Polymer.DomModule.import(this.is);
var root = '';
if (module) {
var assetPath = module.getAttribute('assetpath') || '';
root = Polymer.ResolveUrl.resolveUrl(assetPath, module.ownerDocument.baseURI);
}
return Polymer.ResolveUrl.resolveUrl(url, root);
}
});
Polymer.CssParse = function () {
return {
parse: function (text) {
text = this._clean(text);
return this._parseCss(this._lex(text), text);
},
_clean: function (cssText) {
return cssText.replace(this._rx.comments, '').replace(this._rx.port, '');
},
_lex: function (text) {
var root = {
start: 0,
end: text.length
};
var n = root;
for (var i = 0, l = text.length; i < l; i++) {
switch (text[i]) {
case this.OPEN_BRACE:
if (!n.rules) {
n.rules = [];
}
var p = n;
var previous = p.rules[p.rules.length - 1];
n = {
start: i + 1,
parent: p,
previous: previous
};
p.rules.push(n);
break;
case this.CLOSE_BRACE:
n.end = i + 1;
n = n.parent || root;
break;
}
}
return root;
},
_parseCss: function (node, text) {
var t = text.substring(node.start, node.end - 1);
node.parsedCssText = node.cssText = t.trim();
if (node.parent) {
var ss = node.previous ? node.previous.end : node.parent.start;
t = text.substring(ss, node.start - 1);
t = this._expandUnicodeEscapes(t);
t = t.replace(this._rx.multipleSpaces, ' ');
t = t.substring(t.lastIndexOf(';') + 1);
var s = node.parsedSelector = node.selector = t.trim();
node.atRule = s.indexOf(this.AT_START) === 0;
if (node.atRule) {
if (s.indexOf(this.MEDIA_START) === 0) {
node.type = this.types.MEDIA_RULE;
} else if (s.match(this._rx.keyframesRule)) {
node.type = this.types.KEYFRAMES_RULE;
node.keyframesName = node.selector.split(this._rx.multipleSpaces).pop();
}
} else {
if (s.indexOf(this.VAR_START) === 0) {
node.type = this.types.MIXIN_RULE;
} else {
node.type = this.types.STYLE_RULE;
}
}
}
var r$ = node.rules;
if (r$) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this._parseCss(r, text);
}
}
return node;
},
_expandUnicodeEscapes: function (s) {
return s.replace(/\\([0-9a-f]{1,6})\s/gi, function () {
var code = arguments[1], repeat = 6 - code.length;
while (repeat--) {
code = '0' + code;
}
return '\\' + code;
});
},
stringify: function (node, preserveProperties, text) {
text = text || '';
var cssText = '';
if (node.cssText || node.rules) {
var r$ = node.rules;
if (r$ && (preserveProperties || !this._hasMixinRules(r$))) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
cssText = this.stringify(r, preserveProperties, cssText);
}
} else {
cssText = preserveProperties ? node.cssText : this.removeCustomProps(node.cssText);
cssText = cssText.trim();
if (cssText) {
cssText = '  ' + cssText + '\n';
}
}
}
if (cssText) {
if (node.selector) {
text += node.selector + ' ' + this.OPEN_BRACE + '\n';
}
text += cssText;
if (node.selector) {
text += this.CLOSE_BRACE + '\n\n';
}
}
return text;
},
_hasMixinRules: function (rules) {
return rules[0].selector.indexOf(this.VAR_START) === 0;
},
removeCustomProps: function (cssText) {
cssText = this.removeCustomPropAssignment(cssText);
return this.removeCustomPropApply(cssText);
},
removeCustomPropAssignment: function (cssText) {
return cssText.replace(this._rx.customProp, '').replace(this._rx.mixinProp, '');
},
removeCustomPropApply: function (cssText) {
return cssText.replace(this._rx.mixinApply, '').replace(this._rx.varApply, '');
},
types: {
STYLE_RULE: 1,
KEYFRAMES_RULE: 7,
MEDIA_RULE: 4,
MIXIN_RULE: 1000
},
OPEN_BRACE: '{',
CLOSE_BRACE: '}',
_rx: {
comments: /\/\*[^*]*\*+([^\/*][^*]*\*+)*\//gim,
port: /@import[^;]*;/gim,
customProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?(?:[;\n]|$)/gim,
mixinProp: /(?:^[^;\-\s}]+)?--[^;{}]*?:[^{};]*?{[^}]*?}(?:[;\n]|$)?/gim,
mixinApply: /@apply[\s]*\([^)]*?\)[\s]*(?:[;\n]|$)?/gim,
varApply: /[^;:]*?:[^;]*?var\([^;]*\)(?:[;\n]|$)?/gim,
keyframesRule: /^@[^\s]*keyframes/,
multipleSpaces: /\s+/g
},
VAR_START: '--',
MEDIA_START: '@media',
AT_START: '@'
};
}();
Polymer.StyleUtil = function () {
return {
MODULE_STYLES_SELECTOR: 'style, link[rel=import][type~=css], template',
INCLUDE_ATTR: 'include',
toCssText: function (rules, callback, preserveProperties) {
if (typeof rules === 'string') {
rules = this.parser.parse(rules);
}
if (callback) {
this.forEachRule(rules, callback);
}
return this.parser.stringify(rules, preserveProperties);
},
forRulesInStyles: function (styles, styleRuleCallback, keyframesRuleCallback) {
if (styles) {
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
this.forEachRule(this.rulesForStyle(s), styleRuleCallback, keyframesRuleCallback);
}
}
},
rulesForStyle: function (style) {
if (!style.__cssRules && style.textContent) {
style.__cssRules = this.parser.parse(style.textContent);
}
return style.__cssRules;
},
isKeyframesSelector: function (rule) {
return rule.parent && rule.parent.type === this.ruleTypes.KEYFRAMES_RULE;
},
forEachRule: function (node, styleRuleCallback, keyframesRuleCallback) {
if (!node) {
return;
}
var skipRules = false;
if (node.type === this.ruleTypes.STYLE_RULE) {
styleRuleCallback(node);
} else if (keyframesRuleCallback && node.type === this.ruleTypes.KEYFRAMES_RULE) {
keyframesRuleCallback(node);
} else if (node.type === this.ruleTypes.MIXIN_RULE) {
skipRules = true;
}
var r$ = node.rules;
if (r$ && !skipRules) {
for (var i = 0, l = r$.length, r; i < l && (r = r$[i]); i++) {
this.forEachRule(r, styleRuleCallback, keyframesRuleCallback);
}
}
},
applyCss: function (cssText, moniker, target, afterNode) {
var style = document.createElement('style');
if (moniker) {
style.setAttribute('scope', moniker);
}
style.textContent = cssText;
target = target || document.head;
if (!afterNode) {
var n$ = target.querySelectorAll('style[scope]');
afterNode = n$[n$.length - 1];
}
target.insertBefore(style, afterNode && afterNode.nextSibling || target.firstChild);
return style;
},
cssFromModules: function (moduleIds, warnIfNotFound) {
var modules = moduleIds.trim().split(' ');
var cssText = '';
for (var i = 0; i < modules.length; i++) {
cssText += this.cssFromModule(modules[i], warnIfNotFound);
}
return cssText;
},
cssFromModule: function (moduleId, warnIfNotFound) {
var m = Polymer.DomModule.import(moduleId);
if (m && !m._cssText) {
m._cssText = this.cssFromElement(m);
}
if (!m && warnIfNotFound) {
console.warn('Could not find style data in module named', moduleId);
}
return m && m._cssText || '';
},
cssFromElement: function (element) {
var cssText = '';
var content = element.content || element;
var e$ = Polymer.TreeApi.arrayCopy(content.querySelectorAll(this.MODULE_STYLES_SELECTOR));
for (var i = 0, e; i < e$.length; i++) {
e = e$[i];
if (e.localName === 'template') {
cssText += this.cssFromElement(e);
} else {
if (e.localName === 'style') {
var include = e.getAttribute(this.INCLUDE_ATTR);
if (include) {
cssText += this.cssFromModules(include, true);
}
e = e.__appliedElement || e;
e.parentNode.removeChild(e);
cssText += this.resolveCss(e.textContent, element.ownerDocument);
} else if (e.import && e.import.body) {
cssText += this.resolveCss(e.import.body.textContent, e.import);
}
}
}
return cssText;
},
resolveCss: Polymer.ResolveUrl.resolveCss,
parser: Polymer.CssParse,
ruleTypes: Polymer.CssParse.types
};
}();
Polymer.StyleTransformer = function () {
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var api = {
dom: function (node, scope, useAttr, shouldRemoveScope) {
this._transformDom(node, scope || '', useAttr, shouldRemoveScope);
},
_transformDom: function (node, selector, useAttr, shouldRemoveScope) {
if (node.setAttribute) {
this.element(node, selector, useAttr, shouldRemoveScope);
}
var c$ = Polymer.dom(node).childNodes;
for (var i = 0; i < c$.length; i++) {
this._transformDom(c$[i], selector, useAttr, shouldRemoveScope);
}
},
element: function (element, scope, useAttr, shouldRemoveScope) {
if (useAttr) {
if (shouldRemoveScope) {
element.removeAttribute(SCOPE_NAME);
} else {
element.setAttribute(SCOPE_NAME, scope);
}
} else {
if (scope) {
if (element.classList) {
if (shouldRemoveScope) {
element.classList.remove(SCOPE_NAME);
element.classList.remove(scope);
} else {
element.classList.add(SCOPE_NAME);
element.classList.add(scope);
}
} else if (element.getAttribute) {
var c = element.getAttribute(CLASS);
if (shouldRemoveScope) {
if (c) {
element.setAttribute(CLASS, c.replace(SCOPE_NAME, '').replace(scope, ''));
}
} else {
element.setAttribute(CLASS, (c ? c + ' ' : '') + SCOPE_NAME + ' ' + scope);
}
}
}
}
},
elementStyles: function (element, callback) {
var styles = element._styles;
var cssText = '';
for (var i = 0, l = styles.length, s; i < l && (s = styles[i]); i++) {
var rules = styleUtil.rulesForStyle(s);
cssText += nativeShadow ? styleUtil.toCssText(rules, callback) : this.css(rules, element.is, element.extends, callback, element._scopeCssViaAttr) + '\n\n';
}
return cssText.trim();
},
css: function (rules, scope, ext, callback, useAttr) {
var hostScope = this._calcHostScope(scope, ext);
scope = this._calcElementScope(scope, useAttr);
var self = this;
return styleUtil.toCssText(rules, function (rule) {
if (!rule.isScoped) {
self.rule(rule, scope, hostScope);
rule.isScoped = true;
}
if (callback) {
callback(rule, scope, hostScope);
}
});
},
_calcElementScope: function (scope, useAttr) {
if (scope) {
return useAttr ? CSS_ATTR_PREFIX + scope + CSS_ATTR_SUFFIX : CSS_CLASS_PREFIX + scope;
} else {
return '';
}
},
_calcHostScope: function (scope, ext) {
return ext ? '[is=' + scope + ']' : scope;
},
rule: function (rule, scope, hostScope) {
this._transformRule(rule, this._transformComplexSelector, scope, hostScope);
},
_transformRule: function (rule, transformer, scope, hostScope) {
var p$ = rule.selector.split(COMPLEX_SELECTOR_SEP);
if (!styleUtil.isKeyframesSelector(rule)) {
for (var i = 0, l = p$.length, p; i < l && (p = p$[i]); i++) {
p$[i] = transformer.call(this, p, scope, hostScope);
}
}
rule.selector = rule.transformedSelector = p$.join(COMPLEX_SELECTOR_SEP);
},
_transformComplexSelector: function (selector, scope, hostScope) {
var stop = false;
var hostContext = false;
var self = this;
selector = selector.replace(CONTENT_START, HOST + ' $1');
selector = selector.replace(SIMPLE_SELECTOR_SEP, function (m, c, s) {
if (!stop) {
var info = self._transformCompoundSelector(s, c, scope, hostScope);
stop = stop || info.stop;
hostContext = hostContext || info.hostContext;
c = info.combinator;
s = info.value;
} else {
s = s.replace(SCOPE_JUMP, ' ');
}
return c + s;
});
if (hostContext) {
selector = selector.replace(HOST_CONTEXT_PAREN, function (m, pre, paren, post) {
return pre + paren + ' ' + hostScope + post + COMPLEX_SELECTOR_SEP + ' ' + pre + hostScope + paren + post;
});
}
return selector;
},
_transformCompoundSelector: function (selector, combinator, scope, hostScope) {
var jumpIndex = selector.search(SCOPE_JUMP);
var hostContext = false;
if (selector.indexOf(HOST_CONTEXT) >= 0) {
hostContext = true;
} else if (selector.indexOf(HOST) >= 0) {
selector = selector.replace(HOST_PAREN, function (m, host, paren) {
return hostScope + paren;
});
selector = selector.replace(HOST, hostScope);
} else if (jumpIndex !== 0) {
selector = scope ? this._transformSimpleSelector(selector, scope) : selector;
}
if (selector.indexOf(CONTENT) >= 0) {
combinator = '';
}
var stop;
if (jumpIndex >= 0) {
selector = selector.replace(SCOPE_JUMP, ' ');
stop = true;
}
return {
value: selector,
combinator: combinator,
stop: stop,
hostContext: hostContext
};
},
_transformSimpleSelector: function (selector, scope) {
var p$ = selector.split(PSEUDO_PREFIX);
p$[0] += scope;
return p$.join(PSEUDO_PREFIX);
},
documentRule: function (rule) {
rule.selector = rule.parsedSelector;
this.normalizeRootSelector(rule);
if (!nativeShadow) {
this._transformRule(rule, this._transformDocumentSelector);
}
},
normalizeRootSelector: function (rule) {
if (rule.selector === ROOT) {
rule.selector = 'body';
}
},
_transformDocumentSelector: function (selector) {
return selector.match(SCOPE_JUMP) ? this._transformComplexSelector(selector, SCOPE_DOC_SELECTOR) : this._transformSimpleSelector(selector.trim(), SCOPE_DOC_SELECTOR);
},
SCOPE_NAME: 'style-scope'
};
var SCOPE_NAME = api.SCOPE_NAME;
var SCOPE_DOC_SELECTOR = ':not([' + SCOPE_NAME + '])' + ':not(.' + SCOPE_NAME + ')';
var COMPLEX_SELECTOR_SEP = ',';
var SIMPLE_SELECTOR_SEP = /(^|[\s>+~]+)((?:\[.+?\]|[^\s>+~=\[])+)/g;
var HOST = ':host';
var ROOT = ':root';
var HOST_PAREN = /(:host)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))/g;
var HOST_CONTEXT = ':host-context';
var HOST_CONTEXT_PAREN = /(.*)(?::host-context)(?:\(((?:\([^)(]*\)|[^)(]*)+?)\))(.*)/;
var CONTENT = '::content';
var SCOPE_JUMP = /::content|::shadow|\/deep\//;
var CSS_CLASS_PREFIX = '.';
var CSS_ATTR_PREFIX = '[' + SCOPE_NAME + '~=';
var CSS_ATTR_SUFFIX = ']';
var PSEUDO_PREFIX = ':';
var CLASS = 'class';
var CONTENT_START = new RegExp('^(' + CONTENT + ')');
return api;
}();
Polymer.StyleExtends = function () {
var styleUtil = Polymer.StyleUtil;
return {
hasExtends: function (cssText) {
return Boolean(cssText.match(this.rx.EXTEND));
},
transform: function (style) {
var rules = styleUtil.rulesForStyle(style);
var self = this;
styleUtil.forEachRule(rules, function (rule) {
self._mapRuleOntoParent(rule);
if (rule.parent) {
var m;
while (m = self.rx.EXTEND.exec(rule.cssText)) {
var extend = m[1];
var extendor = self._findExtendor(extend, rule);
if (extendor) {
self._extendRule(rule, extendor);
}
}
}
rule.cssText = rule.cssText.replace(self.rx.EXTEND, '');
});
return styleUtil.toCssText(rules, function (rule) {
if (rule.selector.match(self.rx.STRIP)) {
rule.cssText = '';
}
}, true);
},
_mapRuleOntoParent: function (rule) {
if (rule.parent) {
var map = rule.parent.map || (rule.parent.map = {});
var parts = rule.selector.split(',');
for (var i = 0, p; i < parts.length; i++) {
p = parts[i];
map[p.trim()] = rule;
}
return map;
}
},
_findExtendor: function (extend, rule) {
return rule.parent && rule.parent.map && rule.parent.map[extend] || this._findExtendor(extend, rule.parent);
},
_extendRule: function (target, source) {
if (target.parent !== source.parent) {
this._cloneAndAddRuleToParent(source, target.parent);
}
target.extends = target.extends || [];
target.extends.push(source);
source.selector = source.selector.replace(this.rx.STRIP, '');
source.selector = (source.selector && source.selector + ',\n') + target.selector;
if (source.extends) {
source.extends.forEach(function (e) {
this._extendRule(target, e);
}, this);
}
},
_cloneAndAddRuleToParent: function (rule, parent) {
rule = Object.create(rule);
rule.parent = parent;
if (rule.extends) {
rule.extends = rule.extends.slice();
}
parent.rules.push(rule);
},
rx: {
EXTEND: /@extends\(([^)]*)\)\s*?;/gim,
STRIP: /%[^,]*$/
}
};
}();
(function () {
var prepElement = Polymer.Base._prepElement;
var nativeShadow = Polymer.Settings.useNativeShadow;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var styleExtends = Polymer.StyleExtends;
Polymer.Base._addFeature({
_prepElement: function (element) {
if (this._encapsulateStyle) {
styleTransformer.element(element, this.is, this._scopeCssViaAttr);
}
prepElement.call(this, element);
},
_prepStyles: function () {
if (this._encapsulateStyle === undefined) {
this._encapsulateStyle = !nativeShadow && Boolean(this._template);
}
if (this._template) {
this._styles = this._collectStyles();
var cssText = styleTransformer.elementStyles(this);
var needsStatic = this._needsStaticStyles(this._styles);
if (needsStatic || !nativeShadow) {
cssText = needsStatic ? cssText : ' ';
var style = styleUtil.applyCss(cssText, this.is, nativeShadow ? this._template.content : null);
if (!nativeShadow) {
this._scopeStyle = style;
}
}
} else {
this._styles = [];
}
},
_collectStyles: function () {
var styles = [];
var cssText = '', m$ = this.styleModules;
if (m$) {
for (var i = 0, l = m$.length, m; i < l && (m = m$[i]); i++) {
cssText += styleUtil.cssFromModule(m);
}
}
cssText += styleUtil.cssFromModule(this.is);
var p = this._template && this._template.parentNode;
if (this._template && (!p || p.id.toLowerCase() !== this.is)) {
cssText += styleUtil.cssFromElement(this._template);
}
if (cssText) {
var style = document.createElement('style');
style.textContent = cssText;
if (styleExtends.hasExtends(style.textContent)) {
cssText = styleExtends.transform(style);
}
styles.push(style);
}
return styles;
},
_elementAdd: function (node) {
if (this._encapsulateStyle) {
if (node.__styleScoped) {
node.__styleScoped = false;
} else {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr);
}
}
},
_elementRemove: function (node) {
if (this._encapsulateStyle) {
styleTransformer.dom(node, this.is, this._scopeCssViaAttr, true);
}
},
scopeSubtree: function (container, shouldObserve) {
if (nativeShadow) {
return;
}
var self = this;
var scopify = function (node) {
if (node.nodeType === Node.ELEMENT_NODE) {
var className = node.getAttribute('class');
node.setAttribute('class', self._scopeElementClass(node, className));
var n$ = node.querySelectorAll('*');
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
className = n.getAttribute('class');
n.setAttribute('class', self._scopeElementClass(n, className));
}
}
};
scopify(container);
if (shouldObserve) {
var mo = new MutationObserver(function (mxns) {
for (var i = 0, m; i < mxns.length && (m = mxns[i]); i++) {
if (m.addedNodes) {
for (var j = 0; j < m.addedNodes.length; j++) {
scopify(m.addedNodes[j]);
}
}
}
});
mo.observe(container, {
childList: true,
subtree: true
});
return mo;
}
}
});
}());
Polymer.StyleProperties = function () {
'use strict';
var nativeShadow = Polymer.Settings.useNativeShadow;
var matchesSelector = Polymer.DomApi.matchesSelector;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
return {
decorateStyles: function (styles) {
var self = this, props = {}, keyframes = [];
styleUtil.forRulesInStyles(styles, function (rule) {
self.decorateRule(rule);
self.collectPropertiesInCssText(rule.propertyInfo.cssText, props);
}, function onKeyframesRule(rule) {
keyframes.push(rule);
});
styles._keyframes = keyframes;
var names = [];
for (var i in props) {
names.push(i);
}
return names;
},
decorateRule: function (rule) {
if (rule.propertyInfo) {
return rule.propertyInfo;
}
var info = {}, properties = {};
var hasProperties = this.collectProperties(rule, properties);
if (hasProperties) {
info.properties = properties;
rule.rules = null;
}
info.cssText = this.collectCssText(rule);
rule.propertyInfo = info;
return info;
},
collectProperties: function (rule, properties) {
var info = rule.propertyInfo;
if (info) {
if (info.properties) {
Polymer.Base.mixin(properties, info.properties);
return true;
}
} else {
var m, rx = this.rx.VAR_ASSIGN;
var cssText = rule.parsedCssText;
var any;
while (m = rx.exec(cssText)) {
properties[m[1]] = (m[2] || m[3]).trim();
any = true;
}
return any;
}
},
collectCssText: function (rule) {
var cssText = rule.parsedCssText;
cssText = cssText.replace(this.rx.BRACKETED, '').replace(this.rx.VAR_ASSIGN, '');
return cssText;
},
collectPropertiesInCssText: function (cssText, props) {
var m;
while (m = this.rx.VAR_CAPTURE.exec(cssText)) {
props[m[1]] = true;
var def = m[2];
if (def && def.match(this.rx.IS_VAR)) {
props[def] = true;
}
}
},
reify: function (props) {
var names = Object.getOwnPropertyNames(props);
for (var i = 0, n; i < names.length; i++) {
n = names[i];
props[n] = this.valueForProperty(props[n], props);
}
},
valueForProperty: function (property, props) {
if (property) {
if (property.indexOf(';') >= 0) {
property = this.valueForProperties(property, props);
} else {
var self = this;
var fn = function (all, prefix, value, fallback) {
var propertyValue = self.valueForProperty(props[value], props) || (props[fallback] ? self.valueForProperty(props[fallback], props) : fallback);
return prefix + (propertyValue || '');
};
property = property.replace(this.rx.VAR_MATCH, fn);
}
}
return property && property.trim() || '';
},
valueForProperties: function (property, props) {
var parts = property.split(';');
for (var i = 0, p, m; i < parts.length; i++) {
if (p = parts[i]) {
m = p.match(this.rx.MIXIN_MATCH);
if (m) {
p = this.valueForProperty(props[m[1]], props);
} else {
var colon = p.indexOf(':');
if (colon !== -1) {
var pp = p.substring(colon);
pp = pp.trim();
pp = this.valueForProperty(pp, props) || pp;
p = p.substring(0, colon) + pp;
}
}
parts[i] = p && p.lastIndexOf(';') === p.length - 1 ? p.slice(0, -1) : p || '';
}
}
return parts.join(';');
},
applyProperties: function (rule, props) {
var output = '';
if (!rule.propertyInfo) {
this.decorateRule(rule);
}
if (rule.propertyInfo.cssText) {
output = this.valueForProperties(rule.propertyInfo.cssText, props);
}
rule.cssText = output;
},
applyKeyframeTransforms: function (rule, keyframeTransforms) {
var input = rule.cssText;
var output = rule.cssText;
if (rule.hasAnimations == null) {
rule.hasAnimations = this.rx.ANIMATION_MATCH.test(input);
}
if (rule.hasAnimations) {
var transform;
if (rule.keyframeNamesToTransform == null) {
rule.keyframeNamesToTransform = [];
for (var keyframe in keyframeTransforms) {
transform = keyframeTransforms[keyframe];
output = transform(input);
if (input !== output) {
input = output;
rule.keyframeNamesToTransform.push(keyframe);
}
}
} else {
for (var i = 0; i < rule.keyframeNamesToTransform.length; ++i) {
transform = keyframeTransforms[rule.keyframeNamesToTransform[i]];
input = transform(input);
}
output = input;
}
}
rule.cssText = output;
},
propertyDataFromStyles: function (styles, element) {
var props = {}, self = this;
var o = [], i = 0;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
if (element && rule.propertyInfo.properties && matchesSelector.call(element, rule.transformedSelector || rule.parsedSelector)) {
self.collectProperties(rule, props);
addToBitMask(i, o);
}
i++;
});
return {
properties: props,
key: o
};
},
scopePropertiesFromStyles: function (styles) {
if (!styles._scopeStyleProperties) {
styles._scopeStyleProperties = this.selectedPropertiesFromStyles(styles, this.SCOPE_SELECTORS);
}
return styles._scopeStyleProperties;
},
hostPropertiesFromStyles: function (styles) {
if (!styles._hostStyleProperties) {
styles._hostStyleProperties = this.selectedPropertiesFromStyles(styles, this.HOST_SELECTORS);
}
return styles._hostStyleProperties;
},
selectedPropertiesFromStyles: function (styles, selectors) {
var props = {}, self = this;
styleUtil.forRulesInStyles(styles, function (rule) {
if (!rule.propertyInfo) {
self.decorateRule(rule);
}
for (var i = 0; i < selectors.length; i++) {
if (rule.parsedSelector === selectors[i]) {
self.collectProperties(rule, props);
return;
}
}
});
return props;
},
transformStyles: function (element, properties, scopeSelector) {
var self = this;
var hostSelector = styleTransformer._calcHostScope(element.is, element.extends);
var rxHostSelector = element.extends ? '\\' + hostSelector.slice(0, -1) + '\\]' : hostSelector;
var hostRx = new RegExp(this.rx.HOST_PREFIX + rxHostSelector + this.rx.HOST_SUFFIX);
var keyframeTransforms = this._elementKeyframeTransforms(element, scopeSelector);
return styleTransformer.elementStyles(element, function (rule) {
self.applyProperties(rule, properties);
if (!nativeShadow && !Polymer.StyleUtil.isKeyframesSelector(rule) && rule.cssText) {
self.applyKeyframeTransforms(rule, keyframeTransforms);
self._scopeSelector(rule, hostRx, hostSelector, element._scopeCssViaAttr, scopeSelector);
}
});
},
_elementKeyframeTransforms: function (element, scopeSelector) {
var keyframesRules = element._styles._keyframes;
var keyframeTransforms = {};
if (!nativeShadow) {
for (var i = 0, keyframesRule = keyframesRules[i]; i < keyframesRules.length; keyframesRule = keyframesRules[++i]) {
this._scopeKeyframes(keyframesRule, scopeSelector);
keyframeTransforms[keyframesRule.keyframesName] = this._keyframesRuleTransformer(keyframesRule);
}
}
return keyframeTransforms;
},
_keyframesRuleTransformer: function (keyframesRule) {
return function (cssText) {
return cssText.replace(keyframesRule.keyframesNameRx, keyframesRule.transformedKeyframesName);
};
},
_scopeKeyframes: function (rule, scopeId) {
rule.keyframesNameRx = new RegExp(rule.keyframesName, 'g');
rule.transformedKeyframesName = rule.keyframesName + '-' + scopeId;
rule.transformedSelector = rule.transformedSelector || rule.selector;
rule.selector = rule.transformedSelector.replace(rule.keyframesName, rule.transformedKeyframesName);
},
_scopeSelector: function (rule, hostRx, hostSelector, viaAttr, scopeId) {
rule.transformedSelector = rule.transformedSelector || rule.selector;
var selector = rule.transformedSelector;
var scope = viaAttr ? '[' + styleTransformer.SCOPE_NAME + '~=' + scopeId + ']' : '.' + scopeId;
var parts = selector.split(',');
for (var i = 0, l = parts.length, p; i < l && (p = parts[i]); i++) {
parts[i] = p.match(hostRx) ? p.replace(hostSelector, scope) : scope + ' ' + p;
}
rule.selector = parts.join(',');
},
applyElementScopeSelector: function (element, selector, old, viaAttr) {
var c = viaAttr ? element.getAttribute(styleTransformer.SCOPE_NAME) : element.getAttribute('class') || '';
var v = old ? c.replace(old, selector) : (c ? c + ' ' : '') + this.XSCOPE_NAME + ' ' + selector;
if (c !== v) {
if (viaAttr) {
element.setAttribute(styleTransformer.SCOPE_NAME, v);
} else {
element.setAttribute('class', v);
}
}
},
applyElementStyle: function (element, properties, selector, style) {
var cssText = style ? style.textContent || '' : this.transformStyles(element, properties, selector);
var s = element._customStyle;
if (s && !nativeShadow && s !== style) {
s._useCount--;
if (s._useCount <= 0 && s.parentNode) {
s.parentNode.removeChild(s);
}
}
if (nativeShadow || (!style || !style.parentNode)) {
if (nativeShadow && element._customStyle) {
element._customStyle.textContent = cssText;
style = element._customStyle;
} else if (cssText) {
style = styleUtil.applyCss(cssText, selector, nativeShadow ? element.root : null, element._scopeStyle);
}
}
if (style) {
style._useCount = style._useCount || 0;
if (element._customStyle != style) {
style._useCount++;
}
element._customStyle = style;
}
return style;
},
mixinCustomStyle: function (props, customStyle) {
var v;
for (var i in customStyle) {
v = customStyle[i];
if (v || v === 0) {
props[i] = v;
}
}
},
rx: {
VAR_ASSIGN: /(?:^|[;\s{]\s*)(--[\w-]*?)\s*:\s*(?:([^;{]*)|{([^}]*)})(?:(?=[;\s}])|$)/gi,
MIXIN_MATCH: /(?:^|\W+)@apply[\s]*\(([^)]*)\)/i,
VAR_MATCH: /(^|\W+)var\([\s]*([^,)]*)[\s]*,?[\s]*((?:[^,()]*)|(?:[^;()]*\([^;)]*\)))[\s]*?\)/gi,
VAR_CAPTURE: /\([\s]*(--[^,\s)]*)(?:,[\s]*(--[^,\s)]*))?(?:\)|,)/gi,
ANIMATION_MATCH: /(animation\s*:)|(animation-name\s*:)/,
IS_VAR: /^--/,
BRACKETED: /\{[^}]*\}/g,
HOST_PREFIX: '(?:^|[^.#[:])',
HOST_SUFFIX: '($|[.:[\\s>+~])'
},
HOST_SELECTORS: [':host'],
SCOPE_SELECTORS: [':root'],
XSCOPE_NAME: 'x-scope'
};
function addToBitMask(n, bits) {
var o = parseInt(n / 32);
var v = 1 << n % 32;
bits[o] = (bits[o] || 0) | v;
}
}();
(function () {
Polymer.StyleCache = function () {
this.cache = {};
};
Polymer.StyleCache.prototype = {
MAX: 100,
store: function (is, data, keyValues, keyStyles) {
data.keyValues = keyValues;
data.styles = keyStyles;
var s$ = this.cache[is] = this.cache[is] || [];
s$.push(data);
if (s$.length > this.MAX) {
s$.shift();
}
},
retrieve: function (is, keyValues, keyStyles) {
var cache = this.cache[is];
if (cache) {
for (var i = cache.length - 1, data; i >= 0; i--) {
data = cache[i];
if (keyStyles === data.styles && this._objectsEqual(keyValues, data.keyValues)) {
return data;
}
}
}
},
clear: function () {
this.cache = {};
},
_objectsEqual: function (target, source) {
var t, s;
for (var i in target) {
t = target[i], s = source[i];
if (!(typeof t === 'object' && t ? this._objectsStrictlyEqual(t, s) : t === s)) {
return false;
}
}
if (Array.isArray(target)) {
return target.length === source.length;
}
return true;
},
_objectsStrictlyEqual: function (target, source) {
return this._objectsEqual(target, source) && this._objectsEqual(source, target);
}
};
}());
Polymer.StyleDefaults = function () {
var styleProperties = Polymer.StyleProperties;
var StyleCache = Polymer.StyleCache;
var api = {
_styles: [],
_properties: null,
customStyle: {},
_styleCache: new StyleCache(),
addStyle: function (style) {
this._styles.push(style);
this._properties = null;
},
get _styleProperties() {
if (!this._properties) {
styleProperties.decorateStyles(this._styles);
this._styles._scopeStyleProperties = null;
this._properties = styleProperties.scopePropertiesFromStyles(this._styles);
styleProperties.mixinCustomStyle(this._properties, this.customStyle);
styleProperties.reify(this._properties);
}
return this._properties;
},
_needsStyleProperties: function () {
},
_computeStyleProperties: function () {
return this._styleProperties;
},
updateStyles: function (properties) {
this._properties = null;
if (properties) {
Polymer.Base.mixin(this.customStyle, properties);
}
this._styleCache.clear();
for (var i = 0, s; i < this._styles.length; i++) {
s = this._styles[i];
s = s.__importElement || s;
s._apply();
}
}
};
return api;
}();
(function () {
'use strict';
var serializeValueToAttribute = Polymer.Base.serializeValueToAttribute;
var propertyUtils = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var styleTransformer = Polymer.StyleTransformer;
var styleDefaults = Polymer.StyleDefaults;
var nativeShadow = Polymer.Settings.useNativeShadow;
Polymer.Base._addFeature({
_needsStaticStyles: function (styles) {
var needsStatic;
for (var i = 0, l = styles.length, css; i < l; i++) {
css = styleUtil.parser._clean(styles[i].textContent);
needsStatic = needsStatic || Boolean(css);
if (css.match(propertyUtils.rx.MIXIN_MATCH) || css.match(propertyUtils.rx.VAR_MATCH)) {
return false;
}
}
return needsStatic;
},
_prepStyleProperties: function () {
this._ownStylePropertyNames = this._styles ? propertyUtils.decorateStyles(this._styles) : null;
},
customStyle: null,
getComputedStyleValue: function (property) {
return this._styleProperties && this._styleProperties[property] || getComputedStyle(this).getPropertyValue(property);
},
_setupStyleProperties: function () {
this.customStyle = {};
this._styleCache = null;
this._styleProperties = null;
this._scopeSelector = null;
this._ownStyleProperties = null;
this._customStyle = null;
},
_needsStyleProperties: function () {
return Boolean(this._ownStylePropertyNames && this._ownStylePropertyNames.length);
},
_beforeAttached: function () {
if (!this._scopeSelector && this._needsStyleProperties()) {
this._updateStyleProperties();
}
},
_findStyleHost: function () {
var e = this, root;
while (root = Polymer.dom(e).getOwnerRoot()) {
if (Polymer.isInstance(root.host)) {
return root.host;
}
e = root.host;
}
return styleDefaults;
},
_updateStyleProperties: function () {
var info, scope = this._findStyleHost();
if (!scope._styleCache) {
scope._styleCache = new Polymer.StyleCache();
}
var scopeData = propertyUtils.propertyDataFromStyles(scope._styles, this);
scopeData.key.customStyle = this.customStyle;
info = scope._styleCache.retrieve(this.is, scopeData.key, this._styles);
var scopeCached = Boolean(info);
if (scopeCached) {
this._styleProperties = info._styleProperties;
} else {
this._computeStyleProperties(scopeData.properties);
}
this._computeOwnStyleProperties();
if (!scopeCached) {
info = styleCache.retrieve(this.is, this._ownStyleProperties, this._styles);
}
var globalCached = Boolean(info) && !scopeCached;
var style = this._applyStyleProperties(info);
if (!scopeCached) {
style = style && nativeShadow ? style.cloneNode(true) : style;
info = {
style: style,
_scopeSelector: this._scopeSelector,
_styleProperties: this._styleProperties
};
scopeData.key.customStyle = {};
this.mixin(scopeData.key.customStyle, this.customStyle);
scope._styleCache.store(this.is, info, scopeData.key, this._styles);
if (!globalCached) {
styleCache.store(this.is, Object.create(info), this._ownStyleProperties, this._styles);
}
}
},
_computeStyleProperties: function (scopeProps) {
var scope = this._findStyleHost();
if (!scope._styleProperties) {
scope._computeStyleProperties();
}
var props = Object.create(scope._styleProperties);
this.mixin(props, propertyUtils.hostPropertiesFromStyles(this._styles));
scopeProps = scopeProps || propertyUtils.propertyDataFromStyles(scope._styles, this).properties;
this.mixin(props, scopeProps);
this.mixin(props, propertyUtils.scopePropertiesFromStyles(this._styles));
propertyUtils.mixinCustomStyle(props, this.customStyle);
propertyUtils.reify(props);
this._styleProperties = props;
},
_computeOwnStyleProperties: function () {
var props = {};
for (var i = 0, n; i < this._ownStylePropertyNames.length; i++) {
n = this._ownStylePropertyNames[i];
props[n] = this._styleProperties[n];
}
this._ownStyleProperties = props;
},
_scopeCount: 0,
_applyStyleProperties: function (info) {
var oldScopeSelector = this._scopeSelector;
this._scopeSelector = info ? info._scopeSelector : this.is + '-' + this.__proto__._scopeCount++;
var style = propertyUtils.applyElementStyle(this, this._styleProperties, this._scopeSelector, info && info.style);
if (!nativeShadow) {
propertyUtils.applyElementScopeSelector(this, this._scopeSelector, oldScopeSelector, this._scopeCssViaAttr);
}
return style;
},
serializeValueToAttribute: function (value, attribute, node) {
node = node || this;
if (attribute === 'class' && !nativeShadow) {
var host = node === this ? this.domHost || this.dataHost : this;
if (host) {
value = host._scopeElementClass(node, value);
}
}
node = this.shadyRoot && this.shadyRoot._hasDistributed ? Polymer.dom(node) : node;
serializeValueToAttribute.call(this, value, attribute, node);
},
_scopeElementClass: function (element, selector) {
if (!nativeShadow && !this._scopeCssViaAttr) {
selector = (selector ? selector + ' ' : '') + SCOPE_NAME + ' ' + this.is + (element._scopeSelector ? ' ' + XSCOPE_NAME + ' ' + element._scopeSelector : '');
}
return selector;
},
updateStyles: function (properties) {
if (this.isAttached) {
if (properties) {
this.mixin(this.customStyle, properties);
}
if (this._needsStyleProperties()) {
this._updateStyleProperties();
} else {
this._styleProperties = null;
}
if (this._styleCache) {
this._styleCache.clear();
}
this._updateRootStyles();
}
},
_updateRootStyles: function (root) {
root = root || this.root;
var c$ = Polymer.dom(root)._query(function (e) {
return e.shadyRoot || e.shadowRoot;
});
for (var i = 0, l = c$.length, c; i < l && (c = c$[i]); i++) {
if (c.updateStyles) {
c.updateStyles();
}
}
}
});
Polymer.updateStyles = function (properties) {
styleDefaults.updateStyles(properties);
Polymer.Base._updateRootStyles(document);
};
var styleCache = new Polymer.StyleCache();
Polymer.customStyleCache = styleCache;
var SCOPE_NAME = styleTransformer.SCOPE_NAME;
var XSCOPE_NAME = propertyUtils.XSCOPE_NAME;
}());
Polymer.Base._addFeature({
_registerFeatures: function () {
this._prepIs();
this._prepConstructor();
this._prepTemplate();
this._prepStyles();
this._prepStyleProperties();
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepPropertyInfo();
this._prepBindings();
this._prepShady();
},
_prepBehavior: function (b) {
this._addPropertyEffects(b.properties);
this._addComplexObserverEffects(b.observers);
this._addHostAttributes(b.hostAttributes);
},
_initFeatures: function () {
this._setupGestures();
this._setupConfigure();
this._setupStyleProperties();
this._setupDebouncers();
this._setupShady();
this._registerHost();
if (this._template) {
this._poolContent();
this._beginHosting();
this._stampTemplate();
this._endHosting();
this._marshalAnnotationReferences();
}
this._marshalInstanceEffects();
this._marshalBehaviors();
this._marshalHostAttributes();
this._marshalAttributes();
this._tryReady();
},
_marshalBehavior: function (b) {
if (b.listeners) {
this._listenListeners(b.listeners);
}
}
});
(function () {
var propertyUtils = Polymer.StyleProperties;
var styleUtil = Polymer.StyleUtil;
var cssParse = Polymer.CssParse;
var styleDefaults = Polymer.StyleDefaults;
var styleTransformer = Polymer.StyleTransformer;
Polymer({
is: 'custom-style',
extends: 'style',
_template: null,
properties: { include: String },
ready: function () {
this._tryApply();
},
attached: function () {
this._tryApply();
},
_tryApply: function () {
if (!this._appliesToDocument) {
if (this.parentNode && this.parentNode.localName !== 'dom-module') {
this._appliesToDocument = true;
var e = this.__appliedElement || this;
styleDefaults.addStyle(e);
if (e.textContent || this.include) {
this._apply(true);
} else {
var self = this;
var observer = new MutationObserver(function () {
observer.disconnect();
self._apply(true);
});
observer.observe(e, { childList: true });
}
}
}
},
_apply: function (deferProperties) {
var e = this.__appliedElement || this;
if (this.include) {
e.textContent = styleUtil.cssFromModules(this.include, true) + e.textContent;
}
if (e.textContent) {
styleUtil.forEachRule(styleUtil.rulesForStyle(e), function (rule) {
styleTransformer.documentRule(rule);
});
var self = this;
var fn = function fn() {
self._applyCustomProperties(e);
};
if (this._pendingApplyProperties) {
cancelAnimationFrame(this._pendingApplyProperties);
this._pendingApplyProperties = null;
}
if (deferProperties) {
this._pendingApplyProperties = requestAnimationFrame(fn);
} else {
fn();
}
}
},
_applyCustomProperties: function (element) {
this._computeStyleProperties();
var props = this._styleProperties;
var rules = styleUtil.rulesForStyle(element);
element.textContent = styleUtil.toCssText(rules, function (rule) {
var css = rule.cssText = rule.parsedCssText;
if (rule.propertyInfo && rule.propertyInfo.cssText) {
css = cssParse.removeCustomPropAssignment(css);
rule.cssText = propertyUtils.valueForProperties(css, props);
}
});
}
});
}());
Polymer.Templatizer = {
properties: { __hideTemplateChildren__: { observer: '_showHideChildren' } },
_instanceProps: Polymer.nob,
_parentPropPrefix: '_parent_',
templatize: function (template) {
this._templatized = template;
if (!template._content) {
template._content = template.content;
}
if (template._content._ctor) {
this.ctor = template._content._ctor;
this._prepParentProperties(this.ctor.prototype, template);
return;
}
var archetype = Object.create(Polymer.Base);
this._customPrepAnnotations(archetype, template);
this._prepParentProperties(archetype, template);
archetype._prepEffects();
this._customPrepEffects(archetype);
archetype._prepBehaviors();
archetype._prepPropertyInfo();
archetype._prepBindings();
archetype._notifyPathUp = this._notifyPathUpImpl;
archetype._scopeElementClass = this._scopeElementClassImpl;
archetype.listen = this._listenImpl;
archetype._showHideChildren = this._showHideChildrenImpl;
archetype.__setPropertyOrig = this.__setProperty;
archetype.__setProperty = this.__setPropertyImpl;
var _constructor = this._constructorImpl;
var ctor = function TemplateInstance(model, host) {
_constructor.call(this, model, host);
};
ctor.prototype = archetype;
archetype.constructor = ctor;
template._content._ctor = ctor;
this.ctor = ctor;
},
_getRootDataHost: function () {
return this.dataHost && this.dataHost._rootDataHost || this.dataHost;
},
_showHideChildrenImpl: function (hide) {
var c = this._children;
for (var i = 0; i < c.length; i++) {
var n = c[i];
if (Boolean(hide) != Boolean(n.__hideTemplateChildren__)) {
if (n.nodeType === Node.TEXT_NODE) {
if (hide) {
n.__polymerTextContent__ = n.textContent;
n.textContent = '';
} else {
n.textContent = n.__polymerTextContent__;
}
} else if (n.style) {
if (hide) {
n.__polymerDisplay__ = n.style.display;
n.style.display = 'none';
} else {
n.style.display = n.__polymerDisplay__;
}
}
}
n.__hideTemplateChildren__ = hide;
}
},
__setPropertyImpl: function (property, value, fromAbove, node) {
if (node && node.__hideTemplateChildren__ && property == 'textContent') {
property = '__polymerTextContent__';
}
this.__setPropertyOrig(property, value, fromAbove, node);
},
_debounceTemplate: function (fn) {
Polymer.dom.addDebouncer(this.debounce('_debounceTemplate', fn));
},
_flushTemplates: function () {
Polymer.dom.flush();
},
_customPrepEffects: function (archetype) {
var parentProps = archetype._parentProps;
for (var prop in parentProps) {
archetype._addPropertyEffect(prop, 'function', this._createHostPropEffector(prop));
}
for (prop in this._instanceProps) {
archetype._addPropertyEffect(prop, 'function', this._createInstancePropEffector(prop));
}
},
_customPrepAnnotations: function (archetype, template) {
archetype._template = template;
var c = template._content;
if (!c._notes) {
var rootDataHost = archetype._rootDataHost;
if (rootDataHost) {
Polymer.Annotations.prepElement = function () {
rootDataHost._prepElement();
};
}
c._notes = Polymer.Annotations.parseAnnotations(template);
Polymer.Annotations.prepElement = null;
this._processAnnotations(c._notes);
}
archetype._notes = c._notes;
archetype._parentProps = c._parentProps;
},
_prepParentProperties: function (archetype, template) {
var parentProps = this._parentProps = archetype._parentProps;
if (this._forwardParentProp && parentProps) {
var proto = archetype._parentPropProto;
var prop;
if (!proto) {
for (prop in this._instanceProps) {
delete parentProps[prop];
}
proto = archetype._parentPropProto = Object.create(null);
if (template != this) {
Polymer.Bind.prepareModel(proto);
Polymer.Base.prepareModelNotifyPath(proto);
}
for (prop in parentProps) {
var parentProp = this._parentPropPrefix + prop;
var effects = [
{
kind: 'function',
effect: this._createForwardPropEffector(prop),
fn: Polymer.Bind._functionEffect
},
{
kind: 'notify',
fn: Polymer.Bind._notifyEffect,
effect: { event: Polymer.CaseMap.camelToDashCase(parentProp) + '-changed' }
}
];
Polymer.Bind._createAccessors(proto, parentProp, effects);
}
}
var self = this;
if (template != this) {
Polymer.Bind.prepareInstance(template);
template._forwardParentProp = function (source, value) {
self._forwardParentProp(source, value);
};
}
this._extendTemplate(template, proto);
template._pathEffector = function (path, value, fromAbove) {
return self._pathEffectorImpl(path, value, fromAbove);
};
}
},
_createForwardPropEffector: function (prop) {
return function (source, value) {
this._forwardParentProp(prop, value);
};
},
_createHostPropEffector: function (prop) {
var prefix = this._parentPropPrefix;
return function (source, value) {
this.dataHost._templatized[prefix + prop] = value;
};
},
_createInstancePropEffector: function (prop) {
return function (source, value, old, fromAbove) {
if (!fromAbove) {
this.dataHost._forwardInstanceProp(this, prop, value);
}
};
},
_extendTemplate: function (template, proto) {
var n$ = Object.getOwnPropertyNames(proto);
if (proto._propertySetter) {
template._propertySetter = proto._propertySetter;
}
for (var i = 0, n; i < n$.length && (n = n$[i]); i++) {
var val = template[n];
var pd = Object.getOwnPropertyDescriptor(proto, n);
Object.defineProperty(template, n, pd);
if (val !== undefined) {
template._propertySetter(n, val);
}
}
},
_showHideChildren: function (hidden) {
},
_forwardInstancePath: function (inst, path, value) {
},
_forwardInstanceProp: function (inst, prop, value) {
},
_notifyPathUpImpl: function (path, value) {
var dataHost = this.dataHost;
var dot = path.indexOf('.');
var root = dot < 0 ? path : path.slice(0, dot);
dataHost._forwardInstancePath.call(dataHost, this, path, value);
if (root in dataHost._parentProps) {
dataHost._templatized.notifyPath(dataHost._parentPropPrefix + path, value);
}
},
_pathEffectorImpl: function (path, value, fromAbove) {
if (this._forwardParentPath) {
if (path.indexOf(this._parentPropPrefix) === 0) {
var subPath = path.substring(this._parentPropPrefix.length);
var model = this._modelForPath(subPath);
if (model in this._parentProps) {
this._forwardParentPath(subPath, value);
}
}
}
Polymer.Base._pathEffector.call(this._templatized, path, value, fromAbove);
},
_constructorImpl: function (model, host) {
this._rootDataHost = host._getRootDataHost();
this._setupConfigure(model);
this._registerHost(host);
this._beginHosting();
this.root = this.instanceTemplate(this._template);
this.root.__noContent = !this._notes._hasContent;
this.root.__styleScoped = true;
this._endHosting();
this._marshalAnnotatedNodes();
this._marshalInstanceEffects();
this._marshalAnnotatedListeners();
var children = [];
for (var n = this.root.firstChild; n; n = n.nextSibling) {
children.push(n);
n._templateInstance = this;
}
this._children = children;
if (host.__hideTemplateChildren__) {
this._showHideChildren(true);
}
this._tryReady();
},
_listenImpl: function (node, eventName, methodName) {
var model = this;
var host = this._rootDataHost;
var handler = host._createEventHandler(node, eventName, methodName);
var decorated = function (e) {
e.model = model;
handler(e);
};
host._listen(node, eventName, decorated);
},
_scopeElementClassImpl: function (node, value) {
var host = this._rootDataHost;
if (host) {
return host._scopeElementClass(node, value);
}
},
stamp: function (model) {
model = model || {};
if (this._parentProps) {
var templatized = this._templatized;
for (var prop in this._parentProps) {
if (model[prop] === undefined) {
model[prop] = templatized[this._parentPropPrefix + prop];
}
}
}
return new this.ctor(model, this);
},
modelForElement: function (el) {
var model;
while (el) {
if (model = el._templateInstance) {
if (model.dataHost != this) {
el = model.dataHost;
} else {
return model;
}
} else {
el = el.parentNode;
}
}
}
};
Polymer({
is: 'dom-template',
extends: 'template',
_template: null,
behaviors: [Polymer.Templatizer],
ready: function () {
this.templatize(this);
}
});
Polymer._collections = new WeakMap();
Polymer.Collection = function (userArray) {
Polymer._collections.set(userArray, this);
this.userArray = userArray;
this.store = userArray.slice();
this.initMap();
};
Polymer.Collection.prototype = {
constructor: Polymer.Collection,
initMap: function () {
var omap = this.omap = new WeakMap();
var pmap = this.pmap = {};
var s = this.store;
for (var i = 0; i < s.length; i++) {
var item = s[i];
if (item && typeof item == 'object') {
omap.set(item, i);
} else {
pmap[item] = i;
}
}
},
add: function (item) {
var key = this.store.push(item) - 1;
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
return '#' + key;
},
removeKey: function (key) {
if (key = this._parseKey(key)) {
this._removeFromMap(this.store[key]);
delete this.store[key];
}
},
_removeFromMap: function (item) {
if (item && typeof item == 'object') {
this.omap.delete(item);
} else {
delete this.pmap[item];
}
},
remove: function (item) {
var key = this.getKey(item);
this.removeKey(key);
return key;
},
getKey: function (item) {
var key;
if (item && typeof item == 'object') {
key = this.omap.get(item);
} else {
key = this.pmap[item];
}
if (key != undefined) {
return '#' + key;
}
},
getKeys: function () {
return Object.keys(this.store).map(function (key) {
return '#' + key;
});
},
_parseKey: function (key) {
if (key && key[0] == '#') {
return key.slice(1);
}
},
setItem: function (key, item) {
if (key = this._parseKey(key)) {
var old = this.store[key];
if (old) {
this._removeFromMap(old);
}
if (item && typeof item == 'object') {
this.omap.set(item, key);
} else {
this.pmap[item] = key;
}
this.store[key] = item;
}
},
getItem: function (key) {
if (key = this._parseKey(key)) {
return this.store[key];
}
},
getItems: function () {
var items = [], store = this.store;
for (var key in store) {
items.push(store[key]);
}
return items;
},
_applySplices: function (splices) {
var keyMap = {}, key;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
s.addedKeys = [];
for (var j = 0; j < s.removed.length; j++) {
key = this.getKey(s.removed[j]);
keyMap[key] = keyMap[key] ? null : -1;
}
for (j = 0; j < s.addedCount; j++) {
var item = this.userArray[s.index + j];
key = this.getKey(item);
key = key === undefined ? this.add(item) : key;
keyMap[key] = keyMap[key] ? null : 1;
s.addedKeys.push(key);
}
}
var removed = [];
var added = [];
for (key in keyMap) {
if (keyMap[key] < 0) {
this.removeKey(key);
removed.push(key);
}
if (keyMap[key] > 0) {
added.push(key);
}
}
return [{
removed: removed,
added: added
}];
}
};
Polymer.Collection.get = function (userArray) {
return Polymer._collections.get(userArray) || new Polymer.Collection(userArray);
};
Polymer.Collection.applySplices = function (userArray, splices) {
var coll = Polymer._collections.get(userArray);
return coll ? coll._applySplices(splices) : null;
};
Polymer({
is: 'dom-repeat',
extends: 'template',
_template: null,
properties: {
items: { type: Array },
as: {
type: String,
value: 'item'
},
indexAs: {
type: String,
value: 'index'
},
sort: {
type: Function,
observer: '_sortChanged'
},
filter: {
type: Function,
observer: '_filterChanged'
},
observe: {
type: String,
observer: '_observeChanged'
},
delay: Number,
renderedItemCount: {
type: Number,
notify: true,
readOnly: true
},
initialCount: {
type: Number,
observer: '_initializeChunking'
},
targetFramerate: {
type: Number,
value: 20
},
_targetFrameTime: {
type: Number,
computed: '_computeFrameTime(targetFramerate)'
}
},
behaviors: [Polymer.Templatizer],
observers: ['_itemsChanged(items.*)'],
created: function () {
this._instances = [];
this._pool = [];
this._limit = Infinity;
var self = this;
this._boundRenderChunk = function () {
self._renderChunk();
};
},
detached: function () {
this.__isDetached = true;
for (var i = 0; i < this._instances.length; i++) {
this._detachInstance(i);
}
},
attached: function () {
if (this.__isDetached) {
this.__isDetached = false;
var parent = Polymer.dom(Polymer.dom(this).parentNode);
for (var i = 0; i < this._instances.length; i++) {
this._attachInstance(i, parent);
}
}
},
ready: function () {
this._instanceProps = { __key__: true };
this._instanceProps[this.as] = true;
this._instanceProps[this.indexAs] = true;
if (!this.ctor) {
this.templatize(this);
}
},
_sortChanged: function (sort) {
var dataHost = this._getRootDataHost();
this._sortFn = sort && (typeof sort == 'function' ? sort : function () {
return dataHost[sort].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_filterChanged: function (filter) {
var dataHost = this._getRootDataHost();
this._filterFn = filter && (typeof filter == 'function' ? filter : function () {
return dataHost[filter].apply(dataHost, arguments);
});
this._needFullRefresh = true;
if (this.items) {
this._debounceTemplate(this._render);
}
},
_computeFrameTime: function (rate) {
return Math.ceil(1000 / rate);
},
_initializeChunking: function () {
if (this.initialCount) {
this._limit = this.initialCount;
this._chunkCount = this.initialCount;
this._lastChunkTime = performance.now();
}
},
_tryRenderChunk: function () {
if (this.items && this._limit < this.items.length) {
this.debounce('renderChunk', this._requestRenderChunk);
}
},
_requestRenderChunk: function () {
requestAnimationFrame(this._boundRenderChunk);
},
_renderChunk: function () {
var currChunkTime = performance.now();
var ratio = this._targetFrameTime / (currChunkTime - this._lastChunkTime);
this._chunkCount = Math.round(this._chunkCount * ratio) || 1;
this._limit += this._chunkCount;
this._lastChunkTime = currChunkTime;
this._debounceTemplate(this._render);
},
_observeChanged: function () {
this._observePaths = this.observe && this.observe.replace('.*', '.').split(' ');
},
_itemsChanged: function (change) {
if (change.path == 'items') {
if (Array.isArray(this.items)) {
this.collection = Polymer.Collection.get(this.items);
} else if (!this.items) {
this.collection = null;
} else {
this._error(this._logf('dom-repeat', 'expected array for `items`,' + ' found', this.items));
}
this._keySplices = [];
this._indexSplices = [];
this._needFullRefresh = true;
this._initializeChunking();
this._debounceTemplate(this._render);
} else if (change.path == 'items.splices') {
this._keySplices = this._keySplices.concat(change.value.keySplices);
this._indexSplices = this._indexSplices.concat(change.value.indexSplices);
this._debounceTemplate(this._render);
} else {
var subpath = change.path.slice(6);
this._forwardItemPath(subpath, change.value);
this._checkObservedPaths(subpath);
}
},
_checkObservedPaths: function (path) {
if (this._observePaths) {
path = path.substring(path.indexOf('.') + 1);
var paths = this._observePaths;
for (var i = 0; i < paths.length; i++) {
if (path.indexOf(paths[i]) === 0) {
this._needFullRefresh = true;
if (this.delay) {
this.debounce('render', this._render, this.delay);
} else {
this._debounceTemplate(this._render);
}
return;
}
}
}
},
render: function () {
this._needFullRefresh = true;
this._debounceTemplate(this._render);
this._flushTemplates();
},
_render: function () {
if (this._needFullRefresh) {
this._applyFullRefresh();
this._needFullRefresh = false;
} else if (this._keySplices.length) {
if (this._sortFn) {
this._applySplicesUserSort(this._keySplices);
} else {
if (this._filterFn) {
this._applyFullRefresh();
} else {
this._applySplicesArrayOrder(this._indexSplices);
}
}
} else {
}
this._keySplices = [];
this._indexSplices = [];
var keyToIdx = this._keyToInstIdx = {};
for (var i = this._instances.length - 1; i >= 0; i--) {
var inst = this._instances[i];
if (inst.isPlaceholder && i < this._limit) {
inst = this._insertInstance(i, inst.__key__);
} else if (!inst.isPlaceholder && i >= this._limit) {
inst = this._downgradeInstance(i, inst.__key__);
}
keyToIdx[inst.__key__] = i;
if (!inst.isPlaceholder) {
inst.__setProperty(this.indexAs, i, true);
}
}
this._pool.length = 0;
this._setRenderedItemCount(this._instances.length);
this.fire('dom-change');
this._tryRenderChunk();
},
_applyFullRefresh: function () {
var c = this.collection;
var keys;
if (this._sortFn) {
keys = c ? c.getKeys() : [];
} else {
keys = [];
var items = this.items;
if (items) {
for (var i = 0; i < items.length; i++) {
keys.push(c.getKey(items[i]));
}
}
}
var self = this;
if (this._filterFn) {
keys = keys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
if (this._sortFn) {
keys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
}
for (i = 0; i < keys.length; i++) {
var key = keys[i];
var inst = this._instances[i];
if (inst) {
inst.__key__ = key;
if (!inst.isPlaceholder && i < this._limit) {
inst.__setProperty(this.as, c.getItem(key), true);
}
} else if (i < this._limit) {
this._insertInstance(i, key);
} else {
this._insertPlaceholder(i, key);
}
}
for (var j = this._instances.length - 1; j >= i; j--) {
this._detachAndRemoveInstance(j);
}
},
_numericSort: function (a, b) {
return a - b;
},
_applySplicesUserSort: function (splices) {
var c = this.collection;
var keyMap = {};
var key;
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
key = s.removed[j];
keyMap[key] = keyMap[key] ? null : -1;
}
for (j = 0; j < s.added.length; j++) {
key = s.added[j];
keyMap[key] = keyMap[key] ? null : 1;
}
}
var removedIdxs = [];
var addedKeys = [];
for (key in keyMap) {
if (keyMap[key] === -1) {
removedIdxs.push(this._keyToInstIdx[key]);
}
if (keyMap[key] === 1) {
addedKeys.push(key);
}
}
if (removedIdxs.length) {
removedIdxs.sort(this._numericSort);
for (i = removedIdxs.length - 1; i >= 0; i--) {
var idx = removedIdxs[i];
if (idx !== undefined) {
this._detachAndRemoveInstance(idx);
}
}
}
var self = this;
if (addedKeys.length) {
if (this._filterFn) {
addedKeys = addedKeys.filter(function (a) {
return self._filterFn(c.getItem(a));
});
}
addedKeys.sort(function (a, b) {
return self._sortFn(c.getItem(a), c.getItem(b));
});
var start = 0;
for (i = 0; i < addedKeys.length; i++) {
start = this._insertRowUserSort(start, addedKeys[i]);
}
}
},
_insertRowUserSort: function (start, key) {
var c = this.collection;
var item = c.getItem(key);
var end = this._instances.length - 1;
var idx = -1;
while (start <= end) {
var mid = start + end >> 1;
var midKey = this._instances[mid].__key__;
var cmp = this._sortFn(c.getItem(midKey), item);
if (cmp < 0) {
start = mid + 1;
} else if (cmp > 0) {
end = mid - 1;
} else {
idx = mid;
break;
}
}
if (idx < 0) {
idx = end + 1;
}
this._insertPlaceholder(idx, key);
return idx;
},
_applySplicesArrayOrder: function (splices) {
for (var i = 0, s; i < splices.length && (s = splices[i]); i++) {
for (var j = 0; j < s.removed.length; j++) {
this._detachAndRemoveInstance(s.index);
}
for (j = 0; j < s.addedKeys.length; j++) {
this._insertPlaceholder(s.index + j, s.addedKeys[j]);
}
}
},
_detachInstance: function (idx) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
for (var i = 0; i < inst._children.length; i++) {
var el = inst._children[i];
Polymer.dom(inst.root).appendChild(el);
}
return inst;
}
},
_attachInstance: function (idx, parent) {
var inst = this._instances[idx];
if (!inst.isPlaceholder) {
parent.insertBefore(inst.root, this);
}
},
_detachAndRemoveInstance: function (idx) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
this._instances.splice(idx, 1);
},
_insertPlaceholder: function (idx, key) {
this._instances.splice(idx, 0, {
isPlaceholder: true,
__key__: key
});
},
_stampInstance: function (idx, key) {
var model = { __key__: key };
model[this.as] = this.collection.getItem(key);
model[this.indexAs] = idx;
return this.stamp(model);
},
_insertInstance: function (idx, key) {
var inst = this._pool.pop();
if (inst) {
inst.__setProperty(this.as, this.collection.getItem(key), true);
inst.__setProperty('__key__', key, true);
} else {
inst = this._stampInstance(idx, key);
}
var beforeRow = this._instances[idx + 1];
var beforeNode = beforeRow && !beforeRow.isPlaceholder ? beforeRow._children[0] : this;
var parentNode = Polymer.dom(this).parentNode;
Polymer.dom(parentNode).insertBefore(inst.root, beforeNode);
this._instances[idx] = inst;
return inst;
},
_downgradeInstance: function (idx, key) {
var inst = this._detachInstance(idx);
if (inst) {
this._pool.push(inst);
}
inst = {
isPlaceholder: true,
__key__: key
};
this._instances[idx] = inst;
return inst;
},
_showHideChildren: function (hidden) {
for (var i = 0; i < this._instances.length; i++) {
this._instances[i]._showHideChildren(hidden);
}
},
_forwardInstanceProp: function (inst, prop, value) {
if (prop == this.as) {
var idx;
if (this._sortFn || this._filterFn) {
idx = this.items.indexOf(this.collection.getItem(inst.__key__));
} else {
idx = inst[this.indexAs];
}
this.set('items.' + idx, value);
}
},
_forwardInstancePath: function (inst, path, value) {
if (path.indexOf(this.as + '.') === 0) {
this._notifyPath('items.' + inst.__key__ + '.' + path.slice(this.as.length + 1), value);
}
},
_forwardParentProp: function (prop, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst.__setProperty(prop, value, true);
}
}
},
_forwardParentPath: function (path, value) {
var i$ = this._instances;
for (var i = 0, inst; i < i$.length && (inst = i$[i]); i++) {
if (!inst.isPlaceholder) {
inst._notifyPath(path, value, true);
}
}
},
_forwardItemPath: function (path, value) {
if (this._keyToInstIdx) {
var dot = path.indexOf('.');
var key = path.substring(0, dot < 0 ? path.length : dot);
var idx = this._keyToInstIdx[key];
var inst = this._instances[idx];
if (inst && !inst.isPlaceholder) {
if (dot >= 0) {
path = this.as + '.' + path.substring(dot + 1);
inst._notifyPath(path, value, true);
} else {
inst.__setProperty(this.as, value, true);
}
}
}
},
itemForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.as];
},
keyForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance.__key__;
},
indexForElement: function (el) {
var instance = this.modelForElement(el);
return instance && instance[this.indexAs];
}
});
Polymer({
is: 'array-selector',
_template: null,
properties: {
items: {
type: Array,
observer: 'clearSelection'
},
multi: {
type: Boolean,
value: false,
observer: 'clearSelection'
},
selected: {
type: Object,
notify: true
},
selectedItem: {
type: Object,
notify: true
},
toggle: {
type: Boolean,
value: false
}
},
clearSelection: function () {
if (Array.isArray(this.selected)) {
for (var i = 0; i < this.selected.length; i++) {
this.unlinkPaths('selected.' + i);
}
} else {
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
if (this.multi) {
if (!this.selected || this.selected.length) {
this.selected = [];
this._selectedColl = Polymer.Collection.get(this.selected);
}
} else {
this.selected = null;
this._selectedColl = null;
}
this.selectedItem = null;
},
isSelected: function (item) {
if (this.multi) {
return this._selectedColl.getKey(item) !== undefined;
} else {
return this.selected == item;
}
},
deselect: function (item) {
if (this.multi) {
if (this.isSelected(item)) {
var skey = this._selectedColl.getKey(item);
this.arrayDelete('selected', item);
this.unlinkPaths('selected.' + skey);
}
} else {
this.selected = null;
this.selectedItem = null;
this.unlinkPaths('selected');
this.unlinkPaths('selectedItem');
}
},
select: function (item) {
var icol = Polymer.Collection.get(this.items);
var key = icol.getKey(item);
if (this.multi) {
if (this.isSelected(item)) {
if (this.toggle) {
this.deselect(item);
}
} else {
this.push('selected', item);
var skey = this._selectedColl.getKey(item);
this.linkPaths('selected.' + skey, 'items.' + key);
}
} else {
if (this.toggle && item == this.selected) {
this.deselect();
} else {
this.selected = item;
this.selectedItem = item;
this.linkPaths('selected', 'items.' + key);
this.linkPaths('selectedItem', 'items.' + key);
}
}
}
});
Polymer({
is: 'dom-if',
extends: 'template',
_template: null,
properties: {
'if': {
type: Boolean,
value: false,
observer: '_queueRender'
},
restamp: {
type: Boolean,
value: false,
observer: '_queueRender'
}
},
behaviors: [Polymer.Templatizer],
_queueRender: function () {
this._debounceTemplate(this._render);
},
detached: function () {
if (!this.parentNode || this.parentNode.nodeType == Node.DOCUMENT_FRAGMENT_NODE && (!Polymer.Settings.hasShadow || !(this.parentNode instanceof ShadowRoot))) {
this._teardownInstance();
}
},
attached: function () {
if (this.if && this.ctor) {
this.async(this._ensureInstance);
}
},
render: function () {
this._flushTemplates();
},
_render: function () {
if (this.if) {
if (!this.ctor) {
this.templatize(this);
}
this._ensureInstance();
this._showHideChildren();
} else if (this.restamp) {
this._teardownInstance();
}
if (!this.restamp && this._instance) {
this._showHideChildren();
}
if (this.if != this._lastIf) {
this.fire('dom-change');
this._lastIf = this.if;
}
},
_ensureInstance: function () {
var parentNode = Polymer.dom(this).parentNode;
if (parentNode) {
var parent = Polymer.dom(parentNode);
if (!this._instance) {
this._instance = this.stamp();
var root = this._instance.root;
parent.insertBefore(root, this);
} else {
var c$ = this._instance._children;
if (c$ && c$.length) {
var lastChild = Polymer.dom(this).previousSibling;
if (lastChild !== c$[c$.length - 1]) {
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
parent.insertBefore(n, this);
}
}
}
}
}
},
_teardownInstance: function () {
if (this._instance) {
var c$ = this._instance._children;
if (c$ && c$.length) {
var parent = Polymer.dom(Polymer.dom(c$[0]).parentNode);
for (var i = 0, n; i < c$.length && (n = c$[i]); i++) {
parent.removeChild(n);
}
}
this._instance = null;
}
},
_showHideChildren: function () {
var hidden = this.__hideTemplateChildren__ || !this.if;
if (this._instance) {
this._instance._showHideChildren(hidden);
}
},
_forwardParentProp: function (prop, value) {
if (this._instance) {
this._instance[prop] = value;
}
},
_forwardParentPath: function (path, value) {
if (this._instance) {
this._instance._notifyPath(path, value, true);
}
}
});
Polymer({
is: 'dom-bind',
extends: 'template',
_template: null,
created: function () {
var self = this;
Polymer.RenderStatus.whenReady(function () {
self._markImportsReady();
});
},
_ensureReady: function () {
if (!this._readied) {
this._readySelf();
}
},
_markImportsReady: function () {
this._importsReady = true;
this._ensureReady();
},
_registerFeatures: function () {
this._prepConstructor();
},
_insertChildren: function () {
var parentDom = Polymer.dom(Polymer.dom(this).parentNode);
parentDom.insertBefore(this.root, this);
},
_removeChildren: function () {
if (this._children) {
for (var i = 0; i < this._children.length; i++) {
this.root.appendChild(this._children[i]);
}
}
},
_initFeatures: function () {
},
_scopeElementClass: function (element, selector) {
if (this.dataHost) {
return this.dataHost._scopeElementClass(element, selector);
} else {
return selector;
}
},
_prepConfigure: function () {
var config = {};
for (var prop in this._propertyEffects) {
config[prop] = this[prop];
}
var setupConfigure = this._setupConfigure;
this._setupConfigure = function () {
setupConfigure.call(this, config);
};
},
attached: function () {
if (this._importsReady) {
this.render();
}
},
detached: function () {
this._removeChildren();
},
render: function () {
this._ensureReady();
if (!this._children) {
this._template = this;
this._prepAnnotations();
this._prepEffects();
this._prepBehaviors();
this._prepConfigure();
this._prepBindings();
this._prepPropertyInfo();
Polymer.Base._initFeatures.call(this);
this._children = Polymer.TreeApi.arrayCopyChildNodes(this.root);
}
this._insertChildren();
this.fire('dom-change');
}
});
Polymer.IronResizableBehavior = {
properties: {
_parentResizable: {
type: Object,
observer: '_parentResizableChanged'
},
_notifyingDescendant: {
type: Boolean,
value: false
}
},
listeners: { 'iron-request-resize-notifications': '_onIronRequestResizeNotifications' },
created: function () {
this._interestedResizables = [];
this._boundNotifyResize = this.notifyResize.bind(this);
},
attached: function () {
this.fire('iron-request-resize-notifications', null, {
node: this,
bubbles: true,
cancelable: true
});
if (!this._parentResizable) {
window.addEventListener('resize', this._boundNotifyResize);
this.notifyResize();
}
},
detached: function () {
if (this._parentResizable) {
this._parentResizable.stopResizeNotificationsFor(this);
} else {
window.removeEventListener('resize', this._boundNotifyResize);
}
this._parentResizable = null;
},
notifyResize: function () {
if (!this.isAttached) {
return;
}
this._interestedResizables.forEach(function (resizable) {
if (this.resizerShouldNotify(resizable)) {
this._notifyDescendant(resizable);
}
}, this);
this._fireResize();
},
assignParentResizable: function (parentResizable) {
this._parentResizable = parentResizable;
},
stopResizeNotificationsFor: function (target) {
var index = this._interestedResizables.indexOf(target);
if (index > -1) {
this._interestedResizables.splice(index, 1);
this.unlisten(target, 'iron-resize', '_onDescendantIronResize');
}
},
resizerShouldNotify: function (element) {
return true;
},
_onDescendantIronResize: function (event) {
if (this._notifyingDescendant) {
event.stopPropagation();
return;
}
if (!Polymer.Settings.useShadow) {
this._fireResize();
}
},
_fireResize: function () {
this.fire('iron-resize', null, {
node: this,
bubbles: false
});
},
_onIronRequestResizeNotifications: function (event) {
var target = event.path ? event.path[0] : event.target;
if (target === this) {
return;
}
if (this._interestedResizables.indexOf(target) === -1) {
this._interestedResizables.push(target);
this.listen(target, 'iron-resize', '_onDescendantIronResize');
}
target.assignParentResizable(this);
this._notifyDescendant(target);
event.stopPropagation();
},
_parentResizableChanged: function (parentResizable) {
if (parentResizable) {
window.removeEventListener('resize', this._boundNotifyResize);
}
},
_notifyDescendant: function (descendant) {
if (!this.isAttached) {
return;
}
this._notifyingDescendant = true;
descendant.notifyResize();
this._notifyingDescendant = false;
}
};
Polymer({
is: 'iron-collapse',
behaviors: [Polymer.IronResizableBehavior],
properties: {
horizontal: {
type: Boolean,
value: false,
observer: '_horizontalChanged'
},
opened: {
type: Boolean,
value: false,
notify: true,
observer: '_openedChanged'
},
noAnimation: { type: Boolean }
},
get dimension() {
return this.horizontal ? 'width' : 'height';
},
hostAttributes: {
role: 'group',
'aria-hidden': 'true',
'aria-expanded': 'false'
},
listeners: { transitionend: '_transitionEnd' },
attached: function () {
this._transitionEnd();
},
toggle: function () {
this.opened = !this.opened;
},
show: function () {
this.opened = true;
},
hide: function () {
this.opened = false;
},
updateSize: function (size, animated) {
if (this.style[this.dimension] === size) {
return;
}
this._updateTransition(false);
if (animated && !this.noAnimation) {
var startSize = this._calcSize();
if (size === 'auto') {
this.style[this.dimension] = size;
size = this._calcSize();
}
this.style[this.dimension] = startSize;
this.offsetHeight = this.offsetHeight;
this._updateTransition(true);
}
this.style[this.dimension] = size;
},
enableTransition: function (enabled) {
console.warn('`enableTransition()` is deprecated, use `noAnimation` instead.');
this.noAnimation = !enabled;
},
_updateTransition: function (enabled) {
this.style.transitionDuration = enabled && !this.noAnimation ? '' : '0s';
},
_horizontalChanged: function () {
this.style.transitionProperty = this.dimension;
var otherDimension = this.dimension === 'width' ? 'height' : 'width';
this.style[otherDimension] = '';
this.updateSize(this.opened ? 'auto' : '0px', false);
},
_openedChanged: function () {
this.setAttribute('aria-expanded', this.opened);
this.setAttribute('aria-hidden', !this.opened);
this.toggleClass('iron-collapse-closed', false);
this.toggleClass('iron-collapse-opened', false);
this.updateSize(this.opened ? 'auto' : '0px', true);
if (this.opened) {
this.focus();
}
if (this.noAnimation) {
this._transitionEnd();
}
},
_transitionEnd: function () {
if (this.opened) {
this.style[this.dimension] = 'auto';
}
this.toggleClass('iron-collapse-closed', !this.opened);
this.toggleClass('iron-collapse-opened', this.opened);
this._updateTransition(false);
this.notifyResize();
},
_calcSize: function () {
return this.getBoundingClientRect()[this.dimension] + 'px';
}
});
(function () {
var g, aa = this;
function n(a) {
return void 0 !== a;
}
function ba() {
}
function ca(a) {
a.vb = function () {
return a.uf ? a.uf : a.uf = new a();
};
}
function da(a) {
var b = typeof a;
if ('object' == b)
if (a) {
if (a instanceof Array)
return 'array';
if (a instanceof Object)
return b;
var c = Object.prototype.toString.call(a);
if ('[object Window]' == c)
return 'object';
if ('[object Array]' == c || 'number' == typeof a.length && 'undefined' != typeof a.splice && 'undefined' != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable('splice'))
return 'array';
if ('[object Function]' == c || 'undefined' != typeof a.call && 'undefined' != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable('call'))
return 'function';
} else
return 'null';
else if ('function' == b && 'undefined' == typeof a.call)
return 'object';
return b;
}
function ea(a) {
return 'array' == da(a);
}
function fa(a) {
var b = da(a);
return 'array' == b || 'object' == b && 'number' == typeof a.length;
}
function p(a) {
return 'string' == typeof a;
}
function ga(a) {
return 'number' == typeof a;
}
function ha(a) {
return 'function' == da(a);
}
function ia(a) {
var b = typeof a;
return 'object' == b && null != a || 'function' == b;
}
function ja(a, b, c) {
return a.call.apply(a.bind, arguments);
}
function ka(a, b, c) {
if (!a)
throw Error();
if (2 < arguments.length) {
var d = Array.prototype.slice.call(arguments, 2);
return function () {
var c = Array.prototype.slice.call(arguments);
Array.prototype.unshift.apply(c, d);
return a.apply(b, c);
};
}
return function () {
return a.apply(b, arguments);
};
}
function q(a, b, c) {
q = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf('native code') ? ja : ka;
return q.apply(null, arguments);
}
var la = Date.now || function () {
return +new Date();
};
function ma(a, b) {
function c() {
}
c.prototype = b.prototype;
a.$g = b.prototype;
a.prototype = new c();
a.prototype.constructor = a;
a.Wg = function (a, c, f) {
for (var h = Array(arguments.length - 2), k = 2; k < arguments.length; k++)
h[k - 2] = arguments[k];
return b.prototype[c].apply(a, h);
};
}
;
function r(a, b) {
for (var c in a)
b.call(void 0, a[c], c, a);
}
function na(a, b) {
var c = {}, d;
for (d in a)
c[d] = b.call(void 0, a[d], d, a);
return c;
}
function oa(a, b) {
for (var c in a)
if (!b.call(void 0, a[c], c, a))
return !1;
return !0;
}
function pa(a) {
var b = 0, c;
for (c in a)
b++;
return b;
}
function qa(a) {
for (var b in a)
return b;
}
function ra(a) {
var b = [], c = 0, d;
for (d in a)
b[c++] = a[d];
return b;
}
function sa(a) {
var b = [], c = 0, d;
for (d in a)
b[c++] = d;
return b;
}
function ta(a, b) {
for (var c in a)
if (a[c] == b)
return !0;
return !1;
}
function ua(a, b, c) {
for (var d in a)
if (b.call(c, a[d], d, a))
return d;
}
function va(a, b) {
var c = ua(a, b, void 0);
return c && a[c];
}
function wa(a) {
for (var b in a)
return !1;
return !0;
}
function xa(a) {
var b = {}, c;
for (c in a)
b[c] = a[c];
return b;
}
var ya = 'constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf'.split(' ');
function za(a, b) {
for (var c, d, e = 1; e < arguments.length; e++) {
d = arguments[e];
for (c in d)
a[c] = d[c];
for (var f = 0; f < ya.length; f++)
c = ya[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c]);
}
}
;
function Aa(a) {
a = String(a);
if (/^\s*$/.test(a) ? 0 : /^[\],:{}\s\u2028\u2029]*$/.test(a.replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, '')))
try {
return eval('(' + a + ')');
} catch (b) {
}
throw Error('Invalid JSON string: ' + a);
}
function Ba() {
this.Sd = void 0;
}
function Ca(a, b, c) {
switch (typeof b) {
case 'string':
Da(b, c);
break;
case 'number':
c.push(isFinite(b) && !isNaN(b) ? b : 'null');
break;
case 'boolean':
c.push(b);
break;
case 'undefined':
c.push('null');
break;
case 'object':
if (null == b) {
c.push('null');
break;
}
if (ea(b)) {
var d = b.length;
c.push('[');
for (var e = '', f = 0; f < d; f++)
c.push(e), e = b[f], Ca(a, a.Sd ? a.Sd.call(b, String(f), e) : e, c), e = ',';
c.push(']');
break;
}
c.push('{');
d = '';
for (f in b)
Object.prototype.hasOwnProperty.call(b, f) && (e = b[f], 'function' != typeof e && (c.push(d), Da(f, c), c.push(':'), Ca(a, a.Sd ? a.Sd.call(b, f, e) : e, c), d = ','));
c.push('}');
break;
case 'function':
break;
default:
throw Error('Unknown type: ' + typeof b);
}
}
var Ea = {
'"': '\\"',
'\\': '\\\\',
'/': '\\/',
'\b': '\\b',
'\f': '\\f',
'\n': '\\n',
'\r': '\\r',
'\t': '\\t',
'\x0B': '\\u000b'
}, Fa = /\uffff/.test('\uFFFF') ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
function Da(a, b) {
b.push('"', a.replace(Fa, function (a) {
if (a in Ea)
return Ea[a];
var b = a.charCodeAt(0), e = '\\u';
16 > b ? e += '000' : 256 > b ? e += '00' : 4096 > b && (e += '0');
return Ea[a] = e + b.toString(16);
}), '"');
}
;
function Ga() {
return Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ la()).toString(36);
}
;
var Ha;
a: {
var Ia = aa.navigator;
if (Ia) {
var Ja = Ia.userAgent;
if (Ja) {
Ha = Ja;
break a;
}
}
Ha = '';
}
;
function Ka() {
this.Wa = -1;
}
;
function La() {
this.Wa = -1;
this.Wa = 64;
this.P = [];
this.ne = [];
this.Uf = [];
this.Ld = [];
this.Ld[0] = 128;
for (var a = 1; a < this.Wa; ++a)
this.Ld[a] = 0;
this.ee = this.ac = 0;
this.reset();
}
ma(La, Ka);
La.prototype.reset = function () {
this.P[0] = 1732584193;
this.P[1] = 4023233417;
this.P[2] = 2562383102;
this.P[3] = 271733878;
this.P[4] = 3285377520;
this.ee = this.ac = 0;
};
function Ma(a, b, c) {
c || (c = 0);
var d = a.Uf;
if (p(b))
for (var e = 0; 16 > e; e++)
d[e] = b.charCodeAt(c) << 24 | b.charCodeAt(c + 1) << 16 | b.charCodeAt(c + 2) << 8 | b.charCodeAt(c + 3), c += 4;
else
for (e = 0; 16 > e; e++)
d[e] = b[c] << 24 | b[c + 1] << 16 | b[c + 2] << 8 | b[c + 3], c += 4;
for (e = 16; 80 > e; e++) {
var f = d[e - 3] ^ d[e - 8] ^ d[e - 14] ^ d[e - 16];
d[e] = (f << 1 | f >>> 31) & 4294967295;
}
b = a.P[0];
c = a.P[1];
for (var h = a.P[2], k = a.P[3], l = a.P[4], m, e = 0; 80 > e; e++)
40 > e ? 20 > e ? (f = k ^ c & (h ^ k), m = 1518500249) : (f = c ^ h ^ k, m = 1859775393) : 60 > e ? (f = c & h | k & (c | h), m = 2400959708) : (f = c ^ h ^ k, m = 3395469782), f = (b << 5 | b >>> 27) + f + l + m + d[e] & 4294967295, l = k, k = h, h = (c << 30 | c >>> 2) & 4294967295, c = b, b = f;
a.P[0] = a.P[0] + b & 4294967295;
a.P[1] = a.P[1] + c & 4294967295;
a.P[2] = a.P[2] + h & 4294967295;
a.P[3] = a.P[3] + k & 4294967295;
a.P[4] = a.P[4] + l & 4294967295;
}
La.prototype.update = function (a, b) {
if (null != a) {
n(b) || (b = a.length);
for (var c = b - this.Wa, d = 0, e = this.ne, f = this.ac; d < b;) {
if (0 == f)
for (; d <= c;)
Ma(this, a, d), d += this.Wa;
if (p(a))
for (; d < b;) {
if (e[f] = a.charCodeAt(d), ++f, ++d, f == this.Wa) {
Ma(this, e);
f = 0;
break;
}
}
else
for (; d < b;)
if (e[f] = a[d], ++f, ++d, f == this.Wa) {
Ma(this, e);
f = 0;
break;
}
}
this.ac = f;
this.ee += b;
}
};
var u = Array.prototype, Na = u.indexOf ? function (a, b, c) {
return u.indexOf.call(a, b, c);
} : function (a, b, c) {
c = null == c ? 0 : 0 > c ? Math.max(0, a.length + c) : c;
if (p(a))
return p(b) && 1 == b.length ? a.indexOf(b, c) : -1;
for (; c < a.length; c++)
if (c in a && a[c] === b)
return c;
return -1;
}, Oa = u.forEach ? function (a, b, c) {
u.forEach.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = p(a) ? a.split('') : a, f = 0; f < d; f++)
f in e && b.call(c, e[f], f, a);
}, Pa = u.filter ? function (a, b, c) {
return u.filter.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = [], f = 0, h = p(a) ? a.split('') : a, k = 0; k < d; k++)
if (k in h) {
var l = h[k];
b.call(c, l, k, a) && (e[f++] = l);
}
return e;
}, Qa = u.map ? function (a, b, c) {
return u.map.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = Array(d), f = p(a) ? a.split('') : a, h = 0; h < d; h++)
h in f && (e[h] = b.call(c, f[h], h, a));
return e;
}, Ra = u.reduce ? function (a, b, c, d) {
for (var e = [], f = 1, h = arguments.length; f < h; f++)
e.push(arguments[f]);
d && (e[0] = q(b, d));
return u.reduce.apply(a, e);
} : function (a, b, c, d) {
var e = c;
Oa(a, function (c, h) {
e = b.call(d, e, c, h, a);
});
return e;
}, Sa = u.every ? function (a, b, c) {
return u.every.call(a, b, c);
} : function (a, b, c) {
for (var d = a.length, e = p(a) ? a.split('') : a, f = 0; f < d; f++)
if (f in e && !b.call(c, e[f], f, a))
return !1;
return !0;
};
function Ta(a, b) {
var c = Ua(a, b, void 0);
return 0 > c ? null : p(a) ? a.charAt(c) : a[c];
}
function Ua(a, b, c) {
for (var d = a.length, e = p(a) ? a.split('') : a, f = 0; f < d; f++)
if (f in e && b.call(c, e[f], f, a))
return f;
return -1;
}
function Va(a, b) {
var c = Na(a, b);
0 <= c && u.splice.call(a, c, 1);
}
function Wa(a, b, c) {
return 2 >= arguments.length ? u.slice.call(a, b) : u.slice.call(a, b, c);
}
function Xa(a, b) {
a.sort(b || Ya);
}
function Ya(a, b) {
return a > b ? 1 : a < b ? -1 : 0;
}
;
var Za = -1 != Ha.indexOf('Opera') || -1 != Ha.indexOf('OPR'), $a = -1 != Ha.indexOf('Trident') || -1 != Ha.indexOf('MSIE'), ab = -1 != Ha.indexOf('Gecko') && -1 == Ha.toLowerCase().indexOf('webkit') && !(-1 != Ha.indexOf('Trident') || -1 != Ha.indexOf('MSIE')), bb = -1 != Ha.toLowerCase().indexOf('webkit');
(function () {
var a = '', b;
if (Za && aa.opera)
return a = aa.opera.version, ha(a) ? a() : a;
ab ? b = /rv\:([^\);]+)(\)|;)/ : $a ? b = /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/ : bb && (b = /WebKit\/(\S+)/);
b && (a = (a = b.exec(Ha)) ? a[1] : '');
return $a && (b = (b = aa.document) ? b.documentMode : void 0, b > parseFloat(a)) ? String(b) : a;
}());
var cb = null, db = null, eb = null;
function fb(a, b) {
if (!fa(a))
throw Error('encodeByteArray takes an array as a parameter');
gb();
for (var c = b ? db : cb, d = [], e = 0; e < a.length; e += 3) {
var f = a[e], h = e + 1 < a.length, k = h ? a[e + 1] : 0, l = e + 2 < a.length, m = l ? a[e + 2] : 0, t = f >> 2, f = (f & 3) << 4 | k >> 4, k = (k & 15) << 2 | m >> 6, m = m & 63;
l || (m = 64, h || (k = 64));
d.push(c[t], c[f], c[k], c[m]);
}
return d.join('');
}
function gb() {
if (!cb) {
cb = {};
db = {};
eb = {};
for (var a = 0; 65 > a; a++)
cb[a] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(a), db[a] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.'.charAt(a), eb[db[a]] = a, 62 <= a && (eb['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(a)] = a);
}
}
;
var hb = hb || '2.2.9';
function v(a, b) {
return Object.prototype.hasOwnProperty.call(a, b);
}
function w(a, b) {
if (Object.prototype.hasOwnProperty.call(a, b))
return a[b];
}
function ib(a, b) {
for (var c in a)
Object.prototype.hasOwnProperty.call(a, c) && b(c, a[c]);
}
function jb(a) {
var b = {};
ib(a, function (a, d) {
b[a] = d;
});
return b;
}
;
function kb(a) {
var b = [];
ib(a, function (a, d) {
ea(d) ? Oa(d, function (d) {
b.push(encodeURIComponent(a) + '=' + encodeURIComponent(d));
}) : b.push(encodeURIComponent(a) + '=' + encodeURIComponent(d));
});
return b.length ? '&' + b.join('&') : '';
}
function lb(a) {
var b = {};
a = a.replace(/^\?/, '').split('&');
Oa(a, function (a) {
a && (a = a.split('='), b[a[0]] = a[1]);
});
return b;
}
;
function x(a, b, c, d) {
var e;
d < b ? e = 'at least ' + b : d > c && (e = 0 === c ? 'none' : 'no more than ' + c);
if (e)
throw Error(a + ' failed: Was called with ' + d + (1 === d ? ' argument.' : ' arguments.') + ' Expects ' + e + '.');
}
function z(a, b, c) {
var d = '';
switch (b) {
case 1:
d = c ? 'first' : 'First';
break;
case 2:
d = c ? 'second' : 'Second';
break;
case 3:
d = c ? 'third' : 'Third';
break;
case 4:
d = c ? 'fourth' : 'Fourth';
break;
default:
throw Error('errorPrefix called with argumentNumber > 4.  Need to update it?');
}
return a = a + ' failed: ' + (d + ' argument ');
}
function A(a, b, c, d) {
if ((!d || n(c)) && !ha(c))
throw Error(z(a, b, d) + 'must be a valid function.');
}
function mb(a, b, c) {
if (n(c) && (!ia(c) || null === c))
throw Error(z(a, b, !0) + 'must be a valid context object.');
}
;
function nb(a) {
return 'undefined' !== typeof JSON && n(JSON.parse) ? JSON.parse(a) : Aa(a);
}
function B(a) {
if ('undefined' !== typeof JSON && n(JSON.stringify))
a = JSON.stringify(a);
else {
var b = [];
Ca(new Ba(), a, b);
a = b.join('');
}
return a;
}
;
function ob() {
this.Wd = C;
}
ob.prototype.j = function (a) {
return this.Wd.Y(a);
};
ob.prototype.toString = function () {
return this.Wd.toString();
};
function pb() {
}
pb.prototype.qf = function () {
return null;
};
pb.prototype.ze = function () {
return null;
};
var qb = new pb();
function rb(a, b, c) {
this.Rf = a;
this.Ka = b;
this.Kd = c;
}
rb.prototype.qf = function (a) {
var b = this.Ka.Q;
if (sb(b, a))
return b.j().J(a);
b = null != this.Kd ? new tb(this.Kd, !0, !1) : this.Ka.C();
return this.Rf.xc(a, b);
};
rb.prototype.ze = function (a, b, c) {
var d = null != this.Kd ? this.Kd : ub(this.Ka);
a = this.Rf.oe(d, b, 1, c, a);
return 0 === a.length ? null : a[0];
};
function vb() {
this.ub = [];
}
function wb(a, b) {
for (var c = null, d = 0; d < b.length; d++) {
var e = b[d], f = e.Zb();
null === c || f.ca(c.Zb()) || (a.ub.push(c), c = null);
null === c && (c = new xb(f));
c.add(e);
}
c && a.ub.push(c);
}
function yb(a, b, c) {
wb(a, c);
zb(a, function (a) {
return a.ca(b);
});
}
function Ab(a, b, c) {
wb(a, c);
zb(a, function (a) {
return a.contains(b) || b.contains(a);
});
}
function zb(a, b) {
for (var c = !0, d = 0; d < a.ub.length; d++) {
var e = a.ub[d];
if (e)
if (e = e.Zb(), b(e)) {
for (var e = a.ub[d], f = 0; f < e.vd.length; f++) {
var h = e.vd[f];
if (null !== h) {
e.vd[f] = null;
var k = h.Vb();
Bb && Cb('event: ' + h.toString());
Db(k);
}
}
a.ub[d] = null;
} else
c = !1;
}
c && (a.ub = []);
}
function xb(a) {
this.ra = a;
this.vd = [];
}
xb.prototype.add = function (a) {
this.vd.push(a);
};
xb.prototype.Zb = function () {
return this.ra;
};
function D(a, b, c, d) {
this.type = a;
this.Ja = b;
this.Xa = c;
this.Le = d;
this.Qd = void 0;
}
function Eb(a) {
return new D(Fb, a);
}
var Fb = 'value';
function Gb(a, b, c, d) {
this.ve = b;
this.$d = c;
this.Qd = d;
this.ud = a;
}
Gb.prototype.Zb = function () {
var a = this.$d.mc();
return 'value' === this.ud ? a.path : a.parent().path;
};
Gb.prototype.Ae = function () {
return this.ud;
};
Gb.prototype.Vb = function () {
return this.ve.Vb(this);
};
Gb.prototype.toString = function () {
return this.Zb().toString() + ':' + this.ud + ':' + B(this.$d.mf());
};
function Hb(a, b, c) {
this.ve = a;
this.error = b;
this.path = c;
}
Hb.prototype.Zb = function () {
return this.path;
};
Hb.prototype.Ae = function () {
return 'cancel';
};
Hb.prototype.Vb = function () {
return this.ve.Vb(this);
};
Hb.prototype.toString = function () {
return this.path.toString() + ':cancel';
};
function tb(a, b, c) {
this.w = a;
this.ea = b;
this.Ub = c;
}
function Ib(a) {
return a.ea;
}
function Jb(a, b) {
return b.e() ? a.ea && !a.Ub : sb(a, E(b));
}
function sb(a, b) {
return a.ea && !a.Ub || a.w.Da(b);
}
tb.prototype.j = function () {
return this.w;
};
function Kb(a) {
this.eg = a;
this.Dd = null;
}
Kb.prototype.get = function () {
var a = this.eg.get(), b = xa(a);
if (this.Dd)
for (var c in this.Dd)
b[c] -= this.Dd[c];
this.Dd = a;
return b;
};
function Lb(a, b) {
this.Nf = {};
this.fd = new Kb(a);
this.ba = b;
var c = 10000 + 20000 * Math.random();
setTimeout(q(this.If, this), Math.floor(c));
}
Lb.prototype.If = function () {
var a = this.fd.get(), b = {}, c = !1, d;
for (d in a)
0 < a[d] && v(this.Nf, d) && (b[d] = a[d], c = !0);
c && this.ba.Ve(b);
setTimeout(q(this.If, this), Math.floor(600000 * Math.random()));
};
function Mb() {
this.Ec = {};
}
function Nb(a, b, c) {
n(c) || (c = 1);
v(a.Ec, b) || (a.Ec[b] = 0);
a.Ec[b] += c;
}
Mb.prototype.get = function () {
return xa(this.Ec);
};
var Ob = {}, Pb = {};
function Qb(a) {
a = a.toString();
Ob[a] || (Ob[a] = new Mb());
return Ob[a];
}
function Rb(a, b) {
var c = a.toString();
Pb[c] || (Pb[c] = b());
return Pb[c];
}
;
function F(a, b) {
this.name = a;
this.S = b;
}
function Sb(a, b) {
return new F(a, b);
}
;
function Tb(a, b) {
return Ub(a.name, b.name);
}
function Vb(a, b) {
return Ub(a, b);
}
;
function Wb(a, b, c) {
this.type = Xb;
this.source = a;
this.path = b;
this.Ga = c;
}
Wb.prototype.Xc = function (a) {
return this.path.e() ? new Wb(this.source, G, this.Ga.J(a)) : new Wb(this.source, H(this.path), this.Ga);
};
Wb.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' overwrite: ' + this.Ga.toString() + ')';
};
function Yb(a, b) {
this.type = Zb;
this.source = a;
this.path = b;
}
Yb.prototype.Xc = function () {
return this.path.e() ? new Yb(this.source, G) : new Yb(this.source, H(this.path));
};
Yb.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' listen_complete)';
};
function $b(a, b) {
this.La = a;
this.wa = b ? b : ac;
}
g = $b.prototype;
g.Oa = function (a, b) {
return new $b(this.La, this.wa.Oa(a, b, this.La).X(null, null, !1, null, null));
};
g.remove = function (a) {
return new $b(this.La, this.wa.remove(a, this.La).X(null, null, !1, null, null));
};
g.get = function (a) {
for (var b, c = this.wa; !c.e();) {
b = this.La(a, c.key);
if (0 === b)
return c.value;
0 > b ? c = c.left : 0 < b && (c = c.right);
}
return null;
};
function bc(a, b) {
for (var c, d = a.wa, e = null; !d.e();) {
c = a.La(b, d.key);
if (0 === c) {
if (d.left.e())
return e ? e.key : null;
for (d = d.left; !d.right.e();)
d = d.right;
return d.key;
}
0 > c ? d = d.left : 0 < c && (e = d, d = d.right);
}
throw Error('Attempted to find predecessor key for a nonexistent key.  What gives?');
}
g.e = function () {
return this.wa.e();
};
g.count = function () {
return this.wa.count();
};
g.Sc = function () {
return this.wa.Sc();
};
g.fc = function () {
return this.wa.fc();
};
g.ia = function (a) {
return this.wa.ia(a);
};
g.Xb = function (a) {
return new cc(this.wa, null, this.La, !1, a);
};
g.Yb = function (a, b) {
return new cc(this.wa, a, this.La, !1, b);
};
g.$b = function (a, b) {
return new cc(this.wa, a, this.La, !0, b);
};
g.sf = function (a) {
return new cc(this.wa, null, this.La, !0, a);
};
function cc(a, b, c, d, e) {
this.Ud = e || null;
this.Ge = d;
this.Qa = [];
for (e = 1; !a.e();)
if (e = b ? c(a.key, b) : 1, d && (e *= -1), 0 > e)
a = this.Ge ? a.left : a.right;
else if (0 === e) {
this.Qa.push(a);
break;
} else
this.Qa.push(a), a = this.Ge ? a.right : a.left;
}
function J(a) {
if (0 === a.Qa.length)
return null;
var b = a.Qa.pop(), c;
c = a.Ud ? a.Ud(b.key, b.value) : {
key: b.key,
value: b.value
};
if (a.Ge)
for (b = b.left; !b.e();)
a.Qa.push(b), b = b.right;
else
for (b = b.right; !b.e();)
a.Qa.push(b), b = b.left;
return c;
}
function dc(a) {
if (0 === a.Qa.length)
return null;
var b;
b = a.Qa;
b = b[b.length - 1];
return a.Ud ? a.Ud(b.key, b.value) : {
key: b.key,
value: b.value
};
}
function ec(a, b, c, d, e) {
this.key = a;
this.value = b;
this.color = null != c ? c : !0;
this.left = null != d ? d : ac;
this.right = null != e ? e : ac;
}
g = ec.prototype;
g.X = function (a, b, c, d, e) {
return new ec(null != a ? a : this.key, null != b ? b : this.value, null != c ? c : this.color, null != d ? d : this.left, null != e ? e : this.right);
};
g.count = function () {
return this.left.count() + 1 + this.right.count();
};
g.e = function () {
return !1;
};
g.ia = function (a) {
return this.left.ia(a) || a(this.key, this.value) || this.right.ia(a);
};
function fc(a) {
return a.left.e() ? a : fc(a.left);
}
g.Sc = function () {
return fc(this).key;
};
g.fc = function () {
return this.right.e() ? this.key : this.right.fc();
};
g.Oa = function (a, b, c) {
var d, e;
e = this;
d = c(a, e.key);
e = 0 > d ? e.X(null, null, null, e.left.Oa(a, b, c), null) : 0 === d ? e.X(null, b, null, null, null) : e.X(null, null, null, null, e.right.Oa(a, b, c));
return gc(e);
};
function hc(a) {
if (a.left.e())
return ac;
a.left.fa() || a.left.left.fa() || (a = ic(a));
a = a.X(null, null, null, hc(a.left), null);
return gc(a);
}
g.remove = function (a, b) {
var c, d;
c = this;
if (0 > b(a, c.key))
c.left.e() || c.left.fa() || c.left.left.fa() || (c = ic(c)), c = c.X(null, null, null, c.left.remove(a, b), null);
else {
c.left.fa() && (c = jc(c));
c.right.e() || c.right.fa() || c.right.left.fa() || (c = kc(c), c.left.left.fa() && (c = jc(c), c = kc(c)));
if (0 === b(a, c.key)) {
if (c.right.e())
return ac;
d = fc(c.right);
c = c.X(d.key, d.value, null, null, hc(c.right));
}
c = c.X(null, null, null, null, c.right.remove(a, b));
}
return gc(c);
};
g.fa = function () {
return this.color;
};
function gc(a) {
a.right.fa() && !a.left.fa() && (a = lc(a));
a.left.fa() && a.left.left.fa() && (a = jc(a));
a.left.fa() && a.right.fa() && (a = kc(a));
return a;
}
function ic(a) {
a = kc(a);
a.right.left.fa() && (a = a.X(null, null, null, null, jc(a.right)), a = lc(a), a = kc(a));
return a;
}
function lc(a) {
return a.right.X(null, null, a.color, a.X(null, null, !0, null, a.right.left), null);
}
function jc(a) {
return a.left.X(null, null, a.color, null, a.X(null, null, !0, a.left.right, null));
}
function kc(a) {
return a.X(null, null, !a.color, a.left.X(null, null, !a.left.color, null, null), a.right.X(null, null, !a.right.color, null, null));
}
function mc() {
}
g = mc.prototype;
g.X = function () {
return this;
};
g.Oa = function (a, b) {
return new ec(a, b, null);
};
g.remove = function () {
return this;
};
g.count = function () {
return 0;
};
g.e = function () {
return !0;
};
g.ia = function () {
return !1;
};
g.Sc = function () {
return null;
};
g.fc = function () {
return null;
};
g.fa = function () {
return !1;
};
var ac = new mc();
function nc(a, b) {
return a && 'object' === typeof a ? (K('.sv' in a, 'Unexpected leaf node or priority contents'), b[a['.sv']]) : a;
}
function oc(a, b) {
var c = new pc();
qc(a, new L(''), function (a, e) {
c.nc(a, rc(e, b));
});
return c;
}
function rc(a, b) {
var c = a.B().H(), c = nc(c, b), d;
if (a.L()) {
var e = nc(a.Ca(), b);
return e !== a.Ca() || c !== a.B().H() ? new sc(e, M(c)) : a;
}
d = a;
c !== a.B().H() && (d = d.ga(new sc(c)));
a.R(N, function (a, c) {
var e = rc(c, b);
e !== c && (d = d.O(a, e));
});
return d;
}
;
function L(a, b) {
if (1 == arguments.length) {
this.n = a.split('/');
for (var c = 0, d = 0; d < this.n.length; d++)
0 < this.n[d].length && (this.n[c] = this.n[d], c++);
this.n.length = c;
this.Z = 0;
} else
this.n = a, this.Z = b;
}
function O(a, b) {
var c = E(a);
if (null === c)
return b;
if (c === E(b))
return O(H(a), H(b));
throw Error('INTERNAL ERROR: innerPath (' + b + ') is not within outerPath (' + a + ')');
}
function E(a) {
return a.Z >= a.n.length ? null : a.n[a.Z];
}
function tc(a) {
return a.n.length - a.Z;
}
function H(a) {
var b = a.Z;
b < a.n.length && b++;
return new L(a.n, b);
}
function uc(a) {
return a.Z < a.n.length ? a.n[a.n.length - 1] : null;
}
g = L.prototype;
g.toString = function () {
for (var a = '', b = this.Z; b < this.n.length; b++)
'' !== this.n[b] && (a += '/' + this.n[b]);
return a || '/';
};
g.slice = function (a) {
return this.n.slice(this.Z + (a || 0));
};
g.parent = function () {
if (this.Z >= this.n.length)
return null;
for (var a = [], b = this.Z; b < this.n.length - 1; b++)
a.push(this.n[b]);
return new L(a, 0);
};
g.u = function (a) {
for (var b = [], c = this.Z; c < this.n.length; c++)
b.push(this.n[c]);
if (a instanceof L)
for (c = a.Z; c < a.n.length; c++)
b.push(a.n[c]);
else
for (a = a.split('/'), c = 0; c < a.length; c++)
0 < a[c].length && b.push(a[c]);
return new L(b, 0);
};
g.e = function () {
return this.Z >= this.n.length;
};
g.ca = function (a) {
if (tc(this) !== tc(a))
return !1;
for (var b = this.Z, c = a.Z; b <= this.n.length; b++, c++)
if (this.n[b] !== a.n[c])
return !1;
return !0;
};
g.contains = function (a) {
var b = this.Z, c = a.Z;
if (tc(this) > tc(a))
return !1;
for (; b < this.n.length;) {
if (this.n[b] !== a.n[c])
return !1;
++b;
++c;
}
return !0;
};
var G = new L('');
function vc(a, b) {
this.Ra = a.slice();
this.Ha = Math.max(1, this.Ra.length);
this.lf = b;
for (var c = 0; c < this.Ra.length; c++)
this.Ha += wc(this.Ra[c]);
xc(this);
}
vc.prototype.push = function (a) {
0 < this.Ra.length && (this.Ha += 1);
this.Ra.push(a);
this.Ha += wc(a);
xc(this);
};
vc.prototype.pop = function () {
var a = this.Ra.pop();
this.Ha -= wc(a);
0 < this.Ra.length && --this.Ha;
};
function xc(a) {
if (768 < a.Ha)
throw Error(a.lf + 'has a key path longer than 768 bytes (' + a.Ha + ').');
if (32 < a.Ra.length)
throw Error(a.lf + 'path specified exceeds the maximum depth that can be written (32) or object contains a cycle ' + yc(a));
}
function yc(a) {
return 0 == a.Ra.length ? '' : 'in property \'' + a.Ra.join('.') + '\'';
}
;
function zc() {
this.wc = {};
}
zc.prototype.set = function (a, b) {
null == b ? delete this.wc[a] : this.wc[a] = b;
};
zc.prototype.get = function (a) {
return v(this.wc, a) ? this.wc[a] : null;
};
zc.prototype.remove = function (a) {
delete this.wc[a];
};
zc.prototype.wf = !0;
function Ac(a) {
this.Fc = a;
this.Pd = 'firebase:';
}
g = Ac.prototype;
g.set = function (a, b) {
null == b ? this.Fc.removeItem(this.Pd + a) : this.Fc.setItem(this.Pd + a, B(b));
};
g.get = function (a) {
a = this.Fc.getItem(this.Pd + a);
return null == a ? null : nb(a);
};
g.remove = function (a) {
this.Fc.removeItem(this.Pd + a);
};
g.wf = !1;
g.toString = function () {
return this.Fc.toString();
};
function Bc(a) {
try {
if ('undefined' !== typeof window && 'undefined' !== typeof window[a]) {
var b = window[a];
b.setItem('firebase:sentinel', 'cache');
b.removeItem('firebase:sentinel');
return new Ac(b);
}
} catch (c) {
}
return new zc();
}
var Cc = Bc('localStorage'), P = Bc('sessionStorage');
function Dc(a, b, c, d, e) {
this.host = a.toLowerCase();
this.domain = this.host.substr(this.host.indexOf('.') + 1);
this.lb = b;
this.Db = c;
this.Ug = d;
this.Od = e || '';
this.Pa = Cc.get('host:' + a) || this.host;
}
function Ec(a, b) {
b !== a.Pa && (a.Pa = b, 's-' === a.Pa.substr(0, 2) && Cc.set('host:' + a.host, a.Pa));
}
Dc.prototype.toString = function () {
var a = (this.lb ? 'https://' : 'http://') + this.host;
this.Od && (a += '<' + this.Od + '>');
return a;
};
var Fc = function () {
var a = 1;
return function () {
return a++;
};
}();
function K(a, b) {
if (!a)
throw Gc(b);
}
function Gc(a) {
return Error('Firebase (' + hb + ') INTERNAL ASSERT FAILED: ' + a);
}
function Hc(a) {
try {
var b;
if ('undefined' !== typeof atob)
b = atob(a);
else {
gb();
for (var c = eb, d = [], e = 0; e < a.length;) {
var f = c[a.charAt(e++)], h = e < a.length ? c[a.charAt(e)] : 0;
++e;
var k = e < a.length ? c[a.charAt(e)] : 64;
++e;
var l = e < a.length ? c[a.charAt(e)] : 64;
++e;
if (null == f || null == h || null == k || null == l)
throw Error();
d.push(f << 2 | h >> 4);
64 != k && (d.push(h << 4 & 240 | k >> 2), 64 != l && d.push(k << 6 & 192 | l));
}
if (8192 > d.length)
b = String.fromCharCode.apply(null, d);
else {
a = '';
for (c = 0; c < d.length; c += 8192)
a += String.fromCharCode.apply(null, Wa(d, c, c + 8192));
b = a;
}
}
return b;
} catch (m) {
Cb('base64Decode failed: ', m);
}
return null;
}
function Ic(a) {
var b = Jc(a);
a = new La();
a.update(b);
var b = [], c = 8 * a.ee;
56 > a.ac ? a.update(a.Ld, 56 - a.ac) : a.update(a.Ld, a.Wa - (a.ac - 56));
for (var d = a.Wa - 1; 56 <= d; d--)
a.ne[d] = c & 255, c /= 256;
Ma(a, a.ne);
for (d = c = 0; 5 > d; d++)
for (var e = 24; 0 <= e; e -= 8)
b[c] = a.P[d] >> e & 255, ++c;
return fb(b);
}
function Kc(a) {
for (var b = '', c = 0; c < arguments.length; c++)
b = fa(arguments[c]) ? b + Kc.apply(null, arguments[c]) : 'object' === typeof arguments[c] ? b + B(arguments[c]) : b + arguments[c], b += ' ';
return b;
}
var Bb = null, Lc = !0;
function Cb(a) {
!0 === Lc && (Lc = !1, null === Bb && !0 === P.get('logging_enabled') && Mc(!0));
if (Bb) {
var b = Kc.apply(null, arguments);
Bb(b);
}
}
function Nc(a) {
return function () {
Cb(a, arguments);
};
}
function Oc(a) {
if ('undefined' !== typeof console) {
var b = 'FIREBASE INTERNAL ERROR: ' + Kc.apply(null, arguments);
'undefined' !== typeof console.error ? console.error(b) : console.log(b);
}
}
function Pc(a) {
var b = Kc.apply(null, arguments);
throw Error('FIREBASE FATAL ERROR: ' + b);
}
function Q(a) {
if ('undefined' !== typeof console) {
var b = 'FIREBASE WARNING: ' + Kc.apply(null, arguments);
'undefined' !== typeof console.warn ? console.warn(b) : console.log(b);
}
}
function Qc(a) {
var b = '', c = '', d = '', e = '', f = !0, h = 'https', k = 443;
if (p(a)) {
var l = a.indexOf('//');
0 <= l && (h = a.substring(0, l - 1), a = a.substring(l + 2));
l = a.indexOf('/');
-1 === l && (l = a.length);
b = a.substring(0, l);
e = '';
a = a.substring(l).split('/');
for (l = 0; l < a.length; l++)
if (0 < a[l].length) {
var m = a[l];
try {
m = decodeURIComponent(m.replace(/\+/g, ' '));
} catch (t) {
}
e += '/' + m;
}
a = b.split('.');
3 === a.length ? (c = a[1], d = a[0].toLowerCase()) : 2 === a.length && (c = a[0]);
l = b.indexOf(':');
0 <= l && (f = 'https' === h || 'wss' === h, k = b.substring(l + 1), isFinite(k) && (k = String(k)), k = p(k) ? /^\s*-?0x/i.test(k) ? parseInt(k, 16) : parseInt(k, 10) : NaN);
}
return {
host: b,
port: k,
domain: c,
Rg: d,
lb: f,
scheme: h,
$c: e
};
}
function Rc(a) {
return ga(a) && (a != a || a == Number.POSITIVE_INFINITY || a == Number.NEGATIVE_INFINITY);
}
function Sc(a) {
if ('complete' === document.readyState)
a();
else {
var b = !1, c = function () {
document.body ? b || (b = !0, a()) : setTimeout(c, Math.floor(10));
};
document.addEventListener ? (document.addEventListener('DOMContentLoaded', c, !1), window.addEventListener('load', c, !1)) : document.attachEvent && (document.attachEvent('onreadystatechange', function () {
'complete' === document.readyState && c();
}), window.attachEvent('onload', c));
}
}
function Ub(a, b) {
if (a === b)
return 0;
if ('[MIN_NAME]' === a || '[MAX_NAME]' === b)
return -1;
if ('[MIN_NAME]' === b || '[MAX_NAME]' === a)
return 1;
var c = Tc(a), d = Tc(b);
return null !== c ? null !== d ? 0 == c - d ? a.length - b.length : c - d : -1 : null !== d ? 1 : a < b ? -1 : 1;
}
function Uc(a, b) {
if (b && a in b)
return b[a];
throw Error('Missing required key (' + a + ') in object: ' + B(b));
}
function Vc(a) {
if ('object' !== typeof a || null === a)
return B(a);
var b = [], c;
for (c in a)
b.push(c);
b.sort();
c = '{';
for (var d = 0; d < b.length; d++)
0 !== d && (c += ','), c += B(b[d]), c += ':', c += Vc(a[b[d]]);
return c + '}';
}
function Wc(a, b) {
if (a.length <= b)
return [a];
for (var c = [], d = 0; d < a.length; d += b)
d + b > a ? c.push(a.substring(d, a.length)) : c.push(a.substring(d, d + b));
return c;
}
function Xc(a, b) {
if (ea(a))
for (var c = 0; c < a.length; ++c)
b(c, a[c]);
else
r(a, b);
}
function Yc(a) {
K(!Rc(a), 'Invalid JSON number');
var b, c, d, e;
0 === a ? (d = c = 0, b = -Infinity === 1 / a ? 1 : 0) : (b = 0 > a, a = Math.abs(a), a >= Math.pow(2, -1022) ? (d = Math.min(Math.floor(Math.log(a) / Math.LN2), 1023), c = d + 1023, d = Math.round(a * Math.pow(2, 52 - d) - Math.pow(2, 52))) : (c = 0, d = Math.round(a / Math.pow(2, -1074))));
e = [];
for (a = 52; a; --a)
e.push(d % 2 ? 1 : 0), d = Math.floor(d / 2);
for (a = 11; a; --a)
e.push(c % 2 ? 1 : 0), c = Math.floor(c / 2);
e.push(b ? 1 : 0);
e.reverse();
b = e.join('');
c = '';
for (a = 0; 64 > a; a += 8)
d = parseInt(b.substr(a, 8), 2).toString(16), 1 === d.length && (d = '0' + d), c += d;
return c.toLowerCase();
}
var Zc = /^-?\d{1,10}$/;
function Tc(a) {
return Zc.test(a) && (a = Number(a), -2147483648 <= a && 2147483647 >= a) ? a : null;
}
function Db(a) {
try {
a();
} catch (b) {
setTimeout(function () {
Q('Exception was thrown by user callback.', b.stack || '');
throw b;
}, Math.floor(0));
}
}
function R(a, b) {
if (ha(a)) {
var c = Array.prototype.slice.call(arguments, 1).slice();
Db(function () {
a.apply(null, c);
});
}
}
;
function Jc(a) {
for (var b = [], c = 0, d = 0; d < a.length; d++) {
var e = a.charCodeAt(d);
55296 <= e && 56319 >= e && (e -= 55296, d++, K(d < a.length, 'Surrogate pair missing trail surrogate.'), e = 65536 + (e << 10) + (a.charCodeAt(d) - 56320));
128 > e ? b[c++] = e : (2048 > e ? b[c++] = e >> 6 | 192 : (65536 > e ? b[c++] = e >> 12 | 224 : (b[c++] = e >> 18 | 240, b[c++] = e >> 12 & 63 | 128), b[c++] = e >> 6 & 63 | 128), b[c++] = e & 63 | 128);
}
return b;
}
function wc(a) {
for (var b = 0, c = 0; c < a.length; c++) {
var d = a.charCodeAt(c);
128 > d ? b++ : 2048 > d ? b += 2 : 55296 <= d && 56319 >= d ? (b += 4, c++) : b += 3;
}
return b;
}
;
function $c(a) {
var b = {}, c = {}, d = {}, e = '';
try {
var f = a.split('.'), b = nb(Hc(f[0]) || ''), c = nb(Hc(f[1]) || ''), e = f[2], d = c.d || {};
delete c.d;
} catch (h) {
}
return {
Xg: b,
Bc: c,
data: d,
Og: e
};
}
function ad(a) {
a = $c(a).Bc;
return 'object' === typeof a && a.hasOwnProperty('iat') ? w(a, 'iat') : null;
}
function bd(a) {
a = $c(a);
var b = a.Bc;
return !!a.Og && !!b && 'object' === typeof b && b.hasOwnProperty('iat');
}
;
function cd(a) {
this.V = a;
this.g = a.o.g;
}
function dd(a, b, c, d) {
var e = [], f = [];
Oa(b, function (b) {
'child_changed' === b.type && a.g.Ad(b.Le, b.Ja) && f.push(new D('child_moved', b.Ja, b.Xa));
});
ed(a, e, 'child_removed', b, d, c);
ed(a, e, 'child_added', b, d, c);
ed(a, e, 'child_moved', f, d, c);
ed(a, e, 'child_changed', b, d, c);
ed(a, e, Fb, b, d, c);
return e;
}
function ed(a, b, c, d, e, f) {
d = Pa(d, function (a) {
return a.type === c;
});
Xa(d, q(a.fg, a));
Oa(d, function (c) {
var d = fd(a, c, f);
Oa(e, function (e) {
e.Kf(c.type) && b.push(e.createEvent(d, a.V));
});
});
}
function fd(a, b, c) {
'value' !== b.type && 'child_removed' !== b.type && (b.Qd = c.rf(b.Xa, b.Ja, a.g));
return b;
}
cd.prototype.fg = function (a, b) {
if (null == a.Xa || null == b.Xa)
throw Gc('Should only compare child_ events.');
return this.g.compare(new F(a.Xa, a.Ja), new F(b.Xa, b.Ja));
};
function gd() {
this.bb = {};
}
function hd(a, b) {
var c = b.type, d = b.Xa;
K('child_added' == c || 'child_changed' == c || 'child_removed' == c, 'Only child changes supported for tracking');
K('.priority' !== d, 'Only non-priority child changes can be tracked.');
var e = w(a.bb, d);
if (e) {
var f = e.type;
if ('child_added' == c && 'child_removed' == f)
a.bb[d] = new D('child_changed', b.Ja, d, e.Ja);
else if ('child_removed' == c && 'child_added' == f)
delete a.bb[d];
else if ('child_removed' == c && 'child_changed' == f)
a.bb[d] = new D('child_removed', e.Le, d);
else if ('child_changed' == c && 'child_added' == f)
a.bb[d] = new D('child_added', b.Ja, d);
else if ('child_changed' == c && 'child_changed' == f)
a.bb[d] = new D('child_changed', b.Ja, d, e.Le);
else
throw Gc('Illegal combination of changes: ' + b + ' occurred after ' + e);
} else
a.bb[d] = b;
}
;
function id(a, b, c) {
this.Rb = a;
this.qb = b;
this.sb = c || null;
}
g = id.prototype;
g.Kf = function (a) {
return 'value' === a;
};
g.createEvent = function (a, b) {
var c = b.o.g;
return new Gb('value', this, new S(a.Ja, b.mc(), c));
};
g.Vb = function (a) {
var b = this.sb;
if ('cancel' === a.Ae()) {
K(this.qb, 'Raising a cancel event on a listener with no cancel callback');
var c = this.qb;
return function () {
c.call(b, a.error);
};
}
var d = this.Rb;
return function () {
d.call(b, a.$d);
};
};
g.gf = function (a, b) {
return this.qb ? new Hb(this, a, b) : null;
};
g.matches = function (a) {
return a instanceof id ? a.Rb && this.Rb ? a.Rb === this.Rb && a.sb === this.sb : !0 : !1;
};
g.tf = function () {
return null !== this.Rb;
};
function jd(a, b, c) {
this.ha = a;
this.qb = b;
this.sb = c;
}
g = jd.prototype;
g.Kf = function (a) {
a = 'children_added' === a ? 'child_added' : a;
return ('children_removed' === a ? 'child_removed' : a) in this.ha;
};
g.gf = function (a, b) {
return this.qb ? new Hb(this, a, b) : null;
};
g.createEvent = function (a, b) {
K(null != a.Xa, 'Child events should have a childName.');
var c = b.mc().u(a.Xa);
return new Gb(a.type, this, new S(a.Ja, c, b.o.g), a.Qd);
};
g.Vb = function (a) {
var b = this.sb;
if ('cancel' === a.Ae()) {
K(this.qb, 'Raising a cancel event on a listener with no cancel callback');
var c = this.qb;
return function () {
c.call(b, a.error);
};
}
var d = this.ha[a.ud];
return function () {
d.call(b, a.$d, a.Qd);
};
};
g.matches = function (a) {
if (a instanceof jd) {
if (!this.ha || !a.ha)
return !0;
if (this.sb === a.sb) {
var b = pa(a.ha);
if (b === pa(this.ha)) {
if (1 === b) {
var b = qa(a.ha), c = qa(this.ha);
return c === b && (!a.ha[b] || !this.ha[c] || a.ha[b] === this.ha[c]);
}
return oa(this.ha, function (b, c) {
return a.ha[c] === b;
});
}
}
}
return !1;
};
g.tf = function () {
return null !== this.ha;
};
function kd(a) {
this.g = a;
}
g = kd.prototype;
g.K = function (a, b, c, d, e, f) {
K(a.Jc(this.g), 'A node must be indexed if only a child is updated');
e = a.J(b);
if (e.Y(d).ca(c.Y(d)) && e.e() == c.e())
return a;
null != f && (c.e() ? a.Da(b) ? hd(f, new D('child_removed', e, b)) : K(a.L(), 'A child remove without an old child only makes sense on a leaf node') : e.e() ? hd(f, new D('child_added', c, b)) : hd(f, new D('child_changed', c, b, e)));
return a.L() && c.e() ? a : a.O(b, c).mb(this.g);
};
g.xa = function (a, b, c) {
null != c && (a.L() || a.R(N, function (a, e) {
b.Da(a) || hd(c, new D('child_removed', e, a));
}), b.L() || b.R(N, function (b, e) {
if (a.Da(b)) {
var f = a.J(b);
f.ca(e) || hd(c, new D('child_changed', e, b, f));
} else
hd(c, new D('child_added', e, b));
}));
return b.mb(this.g);
};
g.ga = function (a, b) {
return a.e() ? C : a.ga(b);
};
g.Na = function () {
return !1;
};
g.Wb = function () {
return this;
};
function ld(a) {
this.Ce = new kd(a.g);
this.g = a.g;
var b;
a.ma ? (b = md(a), b = a.g.Pc(nd(a), b)) : b = a.g.Tc();
this.ed = b;
a.pa ? (b = od(a), a = a.g.Pc(pd(a), b)) : a = a.g.Qc();
this.Gc = a;
}
g = ld.prototype;
g.matches = function (a) {
return 0 >= this.g.compare(this.ed, a) && 0 >= this.g.compare(a, this.Gc);
};
g.K = function (a, b, c, d, e, f) {
this.matches(new F(b, c)) || (c = C);
return this.Ce.K(a, b, c, d, e, f);
};
g.xa = function (a, b, c) {
b.L() && (b = C);
var d = b.mb(this.g), d = d.ga(C), e = this;
b.R(N, function (a, b) {
e.matches(new F(a, b)) || (d = d.O(a, C));
});
return this.Ce.xa(a, d, c);
};
g.ga = function (a) {
return a;
};
g.Na = function () {
return !0;
};
g.Wb = function () {
return this.Ce;
};
function qd(a) {
this.sa = new ld(a);
this.g = a.g;
K(a.ja, 'Only valid if limit has been set');
this.ka = a.ka;
this.Jb = !rd(a);
}
g = qd.prototype;
g.K = function (a, b, c, d, e, f) {
this.sa.matches(new F(b, c)) || (c = C);
return a.J(b).ca(c) ? a : a.Eb() < this.ka ? this.sa.Wb().K(a, b, c, d, e, f) : sd(this, a, b, c, e, f);
};
g.xa = function (a, b, c) {
var d;
if (b.L() || b.e())
d = C.mb(this.g);
else if (2 * this.ka < b.Eb() && b.Jc(this.g)) {
d = C.mb(this.g);
b = this.Jb ? b.$b(this.sa.Gc, this.g) : b.Yb(this.sa.ed, this.g);
for (var e = 0; 0 < b.Qa.length && e < this.ka;) {
var f = J(b), h;
if (h = this.Jb ? 0 >= this.g.compare(this.sa.ed, f) : 0 >= this.g.compare(f, this.sa.Gc))
d = d.O(f.name, f.S), e++;
else
break;
}
} else {
d = b.mb(this.g);
d = d.ga(C);
var k, l, m;
if (this.Jb) {
b = d.sf(this.g);
k = this.sa.Gc;
l = this.sa.ed;
var t = td(this.g);
m = function (a, b) {
return t(b, a);
};
} else
b = d.Xb(this.g), k = this.sa.ed, l = this.sa.Gc, m = td(this.g);
for (var e = 0, y = !1; 0 < b.Qa.length;)
f = J(b), !y && 0 >= m(k, f) && (y = !0), (h = y && e < this.ka && 0 >= m(f, l)) ? e++ : d = d.O(f.name, C);
}
return this.sa.Wb().xa(a, d, c);
};
g.ga = function (a) {
return a;
};
g.Na = function () {
return !0;
};
g.Wb = function () {
return this.sa.Wb();
};
function sd(a, b, c, d, e, f) {
var h;
if (a.Jb) {
var k = td(a.g);
h = function (a, b) {
return k(b, a);
};
} else
h = td(a.g);
K(b.Eb() == a.ka, '');
var l = new F(c, d), m = a.Jb ? ud(b, a.g) : vd(b, a.g), t = a.sa.matches(l);
if (b.Da(c)) {
for (var y = b.J(c), m = e.ze(a.g, m, a.Jb); null != m && (m.name == c || b.Da(m.name));)
m = e.ze(a.g, m, a.Jb);
e = null == m ? 1 : h(m, l);
if (t && !d.e() && 0 <= e)
return null != f && hd(f, new D('child_changed', d, c, y)), b.O(c, d);
null != f && hd(f, new D('child_removed', y, c));
b = b.O(c, C);
return null != m && a.sa.matches(m) ? (null != f && hd(f, new D('child_added', m.S, m.name)), b.O(m.name, m.S)) : b;
}
return d.e() ? b : t && 0 <= h(m, l) ? (null != f && (hd(f, new D('child_removed', m.S, m.name)), hd(f, new D('child_added', d, c))), b.O(c, d).O(m.name, C)) : b;
}
;
function wd(a, b) {
this.ke = a;
this.dg = b;
}
function yd(a) {
this.U = a;
}
yd.prototype.ab = function (a, b, c, d) {
var e = new gd(), f;
if (b.type === Xb)
b.source.xe ? c = zd(this, a, b.path, b.Ga, c, d, e) : (K(b.source.pf, 'Unknown source.'), f = b.source.bf, c = Ad(this, a, b.path, b.Ga, c, d, f, e));
else if (b.type === Bd)
b.source.xe ? c = Cd(this, a, b.path, b.children, c, d, e) : (K(b.source.pf, 'Unknown source.'), f = b.source.bf, c = Dd(this, a, b.path, b.children, c, d, f, e));
else if (b.type === Ed)
if (b.Vd)
if (b = b.path, null != c.tc(b))
c = a;
else {
f = new rb(c, a, d);
d = a.Q.j();
if (b.e() || '.priority' === E(b))
Ib(a.C()) ? b = c.za(ub(a)) : (b = a.C().j(), K(b instanceof T, 'serverChildren would be complete if leaf node'), b = c.yc(b)), b = this.U.xa(d, b, e);
else {
var h = E(b), k = c.xc(h, a.C());
null == k && sb(a.C(), h) && (k = d.J(h));
b = null != k ? this.U.K(d, h, k, H(b), f, e) : a.Q.j().Da(h) ? this.U.K(d, h, C, H(b), f, e) : d;
b.e() && Ib(a.C()) && (d = c.za(ub(a)), d.L() && (b = this.U.xa(b, d, e)));
}
d = Ib(a.C()) || null != c.tc(G);
c = Fd(a, b, d, this.U.Na());
}
else
c = Gd(this, a, b.path, b.Qb, c, d, e);
else if (b.type === Zb)
d = b.path, b = a.C(), f = b.j(), h = b.ea || d.e(), c = Hd(this, new Id(a.Q, new tb(f, h, b.Ub)), d, c, qb, e);
else
throw Gc('Unknown operation type: ' + b.type);
e = ra(e.bb);
d = c;
b = d.Q;
b.ea && (f = b.j().L() || b.j().e(), h = Jd(a), (0 < e.length || !a.Q.ea || f && !b.j().ca(h) || !b.j().B().ca(h.B())) && e.push(Eb(Jd(d))));
return new wd(c, e);
};
function Hd(a, b, c, d, e, f) {
var h = b.Q;
if (null != d.tc(c))
return b;
var k;
if (c.e())
K(Ib(b.C()), 'If change path is empty, we must have complete server data'), b.C().Ub ? (e = ub(b), d = d.yc(e instanceof T ? e : C)) : d = d.za(ub(b)), f = a.U.xa(b.Q.j(), d, f);
else {
var l = E(c);
if ('.priority' == l)
K(1 == tc(c), 'Can\'t have a priority with additional path components'), f = h.j(), k = b.C().j(), d = d.ld(c, f, k), f = null != d ? a.U.ga(f, d) : h.j();
else {
var m = H(c);
sb(h, l) ? (k = b.C().j(), d = d.ld(c, h.j(), k), d = null != d ? h.j().J(l).K(m, d) : h.j().J(l)) : d = d.xc(l, b.C());
f = null != d ? a.U.K(h.j(), l, d, m, e, f) : h.j();
}
}
return Fd(b, f, h.ea || c.e(), a.U.Na());
}
function Ad(a, b, c, d, e, f, h, k) {
var l = b.C();
h = h ? a.U : a.U.Wb();
if (c.e())
d = h.xa(l.j(), d, null);
else if (h.Na() && !l.Ub)
d = l.j().K(c, d), d = h.xa(l.j(), d, null);
else {
var m = E(c);
if (!Jb(l, c) && 1 < tc(c))
return b;
var t = H(c);
d = l.j().J(m).K(t, d);
d = '.priority' == m ? h.ga(l.j(), d) : h.K(l.j(), m, d, t, qb, null);
}
l = l.ea || c.e();
b = new Id(b.Q, new tb(d, l, h.Na()));
return Hd(a, b, c, e, new rb(e, b, f), k);
}
function zd(a, b, c, d, e, f, h) {
var k = b.Q;
e = new rb(e, b, f);
if (c.e())
h = a.U.xa(b.Q.j(), d, h), a = Fd(b, h, !0, a.U.Na());
else if (f = E(c), '.priority' === f)
h = a.U.ga(b.Q.j(), d), a = Fd(b, h, k.ea, k.Ub);
else {
c = H(c);
var l = k.j().J(f);
if (!c.e()) {
var m = e.qf(f);
d = null != m ? '.priority' === uc(c) && m.Y(c.parent()).e() ? m : m.K(c, d) : C;
}
l.ca(d) ? a = b : (h = a.U.K(k.j(), f, d, c, e, h), a = Fd(b, h, k.ea, a.U.Na()));
}
return a;
}
function Cd(a, b, c, d, e, f, h) {
var k = b;
Kd(d, function (d, m) {
var t = c.u(d);
sb(b.Q, E(t)) && (k = zd(a, k, t, m, e, f, h));
});
Kd(d, function (d, m) {
var t = c.u(d);
sb(b.Q, E(t)) || (k = zd(a, k, t, m, e, f, h));
});
return k;
}
function Ld(a, b) {
Kd(b, function (b, d) {
a = a.K(b, d);
});
return a;
}
function Dd(a, b, c, d, e, f, h, k) {
if (b.C().j().e() && !Ib(b.C()))
return b;
var l = b;
c = c.e() ? d : Md(Nd, c, d);
var m = b.C().j();
c.children.ia(function (c, d) {
if (m.Da(c)) {
var I = b.C().j().J(c), I = Ld(I, d);
l = Ad(a, l, new L(c), I, e, f, h, k);
}
});
c.children.ia(function (c, d) {
var I = !sb(b.C(), c) && null == d.value;
m.Da(c) || I || (I = b.C().j().J(c), I = Ld(I, d), l = Ad(a, l, new L(c), I, e, f, h, k));
});
return l;
}
function Gd(a, b, c, d, e, f, h) {
if (null != e.tc(c))
return b;
var k = b.C();
if (null != d.value) {
if (c.e() && k.ea || Jb(k, c))
return Ad(a, b, c, k.j().Y(c), e, f, !1, h);
if (c.e()) {
var l = Nd;
k.j().R(Od, function (a, b) {
l = l.set(new L(a), b);
});
return Dd(a, b, c, l, e, f, !1, h);
}
return b;
}
l = Nd;
Kd(d, function (a) {
var b = c.u(a);
Jb(k, b) && (l = l.set(a, k.j().Y(b)));
});
return Dd(a, b, c, l, e, f, !1, h);
}
;
function Pd() {
}
var Qd = {};
function td(a) {
return q(a.compare, a);
}
Pd.prototype.Ad = function (a, b) {
return 0 !== this.compare(new F('[MIN_NAME]', a), new F('[MIN_NAME]', b));
};
Pd.prototype.Tc = function () {
return Rd;
};
function Sd(a) {
this.cc = a;
}
ma(Sd, Pd);
g = Sd.prototype;
g.Ic = function (a) {
return !a.J(this.cc).e();
};
g.compare = function (a, b) {
var c = a.S.J(this.cc), d = b.S.J(this.cc), c = c.Dc(d);
return 0 === c ? Ub(a.name, b.name) : c;
};
g.Pc = function (a, b) {
var c = M(a), c = C.O(this.cc, c);
return new F(b, c);
};
g.Qc = function () {
var a = C.O(this.cc, Td);
return new F('[MAX_NAME]', a);
};
g.toString = function () {
return this.cc;
};
function Ud() {
}
ma(Ud, Pd);
g = Ud.prototype;
g.compare = function (a, b) {
var c = a.S.B(), d = b.S.B(), c = c.Dc(d);
return 0 === c ? Ub(a.name, b.name) : c;
};
g.Ic = function (a) {
return !a.B().e();
};
g.Ad = function (a, b) {
return !a.B().ca(b.B());
};
g.Tc = function () {
return Rd;
};
g.Qc = function () {
return new F('[MAX_NAME]', new sc('[PRIORITY-POST]', Td));
};
g.Pc = function (a, b) {
var c = M(a);
return new F(b, new sc('[PRIORITY-POST]', c));
};
g.toString = function () {
return '.priority';
};
var N = new Ud();
function Vd() {
}
ma(Vd, Pd);
g = Vd.prototype;
g.compare = function (a, b) {
return Ub(a.name, b.name);
};
g.Ic = function () {
throw Gc('KeyIndex.isDefinedOn not expected to be called.');
};
g.Ad = function () {
return !1;
};
g.Tc = function () {
return Rd;
};
g.Qc = function () {
return new F('[MAX_NAME]', C);
};
g.Pc = function (a) {
K(p(a), 'KeyIndex indexValue must always be a string.');
return new F(a, C);
};
g.toString = function () {
return '.key';
};
var Od = new Vd();
function Wd() {
}
ma(Wd, Pd);
g = Wd.prototype;
g.compare = function (a, b) {
var c = a.S.Dc(b.S);
return 0 === c ? Ub(a.name, b.name) : c;
};
g.Ic = function () {
return !0;
};
g.Ad = function (a, b) {
return !a.ca(b);
};
g.Tc = function () {
return Rd;
};
g.Qc = function () {
return Xd;
};
g.Pc = function (a, b) {
var c = M(a);
return new F(b, c);
};
g.toString = function () {
return '.value';
};
var Yd = new Wd();
function Zd() {
this.Tb = this.pa = this.Lb = this.ma = this.ja = !1;
this.ka = 0;
this.Nb = '';
this.ec = null;
this.yb = '';
this.bc = null;
this.wb = '';
this.g = N;
}
var $d = new Zd();
function rd(a) {
return '' === a.Nb ? a.ma : 'l' === a.Nb;
}
function nd(a) {
K(a.ma, 'Only valid if start has been set');
return a.ec;
}
function md(a) {
K(a.ma, 'Only valid if start has been set');
return a.Lb ? a.yb : '[MIN_NAME]';
}
function pd(a) {
K(a.pa, 'Only valid if end has been set');
return a.bc;
}
function od(a) {
K(a.pa, 'Only valid if end has been set');
return a.Tb ? a.wb : '[MAX_NAME]';
}
function ae(a) {
var b = new Zd();
b.ja = a.ja;
b.ka = a.ka;
b.ma = a.ma;
b.ec = a.ec;
b.Lb = a.Lb;
b.yb = a.yb;
b.pa = a.pa;
b.bc = a.bc;
b.Tb = a.Tb;
b.wb = a.wb;
b.g = a.g;
return b;
}
g = Zd.prototype;
g.Ie = function (a) {
var b = ae(this);
b.ja = !0;
b.ka = a;
b.Nb = '';
return b;
};
g.Je = function (a) {
var b = ae(this);
b.ja = !0;
b.ka = a;
b.Nb = 'l';
return b;
};
g.Ke = function (a) {
var b = ae(this);
b.ja = !0;
b.ka = a;
b.Nb = 'r';
return b;
};
g.ae = function (a, b) {
var c = ae(this);
c.ma = !0;
n(a) || (a = null);
c.ec = a;
null != b ? (c.Lb = !0, c.yb = b) : (c.Lb = !1, c.yb = '');
return c;
};
g.td = function (a, b) {
var c = ae(this);
c.pa = !0;
n(a) || (a = null);
c.bc = a;
n(b) ? (c.Tb = !0, c.wb = b) : (c.Zg = !1, c.wb = '');
return c;
};
function be(a, b) {
var c = ae(a);
c.g = b;
return c;
}
function ce(a) {
var b = {};
a.ma && (b.sp = a.ec, a.Lb && (b.sn = a.yb));
a.pa && (b.ep = a.bc, a.Tb && (b.en = a.wb));
if (a.ja) {
b.l = a.ka;
var c = a.Nb;
'' === c && (c = rd(a) ? 'l' : 'r');
b.vf = c;
}
a.g !== N && (b.i = a.g.toString());
return b;
}
function de(a) {
return !(a.ma || a.pa || a.ja);
}
function ee(a) {
var b = {};
if (de(a) && a.g == N)
return b;
var c;
a.g === N ? c = '$priority' : a.g === Yd ? c = '$value' : a.g === Od ? c = '$key' : (K(a.g instanceof Sd, 'Unrecognized index type!'), c = a.g.toString());
b.orderBy = B(c);
a.ma && (b.startAt = B(a.ec), a.Lb && (b.startAt += ',' + B(a.yb)));
a.pa && (b.endAt = B(a.bc), a.Tb && (b.endAt += ',' + B(a.wb)));
a.ja && (rd(a) ? b.limitToFirst = a.ka : b.limitToLast = a.ka);
return b;
}
g.toString = function () {
return B(ce(this));
};
function fe(a, b) {
this.Bd = a;
this.dc = b;
}
fe.prototype.get = function (a) {
var b = w(this.Bd, a);
if (!b)
throw Error('No index defined for ' + a);
return b === Qd ? null : b;
};
function ge(a, b, c) {
var d = na(a.Bd, function (d, f) {
var h = w(a.dc, f);
K(h, 'Missing index implementation for ' + f);
if (d === Qd) {
if (h.Ic(b.S)) {
for (var k = [], l = c.Xb(Sb), m = J(l); m;)
m.name != b.name && k.push(m), m = J(l);
k.push(b);
return he(k, td(h));
}
return Qd;
}
h = c.get(b.name);
k = d;
h && (k = k.remove(new F(b.name, h)));
return k.Oa(b, b.S);
});
return new fe(d, a.dc);
}
function ie(a, b, c) {
var d = na(a.Bd, function (a) {
if (a === Qd)
return a;
var d = c.get(b.name);
return d ? a.remove(new F(b.name, d)) : a;
});
return new fe(d, a.dc);
}
var je = new fe({ '.priority': Qd }, { '.priority': N });
function sc(a, b) {
this.A = a;
K(n(this.A) && null !== this.A, 'LeafNode shouldn\'t be created with null/undefined value.');
this.aa = b || C;
ke(this.aa);
this.Cb = null;
}
var le = [
'object',
'boolean',
'number',
'string'
];
g = sc.prototype;
g.L = function () {
return !0;
};
g.B = function () {
return this.aa;
};
g.ga = function (a) {
return new sc(this.A, a);
};
g.J = function (a) {
return '.priority' === a ? this.aa : C;
};
g.Y = function (a) {
return a.e() ? this : '.priority' === E(a) ? this.aa : C;
};
g.Da = function () {
return !1;
};
g.rf = function () {
return null;
};
g.O = function (a, b) {
return '.priority' === a ? this.ga(b) : b.e() && '.priority' !== a ? this : C.O(a, b).ga(this.aa);
};
g.K = function (a, b) {
var c = E(a);
if (null === c)
return b;
if (b.e() && '.priority' !== c)
return this;
K('.priority' !== c || 1 === tc(a), '.priority must be the last token in a path');
return this.O(c, C.K(H(a), b));
};
g.e = function () {
return !1;
};
g.Eb = function () {
return 0;
};
g.R = function () {
return !1;
};
g.H = function (a) {
return a && !this.B().e() ? {
'.value': this.Ca(),
'.priority': this.B().H()
} : this.Ca();
};
g.hash = function () {
if (null === this.Cb) {
var a = '';
this.aa.e() || (a += 'priority:' + me(this.aa.H()) + ':');
var b = typeof this.A, a = a + (b + ':'), a = 'number' === b ? a + Yc(this.A) : a + this.A;
this.Cb = Ic(a);
}
return this.Cb;
};
g.Ca = function () {
return this.A;
};
g.Dc = function (a) {
if (a === C)
return 1;
if (a instanceof T)
return -1;
K(a.L(), 'Unknown node type');
var b = typeof a.A, c = typeof this.A, d = Na(le, b), e = Na(le, c);
K(0 <= d, 'Unknown leaf type: ' + b);
K(0 <= e, 'Unknown leaf type: ' + c);
return d === e ? 'object' === c ? 0 : this.A < a.A ? -1 : this.A === a.A ? 0 : 1 : e - d;
};
g.mb = function () {
return this;
};
g.Jc = function () {
return !0;
};
g.ca = function (a) {
return a === this ? !0 : a.L() ? this.A === a.A && this.aa.ca(a.aa) : !1;
};
g.toString = function () {
return B(this.H(!0));
};
function T(a, b, c) {
this.m = a;
(this.aa = b) && ke(this.aa);
a.e() && K(!this.aa || this.aa.e(), 'An empty node cannot have a priority');
this.xb = c;
this.Cb = null;
}
g = T.prototype;
g.L = function () {
return !1;
};
g.B = function () {
return this.aa || C;
};
g.ga = function (a) {
return this.m.e() ? this : new T(this.m, a, this.xb);
};
g.J = function (a) {
if ('.priority' === a)
return this.B();
a = this.m.get(a);
return null === a ? C : a;
};
g.Y = function (a) {
var b = E(a);
return null === b ? this : this.J(b).Y(H(a));
};
g.Da = function (a) {
return null !== this.m.get(a);
};
g.O = function (a, b) {
K(b, 'We should always be passing snapshot nodes');
if ('.priority' === a)
return this.ga(b);
var c = new F(a, b), d, e;
b.e() ? (d = this.m.remove(a), c = ie(this.xb, c, this.m)) : (d = this.m.Oa(a, b), c = ge(this.xb, c, this.m));
e = d.e() ? C : this.aa;
return new T(d, e, c);
};
g.K = function (a, b) {
var c = E(a);
if (null === c)
return b;
K('.priority' !== E(a) || 1 === tc(a), '.priority must be the last token in a path');
var d = this.J(c).K(H(a), b);
return this.O(c, d);
};
g.e = function () {
return this.m.e();
};
g.Eb = function () {
return this.m.count();
};
var ne = /^(0|[1-9]\d*)$/;
g = T.prototype;
g.H = function (a) {
if (this.e())
return null;
var b = {}, c = 0, d = 0, e = !0;
this.R(N, function (f, h) {
b[f] = h.H(a);
c++;
e && ne.test(f) ? d = Math.max(d, Number(f)) : e = !1;
});
if (!a && e && d < 2 * c) {
var f = [], h;
for (h in b)
f[h] = b[h];
return f;
}
a && !this.B().e() && (b['.priority'] = this.B().H());
return b;
};
g.hash = function () {
if (null === this.Cb) {
var a = '';
this.B().e() || (a += 'priority:' + me(this.B().H()) + ':');
this.R(N, function (b, c) {
var d = c.hash();
'' !== d && (a += ':' + b + ':' + d);
});
this.Cb = '' === a ? '' : Ic(a);
}
return this.Cb;
};
g.rf = function (a, b, c) {
return (c = oe(this, c)) ? (a = bc(c, new F(a, b))) ? a.name : null : bc(this.m, a);
};
function ud(a, b) {
var c;
c = (c = oe(a, b)) ? (c = c.Sc()) && c.name : a.m.Sc();
return c ? new F(c, a.m.get(c)) : null;
}
function vd(a, b) {
var c;
c = (c = oe(a, b)) ? (c = c.fc()) && c.name : a.m.fc();
return c ? new F(c, a.m.get(c)) : null;
}
g.R = function (a, b) {
var c = oe(this, a);
return c ? c.ia(function (a) {
return b(a.name, a.S);
}) : this.m.ia(b);
};
g.Xb = function (a) {
return this.Yb(a.Tc(), a);
};
g.Yb = function (a, b) {
var c = oe(this, b);
if (c)
return c.Yb(a, function (a) {
return a;
});
for (var c = this.m.Yb(a.name, Sb), d = dc(c); null != d && 0 > b.compare(d, a);)
J(c), d = dc(c);
return c;
};
g.sf = function (a) {
return this.$b(a.Qc(), a);
};
g.$b = function (a, b) {
var c = oe(this, b);
if (c)
return c.$b(a, function (a) {
return a;
});
for (var c = this.m.$b(a.name, Sb), d = dc(c); null != d && 0 < b.compare(d, a);)
J(c), d = dc(c);
return c;
};
g.Dc = function (a) {
return this.e() ? a.e() ? 0 : -1 : a.L() || a.e() ? 1 : a === Td ? -1 : 0;
};
g.mb = function (a) {
if (a === Od || ta(this.xb.dc, a.toString()))
return this;
var b = this.xb, c = this.m;
K(a !== Od, 'KeyIndex always exists and isn\'t meant to be added to the IndexMap.');
for (var d = [], e = !1, c = c.Xb(Sb), f = J(c); f;)
e = e || a.Ic(f.S), d.push(f), f = J(c);
d = e ? he(d, td(a)) : Qd;
e = a.toString();
c = xa(b.dc);
c[e] = a;
a = xa(b.Bd);
a[e] = d;
return new T(this.m, this.aa, new fe(a, c));
};
g.Jc = function (a) {
return a === Od || ta(this.xb.dc, a.toString());
};
g.ca = function (a) {
if (a === this)
return !0;
if (a.L())
return !1;
if (this.B().ca(a.B()) && this.m.count() === a.m.count()) {
var b = this.Xb(N);
a = a.Xb(N);
for (var c = J(b), d = J(a); c && d;) {
if (c.name !== d.name || !c.S.ca(d.S))
return !1;
c = J(b);
d = J(a);
}
return null === c && null === d;
}
return !1;
};
function oe(a, b) {
return b === Od ? null : a.xb.get(b.toString());
}
g.toString = function () {
return B(this.H(!0));
};
function M(a, b) {
if (null === a)
return C;
var c = null;
'object' === typeof a && '.priority' in a ? c = a['.priority'] : 'undefined' !== typeof b && (c = b);
K(null === c || 'string' === typeof c || 'number' === typeof c || 'object' === typeof c && '.sv' in c, 'Invalid priority type found: ' + typeof c);
'object' === typeof a && '.value' in a && null !== a['.value'] && (a = a['.value']);
if ('object' !== typeof a || '.sv' in a)
return new sc(a, M(c));
if (a instanceof Array) {
var d = C, e = a;
r(e, function (a, b) {
if (v(e, b) && '.' !== b.substring(0, 1)) {
var c = M(a);
if (c.L() || !c.e())
d = d.O(b, c);
}
});
return d.ga(M(c));
}
var f = [], h = !1, k = a;
ib(k, function (a) {
if ('string' !== typeof a || '.' !== a.substring(0, 1)) {
var b = M(k[a]);
b.e() || (h = h || !b.B().e(), f.push(new F(a, b)));
}
});
if (0 == f.length)
return C;
var l = he(f, Tb, function (a) {
return a.name;
}, Vb);
if (h) {
var m = he(f, td(N));
return new T(l, M(c), new fe({ '.priority': m }, { '.priority': N }));
}
return new T(l, M(c), je);
}
var pe = Math.log(2);
function qe(a) {
this.count = parseInt(Math.log(a + 1) / pe, 10);
this.jf = this.count - 1;
this.cg = a + 1 & parseInt(Array(this.count + 1).join('1'), 2);
}
function re(a) {
var b = !(a.cg & 1 << a.jf);
a.jf--;
return b;
}
function he(a, b, c, d) {
function e(b, d) {
var f = d - b;
if (0 == f)
return null;
if (1 == f) {
var m = a[b], t = c ? c(m) : m;
return new ec(t, m.S, !1, null, null);
}
var m = parseInt(f / 2, 10) + b, f = e(b, m), y = e(m + 1, d), m = a[m], t = c ? c(m) : m;
return new ec(t, m.S, !1, f, y);
}
a.sort(b);
var f = function (b) {
function d(b, h) {
var k = t - b, y = t;
t -= b;
var y = e(k + 1, y), k = a[k], I = c ? c(k) : k, y = new ec(I, k.S, h, null, y);
f ? f.left = y : m = y;
f = y;
}
for (var f = null, m = null, t = a.length, y = 0; y < b.count; ++y) {
var I = re(b), xd = Math.pow(2, b.count - (y + 1));
I ? d(xd, !1) : (d(xd, !1), d(xd, !0));
}
return m;
}(new qe(a.length));
return null !== f ? new $b(d || b, f) : new $b(d || b);
}
function me(a) {
return 'number' === typeof a ? 'number:' + Yc(a) : 'string:' + a;
}
function ke(a) {
if (a.L()) {
var b = a.H();
K('string' === typeof b || 'number' === typeof b || 'object' === typeof b && v(b, '.sv'), 'Priority must be a string or number.');
} else
K(a === Td || a.e(), 'priority of unexpected type.');
K(a === Td || a.B().e(), 'Priority nodes can\'t have a priority of their own.');
}
var C = new T(new $b(Vb), null, je);
function se() {
T.call(this, new $b(Vb), C, je);
}
ma(se, T);
g = se.prototype;
g.Dc = function (a) {
return a === this ? 0 : 1;
};
g.ca = function (a) {
return a === this;
};
g.B = function () {
return this;
};
g.J = function () {
return C;
};
g.e = function () {
return !1;
};
var Td = new se(), Rd = new F('[MIN_NAME]', C), Xd = new F('[MAX_NAME]', Td);
function Id(a, b) {
this.Q = a;
this.Yd = b;
}
function Fd(a, b, c, d) {
return new Id(new tb(b, c, d), a.Yd);
}
function Jd(a) {
return a.Q.ea ? a.Q.j() : null;
}
Id.prototype.C = function () {
return this.Yd;
};
function ub(a) {
return a.Yd.ea ? a.Yd.j() : null;
}
;
function te(a, b) {
this.V = a;
var c = a.o, d = new kd(c.g), c = de(c) ? new kd(c.g) : c.ja ? new qd(c) : new ld(c);
this.Hf = new yd(c);
var e = b.C(), f = b.Q, h = d.xa(C, e.j(), null), k = c.xa(C, f.j(), null);
this.Ka = new Id(new tb(k, f.ea, c.Na()), new tb(h, e.ea, d.Na()));
this.Ya = [];
this.jg = new cd(a);
}
function ue(a) {
return a.V;
}
g = te.prototype;
g.C = function () {
return this.Ka.C().j();
};
g.gb = function (a) {
var b = ub(this.Ka);
return b && (de(this.V.o) || !a.e() && !b.J(E(a)).e()) ? b.Y(a) : null;
};
g.e = function () {
return 0 === this.Ya.length;
};
g.Pb = function (a) {
this.Ya.push(a);
};
g.kb = function (a, b) {
var c = [];
if (b) {
K(null == a, 'A cancel should cancel all event registrations.');
var d = this.V.path;
Oa(this.Ya, function (a) {
(a = a.gf(b, d)) && c.push(a);
});
}
if (a) {
for (var e = [], f = 0; f < this.Ya.length; ++f) {
var h = this.Ya[f];
if (!h.matches(a))
e.push(h);
else if (a.tf()) {
e = e.concat(this.Ya.slice(f + 1));
break;
}
}
this.Ya = e;
} else
this.Ya = [];
return c;
};
g.ab = function (a, b, c) {
a.type === Bd && null !== a.source.Ib && (K(ub(this.Ka), 'We should always have a full cache before handling merges'), K(Jd(this.Ka), 'Missing event cache, even though we have a server cache'));
var d = this.Ka;
a = this.Hf.ab(d, a, b, c);
b = this.Hf;
c = a.ke;
K(c.Q.j().Jc(b.U.g), 'Event snap not indexed');
K(c.C().j().Jc(b.U.g), 'Server snap not indexed');
K(Ib(a.ke.C()) || !Ib(d.C()), 'Once a server snap is complete, it should never go back');
this.Ka = a.ke;
return ve(this, a.dg, a.ke.Q.j(), null);
};
function we(a, b) {
var c = a.Ka.Q, d = [];
c.j().L() || c.j().R(N, function (a, b) {
d.push(new D('child_added', b, a));
});
c.ea && d.push(Eb(c.j()));
return ve(a, d, c.j(), b);
}
function ve(a, b, c, d) {
return dd(a.jg, b, c, d ? [d] : a.Ya);
}
;
function xe(a, b, c) {
this.type = Bd;
this.source = a;
this.path = b;
this.children = c;
}
xe.prototype.Xc = function (a) {
if (this.path.e())
return a = this.children.subtree(new L(a)), a.e() ? null : a.value ? new Wb(this.source, G, a.value) : new xe(this.source, G, a);
K(E(this.path) === a, 'Can\'t get a merge for a child not on the path of the operation');
return new xe(this.source, H(this.path), this.children);
};
xe.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' merge: ' + this.children.toString() + ')';
};
function ye(a, b) {
this.f = Nc('p:rest:');
this.F = a;
this.Hb = b;
this.Aa = null;
this.$ = {};
}
function ze(a, b) {
if (n(b))
return 'tag$' + b;
var c = a.o;
K(de(c) && c.g == N, 'should have a tag if it\'s not a default query.');
return a.path.toString();
}
g = ye.prototype;
g.yf = function (a, b, c, d) {
var e = a.path.toString();
this.f('Listen called for ' + e + ' ' + a.va());
var f = ze(a, c), h = {};
this.$[f] = h;
a = ee(a.o);
var k = this;
Ae(this, e + '.json', a, function (a, b) {
var t = b;
404 === a && (a = t = null);
null === a && k.Hb(e, t, !1, c);
w(k.$, f) === h && d(a ? 401 == a ? 'permission_denied' : 'rest_error:' + a : 'ok', null);
});
};
g.Pf = function (a, b) {
var c = ze(a, b);
delete this.$[c];
};
g.N = function (a, b) {
this.Aa = a;
var c = $c(a), d = c.data, c = c.Bc && c.Bc.exp;
b && b('ok', {
auth: d,
expires: c
});
};
g.he = function (a) {
this.Aa = null;
a('ok', null);
};
g.Ne = function () {
};
g.Cf = function () {
};
g.Jd = function () {
};
g.put = function () {
};
g.zf = function () {
};
g.Ve = function () {
};
function Ae(a, b, c, d) {
c = c || {};
c.format = 'export';
a.Aa && (c.auth = a.Aa);
var e = (a.F.lb ? 'https://' : 'http://') + a.F.host + b + '?' + kb(c);
a.f('Sending REST request for ' + e);
var f = new XMLHttpRequest();
f.onreadystatechange = function () {
if (d && 4 === f.readyState) {
a.f('REST Response for ' + e + ' received. status:', f.status, 'response:', f.responseText);
var b = null;
if (200 <= f.status && 300 > f.status) {
try {
b = nb(f.responseText);
} catch (c) {
Q('Failed to parse JSON response for ' + e + ': ' + f.responseText);
}
d(null, b);
} else
401 !== f.status && 404 !== f.status && Q('Got unsuccessful REST response for ' + e + ' Status: ' + f.status), d(f.status);
d = null;
}
};
f.open('GET', e, !0);
f.send();
}
;
function Be(a, b) {
this.value = a;
this.children = b || Ce;
}
var Ce = new $b(function (a, b) {
return a === b ? 0 : a < b ? -1 : 1;
});
function De(a) {
var b = Nd;
r(a, function (a, d) {
b = b.set(new L(d), a);
});
return b;
}
g = Be.prototype;
g.e = function () {
return null === this.value && this.children.e();
};
function Ee(a, b, c) {
if (null != a.value && c(a.value))
return {
path: G,
value: a.value
};
if (b.e())
return null;
var d = E(b);
a = a.children.get(d);
return null !== a ? (b = Ee(a, H(b), c), null != b ? {
path: new L(d).u(b.path),
value: b.value
} : null) : null;
}
function Fe(a, b) {
return Ee(a, b, function () {
return !0;
});
}
g.subtree = function (a) {
if (a.e())
return this;
var b = this.children.get(E(a));
return null !== b ? b.subtree(H(a)) : Nd;
};
g.set = function (a, b) {
if (a.e())
return new Be(b, this.children);
var c = E(a), d = (this.children.get(c) || Nd).set(H(a), b), c = this.children.Oa(c, d);
return new Be(this.value, c);
};
g.remove = function (a) {
if (a.e())
return this.children.e() ? Nd : new Be(null, this.children);
var b = E(a), c = this.children.get(b);
return c ? (a = c.remove(H(a)), b = a.e() ? this.children.remove(b) : this.children.Oa(b, a), null === this.value && b.e() ? Nd : new Be(this.value, b)) : this;
};
g.get = function (a) {
if (a.e())
return this.value;
var b = this.children.get(E(a));
return b ? b.get(H(a)) : null;
};
function Md(a, b, c) {
if (b.e())
return c;
var d = E(b);
b = Md(a.children.get(d) || Nd, H(b), c);
d = b.e() ? a.children.remove(d) : a.children.Oa(d, b);
return new Be(a.value, d);
}
function Ge(a, b) {
return He(a, G, b);
}
function He(a, b, c) {
var d = {};
a.children.ia(function (a, f) {
d[a] = He(f, b.u(a), c);
});
return c(b, a.value, d);
}
function Ie(a, b, c) {
return Je(a, b, G, c);
}
function Je(a, b, c, d) {
var e = a.value ? d(c, a.value) : !1;
if (e)
return e;
if (b.e())
return null;
e = E(b);
return (a = a.children.get(e)) ? Je(a, H(b), c.u(e), d) : null;
}
function Ke(a, b, c) {
var d = G;
if (!b.e()) {
var e = !0;
a.value && (e = c(d, a.value));
!0 === e && (e = E(b), (a = a.children.get(e)) && Le(a, H(b), d.u(e), c));
}
}
function Le(a, b, c, d) {
if (b.e())
return a;
a.value && d(c, a.value);
var e = E(b);
return (a = a.children.get(e)) ? Le(a, H(b), c.u(e), d) : Nd;
}
function Kd(a, b) {
Me(a, G, b);
}
function Me(a, b, c) {
a.children.ia(function (a, e) {
Me(e, b.u(a), c);
});
a.value && c(b, a.value);
}
function Ne(a, b) {
a.children.ia(function (a, d) {
d.value && b(a, d.value);
});
}
var Nd = new Be(null);
Be.prototype.toString = function () {
var a = {};
Kd(this, function (b, c) {
a[b.toString()] = c.toString();
});
return B(a);
};
function Oe(a, b, c) {
this.type = Ed;
this.source = Pe;
this.path = a;
this.Qb = b;
this.Vd = c;
}
Oe.prototype.Xc = function (a) {
if (this.path.e()) {
if (null != this.Qb.value)
return K(this.Qb.children.e(), 'affectedTree should not have overlapping affected paths.'), this;
a = this.Qb.subtree(new L(a));
return new Oe(G, a, this.Vd);
}
K(E(this.path) === a, 'operationForChild called for unrelated child.');
return new Oe(H(this.path), this.Qb, this.Vd);
};
Oe.prototype.toString = function () {
return 'Operation(' + this.path + ': ' + this.source.toString() + ' ack write revert=' + this.Vd + ' affectedTree=' + this.Qb + ')';
};
var Xb = 0, Bd = 1, Ed = 2, Zb = 3;
function Qe(a, b, c, d) {
this.xe = a;
this.pf = b;
this.Ib = c;
this.bf = d;
K(!d || b, 'Tagged queries must be from server.');
}
var Pe = new Qe(!0, !1, null, !1), Re = new Qe(!1, !0, null, !1);
Qe.prototype.toString = function () {
return this.xe ? 'user' : this.bf ? 'server(queryID=' + this.Ib + ')' : 'server';
};
function Se(a) {
this.W = a;
}
var Te = new Se(new Be(null));
function Ue(a, b, c) {
if (b.e())
return new Se(new Be(c));
var d = Fe(a.W, b);
if (null != d) {
var e = d.path, d = d.value;
b = O(e, b);
d = d.K(b, c);
return new Se(a.W.set(e, d));
}
a = Md(a.W, b, new Be(c));
return new Se(a);
}
function Ve(a, b, c) {
var d = a;
ib(c, function (a, c) {
d = Ue(d, b.u(a), c);
});
return d;
}
Se.prototype.Rd = function (a) {
if (a.e())
return Te;
a = Md(this.W, a, Nd);
return new Se(a);
};
function We(a, b) {
var c = Fe(a.W, b);
return null != c ? a.W.get(c.path).Y(O(c.path, b)) : null;
}
function Xe(a) {
var b = [], c = a.W.value;
null != c ? c.L() || c.R(N, function (a, c) {
b.push(new F(a, c));
}) : a.W.children.ia(function (a, c) {
null != c.value && b.push(new F(a, c.value));
});
return b;
}
function Ye(a, b) {
if (b.e())
return a;
var c = We(a, b);
return null != c ? new Se(new Be(c)) : new Se(a.W.subtree(b));
}
Se.prototype.e = function () {
return this.W.e();
};
Se.prototype.apply = function (a) {
return Ze(G, this.W, a);
};
function Ze(a, b, c) {
if (null != b.value)
return c.K(a, b.value);
var d = null;
b.children.ia(function (b, f) {
'.priority' === b ? (K(null !== f.value, 'Priority writes must always be leaf nodes'), d = f.value) : c = Ze(a.u(b), f, c);
});
c.Y(a).e() || null === d || (c = c.K(a.u('.priority'), d));
return c;
}
;
function $e() {
this.T = Te;
this.na = [];
this.Mc = -1;
}
function af(a, b) {
for (var c = 0; c < a.na.length; c++) {
var d = a.na[c];
if (d.kd === b)
return d;
}
return null;
}
g = $e.prototype;
g.Rd = function (a) {
var b = Ua(this.na, function (b) {
return b.kd === a;
});
K(0 <= b, 'removeWrite called with nonexistent writeId.');
var c = this.na[b];
this.na.splice(b, 1);
for (var d = c.visible, e = !1, f = this.na.length - 1; d && 0 <= f;) {
var h = this.na[f];
h.visible && (f >= b && bf(h, c.path) ? d = !1 : c.path.contains(h.path) && (e = !0));
f--;
}
if (d) {
if (e)
this.T = cf(this.na, df, G), this.Mc = 0 < this.na.length ? this.na[this.na.length - 1].kd : -1;
else if (c.Ga)
this.T = this.T.Rd(c.path);
else {
var k = this;
r(c.children, function (a, b) {
k.T = k.T.Rd(c.path.u(b));
});
}
return !0;
}
return !1;
};
g.za = function (a, b, c, d) {
if (c || d) {
var e = Ye(this.T, a);
return !d && e.e() ? b : d || null != b || null != We(e, G) ? (e = cf(this.na, function (b) {
return (b.visible || d) && (!c || !(0 <= Na(c, b.kd))) && (b.path.contains(a) || a.contains(b.path));
}, a), b = b || C, e.apply(b)) : null;
}
e = We(this.T, a);
if (null != e)
return e;
e = Ye(this.T, a);
return e.e() ? b : null != b || null != We(e, G) ? (b = b || C, e.apply(b)) : null;
};
g.yc = function (a, b) {
var c = C, d = We(this.T, a);
if (d)
d.L() || d.R(N, function (a, b) {
c = c.O(a, b);
});
else if (b) {
var e = Ye(this.T, a);
b.R(N, function (a, b) {
var d = Ye(e, new L(a)).apply(b);
c = c.O(a, d);
});
Oa(Xe(e), function (a) {
c = c.O(a.name, a.S);
});
} else
e = Ye(this.T, a), Oa(Xe(e), function (a) {
c = c.O(a.name, a.S);
});
return c;
};
g.ld = function (a, b, c, d) {
K(c || d, 'Either existingEventSnap or existingServerSnap must exist');
a = a.u(b);
if (null != We(this.T, a))
return null;
a = Ye(this.T, a);
return a.e() ? d.Y(b) : a.apply(d.Y(b));
};
g.xc = function (a, b, c) {
a = a.u(b);
var d = We(this.T, a);
return null != d ? d : sb(c, b) ? Ye(this.T, a).apply(c.j().J(b)) : null;
};
g.tc = function (a) {
return We(this.T, a);
};
g.oe = function (a, b, c, d, e, f) {
var h;
a = Ye(this.T, a);
h = We(a, G);
if (null == h)
if (null != b)
h = a.apply(b);
else
return [];
h = h.mb(f);
if (h.e() || h.L())
return [];
b = [];
a = td(f);
e = e ? h.$b(c, f) : h.Yb(c, f);
for (f = J(e); f && b.length < d;)
0 !== a(f, c) && b.push(f), f = J(e);
return b;
};
function bf(a, b) {
return a.Ga ? a.path.contains(b) : !!ua(a.children, function (c, d) {
return a.path.u(d).contains(b);
});
}
function df(a) {
return a.visible;
}
function cf(a, b, c) {
for (var d = Te, e = 0; e < a.length; ++e) {
var f = a[e];
if (b(f)) {
var h = f.path;
if (f.Ga)
c.contains(h) ? (h = O(c, h), d = Ue(d, h, f.Ga)) : h.contains(c) && (h = O(h, c), d = Ue(d, G, f.Ga.Y(h)));
else if (f.children)
if (c.contains(h))
h = O(c, h), d = Ve(d, h, f.children);
else {
if (h.contains(c))
if (h = O(h, c), h.e())
d = Ve(d, G, f.children);
else if (f = w(f.children, E(h)))
f = f.Y(H(h)), d = Ue(d, G, f);
}
else
throw Gc('WriteRecord should have .snap or .children');
}
}
return d;
}
function ef(a, b) {
this.Mb = a;
this.W = b;
}
g = ef.prototype;
g.za = function (a, b, c) {
return this.W.za(this.Mb, a, b, c);
};
g.yc = function (a) {
return this.W.yc(this.Mb, a);
};
g.ld = function (a, b, c) {
return this.W.ld(this.Mb, a, b, c);
};
g.tc = function (a) {
return this.W.tc(this.Mb.u(a));
};
g.oe = function (a, b, c, d, e) {
return this.W.oe(this.Mb, a, b, c, d, e);
};
g.xc = function (a, b) {
return this.W.xc(this.Mb, a, b);
};
g.u = function (a) {
return new ef(this.Mb.u(a), this.W);
};
function ff() {
this.ya = {};
}
g = ff.prototype;
g.e = function () {
return wa(this.ya);
};
g.ab = function (a, b, c) {
var d = a.source.Ib;
if (null !== d)
return d = w(this.ya, d), K(null != d, 'SyncTree gave us an op for an invalid query.'), d.ab(a, b, c);
var e = [];
r(this.ya, function (d) {
e = e.concat(d.ab(a, b, c));
});
return e;
};
g.Pb = function (a, b, c, d, e) {
var f = a.va(), h = w(this.ya, f);
if (!h) {
var h = c.za(e ? d : null), k = !1;
h ? k = !0 : (h = d instanceof T ? c.yc(d) : C, k = !1);
h = new te(a, new Id(new tb(h, k, !1), new tb(d, e, !1)));
this.ya[f] = h;
}
h.Pb(b);
return we(h, b);
};
g.kb = function (a, b, c) {
var d = a.va(), e = [], f = [], h = null != gf(this);
if ('default' === d) {
var k = this;
r(this.ya, function (a, d) {
f = f.concat(a.kb(b, c));
a.e() && (delete k.ya[d], de(a.V.o) || e.push(a.V));
});
} else {
var l = w(this.ya, d);
l && (f = f.concat(l.kb(b, c)), l.e() && (delete this.ya[d], de(l.V.o) || e.push(l.V)));
}
h && null == gf(this) && e.push(new U(a.k, a.path));
return {
Ig: e,
kg: f
};
};
function hf(a) {
return Pa(ra(a.ya), function (a) {
return !de(a.V.o);
});
}
g.gb = function (a) {
var b = null;
r(this.ya, function (c) {
b = b || c.gb(a);
});
return b;
};
function jf(a, b) {
if (de(b.o))
return gf(a);
var c = b.va();
return w(a.ya, c);
}
function gf(a) {
return va(a.ya, function (a) {
return de(a.V.o);
}) || null;
}
;
function kf(a) {
this.ta = Nd;
this.jb = new $e();
this.af = {};
this.lc = {};
this.Nc = a;
}
function lf(a, b, c, d, e) {
var f = a.jb, h = e;
K(d > f.Mc, 'Stacking an older write on top of newer ones');
n(h) || (h = !0);
f.na.push({
path: b,
Ga: c,
kd: d,
visible: h
});
h && (f.T = Ue(f.T, b, c));
f.Mc = d;
return e ? mf(a, new Wb(Pe, b, c)) : [];
}
function nf(a, b, c, d) {
var e = a.jb;
K(d > e.Mc, 'Stacking an older merge on top of newer ones');
e.na.push({
path: b,
children: c,
kd: d,
visible: !0
});
e.T = Ve(e.T, b, c);
e.Mc = d;
c = De(c);
return mf(a, new xe(Pe, b, c));
}
function of(a, b, c) {
c = c || !1;
var d = af(a.jb, b);
if (a.jb.Rd(b)) {
var e = Nd;
null != d.Ga ? e = e.set(G, !0) : ib(d.children, function (a, b) {
e = e.set(new L(a), b);
});
return mf(a, new Oe(d.path, e, c));
}
return [];
}
function pf(a, b, c) {
c = De(c);
return mf(a, new xe(Re, b, c));
}
function qf(a, b, c, d) {
d = rf(a, d);
if (null != d) {
var e = sf(d);
d = e.path;
e = e.Ib;
b = O(d, b);
c = new Wb(new Qe(!1, !0, e, !0), b, c);
return tf(a, d, c);
}
return [];
}
function uf(a, b, c, d) {
if (d = rf(a, d)) {
var e = sf(d);
d = e.path;
e = e.Ib;
b = O(d, b);
c = De(c);
c = new xe(new Qe(!1, !0, e, !0), b, c);
return tf(a, d, c);
}
return [];
}
kf.prototype.Pb = function (a, b) {
var c = a.path, d = null, e = !1;
Ke(this.ta, c, function (a, b) {
var f = O(a, c);
d = b.gb(f);
e = e || null != gf(b);
return !d;
});
var f = this.ta.get(c);
f ? (e = e || null != gf(f), d = d || f.gb(G)) : (f = new ff(), this.ta = this.ta.set(c, f));
var h;
null != d ? h = !0 : (h = !1, d = C, Ne(this.ta.subtree(c), function (a, b) {
var c = b.gb(G);
c && (d = d.O(a, c));
}));
var k = null != jf(f, a);
if (!k && !de(a.o)) {
var l = vf(a);
K(!(l in this.lc), 'View does not exist, but we have a tag');
var m = wf++;
this.lc[l] = m;
this.af['_' + m] = l;
}
h = f.Pb(a, b, new ef(c, this.jb), d, h);
k || e || (f = jf(f, a), h = h.concat(xf(this, a, f)));
return h;
};
kf.prototype.kb = function (a, b, c) {
var d = a.path, e = this.ta.get(d), f = [];
if (e && ('default' === a.va() || null != jf(e, a))) {
f = e.kb(a, b, c);
e.e() && (this.ta = this.ta.remove(d));
e = f.Ig;
f = f.kg;
b = -1 !== Ua(e, function (a) {
return de(a.o);
});
var h = Ie(this.ta, d, function (a, b) {
return null != gf(b);
});
if (b && !h && (d = this.ta.subtree(d), !d.e()))
for (var d = yf(d), k = 0; k < d.length; ++k) {
var l = d[k], m = l.V, l = zf(this, l);
this.Nc.Ye(m, Af(this, m), l.xd, l.G);
}
if (!h && 0 < e.length && !c)
if (b)
this.Nc.be(a, null);
else {
var t = this;
Oa(e, function (a) {
a.va();
var b = t.lc[vf(a)];
t.Nc.be(a, b);
});
}
Bf(this, e);
}
return f;
};
kf.prototype.za = function (a, b) {
var c = this.jb, d = Ie(this.ta, a, function (b, c) {
var d = O(b, a);
if (d = c.gb(d))
return d;
});
return c.za(a, d, b, !0);
};
function yf(a) {
return Ge(a, function (a, c, d) {
if (c && null != gf(c))
return [gf(c)];
var e = [];
c && (e = hf(c));
r(d, function (a) {
e = e.concat(a);
});
return e;
});
}
function Bf(a, b) {
for (var c = 0; c < b.length; ++c) {
var d = b[c];
if (!de(d.o)) {
var d = vf(d), e = a.lc[d];
delete a.lc[d];
delete a.af['_' + e];
}
}
}
function xf(a, b, c) {
var d = b.path, e = Af(a, b);
c = zf(a, c);
b = a.Nc.Ye(b, e, c.xd, c.G);
d = a.ta.subtree(d);
if (e)
K(null == gf(d.value), 'If we\'re adding a query, it shouldn\'t be shadowed');
else
for (e = Ge(d, function (a, b, c) {
if (!a.e() && b && null != gf(b))
return [ue(gf(b))];
var d = [];
b && (d = d.concat(Qa(hf(b), function (a) {
return a.V;
})));
r(c, function (a) {
d = d.concat(a);
});
return d;
}), d = 0; d < e.length; ++d)
c = e[d], a.Nc.be(c, Af(a, c));
return b;
}
function zf(a, b) {
var c = b.V, d = Af(a, c);
return {
xd: function () {
return (b.C() || C).hash();
},
G: function (b) {
if ('ok' === b) {
if (d) {
var f = c.path;
if (b = rf(a, d)) {
var h = sf(b);
b = h.path;
h = h.Ib;
f = O(b, f);
f = new Yb(new Qe(!1, !0, h, !0), f);
b = tf(a, b, f);
} else
b = [];
} else
b = mf(a, new Yb(Re, c.path));
return b;
}
f = 'Unknown Error';
'too_big' === b ? f = 'The data requested exceeds the maximum size that can be accessed with a single request.' : 'permission_denied' == b ? f = 'Client doesn\'t have permission to access the desired data.' : 'unavailable' == b && (f = 'The service is unavailable');
f = Error(b + ': ' + f);
f.code = b.toUpperCase();
return a.kb(c, null, f);
}
};
}
function vf(a) {
return a.path.toString() + '$' + a.va();
}
function sf(a) {
var b = a.indexOf('$');
K(-1 !== b && b < a.length - 1, 'Bad queryKey.');
return {
Ib: a.substr(b + 1),
path: new L(a.substr(0, b))
};
}
function rf(a, b) {
var c = a.af, d = '_' + b;
return d in c ? c[d] : void 0;
}
function Af(a, b) {
var c = vf(b);
return w(a.lc, c);
}
var wf = 1;
function tf(a, b, c) {
var d = a.ta.get(b);
K(d, 'Missing sync point for query tag that we\'re tracking');
return d.ab(c, new ef(b, a.jb), null);
}
function mf(a, b) {
return Cf(a, b, a.ta, null, new ef(G, a.jb));
}
function Cf(a, b, c, d, e) {
if (b.path.e())
return Df(a, b, c, d, e);
var f = c.get(G);
null == d && null != f && (d = f.gb(G));
var h = [], k = E(b.path), l = b.Xc(k);
if ((c = c.children.get(k)) && l)
var m = d ? d.J(k) : null, k = e.u(k), h = h.concat(Cf(a, l, c, m, k));
f && (h = h.concat(f.ab(b, e, d)));
return h;
}
function Df(a, b, c, d, e) {
var f = c.get(G);
null == d && null != f && (d = f.gb(G));
var h = [];
c.children.ia(function (c, f) {
var m = d ? d.J(c) : null, t = e.u(c), y = b.Xc(c);
y && (h = h.concat(Df(a, y, f, m, t)));
});
f && (h = h.concat(f.ab(b, e, d)));
return h;
}
;
function Ef() {
this.children = {};
this.nd = 0;
this.value = null;
}
function Ff(a, b, c) {
this.Gd = a ? a : '';
this.Zc = b ? b : null;
this.w = c ? c : new Ef();
}
function Gf(a, b) {
for (var c = b instanceof L ? b : new L(b), d = a, e; null !== (e = E(c));)
d = new Ff(e, d, w(d.w.children, e) || new Ef()), c = H(c);
return d;
}
g = Ff.prototype;
g.Ca = function () {
return this.w.value;
};
function Hf(a, b) {
K('undefined' !== typeof b, 'Cannot set value to undefined');
a.w.value = b;
If(a);
}
g.clear = function () {
this.w.value = null;
this.w.children = {};
this.w.nd = 0;
If(this);
};
g.wd = function () {
return 0 < this.w.nd;
};
g.e = function () {
return null === this.Ca() && !this.wd();
};
g.R = function (a) {
var b = this;
r(this.w.children, function (c, d) {
a(new Ff(d, b, c));
});
};
function Jf(a, b, c, d) {
c && !d && b(a);
a.R(function (a) {
Jf(a, b, !0, d);
});
c && d && b(a);
}
function Kf(a, b) {
for (var c = a.parent(); null !== c && !b(c);)
c = c.parent();
}
g.path = function () {
return new L(null === this.Zc ? this.Gd : this.Zc.path() + '/' + this.Gd);
};
g.name = function () {
return this.Gd;
};
g.parent = function () {
return this.Zc;
};
function If(a) {
if (null !== a.Zc) {
var b = a.Zc, c = a.Gd, d = a.e(), e = v(b.w.children, c);
d && e ? (delete b.w.children[c], b.w.nd--, If(b)) : d || e || (b.w.children[c] = a.w, b.w.nd++, If(b));
}
}
;
function Lf(a) {
K(ea(a) && 0 < a.length, 'Requires a non-empty array');
this.Vf = a;
this.Oc = {};
}
Lf.prototype.ge = function (a, b) {
for (var c = this.Oc[a] || [], d = 0; d < c.length; d++)
c[d].zc.apply(c[d].Ma, Array.prototype.slice.call(arguments, 1));
};
Lf.prototype.Fb = function (a, b, c) {
Mf(this, a);
this.Oc[a] = this.Oc[a] || [];
this.Oc[a].push({
zc: b,
Ma: c
});
(a = this.Be(a)) && b.apply(c, a);
};
Lf.prototype.hc = function (a, b, c) {
Mf(this, a);
a = this.Oc[a] || [];
for (var d = 0; d < a.length; d++)
if (a[d].zc === b && (!c || c === a[d].Ma)) {
a.splice(d, 1);
break;
}
};
function Mf(a, b) {
K(Ta(a.Vf, function (a) {
return a === b;
}), 'Unknown event: ' + b);
}
;
var Nf = function () {
var a = 0, b = [];
return function (c) {
var d = c === a;
a = c;
for (var e = Array(8), f = 7; 0 <= f; f--)
e[f] = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(c % 64), c = Math.floor(c / 64);
K(0 === c, 'Cannot push at time == 0');
c = e.join('');
if (d) {
for (f = 11; 0 <= f && 63 === b[f]; f--)
b[f] = 0;
b[f]++;
} else
for (f = 0; 12 > f; f++)
b[f] = Math.floor(64 * Math.random());
for (f = 0; 12 > f; f++)
c += '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz'.charAt(b[f]);
K(20 === c.length, 'nextPushId: Length should be 20.');
return c;
};
}();
function Of() {
Lf.call(this, ['online']);
this.jc = !0;
if ('undefined' !== typeof window && 'undefined' !== typeof window.addEventListener) {
var a = this;
window.addEventListener('online', function () {
a.jc || (a.jc = !0, a.ge('online', !0));
}, !1);
window.addEventListener('offline', function () {
a.jc && (a.jc = !1, a.ge('online', !1));
}, !1);
}
}
ma(Of, Lf);
Of.prototype.Be = function (a) {
K('online' === a, 'Unknown event type: ' + a);
return [this.jc];
};
ca(Of);
function Pf() {
Lf.call(this, ['visible']);
var a, b;
'undefined' !== typeof document && 'undefined' !== typeof document.addEventListener && ('undefined' !== typeof document.hidden ? (b = 'visibilitychange', a = 'hidden') : 'undefined' !== typeof document.mozHidden ? (b = 'mozvisibilitychange', a = 'mozHidden') : 'undefined' !== typeof document.msHidden ? (b = 'msvisibilitychange', a = 'msHidden') : 'undefined' !== typeof document.webkitHidden && (b = 'webkitvisibilitychange', a = 'webkitHidden'));
this.Ob = !0;
if (b) {
var c = this;
document.addEventListener(b, function () {
var b = !document[a];
b !== c.Ob && (c.Ob = b, c.ge('visible', b));
}, !1);
}
}
ma(Pf, Lf);
Pf.prototype.Be = function (a) {
K('visible' === a, 'Unknown event type: ' + a);
return [this.Ob];
};
ca(Pf);
var Qf = /[\[\].#$\/\u0000-\u001F\u007F]/, Rf = /[\[\].#$\u0000-\u001F\u007F]/, Sf = /^[a-zA-Z][a-zA-Z._\-+]+$/;
function Tf(a) {
return p(a) && 0 !== a.length && !Qf.test(a);
}
function Uf(a) {
return null === a || p(a) || ga(a) && !Rc(a) || ia(a) && v(a, '.sv');
}
function Vf(a, b, c, d) {
d && !n(b) || Wf(z(a, 1, d), b, c);
}
function Wf(a, b, c) {
c instanceof L && (c = new vc(c, a));
if (!n(b))
throw Error(a + 'contains undefined ' + yc(c));
if (ha(b))
throw Error(a + 'contains a function ' + yc(c) + ' with contents: ' + b.toString());
if (Rc(b))
throw Error(a + 'contains ' + b.toString() + ' ' + yc(c));
if (p(b) && b.length > 10485760 / 3 && 10485760 < wc(b))
throw Error(a + 'contains a string greater than 10485760 utf8 bytes ' + yc(c) + ' (\'' + b.substring(0, 50) + '...\')');
if (ia(b)) {
var d = !1, e = !1;
ib(b, function (b, h) {
if ('.value' === b)
d = !0;
else if ('.priority' !== b && '.sv' !== b && (e = !0, !Tf(b)))
throw Error(a + ' contains an invalid key (' + b + ') ' + yc(c) + '.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');
c.push(b);
Wf(a, h, c);
c.pop();
});
if (d && e)
throw Error(a + ' contains ".value" child ' + yc(c) + ' in addition to actual children.');
}
}
function Xf(a, b, c) {
if (!ia(b) || ea(b))
throw Error(z(a, 1, !1) + ' must be an Object containing the children to replace.');
if (v(b, '.value'))
throw Error(z(a, 1, !1) + ' must not contain ".value".  To overwrite with a leaf value, just use .set() instead.');
Vf(a, b, c, !1);
}
function Yf(a, b, c) {
if (Rc(c))
throw Error(z(a, b, !1) + 'is ' + c.toString() + ', but must be a valid Firebase priority (a string, finite number, server value, or null).');
if (!Uf(c))
throw Error(z(a, b, !1) + 'must be a valid Firebase priority (a string, finite number, server value, or null).');
}
function Zf(a, b, c) {
if (!c || n(b))
switch (b) {
case 'value':
case 'child_added':
case 'child_removed':
case 'child_changed':
case 'child_moved':
break;
default:
throw Error(z(a, 1, c) + 'must be a valid event type: "value", "child_added", "child_removed", "child_changed", or "child_moved".');
}
}
function $f(a, b, c, d) {
if ((!d || n(c)) && !Tf(c))
throw Error(z(a, b, d) + 'was an invalid key: "' + c + '".  Firebase keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]").');
}
function ag(a, b) {
if (!p(b) || 0 === b.length || Rf.test(b))
throw Error(z(a, 1, !1) + 'was an invalid path: "' + b + '". Paths must be non-empty strings and can\'t contain ".", "#", "$", "[", or "]"');
}
function bg(a, b) {
if ('.info' === E(b))
throw Error(a + ' failed: Can\'t modify data under /.info/');
}
function cg(a, b) {
if (!p(b))
throw Error(z(a, 1, !1) + 'must be a valid credential (a string).');
}
function dg(a, b, c) {
if (!p(c))
throw Error(z(a, b, !1) + 'must be a valid string.');
}
function eg(a, b) {
dg(a, 1, b);
if (!Sf.test(b))
throw Error(z(a, 1, !1) + '\'' + b + '\' is not a valid authentication provider.');
}
function fg(a, b, c, d) {
if (!d || n(c))
if (!ia(c) || null === c)
throw Error(z(a, b, d) + 'must be a valid object.');
}
function gg(a, b, c) {
if (!ia(b) || !v(b, c))
throw Error(z(a, 1, !1) + 'must contain the key "' + c + '"');
if (!p(w(b, c)))
throw Error(z(a, 1, !1) + 'must contain the key "' + c + '" with type "string"');
}
;
function hg() {
this.set = {};
}
g = hg.prototype;
g.add = function (a, b) {
this.set[a] = null !== b ? b : !0;
};
g.contains = function (a) {
return v(this.set, a);
};
g.get = function (a) {
return this.contains(a) ? this.set[a] : void 0;
};
g.remove = function (a) {
delete this.set[a];
};
g.clear = function () {
this.set = {};
};
g.e = function () {
return wa(this.set);
};
g.count = function () {
return pa(this.set);
};
function ig(a, b) {
r(a.set, function (a, d) {
b(d, a);
});
}
g.keys = function () {
var a = [];
r(this.set, function (b, c) {
a.push(c);
});
return a;
};
function pc() {
this.m = this.A = null;
}
pc.prototype.find = function (a) {
if (null != this.A)
return this.A.Y(a);
if (a.e() || null == this.m)
return null;
var b = E(a);
a = H(a);
return this.m.contains(b) ? this.m.get(b).find(a) : null;
};
pc.prototype.nc = function (a, b) {
if (a.e())
this.A = b, this.m = null;
else if (null !== this.A)
this.A = this.A.K(a, b);
else {
null == this.m && (this.m = new hg());
var c = E(a);
this.m.contains(c) || this.m.add(c, new pc());
c = this.m.get(c);
a = H(a);
c.nc(a, b);
}
};
function jg(a, b) {
if (b.e())
return a.A = null, a.m = null, !0;
if (null !== a.A) {
if (a.A.L())
return !1;
var c = a.A;
a.A = null;
c.R(N, function (b, c) {
a.nc(new L(b), c);
});
return jg(a, b);
}
return null !== a.m ? (c = E(b), b = H(b), a.m.contains(c) && jg(a.m.get(c), b) && a.m.remove(c), a.m.e() ? (a.m = null, !0) : !1) : !0;
}
function qc(a, b, c) {
null !== a.A ? c(b, a.A) : a.R(function (a, e) {
var f = new L(b.toString() + '/' + a);
qc(e, f, c);
});
}
pc.prototype.R = function (a) {
null !== this.m && ig(this.m, function (b, c) {
a(b, c);
});
};
var kg = 'auth.firebase.com';
function lg(a, b, c) {
this.od = a || {};
this.fe = b || {};
this.$a = c || {};
this.od.remember || (this.od.remember = 'default');
}
var mg = [
'remember',
'redirectTo'
];
function ng(a) {
var b = {}, c = {};
ib(a || {}, function (a, e) {
0 <= Na(mg, a) ? b[a] = e : c[a] = e;
});
return new lg(b, {}, c);
}
;
function og(a, b) {
this.Re = [
'session',
a.Od,
a.Db
].join(':');
this.ce = b;
}
og.prototype.set = function (a, b) {
if (!b)
if (this.ce.length)
b = this.ce[0];
else
throw Error('fb.login.SessionManager : No storage options available!');
b.set(this.Re, a);
};
og.prototype.get = function () {
var a = Qa(this.ce, q(this.og, this)), a = Pa(a, function (a) {
return null !== a;
});
Xa(a, function (a, c) {
return ad(c.token) - ad(a.token);
});
return 0 < a.length ? a.shift() : null;
};
og.prototype.og = function (a) {
try {
var b = a.get(this.Re);
if (b && b.token)
return b;
} catch (c) {
}
return null;
};
og.prototype.clear = function () {
var a = this;
Oa(this.ce, function (b) {
b.remove(a.Re);
});
};
function pg() {
return 'undefined' !== typeof navigator && 'string' === typeof navigator.userAgent ? navigator.userAgent : '';
}
function qg() {
return 'undefined' !== typeof window && !!(window.cordova || window.phonegap || window.PhoneGap) && /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(pg());
}
function rg() {
return 'undefined' !== typeof location && /^file:\//.test(location.href);
}
function sg(a) {
var b = pg();
if ('' === b)
return !1;
if ('Microsoft Internet Explorer' === navigator.appName) {
if ((b = b.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/)) && 1 < b.length)
return parseFloat(b[1]) >= a;
} else if (-1 < b.indexOf('Trident') && (b = b.match(/rv:([0-9]{2,2}[\.0-9]{0,})/)) && 1 < b.length)
return parseFloat(b[1]) >= a;
return !1;
}
;
function tg() {
var a = window.opener.frames, b;
for (b = a.length - 1; 0 <= b; b--)
try {
if (a[b].location.protocol === window.location.protocol && a[b].location.host === window.location.host && '__winchan_relay_frame' === a[b].name)
return a[b];
} catch (c) {
}
return null;
}
function ug(a, b, c) {
a.attachEvent ? a.attachEvent('on' + b, c) : a.addEventListener && a.addEventListener(b, c, !1);
}
function vg(a, b, c) {
a.detachEvent ? a.detachEvent('on' + b, c) : a.removeEventListener && a.removeEventListener(b, c, !1);
}
function wg(a) {
/^https?:\/\//.test(a) || (a = window.location.href);
var b = /^(https?:\/\/[\-_a-zA-Z\.0-9:]+)/.exec(a);
return b ? b[1] : a;
}
function xg(a) {
var b = '';
try {
a = a.replace('#', '');
var c = lb(a);
c && v(c, '__firebase_request_key') && (b = w(c, '__firebase_request_key'));
} catch (d) {
}
return b;
}
function yg() {
var a = Qc(kg);
return a.scheme + '://' + a.host + '/v2';
}
function zg(a) {
return yg() + '/' + a + '/auth/channel';
}
;
function Ag(a) {
var b = this;
this.Ac = a;
this.de = '*';
sg(8) ? this.Rc = this.zd = tg() : (this.Rc = window.opener, this.zd = window);
if (!b.Rc)
throw 'Unable to find relay frame';
ug(this.zd, 'message', q(this.ic, this));
ug(this.zd, 'message', q(this.Bf, this));
try {
Bg(this, { a: 'ready' });
} catch (c) {
ug(this.Rc, 'load', function () {
Bg(b, { a: 'ready' });
});
}
ug(window, 'unload', q(this.zg, this));
}
function Bg(a, b) {
b = B(b);
sg(8) ? a.Rc.doPost(b, a.de) : a.Rc.postMessage(b, a.de);
}
Ag.prototype.ic = function (a) {
var b = this, c;
try {
c = nb(a.data);
} catch (d) {
}
c && 'request' === c.a && (vg(window, 'message', this.ic), this.de = a.origin, this.Ac && setTimeout(function () {
b.Ac(b.de, c.d, function (a, c) {
b.bg = !c;
b.Ac = void 0;
Bg(b, {
a: 'response',
d: a,
forceKeepWindowOpen: c
});
});
}, 0));
};
Ag.prototype.zg = function () {
try {
vg(this.zd, 'message', this.Bf);
} catch (a) {
}
this.Ac && (Bg(this, {
a: 'error',
d: 'unknown closed window'
}), this.Ac = void 0);
try {
window.close();
} catch (b) {
}
};
Ag.prototype.Bf = function (a) {
if (this.bg && 'die' === a.data)
try {
window.close();
} catch (b) {
}
};
function Cg(a) {
this.pc = Ga() + Ga() + Ga();
this.Ef = a;
}
Cg.prototype.open = function (a, b) {
P.set('redirect_request_id', this.pc);
P.set('redirect_request_id', this.pc);
b.requestId = this.pc;
b.redirectTo = b.redirectTo || window.location.href;
a += (/\?/.test(a) ? '' : '?') + kb(b);
window.location = a;
};
Cg.isAvailable = function () {
return !rg() && !qg();
};
Cg.prototype.Cc = function () {
return 'redirect';
};
var Dg = {
NETWORK_ERROR: 'Unable to contact the Firebase server.',
SERVER_ERROR: 'An unknown server error occurred.',
TRANSPORT_UNAVAILABLE: 'There are no login transports available for the requested method.',
REQUEST_INTERRUPTED: 'The browser redirected the page before the login request could complete.',
USER_CANCELLED: 'The user cancelled authentication.'
};
function Eg(a) {
var b = Error(w(Dg, a), a);
b.code = a;
return b;
}
;
function Fg(a) {
var b;
(b = !a.window_features) || (b = pg(), b = -1 !== b.indexOf('Fennec/') || -1 !== b.indexOf('Firefox/') && -1 !== b.indexOf('Android'));
b && (a.window_features = void 0);
a.window_name || (a.window_name = '_blank');
this.options = a;
}
Fg.prototype.open = function (a, b, c) {
function d(a) {
h && (document.body.removeChild(h), h = void 0);
t && (t = clearInterval(t));
vg(window, 'message', e);
vg(window, 'unload', d);
if (m && !a)
try {
m.close();
} catch (b) {
k.postMessage('die', l);
}
m = k = void 0;
}
function e(a) {
if (a.origin === l)
try {
var b = nb(a.data);
'ready' === b.a ? k.postMessage(y, l) : 'error' === b.a ? (d(!1), c && (c(b.d), c = null)) : 'response' === b.a && (d(b.forceKeepWindowOpen), c && (c(null, b.d), c = null));
} catch (e) {
}
}
var f = sg(8), h, k;
if (!this.options.relay_url)
return c(Error('invalid arguments: origin of url and relay_url must match'));
var l = wg(a);
if (l !== wg(this.options.relay_url))
c && setTimeout(function () {
c(Error('invalid arguments: origin of url and relay_url must match'));
}, 0);
else {
f && (h = document.createElement('iframe'), h.setAttribute('src', this.options.relay_url), h.style.display = 'none', h.setAttribute('name', '__winchan_relay_frame'), document.body.appendChild(h), k = h.contentWindow);
a += (/\?/.test(a) ? '' : '?') + kb(b);
var m = window.open(a, this.options.window_name, this.options.window_features);
k || (k = m);
var t = setInterval(function () {
m && m.closed && (d(!1), c && (c(Eg('USER_CANCELLED')), c = null));
}, 500), y = B({
a: 'request',
d: b
});
ug(window, 'unload', d);
ug(window, 'message', e);
}
};
Fg.isAvailable = function () {
var a;
if (a = 'postMessage' in window && !rg())
(a = qg() || 'undefined' !== typeof navigator && (!!pg().match(/Windows Phone/) || !!window.Windows && /^ms-appx:/.test(location.href))) || (a = pg(), a = 'undefined' !== typeof navigator && 'undefined' !== typeof window && !!(a.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i) || a.match(/CriOS/) || a.match(/Twitter for iPhone/) || a.match(/FBAN\/FBIOS/) || window.navigator.standalone)), a = !a;
return a && !pg().match(/PhantomJS/);
};
Fg.prototype.Cc = function () {
return 'popup';
};
function Gg(a) {
a.method || (a.method = 'GET');
a.headers || (a.headers = {});
a.headers.content_type || (a.headers.content_type = 'application/json');
a.headers.content_type = a.headers.content_type.toLowerCase();
this.options = a;
}
Gg.prototype.open = function (a, b, c) {
function d() {
c && (c(Eg('REQUEST_INTERRUPTED')), c = null);
}
var e = new XMLHttpRequest(), f = this.options.method.toUpperCase(), h;
ug(window, 'beforeunload', d);
e.onreadystatechange = function () {
if (c && 4 === e.readyState) {
var a;
if (200 <= e.status && 300 > e.status) {
try {
a = nb(e.responseText);
} catch (b) {
}
c(null, a);
} else
500 <= e.status && 600 > e.status ? c(Eg('SERVER_ERROR')) : c(Eg('NETWORK_ERROR'));
c = null;
vg(window, 'beforeunload', d);
}
};
if ('GET' === f)
a += (/\?/.test(a) ? '' : '?') + kb(b), h = null;
else {
var k = this.options.headers.content_type;
'application/json' === k && (h = B(b));
'application/x-www-form-urlencoded' === k && (h = kb(b));
}
e.open(f, a, !0);
a = {
'X-Requested-With': 'XMLHttpRequest',
Accept: 'application/json;text/plain'
};
za(a, this.options.headers);
for (var l in a)
e.setRequestHeader(l, a[l]);
e.send(h);
};
Gg.isAvailable = function () {
var a;
if (a = !!window.XMLHttpRequest)
a = pg(), a = !(a.match(/MSIE/) || a.match(/Trident/)) || sg(10);
return a;
};
Gg.prototype.Cc = function () {
return 'json';
};
function Hg(a) {
this.pc = Ga() + Ga() + Ga();
this.Ef = a;
}
Hg.prototype.open = function (a, b, c) {
function d() {
c && (c(Eg('USER_CANCELLED')), c = null);
}
var e = this, f = Qc(kg), h;
b.requestId = this.pc;
b.redirectTo = f.scheme + '://' + f.host + '/blank/page.html';
a += /\?/.test(a) ? '' : '?';
a += kb(b);
(h = window.open(a, '_blank', 'location=no')) && ha(h.addEventListener) ? (h.addEventListener('loadstart', function (a) {
var b;
if (b = a && a.url)
a: {
try {
var m = document.createElement('a');
m.href = a.url;
b = m.host === f.host && '/blank/page.html' === m.pathname;
break a;
} catch (t) {
}
b = !1;
}
b && (a = xg(a.url), h.removeEventListener('exit', d), h.close(), a = new lg(null, null, {
requestId: e.pc,
requestKey: a
}), e.Ef.requestWithCredential('/auth/session', a, c), c = null);
}), h.addEventListener('exit', d)) : c(Eg('TRANSPORT_UNAVAILABLE'));
};
Hg.isAvailable = function () {
return qg();
};
Hg.prototype.Cc = function () {
return 'redirect';
};
function Ig(a) {
a.callback_parameter || (a.callback_parameter = 'callback');
this.options = a;
window.__firebase_auth_jsonp = window.__firebase_auth_jsonp || {};
}
Ig.prototype.open = function (a, b, c) {
function d() {
c && (c(Eg('REQUEST_INTERRUPTED')), c = null);
}
function e() {
setTimeout(function () {
window.__firebase_auth_jsonp[f] = void 0;
wa(window.__firebase_auth_jsonp) && (window.__firebase_auth_jsonp = void 0);
try {
var a = document.getElementById(f);
a && a.parentNode.removeChild(a);
} catch (b) {
}
}, 1);
vg(window, 'beforeunload', d);
}
var f = 'fn' + new Date().getTime() + Math.floor(99999 * Math.random());
b[this.options.callback_parameter] = '__firebase_auth_jsonp.' + f;
a += (/\?/.test(a) ? '' : '?') + kb(b);
ug(window, 'beforeunload', d);
window.__firebase_auth_jsonp[f] = function (a) {
c && (c(null, a), c = null);
e();
};
Jg(f, a, c);
};
function Jg(a, b, c) {
setTimeout(function () {
try {
var d = document.createElement('script');
d.type = 'text/javascript';
d.id = a;
d.async = !0;
d.src = b;
d.onerror = function () {
var b = document.getElementById(a);
null !== b && b.parentNode.removeChild(b);
c && c(Eg('NETWORK_ERROR'));
};
var e = document.getElementsByTagName('head');
(e && 0 != e.length ? e[0] : document.documentElement).appendChild(d);
} catch (f) {
c && c(Eg('NETWORK_ERROR'));
}
}, 0);
}
Ig.isAvailable = function () {
return 'undefined' !== typeof document && null != document.createElement;
};
Ig.prototype.Cc = function () {
return 'json';
};
function Kg(a, b, c, d) {
Lf.call(this, ['auth_status']);
this.F = a;
this.ef = b;
this.Tg = c;
this.Me = d;
this.sc = new og(a, [
Cc,
P
]);
this.nb = null;
this.Te = !1;
Lg(this);
}
ma(Kg, Lf);
g = Kg.prototype;
g.ye = function () {
return this.nb || null;
};
function Lg(a) {
P.get('redirect_request_id') && Mg(a);
var b = a.sc.get();
b && b.token ? (Ng(a, b), a.ef(b.token, function (c, d) {
Og(a, c, d, !1, b.token, b);
}, function (b, d) {
Pg(a, 'resumeSession()', b, d);
})) : Ng(a, null);
}
function Qg(a, b, c, d, e, f) {
'firebaseio-demo.com' === a.F.domain && Q('Firebase authentication is not supported on demo Firebases (*.firebaseio-demo.com). To secure your Firebase, create a production Firebase at https://www.firebase.com.');
a.ef(b, function (f, k) {
Og(a, f, k, !0, b, c, d || {}, e);
}, function (b, c) {
Pg(a, 'auth()', b, c, f);
});
}
function Rg(a, b) {
a.sc.clear();
Ng(a, null);
a.Tg(function (a, d) {
if ('ok' === a)
R(b, null);
else {
var e = (a || 'error').toUpperCase(), f = e;
d && (f += ': ' + d);
f = Error(f);
f.code = e;
R(b, f);
}
});
}
function Og(a, b, c, d, e, f, h, k) {
'ok' === b ? (d && (b = c.auth, f.auth = b, f.expires = c.expires, f.token = bd(e) ? e : '', c = null, b && v(b, 'uid') ? c = w(b, 'uid') : v(f, 'uid') && (c = w(f, 'uid')), f.uid = c, c = 'custom', b && v(b, 'provider') ? c = w(b, 'provider') : v(f, 'provider') && (c = w(f, 'provider')), f.provider = c, a.sc.clear(), bd(e) && (h = h || {}, c = Cc, 'sessionOnly' === h.remember && (c = P), 'none' !== h.remember && a.sc.set(f, c)), Ng(a, f)), R(k, null, f)) : (a.sc.clear(), Ng(a, null), f = a = (b || 'error').toUpperCase(), c && (f += ': ' + c), f = Error(f), f.code = a, R(k, f));
}
function Pg(a, b, c, d, e) {
Q(b + ' was canceled: ' + d);
a.sc.clear();
Ng(a, null);
a = Error(d);
a.code = c.toUpperCase();
R(e, a);
}
function Sg(a, b, c, d, e) {
Tg(a);
c = new lg(d || {}, {}, c || {});
Ug(a, [
Gg,
Ig
], '/auth/' + b, c, e);
}
function Vg(a, b, c, d) {
Tg(a);
var e = [
Fg,
Hg
];
c = ng(c);
'anonymous' === b || 'password' === b ? setTimeout(function () {
R(d, Eg('TRANSPORT_UNAVAILABLE'));
}, 0) : (c.fe.window_features = 'menubar=yes,modal=yes,alwaysRaised=yeslocation=yes,resizable=yes,scrollbars=yes,status=yes,height=625,width=625,top=' + ('object' === typeof screen ? 0.5 * (screen.height - 625) : 0) + ',left=' + ('object' === typeof screen ? 0.5 * (screen.width - 625) : 0), c.fe.relay_url = zg(a.F.Db), c.fe.requestWithCredential = q(a.qc, a), Ug(a, e, '/auth/' + b, c, d));
}
function Mg(a) {
var b = P.get('redirect_request_id');
if (b) {
var c = P.get('redirect_client_options');
P.remove('redirect_request_id');
P.remove('redirect_client_options');
var d = [
Gg,
Ig
], b = {
requestId: b,
requestKey: xg(document.location.hash)
}, c = new lg(c, {}, b);
a.Te = !0;
try {
document.location.hash = document.location.hash.replace(/&__firebase_request_key=([a-zA-z0-9]*)/, '');
} catch (e) {
}
Ug(a, d, '/auth/session', c, function () {
this.Te = !1;
}.bind(a));
}
}
g.te = function (a, b) {
Tg(this);
var c = ng(a);
c.$a._method = 'POST';
this.qc('/users', c, function (a, c) {
a ? R(b, a) : R(b, a, c);
});
};
g.Ue = function (a, b) {
var c = this;
Tg(this);
var d = '/users/' + encodeURIComponent(a.email), e = ng(a);
e.$a._method = 'DELETE';
this.qc(d, e, function (a, d) {
!a && d && d.uid && c.nb && c.nb.uid && c.nb.uid === d.uid && Rg(c);
R(b, a);
});
};
g.qe = function (a, b) {
Tg(this);
var c = '/users/' + encodeURIComponent(a.email) + '/password', d = ng(a);
d.$a._method = 'PUT';
d.$a.password = a.newPassword;
this.qc(c, d, function (a) {
R(b, a);
});
};
g.pe = function (a, b) {
Tg(this);
var c = '/users/' + encodeURIComponent(a.oldEmail) + '/email', d = ng(a);
d.$a._method = 'PUT';
d.$a.email = a.newEmail;
d.$a.password = a.password;
this.qc(c, d, function (a) {
R(b, a);
});
};
g.We = function (a, b) {
Tg(this);
var c = '/users/' + encodeURIComponent(a.email) + '/password', d = ng(a);
d.$a._method = 'POST';
this.qc(c, d, function (a) {
R(b, a);
});
};
g.qc = function (a, b, c) {
Wg(this, [
Gg,
Ig
], a, b, c);
};
function Ug(a, b, c, d, e) {
Wg(a, b, c, d, function (b, c) {
!b && c && c.token && c.uid ? Qg(a, c.token, c, d.od, function (a, b) {
a ? R(e, a) : R(e, null, b);
}) : R(e, b || Eg('UNKNOWN_ERROR'));
});
}
function Wg(a, b, c, d, e) {
b = Pa(b, function (a) {
return 'function' === typeof a.isAvailable && a.isAvailable();
});
0 === b.length ? setTimeout(function () {
R(e, Eg('TRANSPORT_UNAVAILABLE'));
}, 0) : (b = new (b.shift())(d.fe), d = jb(d.$a), d.v = 'js-' + hb, d.transport = b.Cc(), d.suppress_status_codes = !0, a = yg() + '/' + a.F.Db + c, b.open(a, d, function (a, b) {
if (a)
R(e, a);
else if (b && b.error) {
var c = Error(b.error.message);
c.code = b.error.code;
c.details = b.error.details;
R(e, c);
} else
R(e, null, b);
}));
}
function Ng(a, b) {
var c = null !== a.nb || null !== b;
a.nb = b;
c && a.ge('auth_status', b);
a.Me(null !== b);
}
g.Be = function (a) {
K('auth_status' === a, 'initial event must be of type "auth_status"');
return this.Te ? null : [this.nb];
};
function Tg(a) {
var b = a.F;
if ('firebaseio.com' !== b.domain && 'firebaseio-demo.com' !== b.domain && 'auth.firebase.com' === kg)
throw Error('This custom Firebase server (\'' + a.F.domain + '\') does not support delegated login.');
}
;
function Xg(a) {
this.ic = a;
this.Nd = [];
this.Sb = 0;
this.re = -1;
this.Gb = null;
}
function Yg(a, b, c) {
a.re = b;
a.Gb = c;
a.re < a.Sb && (a.Gb(), a.Gb = null);
}
function Zg(a, b, c) {
for (a.Nd[b] = c; a.Nd[a.Sb];) {
var d = a.Nd[a.Sb];
delete a.Nd[a.Sb];
for (var e = 0; e < d.length; ++e)
if (d[e]) {
var f = a;
Db(function () {
f.ic(d[e]);
});
}
if (a.Sb === a.re) {
a.Gb && (clearTimeout(a.Gb), a.Gb(), a.Gb = null);
break;
}
a.Sb++;
}
}
;
function $g(a, b, c) {
this.se = a;
this.f = Nc(a);
this.ob = this.pb = 0;
this.Va = Qb(b);
this.Zd = c;
this.Hc = !1;
this.jd = function (a) {
b.host !== b.Pa && (a.ns = b.Db);
var c = [], f;
for (f in a)
a.hasOwnProperty(f) && c.push(f + '=' + a[f]);
return (b.lb ? 'https://' : 'http://') + b.Pa + '/.lp?' + c.join('&');
};
}
var ah, bh;
$g.prototype.open = function (a, b) {
this.hf = 0;
this.la = b;
this.Af = new Xg(a);
this.Ab = !1;
var c = this;
this.rb = setTimeout(function () {
c.f('Timed out trying to connect.');
c.hb();
c.rb = null;
}, Math.floor(30000));
Sc(function () {
if (!c.Ab) {
c.Ta = new ch(function (a, b, d, k, l) {
dh(c, arguments);
if (c.Ta)
if (c.rb && (clearTimeout(c.rb), c.rb = null), c.Hc = !0, 'start' == a)
c.id = b, c.Gf = d;
else if ('close' === a)
b ? (c.Ta.Xd = !1, Yg(c.Af, b, function () {
c.hb();
})) : c.hb();
else
throw Error('Unrecognized command received: ' + a);
}, function (a, b) {
dh(c, arguments);
Zg(c.Af, a, b);
}, function () {
c.hb();
}, c.jd);
var a = { start: 't' };
a.ser = Math.floor(100000000 * Math.random());
c.Ta.ie && (a.cb = c.Ta.ie);
a.v = '5';
c.Zd && (a.s = c.Zd);
'undefined' !== typeof location && location.href && -1 !== location.href.indexOf('firebaseio.com') && (a.r = 'f');
a = c.jd(a);
c.f('Connecting via long-poll to ' + a);
eh(c.Ta, a, function () {
});
}
});
};
$g.prototype.start = function () {
var a = this.Ta, b = this.Gf;
a.sg = this.id;
a.tg = b;
for (a.me = !0; fh(a););
a = this.id;
b = this.Gf;
this.gc = document.createElement('iframe');
var c = { dframe: 't' };
c.id = a;
c.pw = b;
this.gc.src = this.jd(c);
this.gc.style.display = 'none';
document.body.appendChild(this.gc);
};
$g.isAvailable = function () {
return ah || !bh && 'undefined' !== typeof document && null != document.createElement && !('object' === typeof window && window.chrome && window.chrome.extension && !/^chrome/.test(window.location.href)) && !('object' === typeof Windows && 'object' === typeof Windows.Vg) && !0;
};
g = $g.prototype;
g.Ed = function () {
};
g.dd = function () {
this.Ab = !0;
this.Ta && (this.Ta.close(), this.Ta = null);
this.gc && (document.body.removeChild(this.gc), this.gc = null);
this.rb && (clearTimeout(this.rb), this.rb = null);
};
g.hb = function () {
this.Ab || (this.f('Longpoll is closing itself'), this.dd(), this.la && (this.la(this.Hc), this.la = null));
};
g.close = function () {
this.Ab || (this.f('Longpoll is being closed.'), this.dd());
};
g.send = function (a) {
a = B(a);
this.pb += a.length;
Nb(this.Va, 'bytes_sent', a.length);
a = Jc(a);
a = fb(a, !0);
a = Wc(a, 1840);
for (var b = 0; b < a.length; b++) {
var c = this.Ta;
c.ad.push({
Kg: this.hf,
Sg: a.length,
kf: a[b]
});
c.me && fh(c);
this.hf++;
}
};
function dh(a, b) {
var c = B(b).length;
a.ob += c;
Nb(a.Va, 'bytes_received', c);
}
function ch(a, b, c, d) {
this.jd = d;
this.ib = c;
this.Qe = new hg();
this.ad = [];
this.ue = Math.floor(100000000 * Math.random());
this.Xd = !0;
this.ie = Fc();
window['pLPCommand' + this.ie] = a;
window['pRTLPCB' + this.ie] = b;
a = document.createElement('iframe');
a.style.display = 'none';
if (document.body) {
document.body.appendChild(a);
try {
a.contentWindow.document || Cb('No IE domain setting required');
} catch (e) {
a.src = 'javascript:void((function(){document.open();document.domain=\'' + document.domain + '\';document.close();})())';
}
} else
throw 'Document body has not initialized. Wait to initialize Firebase until after the document is ready.';
a.contentDocument ? a.fb = a.contentDocument : a.contentWindow ? a.fb = a.contentWindow.document : a.document && (a.fb = a.document);
this.Ea = a;
a = '';
this.Ea.src && 'javascript:' === this.Ea.src.substr(0, 11) && (a = '<sc' + 'ript>document.domain="' + document.domain + '";</sc' + 'ript>');
a = '<html><body>' + a + '</body></html>';
try {
this.Ea.fb.open(), this.Ea.fb.write(a), this.Ea.fb.close();
} catch (f) {
Cb('frame writing exception'), f.stack && Cb(f.stack), Cb(f);
}
}
ch.prototype.close = function () {
this.me = !1;
if (this.Ea) {
this.Ea.fb.body.innerHTML = '';
var a = this;
setTimeout(function () {
null !== a.Ea && (document.body.removeChild(a.Ea), a.Ea = null);
}, Math.floor(0));
}
var b = this.ib;
b && (this.ib = null, b());
};
function fh(a) {
if (a.me && a.Xd && a.Qe.count() < (0 < a.ad.length ? 2 : 1)) {
a.ue++;
var b = {};
b.id = a.sg;
b.pw = a.tg;
b.ser = a.ue;
for (var b = a.jd(b), c = '', d = 0; 0 < a.ad.length;)
if (1870 >= a.ad[0].kf.length + 30 + c.length) {
var e = a.ad.shift(), c = c + '&seg' + d + '=' + e.Kg + '&ts' + d + '=' + e.Sg + '&d' + d + '=' + e.kf;
d++;
} else
break;
gh(a, b + c, a.ue);
return !0;
}
return !1;
}
function gh(a, b, c) {
function d() {
a.Qe.remove(c);
fh(a);
}
a.Qe.add(c, 1);
var e = setTimeout(d, Math.floor(25000));
eh(a, b, function () {
clearTimeout(e);
d();
});
}
function eh(a, b, c) {
setTimeout(function () {
try {
if (a.Xd) {
var d = a.Ea.fb.createElement('script');
d.type = 'text/javascript';
d.async = !0;
d.src = b;
d.onload = d.onreadystatechange = function () {
var a = d.readyState;
a && 'loaded' !== a && 'complete' !== a || (d.onload = d.onreadystatechange = null, d.parentNode && d.parentNode.removeChild(d), c());
};
d.onerror = function () {
Cb('Long-poll script failed to load: ' + b);
a.Xd = !1;
a.close();
};
a.Ea.fb.body.appendChild(d);
}
} catch (e) {
}
}, Math.floor(1));
}
;
var hh = null;
'undefined' !== typeof MozWebSocket ? hh = MozWebSocket : 'undefined' !== typeof WebSocket && (hh = WebSocket);
function ih(a, b, c) {
this.se = a;
this.f = Nc(this.se);
this.frames = this.Kc = null;
this.ob = this.pb = this.cf = 0;
this.Va = Qb(b);
this.eb = (b.lb ? 'wss://' : 'ws://') + b.Pa + '/.ws?v=5';
'undefined' !== typeof location && location.href && -1 !== location.href.indexOf('firebaseio.com') && (this.eb += '&r=f');
b.host !== b.Pa && (this.eb = this.eb + '&ns=' + b.Db);
c && (this.eb = this.eb + '&s=' + c);
}
var jh;
ih.prototype.open = function (a, b) {
this.ib = b;
this.xg = a;
this.f('Websocket connecting to ' + this.eb);
this.Hc = !1;
Cc.set('previous_websocket_failure', !0);
try {
this.ua = new hh(this.eb);
} catch (c) {
this.f('Error instantiating WebSocket.');
var d = c.message || c.data;
d && this.f(d);
this.hb();
return;
}
var e = this;
this.ua.onopen = function () {
e.f('Websocket connected.');
e.Hc = !0;
};
this.ua.onclose = function () {
e.f('Websocket connection was disconnected.');
e.ua = null;
e.hb();
};
this.ua.onmessage = function (a) {
if (null !== e.ua)
if (a = a.data, e.ob += a.length, Nb(e.Va, 'bytes_received', a.length), kh(e), null !== e.frames)
lh(e, a);
else {
a: {
K(null === e.frames, 'We already have a frame buffer');
if (6 >= a.length) {
var b = Number(a);
if (!isNaN(b)) {
e.cf = b;
e.frames = [];
a = null;
break a;
}
}
e.cf = 1;
e.frames = [];
}
null !== a && lh(e, a);
}
};
this.ua.onerror = function (a) {
e.f('WebSocket error.  Closing connection.');
(a = a.message || a.data) && e.f(a);
e.hb();
};
};
ih.prototype.start = function () {
};
ih.isAvailable = function () {
var a = !1;
if ('undefined' !== typeof navigator && navigator.userAgent) {
var b = navigator.userAgent.match(/Android ([0-9]{0,}\.[0-9]{0,})/);
b && 1 < b.length && 4.4 > parseFloat(b[1]) && (a = !0);
}
return !a && null !== hh && !jh;
};
ih.responsesRequiredToBeHealthy = 2;
ih.healthyTimeout = 30000;
g = ih.prototype;
g.Ed = function () {
Cc.remove('previous_websocket_failure');
};
function lh(a, b) {
a.frames.push(b);
if (a.frames.length == a.cf) {
var c = a.frames.join('');
a.frames = null;
c = nb(c);
a.xg(c);
}
}
g.send = function (a) {
kh(this);
a = B(a);
this.pb += a.length;
Nb(this.Va, 'bytes_sent', a.length);
a = Wc(a, 16384);
1 < a.length && this.ua.send(String(a.length));
for (var b = 0; b < a.length; b++)
this.ua.send(a[b]);
};
g.dd = function () {
this.Ab = !0;
this.Kc && (clearInterval(this.Kc), this.Kc = null);
this.ua && (this.ua.close(), this.ua = null);
};
g.hb = function () {
this.Ab || (this.f('WebSocket is closing itself'), this.dd(), this.ib && (this.ib(this.Hc), this.ib = null));
};
g.close = function () {
this.Ab || (this.f('WebSocket is being closed'), this.dd());
};
function kh(a) {
clearInterval(a.Kc);
a.Kc = setInterval(function () {
a.ua && a.ua.send('0');
kh(a);
}, Math.floor(45000));
}
;
function mh(a) {
nh(this, a);
}
var oh = [
$g,
ih
];
function nh(a, b) {
var c = ih && ih.isAvailable(), d = c && !(Cc.wf || !0 === Cc.get('previous_websocket_failure'));
b.Ug && (c || Q('wss:// URL used, but browser isn\'t known to support websockets.  Trying anyway.'), d = !0);
if (d)
a.gd = [ih];
else {
var e = a.gd = [];
Xc(oh, function (a, b) {
b && b.isAvailable() && e.push(b);
});
}
}
function ph(a) {
if (0 < a.gd.length)
return a.gd[0];
throw Error('No transports available');
}
;
function qh(a, b, c, d, e, f) {
this.id = a;
this.f = Nc('c:' + this.id + ':');
this.ic = c;
this.Wc = d;
this.la = e;
this.Oe = f;
this.F = b;
this.Md = [];
this.ff = 0;
this.Of = new mh(b);
this.Ua = 0;
this.f('Connection created');
rh(this);
}
function rh(a) {
var b = ph(a.Of);
a.I = new b('c:' + a.id + ':' + a.ff++, a.F);
a.Se = b.responsesRequiredToBeHealthy || 0;
var c = sh(a, a.I), d = th(a, a.I);
a.hd = a.I;
a.cd = a.I;
a.D = null;
a.Bb = !1;
setTimeout(function () {
a.I && a.I.open(c, d);
}, Math.floor(0));
b = b.healthyTimeout || 0;
0 < b && (a.yd = setTimeout(function () {
a.yd = null;
a.Bb || (a.I && 102400 < a.I.ob ? (a.f('Connection exceeded healthy timeout but has received ' + a.I.ob + ' bytes.  Marking connection healthy.'), a.Bb = !0, a.I.Ed()) : a.I && 10240 < a.I.pb ? a.f('Connection exceeded healthy timeout but has sent ' + a.I.pb + ' bytes.  Leaving connection alive.') : (a.f('Closing unhealthy connection after timeout.'), a.close()));
}, Math.floor(b)));
}
function th(a, b) {
return function (c) {
b === a.I ? (a.I = null, c || 0 !== a.Ua ? 1 === a.Ua && a.f('Realtime connection lost.') : (a.f('Realtime connection failed.'), 's-' === a.F.Pa.substr(0, 2) && (Cc.remove('host:' + a.F.host), a.F.Pa = a.F.host)), a.close()) : b === a.D ? (a.f('Secondary connection lost.'), c = a.D, a.D = null, a.hd !== c && a.cd !== c || a.close()) : a.f('closing an old connection');
};
}
function sh(a, b) {
return function (c) {
if (2 != a.Ua)
if (b === a.cd) {
var d = Uc('t', c);
c = Uc('d', c);
if ('c' == d) {
if (d = Uc('t', c), 'd' in c)
if (c = c.d, 'h' === d) {
var d = c.ts, e = c.v, f = c.h;
a.Zd = c.s;
Ec(a.F, f);
0 == a.Ua && (a.I.start(), uh(a, a.I, d), '5' !== e && Q('Protocol version mismatch detected'), c = a.Of, (c = 1 < c.gd.length ? c.gd[1] : null) && vh(a, c));
} else if ('n' === d) {
a.f('recvd end transmission on primary');
a.cd = a.D;
for (c = 0; c < a.Md.length; ++c)
a.Id(a.Md[c]);
a.Md = [];
wh(a);
} else
's' === d ? (a.f('Connection shutdown command received. Shutting down...'), a.Oe && (a.Oe(c), a.Oe = null), a.la = null, a.close()) : 'r' === d ? (a.f('Reset packet received.  New host: ' + c), Ec(a.F, c), 1 === a.Ua ? a.close() : (xh(a), rh(a))) : 'e' === d ? Oc('Server Error: ' + c) : 'o' === d ? (a.f('got pong on primary.'), yh(a), zh(a)) : Oc('Unknown control packet command: ' + d);
} else
'd' == d && a.Id(c);
} else if (b === a.D)
if (d = Uc('t', c), c = Uc('d', c), 'c' == d)
't' in c && (c = c.t, 'a' === c ? Ah(a) : 'r' === c ? (a.f('Got a reset on secondary, closing it'), a.D.close(), a.hd !== a.D && a.cd !== a.D || a.close()) : 'o' === c && (a.f('got pong on secondary.'), a.Mf--, Ah(a)));
else if ('d' == d)
a.Md.push(c);
else
throw Error('Unknown protocol layer: ' + d);
else
a.f('message on old connection');
};
}
qh.prototype.Fa = function (a) {
Bh(this, {
t: 'd',
d: a
});
};
function wh(a) {
a.hd === a.D && a.cd === a.D && (a.f('cleaning up and promoting a connection: ' + a.D.se), a.I = a.D, a.D = null);
}
function Ah(a) {
0 >= a.Mf ? (a.f('Secondary connection is healthy.'), a.Bb = !0, a.D.Ed(), a.D.start(), a.f('sending client ack on secondary'), a.D.send({
t: 'c',
d: {
t: 'a',
d: {}
}
}), a.f('Ending transmission on primary'), a.I.send({
t: 'c',
d: {
t: 'n',
d: {}
}
}), a.hd = a.D, wh(a)) : (a.f('sending ping on secondary.'), a.D.send({
t: 'c',
d: {
t: 'p',
d: {}
}
}));
}
qh.prototype.Id = function (a) {
yh(this);
this.ic(a);
};
function yh(a) {
a.Bb || (a.Se--, 0 >= a.Se && (a.f('Primary connection is healthy.'), a.Bb = !0, a.I.Ed()));
}
function vh(a, b) {
a.D = new b('c:' + a.id + ':' + a.ff++, a.F, a.Zd);
a.Mf = b.responsesRequiredToBeHealthy || 0;
a.D.open(sh(a, a.D), th(a, a.D));
setTimeout(function () {
a.D && (a.f('Timed out trying to upgrade.'), a.D.close());
}, Math.floor(60000));
}
function uh(a, b, c) {
a.f('Realtime connection established.');
a.I = b;
a.Ua = 1;
a.Wc && (a.Wc(c), a.Wc = null);
0 === a.Se ? (a.f('Primary connection is healthy.'), a.Bb = !0) : setTimeout(function () {
zh(a);
}, Math.floor(5000));
}
function zh(a) {
a.Bb || 1 !== a.Ua || (a.f('sending ping on primary.'), Bh(a, {
t: 'c',
d: {
t: 'p',
d: {}
}
}));
}
function Bh(a, b) {
if (1 !== a.Ua)
throw 'Connection is not connected';
a.hd.send(b);
}
qh.prototype.close = function () {
2 !== this.Ua && (this.f('Closing realtime connection.'), this.Ua = 2, xh(this), this.la && (this.la(), this.la = null));
};
function xh(a) {
a.f('Shutting down all connections');
a.I && (a.I.close(), a.I = null);
a.D && (a.D.close(), a.D = null);
a.yd && (clearTimeout(a.yd), a.yd = null);
}
;
function Ch(a, b, c, d) {
this.id = Dh++;
this.f = Nc('p:' + this.id + ':');
this.xf = this.Fe = !1;
this.$ = {};
this.qa = [];
this.Yc = 0;
this.Vc = [];
this.oa = !1;
this.Za = 1000;
this.Fd = 300000;
this.Hb = b;
this.Uc = c;
this.Pe = d;
this.F = a;
this.tb = this.Aa = this.Ia = this.Xe = null;
this.Ob = !1;
this.Td = {};
this.Jg = 0;
this.nf = !0;
this.Lc = this.He = null;
Eh(this, 0);
Pf.vb().Fb('visible', this.Ag, this);
-1 === a.host.indexOf('fblocal') && Of.vb().Fb('online', this.yg, this);
}
var Dh = 0, Fh = 0;
g = Ch.prototype;
g.Fa = function (a, b, c) {
var d = ++this.Jg;
a = {
r: d,
a: a,
b: b
};
this.f(B(a));
K(this.oa, 'sendRequest call when we\'re not connected not allowed.');
this.Ia.Fa(a);
c && (this.Td[d] = c);
};
g.yf = function (a, b, c, d) {
var e = a.va(), f = a.path.toString();
this.f('Listen called for ' + f + ' ' + e);
this.$[f] = this.$[f] || {};
K(!this.$[f][e], 'listen() called twice for same path/queryId.');
a = {
G: d,
xd: b,
Gg: a,
tag: c
};
this.$[f][e] = a;
this.oa && Gh(this, a);
};
function Gh(a, b) {
var c = b.Gg, d = c.path.toString(), e = c.va();
a.f('Listen on ' + d + ' for ' + e);
var f = { p: d };
b.tag && (f.q = ce(c.o), f.t = b.tag);
f.h = b.xd();
a.Fa('q', f, function (f) {
var k = f.d, l = f.s;
if (k && 'object' === typeof k && v(k, 'w')) {
var m = w(k, 'w');
ea(m) && 0 <= Na(m, 'no_index') && Q('Using an unspecified index. Consider adding ' + ('".indexOn": "' + c.o.g.toString() + '"') + ' at ' + c.path.toString() + ' to your security rules for better performance');
}
(a.$[d] && a.$[d][e]) === b && (a.f('listen response', f), 'ok' !== l && Hh(a, d, e), b.G && b.G(l, k));
});
}
g.N = function (a, b, c) {
this.Aa = {
gg: a,
of: !1,
zc: b,
md: c
};
this.f('Authenticating using credential: ' + a);
Ih(this);
(b = 40 == a.length) || (a = $c(a).Bc, b = 'object' === typeof a && !0 === w(a, 'admin'));
b && (this.f('Admin auth credential detected.  Reducing max reconnect time.'), this.Fd = 30000);
};
g.he = function (a) {
delete this.Aa;
this.oa && this.Fa('unauth', {}, function (b) {
a(b.s, b.d);
});
};
function Ih(a) {
var b = a.Aa;
a.oa && b && a.Fa('auth', { cred: b.gg }, function (c) {
var d = c.s;
c = c.d || 'error';
'ok' !== d && a.Aa === b && delete a.Aa;
b.of ? 'ok' !== d && b.md && b.md(d, c) : (b.of = !0, b.zc && b.zc(d, c));
});
}
g.Pf = function (a, b) {
var c = a.path.toString(), d = a.va();
this.f('Unlisten called for ' + c + ' ' + d);
if (Hh(this, c, d) && this.oa) {
var e = ce(a.o);
this.f('Unlisten on ' + c + ' for ' + d);
c = { p: c };
b && (c.q = e, c.t = b);
this.Fa('n', c);
}
};
g.Ne = function (a, b, c) {
this.oa ? Jh(this, 'o', a, b, c) : this.Vc.push({
$c: a,
action: 'o',
data: b,
G: c
});
};
g.Cf = function (a, b, c) {
this.oa ? Jh(this, 'om', a, b, c) : this.Vc.push({
$c: a,
action: 'om',
data: b,
G: c
});
};
g.Jd = function (a, b) {
this.oa ? Jh(this, 'oc', a, null, b) : this.Vc.push({
$c: a,
action: 'oc',
data: null,
G: b
});
};
function Jh(a, b, c, d, e) {
c = {
p: c,
d: d
};
a.f('onDisconnect ' + b, c);
a.Fa(b, c, function (a) {
e && setTimeout(function () {
e(a.s, a.d);
}, Math.floor(0));
});
}
g.put = function (a, b, c, d) {
Kh(this, 'p', a, b, c, d);
};
g.zf = function (a, b, c, d) {
Kh(this, 'm', a, b, c, d);
};
function Kh(a, b, c, d, e, f) {
d = {
p: c,
d: d
};
n(f) && (d.h = f);
a.qa.push({
action: b,
Jf: d,
G: e
});
a.Yc++;
b = a.qa.length - 1;
a.oa ? Lh(a, b) : a.f('Buffering put: ' + c);
}
function Lh(a, b) {
var c = a.qa[b].action, d = a.qa[b].Jf, e = a.qa[b].G;
a.qa[b].Hg = a.oa;
a.Fa(c, d, function (d) {
a.f(c + ' response', d);
delete a.qa[b];
a.Yc--;
0 === a.Yc && (a.qa = []);
e && e(d.s, d.d);
});
}
g.Ve = function (a) {
this.oa && (a = { c: a }, this.f('reportStats', a), this.Fa('s', a, function (a) {
'ok' !== a.s && this.f('reportStats', 'Error sending stats: ' + a.d);
}));
};
g.Id = function (a) {
if ('r' in a) {
this.f('from server: ' + B(a));
var b = a.r, c = this.Td[b];
c && (delete this.Td[b], c(a.b));
} else {
if ('error' in a)
throw 'A server-side error has occurred: ' + a.error;
'a' in a && (b = a.a, c = a.b, this.f('handleServerMessage', b, c), 'd' === b ? this.Hb(c.p, c.d, !1, c.t) : 'm' === b ? this.Hb(c.p, c.d, !0, c.t) : 'c' === b ? Mh(this, c.p, c.q) : 'ac' === b ? (a = c.s, b = c.d, c = this.Aa, delete this.Aa, c && c.md && c.md(a, b)) : 'sd' === b ? this.Xe ? this.Xe(c) : 'msg' in c && 'undefined' !== typeof console && console.log('FIREBASE: ' + c.msg.replace('\n', '\nFIREBASE: ')) : Oc('Unrecognized action received from server: ' + B(b) + '\nAre you using the latest client?'));
}
};
g.Wc = function (a) {
this.f('connection ready');
this.oa = !0;
this.Lc = new Date().getTime();
this.Pe({ serverTimeOffset: a - new Date().getTime() });
this.nf && (a = {}, a['sdk.js.' + hb.replace(/\./g, '-')] = 1, qg() && (a['framework.cordova'] = 1), this.Ve(a));
Nh(this);
this.nf = !1;
this.Uc(!0);
};
function Eh(a, b) {
K(!a.Ia, 'Scheduling a connect when we\'re already connected/ing?');
a.tb && clearTimeout(a.tb);
a.tb = setTimeout(function () {
a.tb = null;
Oh(a);
}, Math.floor(b));
}
g.Ag = function (a) {
a && !this.Ob && this.Za === this.Fd && (this.f('Window became visible.  Reducing delay.'), this.Za = 1000, this.Ia || Eh(this, 0));
this.Ob = a;
};
g.yg = function (a) {
a ? (this.f('Browser went online.'), this.Za = 1000, this.Ia || Eh(this, 0)) : (this.f('Browser went offline.  Killing connection.'), this.Ia && this.Ia.close());
};
g.Df = function () {
this.f('data client disconnected');
this.oa = !1;
this.Ia = null;
for (var a = 0; a < this.qa.length; a++) {
var b = this.qa[a];
b && 'h' in b.Jf && b.Hg && (b.G && b.G('disconnect'), delete this.qa[a], this.Yc--);
}
0 === this.Yc && (this.qa = []);
this.Td = {};
Ph(this) && (this.Ob ? this.Lc && (30000 < new Date().getTime() - this.Lc && (this.Za = 1000), this.Lc = null) : (this.f('Window isn\'t visible.  Delaying reconnect.'), this.Za = this.Fd, this.He = new Date().getTime()), a = Math.max(0, this.Za - (new Date().getTime() - this.He)), a *= Math.random(), this.f('Trying to reconnect in ' + a + 'ms'), Eh(this, a), this.Za = Math.min(this.Fd, 1.3 * this.Za));
this.Uc(!1);
};
function Oh(a) {
if (Ph(a)) {
a.f('Making a connection attempt');
a.He = new Date().getTime();
a.Lc = null;
var b = q(a.Id, a), c = q(a.Wc, a), d = q(a.Df, a), e = a.id + ':' + Fh++;
a.Ia = new qh(e, a.F, b, c, d, function (b) {
Q(b + ' (' + a.F.toString() + ')');
a.xf = !0;
});
}
}
g.zb = function () {
this.Fe = !0;
this.Ia ? this.Ia.close() : (this.tb && (clearTimeout(this.tb), this.tb = null), this.oa && this.Df());
};
g.rc = function () {
this.Fe = !1;
this.Za = 1000;
this.Ia || Eh(this, 0);
};
function Mh(a, b, c) {
c = c ? Qa(c, function (a) {
return Vc(a);
}).join('$') : 'default';
(a = Hh(a, b, c)) && a.G && a.G('permission_denied');
}
function Hh(a, b, c) {
b = new L(b).toString();
var d;
n(a.$[b]) ? (d = a.$[b][c], delete a.$[b][c], 0 === pa(a.$[b]) && delete a.$[b]) : d = void 0;
return d;
}
function Nh(a) {
Ih(a);
r(a.$, function (b) {
r(b, function (b) {
Gh(a, b);
});
});
for (var b = 0; b < a.qa.length; b++)
a.qa[b] && Lh(a, b);
for (; a.Vc.length;)
b = a.Vc.shift(), Jh(a, b.action, b.$c, b.data, b.G);
}
function Ph(a) {
var b;
b = Of.vb().jc;
return !a.xf && !a.Fe && b;
}
;
var V = {
mg: function () {
ah = jh = !0;
}
};
V.forceLongPolling = V.mg;
V.ng = function () {
bh = !0;
};
V.forceWebSockets = V.ng;
V.Ng = function (a, b) {
a.k.Sa.Xe = b;
};
V.setSecurityDebugCallback = V.Ng;
V.Ze = function (a, b) {
a.k.Ze(b);
};
V.stats = V.Ze;
V.$e = function (a, b) {
a.k.$e(b);
};
V.statsIncrementCounter = V.$e;
V.sd = function (a) {
return a.k.sd;
};
V.dataUpdateCount = V.sd;
V.qg = function (a, b) {
a.k.Ee = b;
};
V.interceptServerData = V.qg;
V.wg = function (a) {
new Ag(a);
};
V.onPopupOpen = V.wg;
V.Lg = function (a) {
kg = a;
};
V.setAuthenticationServer = V.Lg;
function S(a, b, c) {
this.w = a;
this.V = b;
this.g = c;
}
S.prototype.H = function () {
x('Firebase.DataSnapshot.val', 0, 0, arguments.length);
return this.w.H();
};
S.prototype.val = S.prototype.H;
S.prototype.mf = function () {
x('Firebase.DataSnapshot.exportVal', 0, 0, arguments.length);
return this.w.H(!0);
};
S.prototype.exportVal = S.prototype.mf;
S.prototype.lg = function () {
x('Firebase.DataSnapshot.exists', 0, 0, arguments.length);
return !this.w.e();
};
S.prototype.exists = S.prototype.lg;
S.prototype.u = function (a) {
x('Firebase.DataSnapshot.child', 0, 1, arguments.length);
ga(a) && (a = String(a));
ag('Firebase.DataSnapshot.child', a);
var b = new L(a), c = this.V.u(b);
return new S(this.w.Y(b), c, N);
};
S.prototype.child = S.prototype.u;
S.prototype.Da = function (a) {
x('Firebase.DataSnapshot.hasChild', 1, 1, arguments.length);
ag('Firebase.DataSnapshot.hasChild', a);
var b = new L(a);
return !this.w.Y(b).e();
};
S.prototype.hasChild = S.prototype.Da;
S.prototype.B = function () {
x('Firebase.DataSnapshot.getPriority', 0, 0, arguments.length);
return this.w.B().H();
};
S.prototype.getPriority = S.prototype.B;
S.prototype.forEach = function (a) {
x('Firebase.DataSnapshot.forEach', 1, 1, arguments.length);
A('Firebase.DataSnapshot.forEach', 1, a, !1);
if (this.w.L())
return !1;
var b = this;
return !!this.w.R(this.g, function (c, d) {
return a(new S(d, b.V.u(c), N));
});
};
S.prototype.forEach = S.prototype.forEach;
S.prototype.wd = function () {
x('Firebase.DataSnapshot.hasChildren', 0, 0, arguments.length);
return this.w.L() ? !1 : !this.w.e();
};
S.prototype.hasChildren = S.prototype.wd;
S.prototype.name = function () {
Q('Firebase.DataSnapshot.name() being deprecated. Please use Firebase.DataSnapshot.key() instead.');
x('Firebase.DataSnapshot.name', 0, 0, arguments.length);
return this.key();
};
S.prototype.name = S.prototype.name;
S.prototype.key = function () {
x('Firebase.DataSnapshot.key', 0, 0, arguments.length);
return this.V.key();
};
S.prototype.key = S.prototype.key;
S.prototype.Eb = function () {
x('Firebase.DataSnapshot.numChildren', 0, 0, arguments.length);
return this.w.Eb();
};
S.prototype.numChildren = S.prototype.Eb;
S.prototype.mc = function () {
x('Firebase.DataSnapshot.ref', 0, 0, arguments.length);
return this.V;
};
S.prototype.ref = S.prototype.mc;
function Qh(a, b) {
this.F = a;
this.Va = Qb(a);
this.fd = null;
this.da = new vb();
this.Hd = 1;
this.Sa = null;
b || 0 <= ('object' === typeof window && window.navigator && window.navigator.userAgent || '').search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i) ? (this.ba = new ye(this.F, q(this.Hb, this)), setTimeout(q(this.Uc, this, !0), 0)) : this.ba = this.Sa = new Ch(this.F, q(this.Hb, this), q(this.Uc, this), q(this.Pe, this));
this.Qg = Rb(a, q(function () {
return new Lb(this.Va, this.ba);
}, this));
this.uc = new Ff();
this.De = new ob();
var c = this;
this.Cd = new kf({
Ye: function (a, b, f, h) {
b = [];
f = c.De.j(a.path);
f.e() || (b = mf(c.Cd, new Wb(Re, a.path, f)), setTimeout(function () {
h('ok');
}, 0));
return b;
},
be: ba
});
Rh(this, 'connected', !1);
this.la = new pc();
this.N = new Kg(a, q(this.ba.N, this.ba), q(this.ba.he, this.ba), q(this.Me, this));
this.sd = 0;
this.Ee = null;
this.M = new kf({
Ye: function (a, b, f, h) {
c.ba.yf(a, f, b, function (b, e) {
var f = h(b, e);
Ab(c.da, a.path, f);
});
return [];
},
be: function (a, b) {
c.ba.Pf(a, b);
}
});
}
g = Qh.prototype;
g.toString = function () {
return (this.F.lb ? 'https://' : 'http://') + this.F.host;
};
g.name = function () {
return this.F.Db;
};
function Sh(a) {
a = a.De.j(new L('.info/serverTimeOffset')).H() || 0;
return new Date().getTime() + a;
}
function Th(a) {
a = a = { timestamp: Sh(a) };
a.timestamp = a.timestamp || new Date().getTime();
return a;
}
g.Hb = function (a, b, c, d) {
this.sd++;
var e = new L(a);
b = this.Ee ? this.Ee(a, b) : b;
a = [];
d ? c ? (b = na(b, function (a) {
return M(a);
}), a = uf(this.M, e, b, d)) : (b = M(b), a = qf(this.M, e, b, d)) : c ? (d = na(b, function (a) {
return M(a);
}), a = pf(this.M, e, d)) : (d = M(b), a = mf(this.M, new Wb(Re, e, d)));
d = e;
0 < a.length && (d = Uh(this, e));
Ab(this.da, d, a);
};
g.Uc = function (a) {
Rh(this, 'connected', a);
!1 === a && Vh(this);
};
g.Pe = function (a) {
var b = this;
Xc(a, function (a, d) {
Rh(b, d, a);
});
};
g.Me = function (a) {
Rh(this, 'authenticated', a);
};
function Rh(a, b, c) {
b = new L('/.info/' + b);
c = M(c);
var d = a.De;
d.Wd = d.Wd.K(b, c);
c = mf(a.Cd, new Wb(Re, b, c));
Ab(a.da, b, c);
}
g.Kb = function (a, b, c, d) {
this.f('set', {
path: a.toString(),
value: b,
Yg: c
});
var e = Th(this);
b = M(b, c);
var e = rc(b, e), f = this.Hd++, e = lf(this.M, a, e, f, !0);
wb(this.da, e);
var h = this;
this.ba.put(a.toString(), b.H(!0), function (b, c) {
var e = 'ok' === b;
e || Q('set at ' + a + ' failed: ' + b);
e = of(h.M, f, !e);
Ab(h.da, a, e);
Wh(d, b, c);
});
e = Xh(this, a);
Uh(this, e);
Ab(this.da, e, []);
};
g.update = function (a, b, c) {
this.f('update', {
path: a.toString(),
value: b
});
var d = !0, e = Th(this), f = {};
r(b, function (a, b) {
d = !1;
var c = M(a);
f[b] = rc(c, e);
});
if (d)
Cb('update() called with empty data.  Don\'t do anything.'), Wh(c, 'ok');
else {
var h = this.Hd++, k = nf(this.M, a, f, h);
wb(this.da, k);
var l = this;
this.ba.zf(a.toString(), b, function (b, d) {
var e = 'ok' === b;
e || Q('update at ' + a + ' failed: ' + b);
var e = of(l.M, h, !e), f = a;
0 < e.length && (f = Uh(l, a));
Ab(l.da, f, e);
Wh(c, b, d);
});
b = Xh(this, a);
Uh(this, b);
Ab(this.da, a, []);
}
};
function Vh(a) {
a.f('onDisconnectEvents');
var b = Th(a), c = [];
qc(oc(a.la, b), G, function (b, e) {
c = c.concat(mf(a.M, new Wb(Re, b, e)));
var f = Xh(a, b);
Uh(a, f);
});
a.la = new pc();
Ab(a.da, G, c);
}
g.Jd = function (a, b) {
var c = this;
this.ba.Jd(a.toString(), function (d, e) {
'ok' === d && jg(c.la, a);
Wh(b, d, e);
});
};
function Yh(a, b, c, d) {
var e = M(c);
a.ba.Ne(b.toString(), e.H(!0), function (c, h) {
'ok' === c && a.la.nc(b, e);
Wh(d, c, h);
});
}
function Zh(a, b, c, d, e) {
var f = M(c, d);
a.ba.Ne(b.toString(), f.H(!0), function (c, d) {
'ok' === c && a.la.nc(b, f);
Wh(e, c, d);
});
}
function $h(a, b, c, d) {
var e = !0, f;
for (f in c)
e = !1;
e ? (Cb('onDisconnect().update() called with empty data.  Don\'t do anything.'), Wh(d, 'ok')) : a.ba.Cf(b.toString(), c, function (e, f) {
if ('ok' === e)
for (var l in c) {
var m = M(c[l]);
a.la.nc(b.u(l), m);
}
Wh(d, e, f);
});
}
function ai(a, b, c) {
c = '.info' === E(b.path) ? a.Cd.Pb(b, c) : a.M.Pb(b, c);
yb(a.da, b.path, c);
}
g.zb = function () {
this.Sa && this.Sa.zb();
};
g.rc = function () {
this.Sa && this.Sa.rc();
};
g.Ze = function (a) {
if ('undefined' !== typeof console) {
a ? (this.fd || (this.fd = new Kb(this.Va)), a = this.fd.get()) : a = this.Va.get();
var b = Ra(sa(a), function (a, b) {
return Math.max(b.length, a);
}, 0), c;
for (c in a) {
for (var d = a[c], e = c.length; e < b + 2; e++)
c += ' ';
console.log(c + d);
}
}
};
g.$e = function (a) {
Nb(this.Va, a);
this.Qg.Nf[a] = !0;
};
g.f = function (a) {
var b = '';
this.Sa && (b = this.Sa.id + ':');
Cb(b, arguments);
};
function Wh(a, b, c) {
a && Db(function () {
if ('ok' == b)
a(null);
else {
var d = (b || 'error').toUpperCase(), e = d;
c && (e += ': ' + c);
e = Error(e);
e.code = d;
a(e);
}
});
}
;
function bi(a, b, c, d, e) {
function f() {
}
a.f('transaction on ' + b);
var h = new U(a, b);
h.Fb('value', f);
c = {
path: b,
update: c,
G: d,
status: null,
Ff: Fc(),
df: e,
Lf: 0,
je: function () {
h.hc('value', f);
},
le: null,
Ba: null,
pd: null,
qd: null,
rd: null
};
d = a.M.za(b, void 0) || C;
c.pd = d;
d = c.update(d.H());
if (n(d)) {
Wf('transaction failed: Data returned ', d, c.path);
c.status = 1;
e = Gf(a.uc, b);
var k = e.Ca() || [];
k.push(c);
Hf(e, k);
'object' === typeof d && null !== d && v(d, '.priority') ? (k = w(d, '.priority'), K(Uf(k), 'Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.')) : k = (a.M.za(b) || C).B().H();
e = Th(a);
d = M(d, k);
e = rc(d, e);
c.qd = d;
c.rd = e;
c.Ba = a.Hd++;
c = lf(a.M, b, e, c.Ba, c.df);
Ab(a.da, b, c);
ci(a);
} else
c.je(), c.qd = null, c.rd = null, c.G && (a = new S(c.pd, new U(a, c.path), N), c.G(null, !1, a));
}
function ci(a, b) {
var c = b || a.uc;
b || di(a, c);
if (null !== c.Ca()) {
var d = ei(a, c);
K(0 < d.length, 'Sending zero length transaction queue');
Sa(d, function (a) {
return 1 === a.status;
}) && fi(a, c.path(), d);
} else
c.wd() && c.R(function (b) {
ci(a, b);
});
}
function fi(a, b, c) {
for (var d = Qa(c, function (a) {
return a.Ba;
}), e = a.M.za(b, d) || C, d = e, e = e.hash(), f = 0; f < c.length; f++) {
var h = c[f];
K(1 === h.status, 'tryToSendTransactionQueue_: items in queue should all be run.');
h.status = 2;
h.Lf++;
var k = O(b, h.path), d = d.K(k, h.qd);
}
d = d.H(!0);
a.ba.put(b.toString(), d, function (d) {
a.f('transaction put response', {
path: b.toString(),
status: d
});
var e = [];
if ('ok' === d) {
d = [];
for (f = 0; f < c.length; f++) {
c[f].status = 3;
e = e.concat(of(a.M, c[f].Ba));
if (c[f].G) {
var h = c[f].rd, k = new U(a, c[f].path);
d.push(q(c[f].G, null, null, !0, new S(h, k, N)));
}
c[f].je();
}
di(a, Gf(a.uc, b));
ci(a);
Ab(a.da, b, e);
for (f = 0; f < d.length; f++)
Db(d[f]);
} else {
if ('datastale' === d)
for (f = 0; f < c.length; f++)
c[f].status = 4 === c[f].status ? 5 : 1;
else
for (Q('transaction at ' + b.toString() + ' failed: ' + d), f = 0; f < c.length; f++)
c[f].status = 5, c[f].le = d;
Uh(a, b);
}
}, e);
}
function Uh(a, b) {
var c = gi(a, b), d = c.path(), c = ei(a, c);
hi(a, c, d);
return d;
}
function hi(a, b, c) {
if (0 !== b.length) {
for (var d = [], e = [], f = Qa(b, function (a) {
return a.Ba;
}), h = 0; h < b.length; h++) {
var k = b[h], l = O(c, k.path), m = !1, t;
K(null !== l, 'rerunTransactionsUnderNode_: relativePath should not be null.');
if (5 === k.status)
m = !0, t = k.le, e = e.concat(of(a.M, k.Ba, !0));
else if (1 === k.status)
if (25 <= k.Lf)
m = !0, t = 'maxretry', e = e.concat(of(a.M, k.Ba, !0));
else {
var y = a.M.za(k.path, f) || C;
k.pd = y;
var I = b[h].update(y.H());
n(I) ? (Wf('transaction failed: Data returned ', I, k.path), l = M(I), 'object' === typeof I && null != I && v(I, '.priority') || (l = l.ga(y.B())), y = k.Ba, I = Th(a), I = rc(l, I), k.qd = l, k.rd = I, k.Ba = a.Hd++, Va(f, y), e = e.concat(lf(a.M, k.path, I, k.Ba, k.df)), e = e.concat(of(a.M, y, !0))) : (m = !0, t = 'nodata', e = e.concat(of(a.M, k.Ba, !0)));
}
Ab(a.da, c, e);
e = [];
m && (b[h].status = 3, setTimeout(b[h].je, Math.floor(0)), b[h].G && ('nodata' === t ? (k = new U(a, b[h].path), d.push(q(b[h].G, null, null, !1, new S(b[h].pd, k, N)))) : d.push(q(b[h].G, null, Error(t), !1, null))));
}
di(a, a.uc);
for (h = 0; h < d.length; h++)
Db(d[h]);
ci(a);
}
}
function gi(a, b) {
for (var c, d = a.uc; null !== (c = E(b)) && null === d.Ca();)
d = Gf(d, c), b = H(b);
return d;
}
function ei(a, b) {
var c = [];
ii(a, b, c);
c.sort(function (a, b) {
return a.Ff - b.Ff;
});
return c;
}
function ii(a, b, c) {
var d = b.Ca();
if (null !== d)
for (var e = 0; e < d.length; e++)
c.push(d[e]);
b.R(function (b) {
ii(a, b, c);
});
}
function di(a, b) {
var c = b.Ca();
if (c) {
for (var d = 0, e = 0; e < c.length; e++)
3 !== c[e].status && (c[d] = c[e], d++);
c.length = d;
Hf(b, 0 < c.length ? c : null);
}
b.R(function (b) {
di(a, b);
});
}
function Xh(a, b) {
var c = gi(a, b).path(), d = Gf(a.uc, b);
Kf(d, function (b) {
ji(a, b);
});
ji(a, d);
Jf(d, function (b) {
ji(a, b);
});
return c;
}
function ji(a, b) {
var c = b.Ca();
if (null !== c) {
for (var d = [], e = [], f = -1, h = 0; h < c.length; h++)
4 !== c[h].status && (2 === c[h].status ? (K(f === h - 1, 'All SENT items should be at beginning of queue.'), f = h, c[h].status = 4, c[h].le = 'set') : (K(1 === c[h].status, 'Unexpected transaction status in abort'), c[h].je(), e = e.concat(of(a.M, c[h].Ba, !0)), c[h].G && d.push(q(c[h].G, null, Error('set'), !1, null))));
-1 === f ? Hf(b, null) : c.length = f + 1;
Ab(a.da, b.path(), e);
for (h = 0; h < d.length; h++)
Db(d[h]);
}
}
;
function W() {
this.oc = {};
this.Qf = !1;
}
W.prototype.zb = function () {
for (var a in this.oc)
this.oc[a].zb();
};
W.prototype.rc = function () {
for (var a in this.oc)
this.oc[a].rc();
};
W.prototype.we = function () {
this.Qf = !0;
};
ca(W);
W.prototype.interrupt = W.prototype.zb;
W.prototype.resume = W.prototype.rc;
function X(a, b) {
this.bd = a;
this.ra = b;
}
X.prototype.cancel = function (a) {
x('Firebase.onDisconnect().cancel', 0, 1, arguments.length);
A('Firebase.onDisconnect().cancel', 1, a, !0);
this.bd.Jd(this.ra, a || null);
};
X.prototype.cancel = X.prototype.cancel;
X.prototype.remove = function (a) {
x('Firebase.onDisconnect().remove', 0, 1, arguments.length);
bg('Firebase.onDisconnect().remove', this.ra);
A('Firebase.onDisconnect().remove', 1, a, !0);
Yh(this.bd, this.ra, null, a);
};
X.prototype.remove = X.prototype.remove;
X.prototype.set = function (a, b) {
x('Firebase.onDisconnect().set', 1, 2, arguments.length);
bg('Firebase.onDisconnect().set', this.ra);
Vf('Firebase.onDisconnect().set', a, this.ra, !1);
A('Firebase.onDisconnect().set', 2, b, !0);
Yh(this.bd, this.ra, a, b);
};
X.prototype.set = X.prototype.set;
X.prototype.Kb = function (a, b, c) {
x('Firebase.onDisconnect().setWithPriority', 2, 3, arguments.length);
bg('Firebase.onDisconnect().setWithPriority', this.ra);
Vf('Firebase.onDisconnect().setWithPriority', a, this.ra, !1);
Yf('Firebase.onDisconnect().setWithPriority', 2, b);
A('Firebase.onDisconnect().setWithPriority', 3, c, !0);
Zh(this.bd, this.ra, a, b, c);
};
X.prototype.setWithPriority = X.prototype.Kb;
X.prototype.update = function (a, b) {
x('Firebase.onDisconnect().update', 1, 2, arguments.length);
bg('Firebase.onDisconnect().update', this.ra);
if (ea(a)) {
for (var c = {}, d = 0; d < a.length; ++d)
c['' + d] = a[d];
a = c;
Q('Passing an Array to Firebase.onDisconnect().update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.');
}
Xf('Firebase.onDisconnect().update', a, this.ra);
A('Firebase.onDisconnect().update', 2, b, !0);
$h(this.bd, this.ra, a, b);
};
X.prototype.update = X.prototype.update;
function Y(a, b, c, d) {
this.k = a;
this.path = b;
this.o = c;
this.kc = d;
}
function ki(a) {
var b = null, c = null;
a.ma && (b = nd(a));
a.pa && (c = pd(a));
if (a.g === Od) {
if (a.ma) {
if ('[MIN_NAME]' != md(a))
throw Error('Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().');
if ('string' !== typeof b)
throw Error('Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.');
}
if (a.pa) {
if ('[MAX_NAME]' != od(a))
throw Error('Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().');
if ('string' !== typeof c)
throw Error('Query: When ordering by key, the argument passed to startAt(), endAt(),or equalTo() must be a string.');
}
} else if (a.g === N) {
if (null != b && !Uf(b) || null != c && !Uf(c))
throw Error('Query: When ordering by priority, the first argument passed to startAt(), endAt(), or equalTo() must be a valid priority value (null, a number, or a string).');
} else if (K(a.g instanceof Sd || a.g === Yd, 'unknown index type.'), null != b && 'object' === typeof b || null != c && 'object' === typeof c)
throw Error('Query: First argument passed to startAt(), endAt(), or equalTo() cannot be an object.');
}
function li(a) {
if (a.ma && a.pa && a.ja && (!a.ja || '' === a.Nb))
throw Error('Query: Can\'t combine startAt(), endAt(), and limit(). Use limitToFirst() or limitToLast() instead.');
}
function mi(a, b) {
if (!0 === a.kc)
throw Error(b + ': You can\'t combine multiple orderBy calls.');
}
g = Y.prototype;
g.mc = function () {
x('Query.ref', 0, 0, arguments.length);
return new U(this.k, this.path);
};
g.Fb = function (a, b, c, d) {
x('Query.on', 2, 4, arguments.length);
Zf('Query.on', a, !1);
A('Query.on', 2, b, !1);
var e = ni('Query.on', c, d);
if ('value' === a)
ai(this.k, this, new id(b, e.cancel || null, e.Ma || null));
else {
var f = {};
f[a] = b;
ai(this.k, this, new jd(f, e.cancel, e.Ma));
}
return b;
};
g.hc = function (a, b, c) {
x('Query.off', 0, 3, arguments.length);
Zf('Query.off', a, !0);
A('Query.off', 2, b, !0);
mb('Query.off', 3, c);
var d = null, e = null;
'value' === a ? d = new id(b || null, null, c || null) : a && (b && (e = {}, e[a] = b), d = new jd(e, null, c || null));
e = this.k;
d = '.info' === E(this.path) ? e.Cd.kb(this, d) : e.M.kb(this, d);
yb(e.da, this.path, d);
};
g.Bg = function (a, b) {
function c(h) {
f && (f = !1, e.hc(a, c), b.call(d.Ma, h));
}
x('Query.once', 2, 4, arguments.length);
Zf('Query.once', a, !1);
A('Query.once', 2, b, !1);
var d = ni('Query.once', arguments[2], arguments[3]), e = this, f = !0;
this.Fb(a, c, function (b) {
e.hc(a, c);
d.cancel && d.cancel.call(d.Ma, b);
});
};
g.Ie = function (a) {
Q('Query.limit() being deprecated. Please use Query.limitToFirst() or Query.limitToLast() instead.');
x('Query.limit', 1, 1, arguments.length);
if (!ga(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limit: First argument must be a positive integer.');
if (this.o.ja)
throw Error('Query.limit: Limit was already set (by another call to limit, limitToFirst, orlimitToLast.');
var b = this.o.Ie(a);
li(b);
return new Y(this.k, this.path, b, this.kc);
};
g.Je = function (a) {
x('Query.limitToFirst', 1, 1, arguments.length);
if (!ga(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limitToFirst: First argument must be a positive integer.');
if (this.o.ja)
throw Error('Query.limitToFirst: Limit was already set (by another call to limit, limitToFirst, or limitToLast).');
return new Y(this.k, this.path, this.o.Je(a), this.kc);
};
g.Ke = function (a) {
x('Query.limitToLast', 1, 1, arguments.length);
if (!ga(a) || Math.floor(a) !== a || 0 >= a)
throw Error('Query.limitToLast: First argument must be a positive integer.');
if (this.o.ja)
throw Error('Query.limitToLast: Limit was already set (by another call to limit, limitToFirst, or limitToLast).');
return new Y(this.k, this.path, this.o.Ke(a), this.kc);
};
g.Cg = function (a) {
x('Query.orderByChild', 1, 1, arguments.length);
if ('$key' === a)
throw Error('Query.orderByChild: "$key" is invalid.  Use Query.orderByKey() instead.');
if ('$priority' === a)
throw Error('Query.orderByChild: "$priority" is invalid.  Use Query.orderByPriority() instead.');
if ('$value' === a)
throw Error('Query.orderByChild: "$value" is invalid.  Use Query.orderByValue() instead.');
$f('Query.orderByChild', 1, a, !1);
mi(this, 'Query.orderByChild');
var b = be(this.o, new Sd(a));
ki(b);
return new Y(this.k, this.path, b, !0);
};
g.Dg = function () {
x('Query.orderByKey', 0, 0, arguments.length);
mi(this, 'Query.orderByKey');
var a = be(this.o, Od);
ki(a);
return new Y(this.k, this.path, a, !0);
};
g.Eg = function () {
x('Query.orderByPriority', 0, 0, arguments.length);
mi(this, 'Query.orderByPriority');
var a = be(this.o, N);
ki(a);
return new Y(this.k, this.path, a, !0);
};
g.Fg = function () {
x('Query.orderByValue', 0, 0, arguments.length);
mi(this, 'Query.orderByValue');
var a = be(this.o, Yd);
ki(a);
return new Y(this.k, this.path, a, !0);
};
g.ae = function (a, b) {
x('Query.startAt', 0, 2, arguments.length);
Vf('Query.startAt', a, this.path, !0);
$f('Query.startAt', 2, b, !0);
var c = this.o.ae(a, b);
li(c);
ki(c);
if (this.o.ma)
throw Error('Query.startAt: Starting point was already set (by another call to startAt or equalTo).');
n(a) || (b = a = null);
return new Y(this.k, this.path, c, this.kc);
};
g.td = function (a, b) {
x('Query.endAt', 0, 2, arguments.length);
Vf('Query.endAt', a, this.path, !0);
$f('Query.endAt', 2, b, !0);
var c = this.o.td(a, b);
li(c);
ki(c);
if (this.o.pa)
throw Error('Query.endAt: Ending point was already set (by another call to endAt or equalTo).');
return new Y(this.k, this.path, c, this.kc);
};
g.ig = function (a, b) {
x('Query.equalTo', 1, 2, arguments.length);
Vf('Query.equalTo', a, this.path, !1);
$f('Query.equalTo', 2, b, !0);
if (this.o.ma)
throw Error('Query.equalTo: Starting point was already set (by another call to endAt or equalTo).');
if (this.o.pa)
throw Error('Query.equalTo: Ending point was already set (by another call to endAt or equalTo).');
return this.ae(a, b).td(a, b);
};
g.toString = function () {
x('Query.toString', 0, 0, arguments.length);
for (var a = this.path, b = '', c = a.Z; c < a.n.length; c++)
'' !== a.n[c] && (b += '/' + encodeURIComponent(String(a.n[c])));
return this.k.toString() + (b || '/');
};
g.va = function () {
var a = Vc(ce(this.o));
return '{}' === a ? 'default' : a;
};
function ni(a, b, c) {
var d = {
cancel: null,
Ma: null
};
if (b && c)
d.cancel = b, A(a, 3, d.cancel, !0), d.Ma = c, mb(a, 4, d.Ma);
else if (b)
if ('object' === typeof b && null !== b)
d.Ma = b;
else if ('function' === typeof b)
d.cancel = b;
else
throw Error(z(a, 3, !0) + ' must either be a cancel callback or a context object.');
return d;
}
Y.prototype.ref = Y.prototype.mc;
Y.prototype.on = Y.prototype.Fb;
Y.prototype.off = Y.prototype.hc;
Y.prototype.once = Y.prototype.Bg;
Y.prototype.limit = Y.prototype.Ie;
Y.prototype.limitToFirst = Y.prototype.Je;
Y.prototype.limitToLast = Y.prototype.Ke;
Y.prototype.orderByChild = Y.prototype.Cg;
Y.prototype.orderByKey = Y.prototype.Dg;
Y.prototype.orderByPriority = Y.prototype.Eg;
Y.prototype.orderByValue = Y.prototype.Fg;
Y.prototype.startAt = Y.prototype.ae;
Y.prototype.endAt = Y.prototype.td;
Y.prototype.equalTo = Y.prototype.ig;
Y.prototype.toString = Y.prototype.toString;
var Z = {};
Z.vc = Ch;
Z.DataConnection = Z.vc;
Ch.prototype.Pg = function (a, b) {
this.Fa('q', { p: a }, b);
};
Z.vc.prototype.simpleListen = Z.vc.prototype.Pg;
Ch.prototype.hg = function (a, b) {
this.Fa('echo', { d: a }, b);
};
Z.vc.prototype.echo = Z.vc.prototype.hg;
Ch.prototype.interrupt = Ch.prototype.zb;
Z.Tf = qh;
Z.RealTimeConnection = Z.Tf;
qh.prototype.sendRequest = qh.prototype.Fa;
qh.prototype.close = qh.prototype.close;
Z.pg = function (a) {
var b = Ch.prototype.put;
Ch.prototype.put = function (c, d, e, f) {
n(f) && (f = a());
b.call(this, c, d, e, f);
};
return function () {
Ch.prototype.put = b;
};
};
Z.hijackHash = Z.pg;
Z.Sf = Dc;
Z.ConnectionTarget = Z.Sf;
Z.va = function (a) {
return a.va();
};
Z.queryIdentifier = Z.va;
Z.rg = function (a) {
return a.k.Sa.$;
};
Z.listens = Z.rg;
Z.we = function (a) {
a.we();
};
Z.forceRestClient = Z.we;
function U(a, b) {
var c, d, e;
if (a instanceof Qh)
c = a, d = b;
else {
x('new Firebase', 1, 2, arguments.length);
d = Qc(arguments[0]);
c = d.Rg;
'firebase' === d.domain && Pc(d.host + ' is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead');
c && 'undefined' != c || Pc('Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com');
d.lb || 'undefined' !== typeof window && window.location && window.location.protocol && -1 !== window.location.protocol.indexOf('https:') && Q('Insecure Firebase access from a secure page. Please use https in calls to new Firebase().');
c = new Dc(d.host, d.lb, c, 'ws' === d.scheme || 'wss' === d.scheme);
d = new L(d.$c);
e = d.toString();
var f;
!(f = !p(c.host) || 0 === c.host.length || !Tf(c.Db)) && (f = 0 !== e.length) && (e && (e = e.replace(/^\/*\.info(\/|$)/, '/')), f = !(p(e) && 0 !== e.length && !Rf.test(e)));
if (f)
throw Error(z('new Firebase', 1, !1) + 'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".');
if (b)
if (b instanceof W)
e = b;
else if (p(b))
e = W.vb(), c.Od = b;
else
throw Error('Expected a valid Firebase.Context for second argument to new Firebase()');
else
e = W.vb();
f = c.toString();
var h = w(e.oc, f);
h || (h = new Qh(c, e.Qf), e.oc[f] = h);
c = h;
}
Y.call(this, c, d, $d, !1);
}
ma(U, Y);
var oi = U, pi = ['Firebase'], qi = aa;
pi[0] in qi || !qi.execScript || qi.execScript('var ' + pi[0]);
for (var ri; pi.length && (ri = pi.shift());)
!pi.length && n(oi) ? qi[ri] = oi : qi = qi[ri] ? qi[ri] : qi[ri] = {};
U.goOffline = function () {
x('Firebase.goOffline', 0, 0, arguments.length);
W.vb().zb();
};
U.goOnline = function () {
x('Firebase.goOnline', 0, 0, arguments.length);
W.vb().rc();
};
function Mc(a, b) {
K(!b || !0 === a || !1 === a, 'Can\'t turn on custom loggers persistently.');
!0 === a ? ('undefined' !== typeof console && ('function' === typeof console.log ? Bb = q(console.log, console) : 'object' === typeof console.log && (Bb = function (a) {
console.log(a);
})), b && P.set('logging_enabled', !0)) : a ? Bb = a : (Bb = null, P.remove('logging_enabled'));
}
U.enableLogging = Mc;
U.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
U.SDK_VERSION = hb;
U.INTERNAL = V;
U.Context = W;
U.TEST_ACCESS = Z;
U.prototype.name = function () {
Q('Firebase.name() being deprecated. Please use Firebase.key() instead.');
x('Firebase.name', 0, 0, arguments.length);
return this.key();
};
U.prototype.name = U.prototype.name;
U.prototype.key = function () {
x('Firebase.key', 0, 0, arguments.length);
return this.path.e() ? null : uc(this.path);
};
U.prototype.key = U.prototype.key;
U.prototype.u = function (a) {
x('Firebase.child', 1, 1, arguments.length);
if (ga(a))
a = String(a);
else if (!(a instanceof L))
if (null === E(this.path)) {
var b = a;
b && (b = b.replace(/^\/*\.info(\/|$)/, '/'));
ag('Firebase.child', b);
} else
ag('Firebase.child', a);
return new U(this.k, this.path.u(a));
};
U.prototype.child = U.prototype.u;
U.prototype.parent = function () {
x('Firebase.parent', 0, 0, arguments.length);
var a = this.path.parent();
return null === a ? null : new U(this.k, a);
};
U.prototype.parent = U.prototype.parent;
U.prototype.root = function () {
x('Firebase.ref', 0, 0, arguments.length);
for (var a = this; null !== a.parent();)
a = a.parent();
return a;
};
U.prototype.root = U.prototype.root;
U.prototype.set = function (a, b) {
x('Firebase.set', 1, 2, arguments.length);
bg('Firebase.set', this.path);
Vf('Firebase.set', a, this.path, !1);
A('Firebase.set', 2, b, !0);
this.k.Kb(this.path, a, null, b || null);
};
U.prototype.set = U.prototype.set;
U.prototype.update = function (a, b) {
x('Firebase.update', 1, 2, arguments.length);
bg('Firebase.update', this.path);
if (ea(a)) {
for (var c = {}, d = 0; d < a.length; ++d)
c['' + d] = a[d];
a = c;
Q('Passing an Array to Firebase.update() is deprecated. Use set() if you want to overwrite the existing data, or an Object with integer keys if you really do want to only update some of the children.');
}
Xf('Firebase.update', a, this.path);
A('Firebase.update', 2, b, !0);
this.k.update(this.path, a, b || null);
};
U.prototype.update = U.prototype.update;
U.prototype.Kb = function (a, b, c) {
x('Firebase.setWithPriority', 2, 3, arguments.length);
bg('Firebase.setWithPriority', this.path);
Vf('Firebase.setWithPriority', a, this.path, !1);
Yf('Firebase.setWithPriority', 2, b);
A('Firebase.setWithPriority', 3, c, !0);
if ('.length' === this.key() || '.keys' === this.key())
throw 'Firebase.setWithPriority failed: ' + this.key() + ' is a read-only object.';
this.k.Kb(this.path, a, b, c || null);
};
U.prototype.setWithPriority = U.prototype.Kb;
U.prototype.remove = function (a) {
x('Firebase.remove', 0, 1, arguments.length);
bg('Firebase.remove', this.path);
A('Firebase.remove', 1, a, !0);
this.set(null, a);
};
U.prototype.remove = U.prototype.remove;
U.prototype.transaction = function (a, b, c) {
x('Firebase.transaction', 1, 3, arguments.length);
bg('Firebase.transaction', this.path);
A('Firebase.transaction', 1, a, !1);
A('Firebase.transaction', 2, b, !0);
if (n(c) && 'boolean' != typeof c)
throw Error(z('Firebase.transaction', 3, !0) + 'must be a boolean.');
if ('.length' === this.key() || '.keys' === this.key())
throw 'Firebase.transaction failed: ' + this.key() + ' is a read-only object.';
'undefined' === typeof c && (c = !0);
bi(this.k, this.path, a, b || null, c);
};
U.prototype.transaction = U.prototype.transaction;
U.prototype.Mg = function (a, b) {
x('Firebase.setPriority', 1, 2, arguments.length);
bg('Firebase.setPriority', this.path);
Yf('Firebase.setPriority', 1, a);
A('Firebase.setPriority', 2, b, !0);
this.k.Kb(this.path.u('.priority'), a, null, b);
};
U.prototype.setPriority = U.prototype.Mg;
U.prototype.push = function (a, b) {
x('Firebase.push', 0, 2, arguments.length);
bg('Firebase.push', this.path);
Vf('Firebase.push', a, this.path, !0);
A('Firebase.push', 2, b, !0);
var c = Sh(this.k), c = Nf(c), c = this.u(c);
'undefined' !== typeof a && null !== a && c.set(a, b);
return c;
};
U.prototype.push = U.prototype.push;
U.prototype.ib = function () {
bg('Firebase.onDisconnect', this.path);
return new X(this.k, this.path);
};
U.prototype.onDisconnect = U.prototype.ib;
U.prototype.N = function (a, b, c) {
Q('FirebaseRef.auth() being deprecated. Please use FirebaseRef.authWithCustomToken() instead.');
x('Firebase.auth', 1, 3, arguments.length);
cg('Firebase.auth', a);
A('Firebase.auth', 2, b, !0);
A('Firebase.auth', 3, b, !0);
Qg(this.k.N, a, {}, { remember: 'none' }, b, c);
};
U.prototype.auth = U.prototype.N;
U.prototype.he = function (a) {
x('Firebase.unauth', 0, 1, arguments.length);
A('Firebase.unauth', 1, a, !0);
Rg(this.k.N, a);
};
U.prototype.unauth = U.prototype.he;
U.prototype.ye = function () {
x('Firebase.getAuth', 0, 0, arguments.length);
return this.k.N.ye();
};
U.prototype.getAuth = U.prototype.ye;
U.prototype.vg = function (a, b) {
x('Firebase.onAuth', 1, 2, arguments.length);
A('Firebase.onAuth', 1, a, !1);
mb('Firebase.onAuth', 2, b);
this.k.N.Fb('auth_status', a, b);
};
U.prototype.onAuth = U.prototype.vg;
U.prototype.ug = function (a, b) {
x('Firebase.offAuth', 1, 2, arguments.length);
A('Firebase.offAuth', 1, a, !1);
mb('Firebase.offAuth', 2, b);
this.k.N.hc('auth_status', a, b);
};
U.prototype.offAuth = U.prototype.ug;
U.prototype.Xf = function (a, b, c) {
x('Firebase.authWithCustomToken', 2, 3, arguments.length);
cg('Firebase.authWithCustomToken', a);
A('Firebase.authWithCustomToken', 2, b, !1);
fg('Firebase.authWithCustomToken', 3, c, !0);
Qg(this.k.N, a, {}, c || {}, b);
};
U.prototype.authWithCustomToken = U.prototype.Xf;
U.prototype.Yf = function (a, b, c) {
x('Firebase.authWithOAuthPopup', 2, 3, arguments.length);
eg('Firebase.authWithOAuthPopup', a);
A('Firebase.authWithOAuthPopup', 2, b, !1);
fg('Firebase.authWithOAuthPopup', 3, c, !0);
Vg(this.k.N, a, c, b);
};
U.prototype.authWithOAuthPopup = U.prototype.Yf;
U.prototype.Zf = function (a, b, c) {
x('Firebase.authWithOAuthRedirect', 2, 3, arguments.length);
eg('Firebase.authWithOAuthRedirect', a);
A('Firebase.authWithOAuthRedirect', 2, b, !1);
fg('Firebase.authWithOAuthRedirect', 3, c, !0);
var d = this.k.N;
Tg(d);
var e = [Cg], f = ng(c);
'anonymous' === a || 'firebase' === a ? R(b, Eg('TRANSPORT_UNAVAILABLE')) : (P.set('redirect_client_options', f.od), Ug(d, e, '/auth/' + a, f, b));
};
U.prototype.authWithOAuthRedirect = U.prototype.Zf;
U.prototype.$f = function (a, b, c, d) {
x('Firebase.authWithOAuthToken', 3, 4, arguments.length);
eg('Firebase.authWithOAuthToken', a);
A('Firebase.authWithOAuthToken', 3, c, !1);
fg('Firebase.authWithOAuthToken', 4, d, !0);
p(b) ? (dg('Firebase.authWithOAuthToken', 2, b), Sg(this.k.N, a + '/token', { access_token: b }, d, c)) : (fg('Firebase.authWithOAuthToken', 2, b, !1), Sg(this.k.N, a + '/token', b, d, c));
};
U.prototype.authWithOAuthToken = U.prototype.$f;
U.prototype.Wf = function (a, b) {
x('Firebase.authAnonymously', 1, 2, arguments.length);
A('Firebase.authAnonymously', 1, a, !1);
fg('Firebase.authAnonymously', 2, b, !0);
Sg(this.k.N, 'anonymous', {}, b, a);
};
U.prototype.authAnonymously = U.prototype.Wf;
U.prototype.ag = function (a, b, c) {
x('Firebase.authWithPassword', 2, 3, arguments.length);
fg('Firebase.authWithPassword', 1, a, !1);
gg('Firebase.authWithPassword', a, 'email');
gg('Firebase.authWithPassword', a, 'password');
A('Firebase.authWithPassword', 2, b, !1);
fg('Firebase.authWithPassword', 3, c, !0);
Sg(this.k.N, 'password', a, c, b);
};
U.prototype.authWithPassword = U.prototype.ag;
U.prototype.te = function (a, b) {
x('Firebase.createUser', 2, 2, arguments.length);
fg('Firebase.createUser', 1, a, !1);
gg('Firebase.createUser', a, 'email');
gg('Firebase.createUser', a, 'password');
A('Firebase.createUser', 2, b, !1);
this.k.N.te(a, b);
};
U.prototype.createUser = U.prototype.te;
U.prototype.Ue = function (a, b) {
x('Firebase.removeUser', 2, 2, arguments.length);
fg('Firebase.removeUser', 1, a, !1);
gg('Firebase.removeUser', a, 'email');
gg('Firebase.removeUser', a, 'password');
A('Firebase.removeUser', 2, b, !1);
this.k.N.Ue(a, b);
};
U.prototype.removeUser = U.prototype.Ue;
U.prototype.qe = function (a, b) {
x('Firebase.changePassword', 2, 2, arguments.length);
fg('Firebase.changePassword', 1, a, !1);
gg('Firebase.changePassword', a, 'email');
gg('Firebase.changePassword', a, 'oldPassword');
gg('Firebase.changePassword', a, 'newPassword');
A('Firebase.changePassword', 2, b, !1);
this.k.N.qe(a, b);
};
U.prototype.changePassword = U.prototype.qe;
U.prototype.pe = function (a, b) {
x('Firebase.changeEmail', 2, 2, arguments.length);
fg('Firebase.changeEmail', 1, a, !1);
gg('Firebase.changeEmail', a, 'oldEmail');
gg('Firebase.changeEmail', a, 'newEmail');
gg('Firebase.changeEmail', a, 'password');
A('Firebase.changeEmail', 2, b, !1);
this.k.N.pe(a, b);
};
U.prototype.changeEmail = U.prototype.pe;
U.prototype.We = function (a, b) {
x('Firebase.resetPassword', 2, 2, arguments.length);
fg('Firebase.resetPassword', 1, a, !1);
gg('Firebase.resetPassword', a, 'email');
A('Firebase.resetPassword', 2, b, !1);
this.k.N.We(a, b);
};
U.prototype.resetPassword = U.prototype.We;
}());
Polymer({
is: 'firebase-auth',
properties: {
location: {
type: String,
reflectToAttribute: true,
observer: '_locationChanged'
},
provider: {
type: String,
reflectToAttribute: true,
value: 'anonymous'
},
user: {
type: Object,
readOnly: true,
notify: true
},
autoLogin: {
type: Boolean,
value: false,
reflectToAttribute: true
},
statusKnown: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
redirect: {
type: Boolean,
value: false,
reflectToAttribute: true
},
params: { type: Object },
options: { type: Object },
ref: {
type: Object,
readOnly: true,
notify: true
},
_boundAuthHandler: {
value: function () {
return this._authHandler.bind(this);
}
},
_boundOnlineHandler: {
value: function () {
return this._onlineHandler.bind(this);
}
},
_queuedLogin: { type: Object }
},
attached: function () {
window.addEventListener('online', this._boundOnlineHandler);
},
detached: function () {
window.removeEventListener('online', this._boundOnlineHandler);
this.ref.offAuth(this._boundAuthHandler);
},
_locationChanged: function (location) {
this.debounce('locationChanged', function () {
if (this.ref) {
this.ref.offAuth(this._boundAuthHandler);
}
if (location) {
this._setRef(new Firebase(location));
this.ref.onAuth(this._boundAuthHandler);
} else {
this._setRef(null);
}
}, 1);
},
_loginHandler: function (error, user) {
if (error) {
this.fire('error', error);
} else {
this._authHandler(user);
}
},
_authHandler: function (user) {
if (user) {
this._setUser(user);
this._setStatusKnown(true);
this.fire('login', { user: user });
} else {
this._setUser(null);
if (this.statusKnown) {
this._setStatusKnown(false);
this.fire('logout');
}
if (this._queuedLogin) {
this.login(this._queuedLogin.params, this._queuedLogin.options);
this._queuedLogin = null;
} else if (!this.statusKnown && this.autoLogin) {
this.login();
}
this._setStatusKnown(true);
}
},
login: function (params, options) {
if (!this.ref || navigator.onLine === false) {
this._queuedLogin = {
params: params,
options: options
};
} else {
params = params || this.params || undefined;
options = options || this.options || undefined;
switch (this.provider) {
case 'password':
this.ref.authWithPassword(params, this._loginHandler.bind(this), options);
break;
case 'anonymous':
this.ref.authAnonymously(this._loginHandler.bind(this), params);
break;
case 'custom':
this.ref.authWithCustomToken(params.token, this._loginHandler.bind(this));
break;
case 'facebook':
case 'google':
case 'github':
case 'twitter':
if (this.redirect) {
this.ref.authWithOAuthRedirect(this.provider, this._loginHandler.bind(this), params);
} else {
this.ref.authWithOAuthPopup(this.provider, this._loginHandler.bind(this), params);
}
break;
default:
throw 'Unknown provider: ' + this.provider;
}
}
},
logout: function () {
if (navigator.onLine === false) {
this.queuedLogout = true;
} else {
this.ref.unauth();
}
},
_onlineHandler: function () {
if (this.queuedLogout) {
this.queuedLogout = false;
this.logout();
} else if (this.queuedLogin) {
this.login(this.queuedLogin.params, this.queuedLogin.options);
this.queuedLogin = null;
}
},
createUser: function (email, password) {
this.ref.createUser({
email: email,
password: password
}, function (error) {
if (!error) {
this.fire('user-created');
} else {
this.fire('error', error);
}
}.bind(this));
},
changePassword: function (email, oldPassword, newPassword) {
this.ref.changePassword({
email: email,
oldPassword: oldPassword,
newPassword: newPassword
}, function (error) {
if (!error) {
this.fire('password-changed');
} else {
this.fire('error', error);
}
}.bind(this));
},
sendPasswordResetEmail: function (email) {
this.ref.resetPassword({ email: email }, function (error) {
if (!error) {
this.fire('password-reset');
} else {
this.fire('error', error);
}
}.bind(this));
},
changeEmail: function (oldEmail, newEmail, password) {
this.ref.changeEmail({
oldEmail: oldEmail,
newEmail: newEmail,
password: password
}, function (error) {
if (!error) {
this.fire('email-changed');
} else {
this.fire('error', error);
}
}.bind(this));
},
removeUser: function (email, password) {
this.ref.removeUser({
email: email,
password: password
}, function (error, success) {
if (!error) {
this.fire('user-removed');
} else {
this.fire('error', error);
}
}.bind(this));
}
});
(function () {
'use strict';
Polymer.IronJsonpLibraryBehavior = {
properties: {
libraryLoaded: {
type: Boolean,
value: false,
notify: true,
readOnly: true
},
libraryErrorMessage: {
type: String,
value: null,
notify: true,
readOnly: true
}
},
observers: ['_libraryUrlChanged(libraryUrl)'],
_libraryUrlChanged: function (libraryUrl) {
if (this._isReady && this.libraryUrl)
this._loadLibrary();
},
_libraryLoadCallback: function (err, result) {
if (err) {
console.warn('Library load failed:', err.message);
this._setLibraryErrorMessage(err.message);
} else {
this._setLibraryErrorMessage(null);
this._setLibraryLoaded(true);
if (this.notifyEvent)
this.fire(this.notifyEvent, result);
}
},
_loadLibrary: function () {
LoaderMap.require(this.libraryUrl, this._libraryLoadCallback.bind(this), this.callbackName);
},
ready: function () {
this._isReady = true;
if (this.libraryUrl)
this._loadLibrary();
}
};
var LoaderMap = {
apiMap: {},
require: function (url, notifyCallback, jsonpCallbackName) {
var name = this.nameFromUrl(url);
if (!this.apiMap[name])
this.apiMap[name] = new Loader(name, url, jsonpCallbackName);
this.apiMap[name].requestNotify(notifyCallback);
},
nameFromUrl: function (url) {
return url.replace(/[\:\/\%\?\&\.\=\-\,]/g, '_') + '_api';
}
};
var Loader = function (name, url, callbackName) {
this.notifiers = [];
if (!callbackName) {
if (url.indexOf(this.callbackMacro) >= 0) {
callbackName = name + '_loaded';
url = url.replace(this.callbackMacro, callbackName);
} else {
this.error = new Error('IronJsonpLibraryBehavior a %%callback%% parameter is required in libraryUrl');
return;
}
}
this.callbackName = callbackName;
window[this.callbackName] = this.success.bind(this);
this.addScript(url);
};
Loader.prototype = {
callbackMacro: '%%callback%%',
loaded: false,
addScript: function (src) {
var script = document.createElement('script');
script.src = src;
script.onerror = this.handleError.bind(this);
var s = document.querySelector('script') || document.body;
s.parentNode.insertBefore(script, s);
this.script = script;
},
removeScript: function () {
if (this.script.parentNode) {
this.script.parentNode.removeChild(this.script);
}
this.script = null;
},
handleError: function (ev) {
this.error = new Error('Library failed to load');
this.notifyAll();
this.cleanup();
},
success: function () {
this.loaded = true;
this.result = Array.prototype.slice.call(arguments);
this.notifyAll();
this.cleanup();
},
cleanup: function () {
delete window[this.callbackName];
},
notifyAll: function () {
this.notifiers.forEach(function (notifyCallback) {
notifyCallback(this.error, this.result);
}.bind(this));
this.notifiers = [];
},
requestNotify: function (notifyCallback) {
if (this.loaded || this.error) {
notifyCallback(this.error, this.result);
} else {
this.notifiers.push(notifyCallback);
}
}
};
}());
Polymer({
is: 'iron-jsonp-library',
behaviors: [Polymer.IronJsonpLibraryBehavior],
properties: {
libraryUrl: String,
callbackName: String,
notifyEvent: String
}
});
Polymer({
is: 'google-js-api',
behaviors: [Polymer.IronJsonpLibraryBehavior],
properties: {
libraryUrl: {
type: String,
value: 'https://apis.google.com/js/api.js?onload=%%callback%%'
},
notifyEvent: {
type: String,
value: 'js-api-load'
}
},
get api() {
return gapi;
}
});
(function () {
var ProxyLoginAttributes = {
'appPackageName': 'apppackagename',
'clientId': 'clientid',
'cookiePolicy': 'cookiepolicy',
'requestVisibleActions': 'requestvisibleactions',
'hostedDomain': 'hostedDomain'
};
var AuthEngine = {
_clientId: null,
get clientId() {
return this._clientId;
},
set clientId(val) {
if (this._clientId && val && val != this._clientId) {
throw new Error('clientId cannot change. Values do not match. New: ' + val + ' Old:' + this._clientId);
}
if (val) {
this._clientId = val;
this.initAuth2();
}
},
_cookiePolicy: 'single_host_origin',
get cookiePolicy() {
return this._cookiePolicy;
},
set cookiePolicy(val) {
if (val) {
this._cookiePolicy = val;
}
},
_appPackageName: '',
get appPackageName() {
return this._appPackageName;
},
set appPackageName(val) {
if (this._appPackageName && val && val != this._appPackageName) {
throw new Error('appPackageName cannot change. Values do not match. New: ' + val + ' Old: ' + this._appPackageName);
}
if (val) {
this._appPackageName = val;
}
},
_requestVisibleActions: '',
get requestVisibleactions() {
return this._requestVisibleActions;
},
set requestVisibleactions(val) {
if (this._requestVisibleActions && val && val != this._requestVisibleActions) {
throw new Error('requestVisibleactions cannot change. Values do not match. New: ' + val + ' Old: ' + this._requestVisibleActions);
}
if (val)
this._requestVisibleActions = val;
},
_hostedDomain: '',
get hostedDomain() {
return this._hostedDomain;
},
set hostedDomain(val) {
if (this._hostedDomain && val && val != this._hostedDomain) {
throw new Error('hostedDomain cannot change. Values do not match. New: ' + val + ' Old: ' + this._hostedDomain);
}
if (val)
this._hostedDomain = val;
},
_offline: false,
get offline() {
return this._offline;
},
set offline(val) {
this._offline = val;
this.updateAdditionalAuth();
},
_offlineAlwaysPrompt: false,
get offlineAlwaysPrompt() {
return this._offlineAlwaysPrompt;
},
set offlineAlwaysPrompt(val) {
this._offlineAlwaysPrompt = val;
this.updateAdditionalAuth();
},
offlineGranted: false,
_apiLoader: null,
_requestedScopeArray: [],
get requestedScopes() {
return this._requestedScopeArray.join(' ');
},
_signedIn: false,
_grantedScopeArray: [],
_needAdditionalAuth: true,
_hasPlusScopes: false,
signinAwares: [],
init: function () {
this._apiLoader = document.createElement('google-js-api');
this._apiLoader.addEventListener('js-api-load', this.loadAuth2.bind(this));
},
loadAuth2: function () {
gapi.load('auth2', this.initAuth2.bind(this));
},
initAuth2: function () {
if (!('gapi' in window) || !('auth2' in window.gapi) || !this.clientId) {
return;
}
var auth = gapi.auth2.init({
'client_id': this.clientId,
'cookie_policy': this.cookiePolicy,
'scope': this.requestedScopes,
'hosted_domain': this.hostedDomain
});
auth.currentUser.listen(this.handleUserUpdate.bind(this));
auth.then(function success() {
}, function error(error) {
console.error(error);
});
},
handleUserUpdate: function (newPrimaryUser) {
var isSignedIn = newPrimaryUser.isSignedIn();
if (isSignedIn != this._signedIn) {
this._signedIn = isSignedIn;
for (var i = 0; i < this.signinAwares.length; i++) {
this.signinAwares[i]._setSignedIn(isSignedIn);
}
}
this._grantedScopeArray = this.strToScopeArray(newPrimaryUser.getGrantedScopes());
this.updateAdditionalAuth();
var response = newPrimaryUser.getAuthResponse();
for (var i = 0; i < this.signinAwares.length; i++) {
this.signinAwares[i]._updateScopeStatus(response);
}
},
setOfflineCode: function (code) {
for (var i = 0; i < this.signinAwares.length; i++) {
this.signinAwares[i]._updateOfflineCode(code);
}
},
strToScopeArray: function (str) {
if (!str) {
return [];
}
var scopes = str.replace(/\ +/g, ' ').trim().split(' ');
for (var i = 0; i < scopes.length; i++) {
scopes[i] = scopes[i].toLowerCase();
if (scopes[i] === 'https://www.googleapis.com/auth/userinfo.profile') {
scopes[i] = 'profile';
}
if (scopes[i] === 'https://www.googleapis.com/auth/userinfo.email') {
scopes[i] = 'email';
}
}
return scopes.filter(function (value, index, self) {
return self.indexOf(value) === index;
});
},
isPlusScope: function (scope) {
return scope.indexOf('/auth/games') > -1 || scope.indexOf('auth/plus.') > -1 && scope.indexOf('auth/plus.me') < 0;
},
hasGrantedScopes: function (scopeStr) {
var scopes = this.strToScopeArray(scopeStr);
for (var i = 0; i < scopes.length; i++) {
if (this._grantedScopeArray.indexOf(scopes[i]) === -1)
return false;
}
return true;
},
requestScopes: function (newScopeStr) {
var newScopes = this.strToScopeArray(newScopeStr);
var scopesUpdated = false;
for (var i = 0; i < newScopes.length; i++) {
if (this._requestedScopeArray.indexOf(newScopes[i]) === -1) {
this._requestedScopeArray.push(newScopes[i]);
scopesUpdated = true;
}
}
if (scopesUpdated) {
this.updateAdditionalAuth();
this.updatePlusScopes();
}
},
updateAdditionalAuth: function () {
var needMoreAuth = false;
if ((this.offlineAlwaysPrompt || this.offline) && !this.offlineGranted) {
needMoreAuth = true;
} else {
for (var i = 0; i < this._requestedScopeArray.length; i++) {
if (this._grantedScopeArray.indexOf(this._requestedScopeArray[i]) === -1) {
needMoreAuth = true;
break;
}
}
}
if (this._needAdditionalAuth != needMoreAuth) {
this._needAdditionalAuth = needMoreAuth;
for (var i = 0; i < this.signinAwares.length; i++) {
this.signinAwares[i]._setNeedAdditionalAuth(needMoreAuth);
}
}
},
updatePlusScopes: function () {
var hasPlusScopes = false;
for (var i = 0; i < this._requestedScopeArray.length; i++) {
if (this.isPlusScope(this._requestedScopeArray[i])) {
hasPlusScopes = true;
break;
}
}
if (this._hasPlusScopes != hasPlusScopes) {
this._hasPlusScopes = hasPlusScopes;
for (var i = 0; i < this.signinAwares.length; i++) {
this.signinAwares[i]._setHasPlusScopes(hasPlusScopes);
}
}
},
attachSigninAware: function (aware) {
if (this.signinAwares.indexOf(aware) == -1) {
this.signinAwares.push(aware);
aware._setNeedAdditionalAuth(this._needAdditionalAuth);
aware._setSignedIn(this._signedIn);
aware._setHasPlusScopes(this._hasPlusScopes);
} else {
console.warn('signinAware attached more than once', aware);
}
},
detachSigninAware: function (aware) {
var index = this.signinAwares.indexOf(aware);
if (index != -1) {
this.signinAwares.splice(index, 1);
} else {
console.warn('Trying to detach unattached signin-aware');
}
},
getMissingScopes: function () {
return this._requestedScopeArray.filter(function (scope) {
return this._grantedScopeArray.indexOf(scope) === -1;
}.bind(this)).join(' ');
},
assertAuthInitialized: function () {
if (!this.clientId) {
throw new Error('AuthEngine not initialized. clientId has not been configured.');
}
if (!('gapi' in window)) {
throw new Error('AuthEngine not initialized. gapi has not loaded.');
}
if (!('auth2' in window.gapi)) {
throw new Error('AuthEngine not initialized. auth2 not loaded.');
}
},
signIn: function () {
this.assertAuthInitialized();
var params = { 'scope': this.getMissingScopes() };
Object.keys(ProxyLoginAttributes).forEach(function (key) {
if (this[key] && this[key] !== '') {
params[ProxyLoginAttributes[key]] = this[key];
}
}, this);
var promise;
var user = gapi.auth2.getAuthInstance().currentUser.get();
if (!(this.offline || this.offlineAlwaysPrompt)) {
if (user.getGrantedScopes()) {
promise = user.grant(params);
} else {
promise = gapi.auth2.getAuthInstance().signIn(params);
}
} else {
params.redirect_uri = 'postmessage';
if (this.offlineAlwaysPrompt) {
params.approval_prompt = 'force';
}
promise = gapi.auth2.getAuthInstance().grantOfflineAccess(params);
}
promise.then(function success(response) {
var newUser;
if (response.code) {
AuthEngine.offlineGranted = true;
newUser = gapi.auth2.getAuthInstance().currentUser.get();
AuthEngine.setOfflineCode(response.code);
} else {
newUser = response;
}
var authResponse = newUser.getAuthResponse();
}, function error(error) {
if ('Access denied.' == error.reason) {
return;
} else {
console.error(error);
}
});
},
signOut: function () {
this.assertAuthInitialized();
gapi.auth2.getAuthInstance().signOut().then(function success() {
}, function error(error) {
console.error(error);
});
}
};
AuthEngine.init();
Polymer({
is: 'google-signin-aware',
properties: {
appPackageName: {
type: String,
observer: '_appPackageNameChanged'
},
clientId: {
type: String,
observer: '_clientIdChanged'
},
cookiePolicy: {
type: String,
observer: '_cookiePolicyChanged'
},
requestVisibleActions: {
type: String,
observer: '_requestVisibleActionsChanged'
},
hostedDomain: {
type: String,
observer: '_hostedDomainChanged'
},
offline: {
type: Boolean,
value: false,
observer: '_offlineChanged'
},
offlineAlwaysPrompt: {
type: Boolean,
value: false,
observer: '_offlineAlwaysPromptChanged'
},
scopes: {
type: String,
value: 'profile',
observer: '_scopesChanged'
},
signedIn: {
type: Boolean,
notify: true,
readOnly: true
},
isAuthorized: {
type: Boolean,
notify: true,
readOnly: true,
value: false
},
needAdditionalAuth: {
type: Boolean,
notify: true,
readOnly: true
},
hasPlusScopes: {
type: Boolean,
value: false,
notify: true,
readOnly: true
}
},
attached: function () {
AuthEngine.attachSigninAware(this);
},
detached: function () {
AuthEngine.detachSigninAware(this);
},
signIn: function () {
AuthEngine.signIn();
},
signOut: function () {
AuthEngine.signOut();
},
_appPackageNameChanged: function (newName, oldName) {
AuthEngine.appPackageName = newName;
},
_clientIdChanged: function (newId, oldId) {
AuthEngine.clientId = newId;
},
_cookiePolicyChanged: function (newPolicy, oldPolicy) {
AuthEngine.cookiePolicy = newPolicy;
},
_requestVisibleActionsChanged: function (newVal, oldVal) {
AuthEngine.requestVisibleActions = newVal;
},
_hostedDomainChanged: function (newVal, oldVal) {
AuthEngine.hostedDomain = newVal;
},
_offlineChanged: function (newVal, oldVal) {
AuthEngine.offline = newVal;
},
_offlineAlwaysPromptChanged: function (newVal, oldVal) {
AuthEngine.offlineAlwaysPrompt = newVal;
},
_scopesChanged: function (newVal, oldVal) {
AuthEngine.requestScopes(newVal);
this._updateScopeStatus();
},
_updateScopeStatus: function (user) {
var newAuthorized = this.signedIn && AuthEngine.hasGrantedScopes(this.scopes);
if (newAuthorized !== this.isAuthorized) {
this._setIsAuthorized(newAuthorized);
if (newAuthorized) {
this.fire('google-signin-aware-success', user);
} else {
this.fire('google-signin-aware-signed-out', user);
}
}
},
_updateOfflineCode: function (code) {
if (code) {
this.fire('google-signin-offline-success', { code: code });
}
}
});
}());
(function () {
var metaDatas = {};
var metaArrays = {};
var singleton = null;
Polymer.IronMeta = Polymer({
is: 'iron-meta',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
observer: '_valueChanged'
},
self: {
type: Boolean,
observer: '_selfChanged'
},
list: {
type: Array,
notify: true
}
},
hostAttributes: { hidden: true },
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
case 'value':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key, old) {
this._resetRegistration(old);
},
_valueChanged: function (value) {
this._resetRegistration(this.key);
},
_selfChanged: function (self) {
if (self) {
this.value = this;
}
},
_typeChanged: function (type) {
this._unregisterKey(this.key);
if (!metaDatas[type]) {
metaDatas[type] = {};
}
this._metaData = metaDatas[type];
if (!metaArrays[type]) {
metaArrays[type] = [];
}
this.list = metaArrays[type];
this._registerKeyValue(this.key, this.value);
},
byKey: function (key) {
return this._metaData && this._metaData[key];
},
_resetRegistration: function (oldKey) {
this._unregisterKey(oldKey);
this._registerKeyValue(this.key, this.value);
},
_unregisterKey: function (key) {
this._unregister(key, this._metaData, this.list);
},
_registerKeyValue: function (key, value) {
this._register(key, value, this._metaData, this.list);
},
_register: function (key, value, data, list) {
if (key && data && value !== undefined) {
data[key] = value;
list.push(value);
}
},
_unregister: function (key, data, list) {
if (key && data) {
if (key in data) {
var value = data[key];
delete data[key];
this.arrayDelete(list, value);
}
}
}
});
Polymer.IronMeta.getIronMeta = function getIronMeta() {
if (singleton === null) {
singleton = new Polymer.IronMeta();
}
return singleton;
};
Polymer.IronMetaQuery = Polymer({
is: 'iron-meta-query',
properties: {
type: {
type: String,
value: 'default',
observer: '_typeChanged'
},
key: {
type: String,
observer: '_keyChanged'
},
value: {
type: Object,
notify: true,
readOnly: true
},
list: {
type: Array,
notify: true
}
},
factoryImpl: function (config) {
if (config) {
for (var n in config) {
switch (n) {
case 'type':
case 'key':
this[n] = config[n];
break;
}
}
}
},
created: function () {
this._metaDatas = metaDatas;
this._metaArrays = metaArrays;
},
_keyChanged: function (key) {
this._setValue(this._metaData && this._metaData[key]);
},
_typeChanged: function (type) {
this._metaData = metaDatas[type];
this.list = metaArrays[type];
if (this.key) {
this._keyChanged(this.key);
}
},
byKey: function (key) {
return this._metaData && this._metaData[key];
}
});
}());
Polymer({
is: 'iron-icon',
properties: {
icon: {
type: String,
observer: '_iconChanged'
},
theme: {
type: String,
observer: '_updateIcon'
},
src: {
type: String,
observer: '_srcChanged'
},
_meta: { value: Polymer.Base.create('iron-meta', { type: 'iconset' }) }
},
_DEFAULT_ICONSET: 'icons',
_iconChanged: function (icon) {
var parts = (icon || '').split(':');
this._iconName = parts.pop();
this._iconsetName = parts.pop() || this._DEFAULT_ICONSET;
this._updateIcon();
},
_srcChanged: function (src) {
this._updateIcon();
},
_usesIconset: function () {
return this.icon || !this.src;
},
_updateIcon: function () {
if (this._usesIconset()) {
if (this._iconsetName) {
this._iconset = this._meta.byKey(this._iconsetName);
if (this._iconset) {
this._iconset.applyIcon(this, this._iconName, this.theme);
this.unlisten(window, 'iron-iconset-added', '_updateIcon');
} else {
this.listen(window, 'iron-iconset-added', '_updateIcon');
}
}
} else {
if (!this._img) {
this._img = document.createElement('img');
this._img.style.width = '100%';
this._img.style.height = '100%';
this._img.draggable = false;
}
this._img.src = this.src;
Polymer.dom(this.root).appendChild(this._img);
}
}
});
(function () {
'use strict';
var KEY_IDENTIFIER = {
'U+0008': 'backspace',
'U+0009': 'tab',
'U+001B': 'esc',
'U+0020': 'space',
'U+007F': 'del'
};
var KEY_CODE = {
8: 'backspace',
9: 'tab',
13: 'enter',
27: 'esc',
33: 'pageup',
34: 'pagedown',
35: 'end',
36: 'home',
32: 'space',
37: 'left',
38: 'up',
39: 'right',
40: 'down',
46: 'del',
106: '*'
};
var MODIFIER_KEYS = {
'shift': 'shiftKey',
'ctrl': 'ctrlKey',
'alt': 'altKey',
'meta': 'metaKey'
};
var KEY_CHAR = /[a-z0-9*]/;
var IDENT_CHAR = /U\+/;
var ARROW_KEY = /^arrow/;
var SPACE_KEY = /^space(bar)?/;
function transformKey(key, noSpecialChars) {
var validKey = '';
if (key) {
var lKey = key.toLowerCase();
if (lKey === ' ' || SPACE_KEY.test(lKey)) {
validKey = 'space';
} else if (lKey.length == 1) {
if (!noSpecialChars || KEY_CHAR.test(lKey)) {
validKey = lKey;
}
} else if (ARROW_KEY.test(lKey)) {
validKey = lKey.replace('arrow', '');
} else if (lKey == 'multiply') {
validKey = '*';
} else {
validKey = lKey;
}
}
return validKey;
}
function transformKeyIdentifier(keyIdent) {
var validKey = '';
if (keyIdent) {
if (keyIdent in KEY_IDENTIFIER) {
validKey = KEY_IDENTIFIER[keyIdent];
} else if (IDENT_CHAR.test(keyIdent)) {
keyIdent = parseInt(keyIdent.replace('U+', '0x'), 16);
validKey = String.fromCharCode(keyIdent).toLowerCase();
} else {
validKey = keyIdent.toLowerCase();
}
}
return validKey;
}
function transformKeyCode(keyCode) {
var validKey = '';
if (Number(keyCode)) {
if (keyCode >= 65 && keyCode <= 90) {
validKey = String.fromCharCode(32 + keyCode);
} else if (keyCode >= 112 && keyCode <= 123) {
validKey = 'f' + (keyCode - 112);
} else if (keyCode >= 48 && keyCode <= 57) {
validKey = String(48 - keyCode);
} else if (keyCode >= 96 && keyCode <= 105) {
validKey = String(96 - keyCode);
} else {
validKey = KEY_CODE[keyCode];
}
}
return validKey;
}
function normalizedKeyForEvent(keyEvent, noSpecialChars) {
return transformKey(keyEvent.key, noSpecialChars) || transformKeyIdentifier(keyEvent.keyIdentifier) || transformKeyCode(keyEvent.keyCode) || transformKey(keyEvent.detail.key, noSpecialChars) || '';
}
function keyComboMatchesEvent(keyCombo, event) {
var keyEvent = normalizedKeyForEvent(event, keyCombo.hasModifiers);
return keyEvent === keyCombo.key && (!keyCombo.hasModifiers || !!event.shiftKey === !!keyCombo.shiftKey && !!event.ctrlKey === !!keyCombo.ctrlKey && !!event.altKey === !!keyCombo.altKey && !!event.metaKey === !!keyCombo.metaKey);
}
function parseKeyComboString(keyComboString) {
if (keyComboString.length === 1) {
return {
combo: keyComboString,
key: keyComboString,
event: 'keydown'
};
}
return keyComboString.split('+').reduce(function (parsedKeyCombo, keyComboPart) {
var eventParts = keyComboPart.split(':');
var keyName = eventParts[0];
var event = eventParts[1];
if (keyName in MODIFIER_KEYS) {
parsedKeyCombo[MODIFIER_KEYS[keyName]] = true;
parsedKeyCombo.hasModifiers = true;
} else {
parsedKeyCombo.key = keyName;
parsedKeyCombo.event = event || 'keydown';
}
return parsedKeyCombo;
}, { combo: keyComboString.split(':').shift() });
}
function parseEventString(eventString) {
return eventString.trim().split(' ').map(function (keyComboString) {
return parseKeyComboString(keyComboString);
});
}
Polymer.IronA11yKeysBehavior = {
properties: {
keyEventTarget: {
type: Object,
value: function () {
return this;
}
},
stopKeyboardEventPropagation: {
type: Boolean,
value: false
},
_boundKeyHandlers: {
type: Array,
value: function () {
return [];
}
},
_imperativeKeyBindings: {
type: Object,
value: function () {
return {};
}
}
},
observers: ['_resetKeyEventListeners(keyEventTarget, _boundKeyHandlers)'],
keyBindings: {},
registered: function () {
this._prepKeyBindings();
},
attached: function () {
this._listenKeyEventListeners();
},
detached: function () {
this._unlistenKeyEventListeners();
},
addOwnKeyBinding: function (eventString, handlerName) {
this._imperativeKeyBindings[eventString] = handlerName;
this._prepKeyBindings();
this._resetKeyEventListeners();
},
removeOwnKeyBindings: function () {
this._imperativeKeyBindings = {};
this._prepKeyBindings();
this._resetKeyEventListeners();
},
keyboardEventMatchesKeys: function (event, eventString) {
var keyCombos = parseEventString(eventString);
for (var i = 0; i < keyCombos.length; ++i) {
if (keyComboMatchesEvent(keyCombos[i], event)) {
return true;
}
}
return false;
},
_collectKeyBindings: function () {
var keyBindings = this.behaviors.map(function (behavior) {
return behavior.keyBindings;
});
if (keyBindings.indexOf(this.keyBindings) === -1) {
keyBindings.push(this.keyBindings);
}
return keyBindings;
},
_prepKeyBindings: function () {
this._keyBindings = {};
this._collectKeyBindings().forEach(function (keyBindings) {
for (var eventString in keyBindings) {
this._addKeyBinding(eventString, keyBindings[eventString]);
}
}, this);
for (var eventString in this._imperativeKeyBindings) {
this._addKeyBinding(eventString, this._imperativeKeyBindings[eventString]);
}
for (var eventName in this._keyBindings) {
this._keyBindings[eventName].sort(function (kb1, kb2) {
var b1 = kb1[0].hasModifiers;
var b2 = kb2[0].hasModifiers;
return b1 === b2 ? 0 : b1 ? -1 : 1;
});
}
},
_addKeyBinding: function (eventString, handlerName) {
parseEventString(eventString).forEach(function (keyCombo) {
this._keyBindings[keyCombo.event] = this._keyBindings[keyCombo.event] || [];
this._keyBindings[keyCombo.event].push([
keyCombo,
handlerName
]);
}, this);
},
_resetKeyEventListeners: function () {
this._unlistenKeyEventListeners();
if (this.isAttached) {
this._listenKeyEventListeners();
}
},
_listenKeyEventListeners: function () {
Object.keys(this._keyBindings).forEach(function (eventName) {
var keyBindings = this._keyBindings[eventName];
var boundKeyHandler = this._onKeyBindingEvent.bind(this, keyBindings);
this._boundKeyHandlers.push([
this.keyEventTarget,
eventName,
boundKeyHandler
]);
this.keyEventTarget.addEventListener(eventName, boundKeyHandler);
}, this);
},
_unlistenKeyEventListeners: function () {
var keyHandlerTuple;
var keyEventTarget;
var eventName;
var boundKeyHandler;
while (this._boundKeyHandlers.length) {
keyHandlerTuple = this._boundKeyHandlers.pop();
keyEventTarget = keyHandlerTuple[0];
eventName = keyHandlerTuple[1];
boundKeyHandler = keyHandlerTuple[2];
keyEventTarget.removeEventListener(eventName, boundKeyHandler);
}
},
_onKeyBindingEvent: function (keyBindings, event) {
if (this.stopKeyboardEventPropagation) {
event.stopPropagation();
}
if (event.defaultPrevented) {
return;
}
for (var i = 0; i < keyBindings.length; i++) {
var keyCombo = keyBindings[i][0];
var handlerName = keyBindings[i][1];
if (keyComboMatchesEvent(keyCombo, event)) {
this._triggerKeyHandler(keyCombo, handlerName, event);
if (event.defaultPrevented) {
return;
}
}
}
},
_triggerKeyHandler: function (keyCombo, handlerName, keyboardEvent) {
var detail = Object.create(keyCombo);
detail.keyboardEvent = keyboardEvent;
var event = new CustomEvent(keyCombo.event, {
detail: detail,
cancelable: true
});
this[handlerName].call(this, event);
if (event.defaultPrevented) {
keyboardEvent.preventDefault();
}
}
};
}());
(function () {
var Utility = {
distance: function (x1, y1, x2, y2) {
var xDelta = x1 - x2;
var yDelta = y1 - y2;
return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
},
now: window.performance && window.performance.now ? window.performance.now.bind(window.performance) : Date.now
};
function ElementMetrics(element) {
this.element = element;
this.width = this.boundingRect.width;
this.height = this.boundingRect.height;
this.size = Math.max(this.width, this.height);
}
ElementMetrics.prototype = {
get boundingRect() {
return this.element.getBoundingClientRect();
},
furthestCornerDistanceFrom: function (x, y) {
var topLeft = Utility.distance(x, y, 0, 0);
var topRight = Utility.distance(x, y, this.width, 0);
var bottomLeft = Utility.distance(x, y, 0, this.height);
var bottomRight = Utility.distance(x, y, this.width, this.height);
return Math.max(topLeft, topRight, bottomLeft, bottomRight);
}
};
function Ripple(element) {
this.element = element;
this.color = window.getComputedStyle(element).color;
this.wave = document.createElement('div');
this.waveContainer = document.createElement('div');
this.wave.style.backgroundColor = this.color;
this.wave.classList.add('wave');
this.waveContainer.classList.add('wave-container');
Polymer.dom(this.waveContainer).appendChild(this.wave);
this.resetInteractionState();
}
Ripple.MAX_RADIUS = 300;
Ripple.prototype = {
get recenters() {
return this.element.recenters;
},
get center() {
return this.element.center;
},
get mouseDownElapsed() {
var elapsed;
if (!this.mouseDownStart) {
return 0;
}
elapsed = Utility.now() - this.mouseDownStart;
if (this.mouseUpStart) {
elapsed -= this.mouseUpElapsed;
}
return elapsed;
},
get mouseUpElapsed() {
return this.mouseUpStart ? Utility.now() - this.mouseUpStart : 0;
},
get mouseDownElapsedSeconds() {
return this.mouseDownElapsed / 1000;
},
get mouseUpElapsedSeconds() {
return this.mouseUpElapsed / 1000;
},
get mouseInteractionSeconds() {
return this.mouseDownElapsedSeconds + this.mouseUpElapsedSeconds;
},
get initialOpacity() {
return this.element.initialOpacity;
},
get opacityDecayVelocity() {
return this.element.opacityDecayVelocity;
},
get radius() {
var width2 = this.containerMetrics.width * this.containerMetrics.width;
var height2 = this.containerMetrics.height * this.containerMetrics.height;
var waveRadius = Math.min(Math.sqrt(width2 + height2), Ripple.MAX_RADIUS) * 1.1 + 5;
var duration = 1.1 - 0.2 * (waveRadius / Ripple.MAX_RADIUS);
var timeNow = this.mouseInteractionSeconds / duration;
var size = waveRadius * (1 - Math.pow(80, -timeNow));
return Math.abs(size);
},
get opacity() {
if (!this.mouseUpStart) {
return this.initialOpacity;
}
return Math.max(0, this.initialOpacity - this.mouseUpElapsedSeconds * this.opacityDecayVelocity);
},
get outerOpacity() {
var outerOpacity = this.mouseUpElapsedSeconds * 0.3;
var waveOpacity = this.opacity;
return Math.max(0, Math.min(outerOpacity, waveOpacity));
},
get isOpacityFullyDecayed() {
return this.opacity < 0.01 && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isRestingAtMaxRadius() {
return this.opacity >= this.initialOpacity && this.radius >= Math.min(this.maxRadius, Ripple.MAX_RADIUS);
},
get isAnimationComplete() {
return this.mouseUpStart ? this.isOpacityFullyDecayed : this.isRestingAtMaxRadius;
},
get translationFraction() {
return Math.min(1, this.radius / this.containerMetrics.size * 2 / Math.sqrt(2));
},
get xNow() {
if (this.xEnd) {
return this.xStart + this.translationFraction * (this.xEnd - this.xStart);
}
return this.xStart;
},
get yNow() {
if (this.yEnd) {
return this.yStart + this.translationFraction * (this.yEnd - this.yStart);
}
return this.yStart;
},
get isMouseDown() {
return this.mouseDownStart && !this.mouseUpStart;
},
resetInteractionState: function () {
this.maxRadius = 0;
this.mouseDownStart = 0;
this.mouseUpStart = 0;
this.xStart = 0;
this.yStart = 0;
this.xEnd = 0;
this.yEnd = 0;
this.slideDistance = 0;
this.containerMetrics = new ElementMetrics(this.element);
},
draw: function () {
var scale;
var translateString;
var dx;
var dy;
this.wave.style.opacity = this.opacity;
scale = this.radius / (this.containerMetrics.size / 2);
dx = this.xNow - this.containerMetrics.width / 2;
dy = this.yNow - this.containerMetrics.height / 2;
this.waveContainer.style.webkitTransform = 'translate(' + dx + 'px, ' + dy + 'px)';
this.waveContainer.style.transform = 'translate3d(' + dx + 'px, ' + dy + 'px, 0)';
this.wave.style.webkitTransform = 'scale(' + scale + ',' + scale + ')';
this.wave.style.transform = 'scale3d(' + scale + ',' + scale + ',1)';
},
downAction: function (event) {
var xCenter = this.containerMetrics.width / 2;
var yCenter = this.containerMetrics.height / 2;
this.resetInteractionState();
this.mouseDownStart = Utility.now();
if (this.center) {
this.xStart = xCenter;
this.yStart = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
} else {
this.xStart = event ? event.detail.x - this.containerMetrics.boundingRect.left : this.containerMetrics.width / 2;
this.yStart = event ? event.detail.y - this.containerMetrics.boundingRect.top : this.containerMetrics.height / 2;
}
if (this.recenters) {
this.xEnd = xCenter;
this.yEnd = yCenter;
this.slideDistance = Utility.distance(this.xStart, this.yStart, this.xEnd, this.yEnd);
}
this.maxRadius = this.containerMetrics.furthestCornerDistanceFrom(this.xStart, this.yStart);
this.waveContainer.style.top = (this.containerMetrics.height - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.left = (this.containerMetrics.width - this.containerMetrics.size) / 2 + 'px';
this.waveContainer.style.width = this.containerMetrics.size + 'px';
this.waveContainer.style.height = this.containerMetrics.size + 'px';
},
upAction: function (event) {
if (!this.isMouseDown) {
return;
}
this.mouseUpStart = Utility.now();
},
remove: function () {
Polymer.dom(this.waveContainer.parentNode).removeChild(this.waveContainer);
}
};
Polymer({
is: 'paper-ripple',
behaviors: [Polymer.IronA11yKeysBehavior],
properties: {
initialOpacity: {
type: Number,
value: 0.25
},
opacityDecayVelocity: {
type: Number,
value: 0.8
},
recenters: {
type: Boolean,
value: false
},
center: {
type: Boolean,
value: false
},
ripples: {
type: Array,
value: function () {
return [];
}
},
animating: {
type: Boolean,
readOnly: true,
reflectToAttribute: true,
value: false
},
holdDown: {
type: Boolean,
value: false,
observer: '_holdDownChanged'
},
noink: {
type: Boolean,
value: false
},
_animating: { type: Boolean },
_boundAnimate: {
type: Function,
value: function () {
return this.animate.bind(this);
}
}
},
get target() {
var ownerRoot = Polymer.dom(this).getOwnerRoot();
var target;
if (this.parentNode.nodeType == 11) {
target = ownerRoot.host;
} else {
target = this.parentNode;
}
return target;
},
keyBindings: {
'enter:keydown': '_onEnterKeydown',
'space:keydown': '_onSpaceKeydown',
'space:keyup': '_onSpaceKeyup'
},
attached: function () {
this.keyEventTarget = this.target;
this.listen(this.target, 'up', 'uiUpAction');
this.listen(this.target, 'down', 'uiDownAction');
},
detached: function () {
this.unlisten(this.target, 'up', 'uiUpAction');
this.unlisten(this.target, 'down', 'uiDownAction');
},
get shouldKeepAnimating() {
for (var index = 0; index < this.ripples.length; ++index) {
if (!this.ripples[index].isAnimationComplete) {
return true;
}
}
return false;
},
simulatedRipple: function () {
this.downAction(null);
this.async(function () {
this.upAction();
}, 1);
},
uiDownAction: function (event) {
if (!this.noink) {
this.downAction(event);
}
},
downAction: function (event) {
if (this.holdDown && this.ripples.length > 0) {
return;
}
var ripple = this.addRipple();
ripple.downAction(event);
if (!this._animating) {
this.animate();
}
},
uiUpAction: function (event) {
if (!this.noink) {
this.upAction(event);
}
},
upAction: function (event) {
if (this.holdDown) {
return;
}
this.ripples.forEach(function (ripple) {
ripple.upAction(event);
});
this.animate();
},
onAnimationComplete: function () {
this._animating = false;
this.$.background.style.backgroundColor = null;
this.fire('transitionend');
},
addRipple: function () {
var ripple = new Ripple(this);
Polymer.dom(this.$.waves).appendChild(ripple.waveContainer);
this.$.background.style.backgroundColor = ripple.color;
this.ripples.push(ripple);
this._setAnimating(true);
return ripple;
},
removeRipple: function (ripple) {
var rippleIndex = this.ripples.indexOf(ripple);
if (rippleIndex < 0) {
return;
}
this.ripples.splice(rippleIndex, 1);
ripple.remove();
if (!this.ripples.length) {
this._setAnimating(false);
}
},
animate: function () {
var index;
var ripple;
this._animating = true;
for (index = 0; index < this.ripples.length; ++index) {
ripple = this.ripples[index];
ripple.draw();
this.$.background.style.opacity = ripple.outerOpacity;
if (ripple.isOpacityFullyDecayed && !ripple.isRestingAtMaxRadius) {
this.removeRipple(ripple);
}
}
if (!this.shouldKeepAnimating && this.ripples.length === 0) {
this.onAnimationComplete();
} else {
window.requestAnimationFrame(this._boundAnimate);
}
},
_onEnterKeydown: function () {
this.uiDownAction();
this.async(this.uiUpAction, 1);
},
_onSpaceKeydown: function () {
this.uiDownAction();
},
_onSpaceKeyup: function () {
this.uiUpAction();
},
_holdDownChanged: function (newVal, oldVal) {
if (oldVal === undefined) {
return;
}
if (newVal) {
this.downAction();
} else {
this.upAction();
}
}
});
}());
Polymer({
is: 'paper-material',
properties: {
elevation: {
type: Number,
reflectToAttribute: true,
value: 1
},
animated: {
type: Boolean,
reflectToAttribute: true,
value: false
}
}
});
Polymer({
is: 'iron-iconset-svg',
properties: {
name: {
type: String,
observer: '_nameChanged'
},
size: {
type: Number,
value: 24
}
},
attached: function () {
this.style.display = 'none';
},
getIconNames: function () {
this._icons = this._createIconMap();
return Object.keys(this._icons).map(function (n) {
return this.name + ':' + n;
}, this);
},
applyIcon: function (element, iconName) {
element = element.root || element;
this.removeIcon(element);
var svg = this._cloneIcon(iconName);
if (svg) {
var pde = Polymer.dom(element);
pde.insertBefore(svg, pde.childNodes[0]);
return element._svgIcon = svg;
}
return null;
},
removeIcon: function (element) {
if (element._svgIcon) {
Polymer.dom(element).removeChild(element._svgIcon);
element._svgIcon = null;
}
},
_nameChanged: function () {
new Polymer.IronMeta({
type: 'iconset',
key: this.name,
value: this
});
this.async(function () {
this.fire('iron-iconset-added', this, { node: window });
});
},
_createIconMap: function () {
var icons = Object.create(null);
Polymer.dom(this).querySelectorAll('[id]').forEach(function (icon) {
icons[icon.id] = icon;
});
return icons;
},
_cloneIcon: function (id) {
this._icons = this._icons || this._createIconMap();
return this._prepareSvgClone(this._icons[id], this.size);
},
_prepareSvgClone: function (sourceSvg, size) {
if (sourceSvg) {
var content = sourceSvg.cloneNode(true), svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), viewBox = content.getAttribute('viewBox') || '0 0 ' + size + ' ' + size;
svg.setAttribute('viewBox', viewBox);
svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
svg.style.cssText = 'pointer-events: none; display: block; width: 100%; height: 100%;';
svg.appendChild(content).removeAttribute('id');
return svg;
}
return null;
}
});
(function () {
var BrandValue = {
GOOGLE: 'google',
PLUS: 'google-plus'
};
var HeightValue = {
SHORT: 'short',
STANDARD: 'standard',
TALL: 'tall'
};
var LabelValue = {
STANDARD: 'Sign in',
WIDE: 'Sign in with Google',
WIDE_PLUS: 'Sign in with Google+'
};
var ThemeValue = {
LIGHT: 'light',
DARK: 'dark'
};
var WidthValue = {
ICON_ONLY: 'iconOnly',
STANDARD: 'standard',
WIDE: 'wide'
};
Polymer({
is: 'google-signin',
properties: {
appPackageName: {
type: String,
value: ''
},
brand: {
type: String,
value: ''
},
_brand: {
type: String,
computed: '_computeBrand(brand, hasPlusScopes)'
},
clientId: {
type: String,
value: ''
},
cookiePolicy: {
type: String,
value: ''
},
height: {
type: String,
value: 'standard'
},
fill: {
type: Boolean,
value: true
},
labelAdditional: {
type: String,
value: 'Additional permissions required'
},
labelSignin: {
type: String,
value: ''
},
_labelSignin: {
type: String,
computed: '_computeSigninLabel(labelSignin, width, _brand)'
},
labelSignout: {
type: String,
value: 'Sign out'
},
raised: {
type: Boolean,
value: false
},
requestVisibleActions: {
type: String,
value: ''
},
hostedDomain: {
type: String,
value: ''
},
offline: {
type: Boolean,
value: false
},
offlineAlwaysPrompt: {
type: Boolean,
value: false
},
scopes: {
type: String,
value: ''
},
theme: {
type: String,
value: 'light'
},
width: {
type: String,
value: 'standard'
},
_brandIcon: {
type: String,
computed: '_computeIcon(_brand)'
},
hasPlusScopes: {
type: Boolean,
notify: true,
value: false
},
needAdditionalAuth: {
type: Boolean,
value: false
},
signedIn: {
type: Boolean,
notify: true,
value: false,
observer: '_observeSignedIn'
},
isAuthorized: {
type: Boolean,
notify: true,
value: false
}
},
_computeButtonClass: function (height, width, theme, signedIn, brand, needAdditionalAuth) {
return 'height-' + height + ' width-' + width + ' theme-' + theme + ' signedIn-' + signedIn + ' brand-' + brand + '  additionalAuth-' + needAdditionalAuth;
},
_computeIcon: function (brand) {
return 'google:' + brand;
},
_computeButtonIsSignIn: function (signedIn, additionalAuth) {
return !signedIn;
},
_computeButtonIsSignOut: function (signedIn, additionalAuth) {
return signedIn && !additionalAuth;
},
_computeButtonIsSignOutAddl: function (signedIn, additionalAuth) {
return signedIn && additionalAuth;
},
_computeBrand: function (attrBrand, hasPlusScopes) {
var newBrand;
if (attrBrand) {
newBrand = attrBrand;
} else if (hasPlusScopes) {
newBrand = BrandValue.PLUS;
} else {
newBrand = BrandValue.GOOGLE;
}
;
return newBrand;
},
_observeSignedIn: function (newVal, oldVal) {
if (newVal) {
if (this.needAdditionalAuth)
this.fire('google-signin-necessary');
this.fire('google-signin-success');
} else
this.fire('google-signed-out');
},
_computeSigninLabel: function (labelSignin, width, _brand) {
if (labelSignin) {
return labelSignin;
} else {
switch (width) {
case WidthValue.WIDE:
return _brand == BrandValue.PLUS ? LabelValue.WIDE_PLUS : LabelValue.WIDE;
case WidthValue.STANDARD:
return LabelValue.STANDARD;
case WidthValue.ICON_ONLY:
return '';
default:
console.warn('bad width value: ', width);
return LabelValue.STANDARD;
}
}
},
signIn: function () {
this.$.aware.signIn();
},
_signInKeyPress: function (e) {
if (e.which == 13 || e.keyCode == 13 || e.which == 32 || e.keyCode == 32) {
e.preventDefault();
this.signIn();
}
},
signOut: function () {
this.fire('google-signout-attempted');
this.$.aware.signOut();
},
_signOutKeyPress: function (e) {
if (e.which == 13 || e.keyCode == 13 || e.which == 32 || e.keyCode == 32) {
e.preventDefault();
this.signOut();
}
}
});
}());
function MakePromise(asap) {
function Promise(fn) {
if (typeof this !== 'object' || typeof fn !== 'function')
throw new TypeError();
this._state = null;
this._value = null;
this._deferreds = [];
doResolve(fn, resolve.bind(this), reject.bind(this));
}
function handle(deferred) {
var me = this;
if (this._state === null) {
this._deferreds.push(deferred);
return;
}
asap(function () {
var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
if (typeof cb !== 'function') {
(me._state ? deferred.resolve : deferred.reject)(me._value);
return;
}
var ret;
try {
ret = cb(me._value);
} catch (e) {
deferred.reject(e);
return;
}
deferred.resolve(ret);
});
}
function resolve(newValue) {
try {
if (newValue === this)
throw new TypeError();
if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
var then = newValue.then;
if (typeof then === 'function') {
doResolve(then.bind(newValue), resolve.bind(this), reject.bind(this));
return;
}
}
this._state = true;
this._value = newValue;
finale.call(this);
} catch (e) {
reject.call(this, e);
}
}
function reject(newValue) {
this._state = false;
this._value = newValue;
finale.call(this);
}
function finale() {
for (var i = 0, len = this._deferreds.length; i < len; i++) {
handle.call(this, this._deferreds[i]);
}
this._deferreds = null;
}
function doResolve(fn, onFulfilled, onRejected) {
var done = false;
try {
fn(function (value) {
if (done)
return;
done = true;
onFulfilled(value);
}, function (reason) {
if (done)
return;
done = true;
onRejected(reason);
});
} catch (ex) {
if (done)
return;
done = true;
onRejected(ex);
}
}
Promise.prototype['catch'] = function (onRejected) {
return this.then(null, onRejected);
};
Promise.prototype.then = function (onFulfilled, onRejected) {
var me = this;
return new Promise(function (resolve, reject) {
handle.call(me, {
onFulfilled: onFulfilled,
onRejected: onRejected,
resolve: resolve,
reject: reject
});
});
};
Promise.resolve = function (value) {
if (value && typeof value === 'object' && value.constructor === Promise) {
return value;
}
return new Promise(function (resolve) {
resolve(value);
});
};
Promise.reject = function (value) {
return new Promise(function (resolve, reject) {
reject(value);
});
};
return Promise;
}
if (typeof module !== 'undefined') {
module.exports = MakePromise;
};
if (!window.Promise) {
window.Promise = MakePromise(Polymer.Base.async);
};
'use strict';
Polymer({
is: 'iron-request',
hostAttributes: { hidden: true },
properties: {
xhr: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return new XMLHttpRequest();
}
},
response: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return null;
}
},
status: {
type: Number,
notify: true,
readOnly: true,
value: 0
},
statusText: {
type: String,
notify: true,
readOnly: true,
value: ''
},
completes: {
type: Object,
readOnly: true,
notify: true,
value: function () {
return new Promise(function (resolve, reject) {
this.resolveCompletes = resolve;
this.rejectCompletes = reject;
}.bind(this));
}
},
progress: {
type: Object,
notify: true,
readOnly: true,
value: function () {
return {};
}
},
aborted: {
type: Boolean,
notify: true,
readOnly: true,
value: false
},
errored: {
type: Boolean,
notify: true,
readOnly: true,
value: false
},
timedOut: {
type: Boolean,
notify: true,
readOnly: true,
value: false
}
},
get succeeded() {
if (this.errored || this.aborted || this.timedOut) {
return false;
}
var status = this.xhr.status || 0;
return status === 0 || status >= 200 && status < 300;
},
send: function (options) {
var xhr = this.xhr;
if (xhr.readyState > 0) {
return null;
}
xhr.addEventListener('progress', function (progress) {
this._setProgress({
lengthComputable: progress.lengthComputable,
loaded: progress.loaded,
total: progress.total
});
}.bind(this));
xhr.addEventListener('error', function (error) {
this._setErrored(true);
this._updateStatus();
this.rejectCompletes(error);
}.bind(this));
xhr.addEventListener('timeout', function (error) {
this._setTimedOut(true);
this._updateStatus();
this.rejectCompletes(error);
}.bind(this));
xhr.addEventListener('abort', function () {
this._updateStatus();
this.rejectCompletes(new Error('Request aborted.'));
}.bind(this));
xhr.addEventListener('loadend', function () {
this._updateStatus();
if (!this.succeeded) {
this.rejectCompletes(new Error('The request failed with status code: ' + this.xhr.status));
return;
}
this._setResponse(this.parseResponse());
this.resolveCompletes(this);
}.bind(this));
this.url = options.url;
xhr.open(options.method || 'GET', options.url, options.async !== false);
var acceptType = {
'json': 'application/json',
'text': 'text/plain',
'html': 'text/html',
'xml': 'application/xml',
'arraybuffer': 'application/octet-stream'
}[options.handleAs];
var headers = options.headers || Object.create(null);
var newHeaders = Object.create(null);
for (var key in headers) {
newHeaders[key.toLowerCase()] = headers[key];
}
headers = newHeaders;
if (acceptType && !headers['accept']) {
headers['accept'] = acceptType;
}
Object.keys(headers).forEach(function (requestHeader) {
if (/[A-Z]/.test(requestHeader)) {
console.error('Headers must be lower case, got', requestHeader);
}
xhr.setRequestHeader(requestHeader, headers[requestHeader]);
}, this);
if (options.async !== false) {
var handleAs = options.handleAs;
if (!!options.jsonPrefix || !handleAs) {
handleAs = 'text';
}
xhr.responseType = xhr._responseType = handleAs;
if (!!options.jsonPrefix) {
xhr._jsonPrefix = options.jsonPrefix;
}
}
xhr.withCredentials = !!options.withCredentials;
xhr.timeout = options.timeout;
var body = this._encodeBodyObject(options.body, headers['content-type']);
xhr.send(body);
return this.completes;
},
parseResponse: function () {
var xhr = this.xhr;
var responseType = xhr.responseType || xhr._responseType;
var preferResponseText = !this.xhr.responseType;
var prefixLen = xhr._jsonPrefix && xhr._jsonPrefix.length || 0;
try {
switch (responseType) {
case 'json':
if (preferResponseText || xhr.response === undefined) {
try {
return JSON.parse(xhr.responseText);
} catch (_) {
return null;
}
}
return xhr.response;
case 'xml':
return xhr.responseXML;
case 'blob':
case 'document':
case 'arraybuffer':
return xhr.response;
case 'text':
default: {
if (prefixLen) {
try {
return JSON.parse(xhr.responseText.substring(prefixLen));
} catch (_) {
return null;
}
}
return xhr.responseText;
}
}
} catch (e) {
this.rejectCompletes(new Error('Could not parse response. ' + e.message));
}
},
abort: function () {
this._setAborted(true);
this.xhr.abort();
},
_encodeBodyObject: function (body, contentType) {
if (typeof body == 'string') {
return body;
}
var bodyObj = body;
switch (contentType) {
case 'application/json':
return JSON.stringify(bodyObj);
case 'application/x-www-form-urlencoded':
return this._wwwFormUrlEncode(bodyObj);
}
return body;
},
_wwwFormUrlEncode: function (object) {
if (!object) {
return '';
}
var pieces = [];
Object.keys(object).forEach(function (key) {
pieces.push(this._wwwFormUrlEncodePiece(key) + '=' + this._wwwFormUrlEncodePiece(object[key]));
}, this);
return pieces.join('&');
},
_wwwFormUrlEncodePiece: function (str) {
return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n')).replace(/%20/g, '+');
},
_updateStatus: function () {
this._setStatus(this.xhr.status);
this._setStatusText(this.xhr.statusText === undefined ? '' : this.xhr.statusText);
}
});
'use strict';
Polymer({
is: 'iron-ajax',
hostAttributes: { hidden: true },
properties: {
url: { type: String },
params: {
type: Object,
value: function () {
return {};
}
},
method: {
type: String,
value: 'GET'
},
headers: {
type: Object,
value: function () {
return {};
}
},
contentType: {
type: String,
value: null
},
body: {
type: Object,
value: null
},
sync: {
type: Boolean,
value: false
},
handleAs: {
type: String,
value: 'json'
},
withCredentials: {
type: Boolean,
value: false
},
timeout: {
type: Number,
value: 0
},
auto: {
type: Boolean,
value: false
},
verbose: {
type: Boolean,
value: false
},
lastRequest: {
type: Object,
notify: true,
readOnly: true
},
loading: {
type: Boolean,
notify: true,
readOnly: true
},
lastResponse: {
type: Object,
notify: true,
readOnly: true
},
lastError: {
type: Object,
notify: true,
readOnly: true
},
activeRequests: {
type: Array,
notify: true,
readOnly: true,
value: function () {
return [];
}
},
debounceDuration: {
type: Number,
value: 0,
notify: true
},
jsonPrefix: {
type: String,
value: ''
},
_boundHandleResponse: {
type: Function,
value: function () {
return this._handleResponse.bind(this);
}
}
},
observers: ['_requestOptionsChanged(url, method, params.*, headers, contentType, ' + 'body, sync, handleAs, jsonPrefix, withCredentials, timeout, auto)'],
get queryString() {
var queryParts = [];
var param;
var value;
for (param in this.params) {
value = this.params[param];
param = window.encodeURIComponent(param);
if (Array.isArray(value)) {
for (var i = 0; i < value.length; i++) {
queryParts.push(param + '=' + window.encodeURIComponent(value[i]));
}
} else if (value !== null) {
queryParts.push(param + '=' + window.encodeURIComponent(value));
} else {
queryParts.push(param);
}
}
return queryParts.join('&');
},
get requestUrl() {
var queryString = this.queryString;
if (queryString) {
var bindingChar = this.url.indexOf('?') >= 0 ? '&' : '?';
return this.url + bindingChar + queryString;
}
return this.url;
},
get requestHeaders() {
var headers = {};
var contentType = this.contentType;
if (contentType == null && typeof this.body === 'string') {
contentType = 'application/x-www-form-urlencoded';
}
if (contentType) {
headers['content-type'] = contentType;
}
var header;
if (this.headers instanceof Object) {
for (header in this.headers) {
headers[header] = this.headers[header].toString();
}
}
return headers;
},
toRequestOptions: function () {
return {
url: this.requestUrl || '',
method: this.method,
headers: this.requestHeaders,
body: this.body,
async: !this.sync,
handleAs: this.handleAs,
jsonPrefix: this.jsonPrefix,
withCredentials: this.withCredentials,
timeout: this.timeout
};
},
generateRequest: function () {
var request = document.createElement('iron-request');
var requestOptions = this.toRequestOptions();
this.activeRequests.push(request);
request.completes.then(this._boundHandleResponse).catch(this._handleError.bind(this, request)).then(this._discardRequest.bind(this, request));
request.send(requestOptions);
this._setLastRequest(request);
this._setLoading(true);
this.fire('request', {
request: request,
options: requestOptions
}, { bubbles: false });
return request;
},
_handleResponse: function (request) {
if (request === this.lastRequest) {
this._setLastResponse(request.response);
this._setLastError(null);
this._setLoading(false);
}
this.fire('response', request, { bubbles: false });
},
_handleError: function (request, error) {
if (this.verbose) {
console.error(error);
}
if (request === this.lastRequest) {
this._setLastError({
request: request,
error: error
});
this._setLastResponse(null);
this._setLoading(false);
}
this.fire('error', {
request: request,
error: error
}, { bubbles: false });
},
_discardRequest: function (request) {
var requestIndex = this.activeRequests.indexOf(request);
if (requestIndex > -1) {
this.activeRequests.splice(requestIndex, 1);
}
},
_requestOptionsChanged: function () {
this.debounce('generate-request', function () {
if (this.url == null) {
return;
}
if (this.auto) {
this.generateRequest();
}
}, this.debounceDuration);
}
});
(function () {
var SCOPE_ = 'https://spreadsheets.google.com/feeds';
var rowDataCache_ = {};
function generateCacheKey_() {
return this._worksheetId + '_' + this.tabId;
}
function getLink_(rel, links) {
for (var i = 0, link; link = links[i]; ++i) {
if (link.rel === rel) {
return link;
}
}
return null;
}
function wid_to_gid_(wid) {
return parseInt(String(wid), 36) ^ 31578;
}
function gid_to_wid_(gid) {
return parseInt(gid ^ 31578).toString(36);
}
window.GoogleSheets = Polymer({
is: 'google-sheets',
hostAttributes: { hidden: true },
properties: {
clientId: {
type: String,
value: '',
observer: '_configUpdate'
},
key: {
type: String,
value: '',
observer: '_keyChanged'
},
tabId: {
type: Number,
value: 1,
observer: '_configUpdate'
},
published: {
type: Boolean,
value: false,
observer: '_configUpdate'
},
sheet: {
type: Object,
value: function () {
return {};
},
readOnly: true,
notify: true,
observer: '_sheetChanged'
},
tab: {
type: Object,
value: function () {
return {};
},
readOnly: true,
notify: true,
observer: '_tabChanged'
},
rows: {
type: Array,
value: function () {
return [];
},
readOnly: true,
notify: true
},
spreadsheets: {
type: Array,
readOnly: true,
notify: true,
value: function () {
return [];
}
},
openInGoogleDocsUrl: {
type: String,
computed: '_computeGoogleDocsUrl(key)',
notify: true
}
},
_worksheetId: null,
_computeGoogleDocsUrl: function (key) {
var url = 'https://docs.google.com/spreadsheet/';
if (key) {
url += 'ccc?key=' + key;
}
return url;
},
_configUpdate: function (key, published, tabId, clientId) {
this._tabIdChanged();
},
_keyChanged: function (newValue, oldValue) {
if (this.published) {
var url = SCOPE_ + '/list/' + this.key + '/' + this.tabId + '/public/values';
this.$.publicajax.url = url;
this.$.publicajax.generateRequest();
}
},
_tabIdChanged: function (newValue, oldValue) {
if (this._worksheetId) {
this._getCellRows();
} else if (this.published) {
this._keyChanged();
}
},
_sheetChanged: function (newValue, oldValue) {
if (!this.sheet.title) {
return;
}
var authors = this.sheet.author && this.sheet.author.map(function (a) {
return {
email: a.email.$t,
name: a.name.$t
};
});
this.set('sheet.title', this.sheet.title.$t);
this.set('sheet.updated', new Date(this.sheet.updated.$t));
this.set('sheet.authors', authors);
this._worksheetId = this.sheet.id.$t.split('/').slice(-1)[0];
this._getWorksheet();
},
_tabChanged: function (newValue, oldValue) {
if (!this.tab.title) {
return;
}
var authors = this.tab.authors = this.tab.author && this.tab.author.map(function (a) {
return {
email: a.email.$t,
name: a.name.$t
};
});
this.set('tab.title', this.tab.title.$t);
this.set('tab.updated', new Date(this.tab.updated.$t));
this.set('tab.authors', authors);
this.fire('google-sheet-data', {
type: 'tab',
data: this.tab
});
},
_onSignInSuccess: function (e, detail) {
var oauthToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
var headers = { 'Authorization': 'Bearer ' + oauthToken.access_token };
this.$.listsheetsajax.headers = headers;
this.$.worksheetajax.headers = headers;
this.$.cellrowsajax.headers = headers;
this._listSpreadsheets();
},
_onSignInFail: function (e, detail) {
console.log(e, e.type);
},
_listSpreadsheets: function () {
var url = SCOPE_ + '/spreadsheets/private/full';
this.$.listsheetsajax.url = url;
this.$.listsheetsajax.generateRequest();
},
_onSpreadsheetList: function (e) {
e.stopPropagation();
var feed = e.target.lastResponse.feed;
this._setSpreadsheets(feed.entry);
this.fire('google-sheet-data', {
type: 'spreadsheets',
data: this.spreadsheets
});
if (this.key) {
for (var i = 0, entry; entry = feed.entry[i]; ++i) {
var altLink = getLink_('alternate', entry.link);
if (altLink && altLink.href.indexOf(this.key) != -1) {
this._setSheet(entry);
break;
}
}
}
},
_getWorksheet: function () {
if (!this._worksheetId) {
throw new Error('workesheetId was not given.');
}
var url = SCOPE_ + '/worksheets/' + this._worksheetId + '/private/full/' + this.tabId;
this.$.worksheetajax.url = url;
this.$.worksheetajax.generateRequest();
},
_onWorksheet: function (e) {
e.stopPropagation();
this._setTab(e.target.lastResponse.entry);
this._getCellRows();
},
_getCellRows: function () {
var key = generateCacheKey_.call(this);
if (key in rowDataCache_) {
this._onCellRows(null, null, rowDataCache_[key]);
return;
}
var url = SCOPE_ + '/list/' + this._worksheetId + '/' + this.tabId + '/private/full';
this.$.cellrowsajax.url = url;
this.$.cellrowsajax.generateRequest();
},
_onCellRows: function (e) {
e.stopPropagation();
var feed = e.target.lastResponse.feed;
var key = generateCacheKey_.call(this);
if (!(key in rowDataCache_)) {
rowDataCache_[key] = { response: { feed: feed } };
}
this._setRows(feed.entry);
var authors = feed.author && feed.author.map(function (a) {
return {
email: a.email.$t,
name: a.name.$t
};
});
this.set('rows.authors', authors);
if (this.published) {
this._setTab(feed);
}
this.fire('google-sheet-data', {
type: 'rows',
data: this.rows
});
}
});
}());
Polymer.IronControlState = {
properties: {
focused: {
type: Boolean,
value: false,
notify: true,
readOnly: true,
reflectToAttribute: true
},
disabled: {
type: Boolean,
value: false,
notify: true,
observer: '_disabledChanged',
reflectToAttribute: true
},
_oldTabIndex: { type: Number },
_boundFocusBlurHandler: {
type: Function,
value: function () {
return this._focusBlurHandler.bind(this);
}
}
},
observers: ['_changedControlState(focused, disabled)'],
ready: function () {
this.addEventListener('focus', this._boundFocusBlurHandler, true);
this.addEventListener('blur', this._boundFocusBlurHandler, true);
},
_focusBlurHandler: function (event) {
if (event.target === this) {
this._setFocused(event.type === 'focus');
} else if (!this.shadowRoot && !this.isLightDescendant(event.target)) {
this.fire(event.type, { sourceEvent: event }, {
node: this,
bubbles: event.bubbles,
cancelable: event.cancelable
});
}
},
_disabledChanged: function (disabled, old) {
this.setAttribute('aria-disabled', disabled ? 'true' : 'false');
this.style.pointerEvents = disabled ? 'none' : '';
if (disabled) {
this._oldTabIndex = this.tabIndex;
this.focused = false;
this.tabIndex = -1;
} else if (this._oldTabIndex !== undefined) {
this.tabIndex = this._oldTabIndex;
}
},
_changedControlState: function () {
if (this._controlStateChanged) {
this._controlStateChanged();
}
}
};
Polymer.IronButtonStateImpl = {
properties: {
pressed: {
type: Boolean,
readOnly: true,
value: false,
reflectToAttribute: true,
observer: '_pressedChanged'
},
toggles: {
type: Boolean,
value: false,
reflectToAttribute: true
},
active: {
type: Boolean,
value: false,
notify: true,
reflectToAttribute: true
},
pointerDown: {
type: Boolean,
readOnly: true,
value: false
},
receivedFocusFromKeyboard: {
type: Boolean,
readOnly: true
},
ariaActiveAttribute: {
type: String,
value: 'aria-pressed',
observer: '_ariaActiveAttributeChanged'
}
},
listeners: {
down: '_downHandler',
up: '_upHandler',
tap: '_tapHandler'
},
observers: [
'_detectKeyboardFocus(focused)',
'_activeChanged(active, ariaActiveAttribute)'
],
keyBindings: {
'enter:keydown': '_asyncClick',
'space:keydown': '_spaceKeyDownHandler',
'space:keyup': '_spaceKeyUpHandler'
},
_mouseEventRe: /^mouse/,
_tapHandler: function () {
if (this.toggles) {
this._userActivate(!this.active);
} else {
this.active = false;
}
},
_detectKeyboardFocus: function (focused) {
this._setReceivedFocusFromKeyboard(!this.pointerDown && focused);
},
_userActivate: function (active) {
if (this.active !== active) {
this.active = active;
this.fire('change');
}
},
_downHandler: function (event) {
this._setPointerDown(true);
this._setPressed(true);
this._setReceivedFocusFromKeyboard(false);
},
_upHandler: function () {
this._setPointerDown(false);
this._setPressed(false);
},
_spaceKeyDownHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
keyboardEvent.preventDefault();
keyboardEvent.stopImmediatePropagation();
this._setPressed(true);
},
_spaceKeyUpHandler: function (event) {
var keyboardEvent = event.detail.keyboardEvent;
var target = Polymer.dom(keyboardEvent).localTarget;
if (this.isLightDescendant(target))
return;
if (this.pressed) {
this._asyncClick();
}
this._setPressed(false);
},
_asyncClick: function () {
this.async(function () {
this.click();
}, 1);
},
_pressedChanged: function (pressed) {
this._changedButtonState();
},
_ariaActiveAttributeChanged: function (value, oldValue) {
if (oldValue && oldValue != value && this.hasAttribute(oldValue)) {
this.removeAttribute(oldValue);
}
},
_activeChanged: function (active, ariaActiveAttribute) {
if (this.toggles) {
this.setAttribute(this.ariaActiveAttribute, active ? 'true' : 'false');
} else {
this.removeAttribute(this.ariaActiveAttribute);
}
this._changedButtonState();
},
_controlStateChanged: function () {
if (this.disabled) {
this._setPressed(false);
} else {
this._changedButtonState();
}
},
_changedButtonState: function () {
if (this._buttonStateChanged) {
this._buttonStateChanged();
}
}
};
Polymer.IronButtonState = [
Polymer.IronA11yKeysBehavior,
Polymer.IronButtonStateImpl
];
Polymer.PaperRippleBehavior = {
properties: {
noink: {
type: Boolean,
observer: '_noinkChanged'
},
_rippleContainer: { type: Object }
},
_buttonStateChanged: function () {
if (this.focused) {
this.ensureRipple();
}
},
_downHandler: function (event) {
Polymer.IronButtonStateImpl._downHandler.call(this, event);
if (this.pressed) {
this.ensureRipple(event);
}
},
ensureRipple: function (optTriggeringEvent) {
if (!this.hasRipple()) {
this._ripple = this._createRipple();
this._ripple.noink = this.noink;
var rippleContainer = this._rippleContainer || this.root;
if (rippleContainer) {
Polymer.dom(rippleContainer).appendChild(this._ripple);
}
if (optTriggeringEvent) {
var domContainer = Polymer.dom(this._rippleContainer || this);
var target = Polymer.dom(optTriggeringEvent).rootTarget;
if (domContainer.deepContains(target)) {
this._ripple.uiDownAction(optTriggeringEvent);
}
}
}
},
getRipple: function () {
this.ensureRipple();
return this._ripple;
},
hasRipple: function () {
return Boolean(this._ripple);
},
_createRipple: function () {
return document.createElement('paper-ripple');
},
_noinkChanged: function (noink) {
if (this.hasRipple()) {
this._ripple.noink = noink;
}
}
};
Polymer.PaperButtonBehaviorImpl = {
properties: {
elevation: {
type: Number,
reflectToAttribute: true,
readOnly: true
}
},
observers: [
'_calculateElevation(focused, disabled, active, pressed, receivedFocusFromKeyboard)',
'_computeKeyboardClass(receivedFocusFromKeyboard)'
],
hostAttributes: {
role: 'button',
tabindex: '0',
animated: true
},
_calculateElevation: function () {
var e = 1;
if (this.disabled) {
e = 0;
} else if (this.active || this.pressed) {
e = 4;
} else if (this.receivedFocusFromKeyboard) {
e = 3;
}
this._setElevation(e);
},
_computeKeyboardClass: function (receivedFocusFromKeyboard) {
this.toggleClass('keyboard-focus', receivedFocusFromKeyboard);
},
_spaceKeyDownHandler: function (event) {
Polymer.IronButtonStateImpl._spaceKeyDownHandler.call(this, event);
if (this.hasRipple() && this.getRipple().ripples.length < 1) {
this._ripple.uiDownAction();
}
},
_spaceKeyUpHandler: function (event) {
Polymer.IronButtonStateImpl._spaceKeyUpHandler.call(this, event);
if (this.hasRipple()) {
this._ripple.uiUpAction();
}
}
};
Polymer.PaperButtonBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperRippleBehavior,
Polymer.PaperButtonBehaviorImpl
];
Polymer({
is: 'paper-button',
behaviors: [Polymer.PaperButtonBehavior],
properties: {
raised: {
type: Boolean,
reflectToAttribute: true,
value: false,
observer: '_calculateElevation'
}
},
_calculateElevation: function () {
if (!this.raised) {
this._setElevation(0);
} else {
Polymer.PaperButtonBehaviorImpl._calculateElevation.apply(this);
}
}
});
Polymer.IronValidatableBehavior = {
properties: {
validatorType: {
type: String,
value: 'validator'
},
validator: { type: String },
invalid: {
notify: true,
reflectToAttribute: true,
type: Boolean,
value: false
},
_validatorMeta: { type: Object }
},
observers: ['_invalidChanged(invalid)'],
get _validator() {
return this._validatorMeta && this._validatorMeta.byKey(this.validator);
},
ready: function () {
this._validatorMeta = new Polymer.IronMeta({ type: this.validatorType });
},
_invalidChanged: function () {
if (this.invalid) {
this.setAttribute('aria-invalid', 'true');
} else {
this.removeAttribute('aria-invalid');
}
},
hasValidator: function () {
return this._validator != null;
},
validate: function (value) {
this.invalid = !this._getValidity(value);
return !this.invalid;
},
_getValidity: function (value) {
if (this.hasValidator()) {
return this._validator.validate(value);
}
return true;
}
};
Polymer.IronFormElementBehavior = {
properties: {
name: { type: String },
value: {
notify: true,
type: String
},
required: {
type: Boolean,
value: false
},
_parentForm: { type: Object }
},
attached: function () {
this.fire('iron-form-element-register');
},
detached: function () {
if (this._parentForm) {
this._parentForm.fire('iron-form-element-unregister', { target: this });
}
}
};
Polymer.IronCheckedElementBehaviorImpl = {
properties: {
checked: {
type: Boolean,
value: false,
reflectToAttribute: true,
notify: true,
observer: '_checkedChanged'
},
toggles: {
type: Boolean,
value: true,
reflectToAttribute: true
},
value: {
type: String,
value: 'on',
observer: '_valueChanged'
}
},
observers: ['_requiredChanged(required)'],
created: function () {
this._hasIronCheckedElementBehavior = true;
},
_getValidity: function (_value) {
return this.disabled || !this.required || this.checked;
},
_requiredChanged: function () {
if (this.required) {
this.setAttribute('aria-required', 'true');
} else {
this.removeAttribute('aria-required');
}
},
_checkedChanged: function () {
this.active = this.checked;
this.fire('iron-change');
},
_valueChanged: function () {
if (this.value === undefined || this.value === null) {
this.value = 'on';
}
}
};
Polymer.IronCheckedElementBehavior = [
Polymer.IronFormElementBehavior,
Polymer.IronValidatableBehavior,
Polymer.IronCheckedElementBehaviorImpl
];
Polymer.PaperInkyFocusBehaviorImpl = {
observers: ['_focusedChanged(receivedFocusFromKeyboard)'],
_focusedChanged: function (receivedFocusFromKeyboard) {
if (receivedFocusFromKeyboard) {
this.ensureRipple();
}
if (this.hasRipple()) {
this._ripple.holdDown = receivedFocusFromKeyboard;
}
},
_createRipple: function () {
var ripple = Polymer.PaperRippleBehavior._createRipple();
ripple.id = 'ink';
ripple.setAttribute('center', '');
ripple.classList.add('circle');
return ripple;
}
};
Polymer.PaperInkyFocusBehavior = [
Polymer.IronButtonState,
Polymer.IronControlState,
Polymer.PaperRippleBehavior,
Polymer.PaperInkyFocusBehaviorImpl
];
Polymer.PaperCheckedElementBehaviorImpl = {
_checkedChanged: function () {
Polymer.IronCheckedElementBehaviorImpl._checkedChanged.call(this);
if (this.hasRipple()) {
if (this.checked) {
this._ripple.setAttribute('checked', '');
} else {
this._ripple.removeAttribute('checked');
}
}
},
_buttonStateChanged: function () {
Polymer.PaperRippleBehavior._buttonStateChanged.call(this);
if (this.disabled) {
return;
}
if (this.isAttached) {
this.checked = this.active;
}
}
};
Polymer.PaperCheckedElementBehavior = [
Polymer.PaperInkyFocusBehavior,
Polymer.IronCheckedElementBehavior,
Polymer.PaperCheckedElementBehaviorImpl
];
Polymer({
is: 'paper-checkbox',
behaviors: [Polymer.PaperCheckedElementBehavior],
hostAttributes: {
role: 'checkbox',
'aria-checked': false,
tabindex: 0
},
properties: {
ariaActiveAttribute: {
type: String,
value: 'aria-checked'
}
},
_computeCheckboxClass: function (checked, invalid) {
var className = '';
if (checked) {
className += 'checked ';
}
if (invalid) {
className += 'invalid';
}
return className;
},
_computeCheckmarkClass: function (checked) {
return checked ? '' : 'hidden';
},
_createRipple: function () {
this._rippleContainer = this.$.checkboxContainer;
return Polymer.PaperInkyFocusBehaviorImpl._createRipple.call(this);
}
});
Polymer({
is: 'paper-toggle-button',
behaviors: [Polymer.PaperCheckedElementBehavior],
hostAttributes: {
role: 'button',
'aria-pressed': 'false',
tabindex: 0
},
properties: {},
listeners: { track: '_ontrack' },
_ontrack: function (event) {
var track = event.detail;
if (track.state === 'start') {
this._trackStart(track);
} else if (track.state === 'track') {
this._trackMove(track);
} else if (track.state === 'end') {
this._trackEnd(track);
}
},
_trackStart: function (track) {
this._width = this.$.toggleBar.offsetWidth / 2;
this._trackChecked = this.checked;
this.$.toggleButton.classList.add('dragging');
},
_trackMove: function (track) {
var dx = track.dx;
this._x = Math.min(this._width, Math.max(0, this._trackChecked ? this._width + dx : dx));
this.translate3d(this._x + 'px', 0, 0, this.$.toggleButton);
this._userActivate(this._x > this._width / 2);
},
_trackEnd: function (track) {
this.$.toggleButton.classList.remove('dragging');
this.transform('', this.$.toggleButton);
},
_createRipple: function () {
this._rippleContainer = this.$.toggleButton;
var ripple = Polymer.PaperRippleBehavior._createRipple();
ripple.id = 'ink';
ripple.setAttribute('recenters', '');
ripple.classList.add('circle', 'toggle-ink');
return ripple;
}
});
Polymer({
is: 'paper-toolbar',
hostAttributes: { 'role': 'toolbar' },
properties: {
bottomJustify: {
type: String,
value: ''
},
justify: {
type: String,
value: ''
},
middleJustify: {
type: String,
value: ''
}
},
attached: function () {
this._observer = this._observe(this);
this._updateAriaLabelledBy();
},
detached: function () {
if (this._observer) {
this._observer.disconnect();
}
},
_observe: function (node) {
var observer = new MutationObserver(function () {
this._updateAriaLabelledBy();
}.bind(this));
observer.observe(node, {
childList: true,
subtree: true
});
return observer;
},
_updateAriaLabelledBy: function () {
var labelledBy = [];
var contents = Polymer.dom(this.root).querySelectorAll('content');
for (var content, index = 0; content = contents[index]; index++) {
var nodes = Polymer.dom(content).getDistributedNodes();
for (var node, jndex = 0; node = nodes[jndex]; jndex++) {
if (node.classList && node.classList.contains('title')) {
if (node.id) {
labelledBy.push(node.id);
} else {
var id = 'paper-toolbar-label-' + Math.floor(Math.random() * 10000);
node.id = id;
labelledBy.push(id);
}
}
}
}
if (labelledBy.length > 0) {
this.setAttribute('aria-labelledby', labelledBy.join(' '));
}
},
_computeBarExtraClasses: function (barJustify) {
if (!barJustify)
return '';
return barJustify + (barJustify === 'justified' ? '' : '-justified');
}
});
Polymer.PaperSpinnerBehavior = {
listeners: {
'animationend': '__reset',
'webkitAnimationEnd': '__reset'
},
properties: {
active: {
type: Boolean,
value: false,
reflectToAttribute: true,
observer: '__activeChanged'
},
alt: {
type: String,
value: 'loading',
observer: '__altChanged'
},
__coolingDown: {
type: Boolean,
value: false
}
},
__computeContainerClasses: function (active, coolingDown) {
return [
active || coolingDown ? 'active' : '',
coolingDown ? 'cooldown' : ''
].join(' ');
},
__activeChanged: function (active, old) {
this.__setAriaHidden(!active);
this.__coolingDown = !active && old;
},
__altChanged: function (alt) {
if (alt === this.getPropertyInfo('alt').value) {
this.alt = this.getAttribute('aria-label') || alt;
} else {
this.__setAriaHidden(alt === '');
this.setAttribute('aria-label', alt);
}
},
__setAriaHidden: function (hidden) {
var attr = 'aria-hidden';
if (hidden) {
this.setAttribute(attr, 'true');
} else {
this.removeAttribute(attr);
}
},
__reset: function () {
this.active = false;
this.__coolingDown = false;
}
};
Polymer({
is: 'paper-spinner',
behaviors: [Polymer.PaperSpinnerBehavior]
});
Polymer({
is: 'iron-localstorage',
properties: {
name: {
type: String,
value: ''
},
value: {
type: Object,
notify: true
},
useRaw: {
type: Boolean,
value: false
},
autoSaveDisabled: {
type: Boolean,
value: false
},
errorMessage: {
type: String,
notify: true
},
_loaded: {
type: Boolean,
value: false
}
},
observers: [
'_debounceReload(name,useRaw)',
'_trySaveValue(autoSaveDisabled)',
'_trySaveValue(value.*)'
],
ready: function () {
this._boundHandleStorage = this._handleStorage.bind(this);
},
attached: function () {
window.addEventListener('storage', this._boundHandleStorage);
},
detached: function () {
window.removeEventListener('storage', this._boundHandleStorage);
},
_handleStorage: function (ev) {
if (ev.key == this.name) {
this._load(true);
}
},
_trySaveValue: function () {
if (this._doNotSave) {
return;
}
if (this._loaded && !this.autoSaveDisabled) {
this.debounce('save', this.save);
}
},
_debounceReload: function () {
this.debounce('reload', this.reload);
},
reload: function () {
this._loaded = false;
this._load();
},
_load: function (externalChange) {
var v = window.localStorage.getItem(this.name);
if (v === null) {
this._loaded = true;
this._doNotSave = true;
this.value = null;
this._doNotSave = false;
this.fire('iron-localstorage-load-empty', { externalChange: externalChange });
} else {
if (!this.useRaw) {
try {
v = JSON.parse(v);
} catch (x) {
this.errorMessage = 'Could not parse local storage value';
console.error('could not parse local storage value', v);
v = null;
}
}
this._loaded = true;
this._doNotSave = true;
this.value = v;
this._doNotSave = false;
this.fire('iron-localstorage-load', { externalChange: externalChange });
}
},
save: function () {
var v = this.useRaw ? this.value : JSON.stringify(this.value);
try {
if (this.value === null || this.value === undefined) {
window.localStorage.removeItem(this.name);
} else {
window.localStorage.setItem(this.name, v);
}
} catch (ex) {
this.errorMessage = ex.message;
console.error('localStorage could not be saved. Safari incoginito mode?', ex);
}
}
});
Polymer({
is: 'pd-app',
properties: {
clientId: { value: '638152944882-u4h50pu74fgnbovm5erc639a39rt8pd6.apps.googleusercontent.com' },
options: {
value: function () {
return {
leadDetailsOpen: true,
maintainerDetailsOpen: true
};
}
},
rows: { observer: '_rowsChanged' },
autoRefresh: {
value: false,
observer: '_autoRefreshChanged'
},
autoRefreshInterval: { value: 60 * 1000 * 10 },
nextRefreshStatus: { value: 'Auto refresh off' },
githubUser: {
value: false,
type: Boolean
},
googleUser: {
value: false,
type: Boolean
},
__loadingGithub: { computed: '_computeLoadingGithub(_requestQueue.*)' },
__loadingSpreadsheet: { value: true },
loading: { computed: '_computeLoading(__loadingGithub, __loadingSpreadsheet)' }
},
observers: ['_refresh(_leads, githubUser)'],
loginStatus: function (user) {
return user ? 'Sign Out' : 'Sign In';
},
bool: function (b) {
return Boolean(b);
},
toggleGithubLogin: function () {
if (this.githubUser) {
this.$.githubAuth.logout();
} else {
this.$.githubAuth.login();
}
},
toggleGoogleLogin: function () {
if (this.googleUser) {
this.$.googleAuth.signOut();
} else {
this.$.googleAuth.signIn();
}
},
refresh: function () {
this._refresh(this._leads, this.githubUser);
},
_rowsChanged: function (rows) {
var leads = {};
for (var i = 0; i < rows.length; i++) {
var row = rows[i];
var o = leads[row.gsx$tl.$t] || (leads[row.gsx$tl.$t] = {});
var m = o[row.gsx$proposedmaintainer.$t] || (o[row.gsx$proposedmaintainer.$t] = []);
m.push({ name: row.gsx$element.$t });
}
this._leads = leads;
if (rows.length > 0) {
this.__loadingSpreadsheet = false;
}
},
_refresh: function (leads, githubUser) {
if (leads && githubUser) {
var leadRepos = [];
var requestQueue = [];
for (var lead in leads) {
if (lead) {
var or = {
name: lead,
maintainers: [],
detailsOpen: this.options.leadDetailsOpen
};
leadRepos.push(or);
for (var maint in leads[lead]) {
var mr = {
name: maint,
repos: [],
detailsOpen: this.options.maintainerDetailsOpen
};
or.maintainers.push(mr);
mr.repos = mr.repos.concat(leads[lead][maint]);
for (i = 0; i < mr.repos.length; i++) {
requestQueue.push({
name: mr.repos[i].name,
path: [
'all',
'leads',
leadRepos.length - 1,
'maintainers',
or.maintainers.length - 1,
'repos',
i
]
});
}
}
}
}
this.all = { leads: leadRepos };
this._requestQueue = requestQueue;
this._requestUntriaged();
}
},
_requestUntriaged: function () {
var repo = this._requestQueue[0];
if (repo) {
var name = 'polymerelements/' + repo.name;
var base = repo.next || 'https://api.github.com/repos/' + name + '/issues?state=open';
var url = base + '&access_token=' + this.githubUser.github.accessToken;
var xhr = new XMLHttpRequest();
xhr.open('GET', url);
xhr.send();
var self = this;
this.status = 'Fetching issues for \'' + repo.name + '\'';
xhr.addEventListener('load', function () {
self._handleUntriaged(xhr, repo);
});
xhr.addEventListener('error', function () {
self._handleUntriagedError(xhr);
});
} else {
if (this.__loadingSpreadsheet) {
this.status = 'Reading spreadsheet';
} else {
this.status = 'Idle.';
}
this._queueRefresh();
}
},
_handleUntriaged: function (xhr, repo) {
if (xhr.status / 100 != 2) {
if (xhr.getResponseHeader('X-RateLimit-Remaining') == '0') {
this._updateRateLimit(60);
} else {
this.status = 'Error: ' + xhr.status;
repo.next = null;
this.shift('_requestQueue');
this._requestUntriaged();
}
} else {
var response = JSON.parse(xhr.responseText);
this._filterAndAdd(response, null, false, false, repo.path, 'all');
this._filterAndAdd(response, /^p\d/i, true, false, repo.path, 'untriaged');
this._filterAndAdd(response, /^p0/i, false, false, repo.path, 'p0');
this._filterAndAdd(response, /^p1/i, false, false, repo.path, 'p1');
this._filterAndAdd(response, /^p2/i, false, false, repo.path, 'p2');
this._filterAndAdd(response, null, false, true, repo.path, 'prs');
var link = xhr.getResponseHeader('Link');
var matches = link && link.match(/<([^>]*)>; rel="next"/);
repo.next = matches && matches[1];
if (!repo.next) {
this.shift('_requestQueue');
}
this._requestUntriaged();
}
},
_filterAndAdd: function (items, filter, negate, pr, path, name) {
items = items.filter(function (item) {
return Boolean(pr) == Boolean(item.pull_request);
});
items = !filter ? items : items.filter(function (item) {
var ret = false;
for (var i = 0; i < item.labels.length; i++) {
if (item.labels[i].name.match(filter)) {
ret = ret || true;
}
}
return negate ? !ret : ret;
});
var repoPath = path.join('.');
var curr = this.get([
repoPath,
name
]) || [];
curr = curr.concat(items);
this.set([
repoPath,
name
], curr);
var maintPath = path.slice(0, -2).join('.');
curr = this.get([
maintPath,
name
]) || [];
curr = curr.concat(items);
this.set([
maintPath,
name
], curr);
var leadPath = path.slice(0, -4).join('.');
curr = this.get([
leadPath,
name
]) || [];
curr = curr.concat(items);
this.set([
leadPath,
name
], curr);
var allPath = path.slice(0, -6).join('.');
curr = this.get([
allPath,
name
]) || [];
curr = curr.concat(items);
this.set([
allPath,
name
], curr);
},
_handleUntriagedError: function (xhr) {
this.status = 'Error: ' + xhr.status;
this.shift('_requestQueue');
this._requestUntriaged();
},
_autoRefreshChanged: function (refresh) {
if (!refresh) {
if (this._refreshId) {
clearTimeout(this._refreshId);
this.nextRefreshStatus = 'Auto refresh off';
}
} else if (!this._requestQueue || !this._requestQueue.length) {
this._queueRefresh();
}
},
_queueRefresh: function () {
if (this.autoRefresh) {
this._refreshId = setTimeout(this.refresh.bind(this), this.autoRefreshInterval);
this.nextRefreshStatus = 'Next refresh at ' + new Date(Date.now() + this.autoRefreshInterval).toLocaleTimeString();
}
},
_toggleTeams: function () {
for (var i = 0; i < this.all.leads.length; i++) {
var lead = this.all.leads[i];
this.set([
'all.leads',
i,
'detailsOpen'
], this.$.teamsOn.checked);
}
},
_toggleRepos: function () {
for (var i = 0; i < this.all.leads.length; i++) {
var lead = this.all.leads[i];
for (var j = 0; j < lead.maintainers.length; j++) {
this.set([
'all.leads',
i,
'maintainers',
j,
'detailsOpen'
], this.$.reposOn.checked);
}
}
},
_shouldShowResults: function (googleUser, githubUser) {
return googleUser && githubUser;
},
_computeLoading: function (loadingGithub, loadingSpreadsheet) {
return loadingGithub || loadingSpreadsheet;
},
_computeLoadingGithub: function () {
return !!this._requestQueue && this._requestQueue.length > 0;
}
});
Polymer({
is: 'pd-lead',
properties: { opened: { observer: '__openedChanged' } },
observers: ['__leadOpenedChanged(lead.detailsOpen)'],
__openedChanged: function () {
this.set('lead.detailsOpen', this.opened);
},
__toggleDetails: function (e) {
this.opened = !this.opened;
},
__leadOpenedChanged: function () {
if (!this.lead) {
return;
}
this.opened = this.lead.detailsOpen;
}
});
Polymer({
is: 'pd-maintainer',
properties: { opened: { observer: '__openedChanged' } },
observers: ['__maintainerOpenedChanged(maintainer.detailsOpen)'],
__openedChanged: function () {
this.set('maintainer.detailsOpen', this.opened);
},
__toggleDetails: function (e) {
this.opened = !this.opened;
},
__maintainerOpenedChanged: function () {
if (!this.lead) {
return;
}
this.opened = this.maintainer.detailsOpen;
}
});
;