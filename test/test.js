const Immutable = require('immutable');
const assert = require('assert');

// Added implemented functions to this file as instructed by spec.md
// const transformErrors = require('../src/transform-errors');

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

it('should tranform errors', () => {
  // example error object returned from API converted to Immutable.Map
  const errors = Immutable.fromJS({
    name: ['This field is required'],
    age: ['This field is required', 'Only numeric characters are allowed'],
    urls: [{}, {}, {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      }
    }],
    url: {
      site: {
        code: ['This site code is invalid'],
        id: ['Unsupported id'],
      }
    },
    tags: [{}, {
      non_field_errors: ['Only alphanumeric characters are allowed'],
      another_error: ['Only alphanumeric characters are allowed'],
      third_error: ['Third error']
    }, {}, {
      non_field_errors: [
        'Minumum length of 10 characters is required',
        'Only alphanumeric characters are allowed',
      ],
    }],
    tag: {
      nested: {
        non_field_errors: ['Only alphanumeric characters are allowed'],
      },
    },
  });

  // in this specific case,
  // errors for `url` and `urls` keys should be nested
  // see expected object below
  const result = transformErrors(errors, ['url', 'urls']);

  assert.deepEqual(result.toJS(), {
    name: 'This field is required.',
    age: 'This field is required. Only numeric characters are allowed.',
    urls: [{}, {}, {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    }],
    url: {
      site: {
        code: 'This site code is invalid.',
        id: 'Unsupported id.',
      },
    },
    tags: 'Only alphanumeric characters are allowed. Third error. ' +
      'Minumum length of 10 characters is required.',
    tag: 'Only alphanumeric characters are allowed.',
  });
});


