const Immutable = require('immutable');

function isMap(obj) {
    return obj && obj.constructor && obj.constructor.name === 'Map';
}

function isList(obj) {
    return obj && obj.constructor && obj.constructor.name === 'List';
}

function isStringList(obj) {
    return isList(obj) && !obj.toArray().filter(x => typeof x !== 'string').length;
}

function distinct(items) {
    return items
        .filter(x => x)
        .reduce((out, x) => { if (out.indexOf(x) < 0) { out.push(x); return out; } else { return out; } }, []);
}

function concat(arrays) {
    return arrays
        .reduce((out, x) => out = out.concat(x), []);
}

function joinStringsWithPeriod(items) {
    return !items.length ? ''
        : distinct(items).join('. ') + '.';
}

function flattenToStringArray(obj) {
    return isMap(obj) ? concat(obj.keySeq().toArray().map(k => flattenToStringArray(obj.get(k))))
        : isList(obj) ? concat(obj.toArray().map(x => flattenToStringArray(x)))
            : [obj];
}

function flattenToStringArrayStart(obj) {
    return joinStringsWithPeriod(flattenToStringArray(obj));
}

function flattenOnlyStringListArray(obj) {
    return isMap(obj) ? Immutable.Map(obj.keySeq().toArray().map(k => [k, flattenOnlyStringListArray(obj.get(k))]))
        : isStringList(obj) ? joinStringsWithPeriod(obj.toArray())
            : isList(obj) ? Immutable.List(obj.toArray().map(x => flattenOnlyStringListArray(x)))
                : obj;
}

function transformErrors(obj, keepFields) {
    return Immutable.Map(obj.keySeq().toArray().map(k =>
        [k, keepFields.indexOf(k) >= 0 ? flattenOnlyStringListArray(obj.get(k)) : flattenToStringArrayStart(obj.get(k))]
    ));
}

module.exports = transformErrors;