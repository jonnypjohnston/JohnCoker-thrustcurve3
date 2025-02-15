/*
 * Copyright 2016-2020 John Coker for ThrustCurve.org
 * Licensed under the ISC License, https://opensource.org/licenses/ISC
 */
'use strict';

const strftime = require('strftime'),
      crypto = require('crypto'),
      getNamespace = require('continuation-local-storage').getNamespace,
      units = require("../units"),
      schema = require("../../database/schema"),
      parsers = require('../../simulate/parsers'),
      bbcode = require("../../render/bbcode");

const placeholder = '—';

var handlebars;

const SEP_UNIT_S = units.SEP + 's';

function toFixed(n, digits) {
  if (typeof n == 'number' && Number.isFinite(n)) {
    let fmt;
    if (digits > 0)
      fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    else
      fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    return fmt.format(n);
  } else
    return placeholder;
}

function sameId(a, b, options) {
  if (a == null || b == null)
    return;

  if (typeof a == 'object' && a.hasOwnProperty('_id'))
    a = a._id;
  if (typeof b == 'object' && b.hasOwnProperty('_id'))
    b = b._id;

  if (a.toString() == b.toString()) {
    /* jshint validthis:true */
    return options.fn(this || module);
  }
}

function updatedLater(o, options) {
  if (o == null)
    return;

  if (o.updatedAt != null && o.updatedAt.getTime() > o.createdAt.getTime() + 47 * 60 * 60 * 1000) {
    /* jshint validthis:true */
    return options.fn(this || module);
  }
}

function hasPerm(p, options) {
  var need, perms, has, i;

  var clsNamespace = getNamespace('session');
  if (clsNamespace)
    perms = clsNamespace.get('perms');

  has = false;
  if (perms != null) {
    if (p == 'any') {
      for (i = 0; i < schema.PermissionInfo.length; i++) {
	need = schema.PermissionInfo[i].key;
	if (perms[need] === true)
	  has = true;
      }
    } else {
      if ((need = schema.getPermissionKey(p)) == null)
	has = false;
      else
	has = perms && perms[need] === true;
    }
  }
  if (has) {
    /* jshint validthis:true */
    return options.fn(this || module);
  }
}

function hasLogin(options) {
  let clsNamespace = getNamespace('session');
  let req = clsNamespace != null ? clsNamespace.get('req') : null;
  if (req && req.user) {
    /* jshint validthis:true */
    return options.fn(this || module);
  }
}

function noLogin(options) {
  let clsNamespace = getNamespace('session');
  let req = clsNamespace != null ? clsNamespace.get('req') : null;
  if (req == null || req.user == null) {
    /* jshint validthis:true */
    return options.fn(this || module);
  }
}

function avatar() {
  let clsNamespace = getNamespace('session');
  let req = clsNamespace != null ? clsNamespace.get('req') : null;
  let src;
  if (req && req.user) {
    let hash = crypto.createHash('md5').update(req.user.email.toLowerCase()).digest("hex");
    src = "//www.gravatar.com/avatar/" + hash + '?d=mp';
  } else {
    src = "/images/nouser.png";
  }
  return new handlebars.SafeString(`<img src="${src}">`);
}

function formatLength(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'length', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'length', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatMass(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'mass', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'mass', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatForce(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'force', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'force', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatImpulse(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'force', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'force', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s + 's';
}

function formatVelocity(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'velocity', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'velocity', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatAcceleration(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'acceleration', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'acceleration', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatAltitude(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'altitude', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'altitude', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatTemperature(v) {
  var s;
  if (typeof arguments[1] == 'string')
    s = units.formatUnit(v, 'temperature', arguments[1], true);
  else
    s = units.formatPrefFromMKS(v, 'temperature', true);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatMMT(v) {
  var s = units.formatMMTFromMKS(v);
  if (s == null || s === '')
    return placeholder;
  else
    return s;
}

function formatDuration(v) {
  if (typeof v == 'number' && Number.isFinite(v))
    return toFixed(v, 1) + SEP_UNIT_S;
  else
    return placeholder;
}

function formatDurationFine(v) {
  if (typeof v == 'number' && Number.isFinite(v)) {
    if (v < 0.01)
      return toFixed(v, 4) + SEP_UNIT_S;
    else if (v < 0.1)
      return toFixed(v, 3) + SEP_UNIT_S;
    else if (v < 1)
      return toFixed(v, 2) + SEP_UNIT_S;
    else
      return toFixed(v, 1) + SEP_UNIT_S;
  } else
    return placeholder;
}

function formatIsp(v) {
  if (typeof v == 'number' && Number.isFinite(v) && v > 0)
    return toFixed(v, 0) + SEP_UNIT_S;
  else
    return placeholder;
}

function formatCD(v) {
  if (typeof v == 'number' && Number.isFinite(v) && v > 0)
    return toFixed(v, 2).replace(/(\.\d)0$/, '$1');
  else
    return placeholder;
}

function formatInt(v) {
  if (typeof v == 'number' && Number.isFinite(v))
    return toFixed(v);
  else
    return placeholder;
}

function formatPosInt(v) {
  if (typeof v == 'number' && Number.isFinite(v) && v > 0)
    return toFixed(v);
  else
    return placeholder;
}

const CountFormat = new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 });

function formatCount(v) {
  if (typeof v == 'number' && Number.isFinite(v) && v >= 0)
    return CountFormat.format(v);
  else
    return placeholder;
}

function formatSort(v) {
  if (typeof v == 'number' && Number.isFinite(v)) {
    if (typeof arguments[1] == 'string' && typeof arguments[2] == 'string')
      v = units.convertUnitToMKS(v, arguments[1], arguments[2]);
    return toFixed(v, 4);
  } else
    return '0.0000';
}

function formatDate(v, fmt) {
  if (v == null)
    return placeholder;
  if (typeof v == 'number')
    v = new Date(v);
  else
    v = new Date(v.toString());

  if (fmt == null || fmt === '' || typeof fmt == 'object')
    fmt = 'long';

  if (fmt == 'short')
    fmt = '%b %e, \'%y';
  else if (fmt == 'long')
    fmt = '%B %e, %Y';
  else if (fmt == 'iso')
    fmt = '%F';

  return strftime(fmt, v).replace(/\s{2,}/g, ' ');
}

function formatType(v) {
  if (v == null || v === '')
    return placeholder;

  if (v == 'SU')
    return 'single-use';
  else
    return v;
}

function formatRatio(v) {
  if (typeof v != 'number' || isNaN(v) || v < 0.1)
    return placeholder;
  if (v < 2.9)
    return toFixed(v, 1) + ':1';
  else
    return toFixed(v) + ':1';
}

function websiteAnchor(v) {
  if (v) {
    v = String(v).valueOf();
    return v.replace(/^https?:\/+/i, '')
            .replace(/^www\./, '')
            .replace(/\/.*$/, '');
  } else
    return placeholder;
}

function downloadAnchor(v) {
  if (v) {
    v = String(v).valueOf();
    v = v.replace(/^https?:\/+/i, '')
         .replace(/^www\./, '')
    let domain = v.replace(/\/.*$/, '');
    let file = v.replace(/^.*\//, '');
    if (domain && file === '' || file == domain)
      return domain;
    else if (domain === '' || /^localhost/.test(domain) || /thrustcurve.org$/.test(domain))
      return file;
    else
      return domain + '/' + file;
  } else
    return placeholder;
}

function prettyName(s) {
  if (!s)
    return '?';

  if (/^1\//.test(s)) {
    s = s.replace(/^1\/2/, '½')
         .replace(/^1\/4/, '¼')
         .replace(/^1\/8/, '⅛');
  }

  return s;
}

function motorFullName(mfr, mot) {
  var s;

  if (arguments[0] != null && arguments[0]._manufacturer) {
    mot = arguments[0];
    mfr = mot._manufacturer;
  }
  if (mot == null)
    return '?';

  s = prettyName(mot.designation);

  if (mfr && mfr.abbrev)
    s = mfr.abbrev + ' ' + s;

  return s;
}

function motorDesignation(mot) {
  if (mot == null)
    return '?';
  else
    return prettyName(mot.designation);
}

function motorCommonName(mot) {
  if (mot == null)
    return '?';
  else
    return prettyName(mot.commonName);
}

function manufacturerLink(mfr) {
  if (mfr != null && mfr.abbrev)
    return '/manufacturers/' + encodeURIComponent(mfr.abbrev) + '/details.html';
  else
    return '/manufacturers/';
}

function motorLink(mfr, mot) {
  if (arguments[0] != null && arguments[0]._manufacturer) {
    mot = arguments[0];
    mfr = mot._manufacturer;
  }
  if (mfr != null && mfr.abbrev && mot != null && mot.designation)
    return '/motors/' + encodeURIComponent(mfr.abbrev) + '/' + encodeURIComponent(mot.designation) + '/';
  else
    return '/motors/search.html';
}

function simfileLink(sf) {
  if (sf == null)
    return '/simfiles/';
  if (typeof sf == 'object' && sf._id)
    return '/simfiles/' + sf._id + '/';
  else
    return '/simfiles/' + sf + '/';
}

function simfileDownloadLink(sf) {
  if (sf == null)
    return '/simfiles/';

  let base, ext = '';
  if (typeof sf == 'object' && sf._id) {
    base = '/simfiles/' + sf._id;
    let info = parsers.formatInfo(sf.format);
    if (info != null)
      ext = info.extension;
  } else {
    base = '/simfiles/' + sf;
  }
  return base + '/download/data' + ext;
}

function contributorLink(ct) {
  if (ct == null)
    return '/contributors/';
  if (typeof ct == 'object' && ct._id)
    return '/contributors/' + ct._id + '/';
  else
    return '/contributors/' + ct + '/';
}

function outboxSuffix() {
  let clsNamespace = getNamespace('session');
  let req = clsNamespace != null ? clsNamespace.get('req') : null;
  if (req && req.session && req.session.outbox && req.session.outbox.length > 0)
    return new handlebars.SafeString(' <b>(' + req.session.outbox.length + ')</b>');
  return '';
}

function capitalize(s) {
  var c, words, i;

  if (s == null || s === '')
    return '';

  c = '';
  words = s.trim().split(/\s+/);
  for (i = 0; i < words.length; i++) {
    if (i > 0)
      c += ' ';
    c += words[i].substring(0, 1).toUpperCase() + words[i].substring(1);
  }
  return c;
}

function formatTrend(sigma) {
  var dir, n, s;

  if (sigma > 0.9) {
    dir = 'up';
    n = Math.round(sigma);
  } else if (sigma < -0.9) {
    dir = 'down';
    n = Math.round(sigma);
  } else {
    dir = 'flat';
    n = 0;
  }

  if (handlebars) {
    s = '<img class="trend" src="/images/trend-' + dir + '.png" alt="' + dir + '"> ';
    if (n > 0.5)
      s += '+' + toFixed(n) + '&sigma;';
    else if (n < -0.5)
      s += '&minus;' + toFixed(Math.abs(n)) + '&sigma;';
    else
      s += '&mdash;';
    return new handlebars.SafeString(s);
  }

  return dir;
}

function formatAccuracy(value, reference, threshold) {
  var delta, diff, flag;

  if (reference == null || typeof reference != 'number' || isNaN(reference))
    return '';
  if (typeof threshold != 'number')
    threshold = 10;

  if (value == null || typeof value != 'number' || isNaN(value)) {
    diff = placeholder;
    flag = true;
  } else {
    delta = Math.round(100.0 * (value - reference) / reference);
    if (delta === 0)
      diff = '=';
    else {
      diff = toFixed(delta) + '%';
      if (delta < 0)
        diff = '−' + diff.substring(1);
      else
        diff = '+' + diff;
    }
    flag = Math.abs(delta) >= threshold;
  }
  if (flag && handlebars)
    return new handlebars.SafeString('<span class="inaccurate">' + diff + '</span>');
  else
    return diff;
}

function renderBBCode(text) {
  var html = bbcode.render(text);
  if (handlebars)
    return new handlebars.SafeString(html);
  else
    return html;
}

function json(value) {
  if (value == null)
    value = {};
  return new handlebars.SafeString(JSON.stringify(value));
}

function isDigit(s) {
  return s >= '0' && s < '9';
}

function nameCompare(a, b) {
  // null/empty are the same
  if ((a == null || a === '') && (b == null || b === ''))
    return 0;
  if (a == null || a === '')
    return -1;
  if (b == null || b === '')
    return 1;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b)
    return 0;

  // skip common prefix
  let len = Math.min(a.length, b.length);
  let i = 0;
  for (i = 0; i < len; i++) {
    if (a[i] != b[i])
      break;
  }
  if (i >= a.length)
    return 1;
  if (i >= b.length)
    return -1;
  while (i > 0 && isDigit(a[i - 1]))
    i--;

  // compare digit sequences as entire numbers
  if (isDigit(a[i]) && isDigit(b[i])) {
    let an = parseInt(a.substring(i));
    let bn = parseInt(b.substring(i));
    return an - bn;
  }

  return a.localeCompare(b);
}

/**
 * <p>The helpers module contains site-specific Handlebars helper functions.</p>
 *
 * @module helpers
 */
module.exports = {

  /**
   * Format a number with the specified number of fraction digits.
   * @function
   * @param {number} n value
   * @param {number} [digits] number of fraction digits
   * @return {string} formatted number
   */
  toFixed,

  /**
   * Block helper to check whether two MongoDB IDs are the same.
   * @function
   * @param {object} a ObjectId or Model
   * @param {object} b ObjectId or Model
   * @return {boolean} true if same
   */
  sameId: sameId,

  /**
   * Block helper to check whether a model has been updated after creation.
   * @function
   * @param {object} o Model
   */
  updatedLater: updatedLater,

  /**
   * Block helper to check whether the logged-in user has the required permission.
   * @function
   * @param {string} p permission name
   */
  hasPerm: hasPerm,

  /**
   * Block helper to check whether a user is logged in.
   * @function
   */
  hasLogin,

  /**
   * Block helper to check whether no user is logged in.
   * @function
   */
  noLogin,

  /**
   * Helper to generate an image tag for the current user's avatar.
   * @function
   */
  avatar,

  /**
   * Format a length for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatLength: formatLength,

  /**
   * Format a mass for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatMass: formatMass,

  /**
   * Format a force for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatForce: formatForce,

  /**
   * Format an impulse for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatImpulse: formatImpulse,

  /**
   * Format a velocity for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatVelocity: formatVelocity,

  /**
   * Format an acceleration for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatAcceleration: formatAcceleration,

  /**
   * Format an altitude for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatAltitude: formatAltitude,

  /**
   * Format an temperature for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatTemperature: formatTemperature,

  /**
   * Format a MMT diameter for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatMMT: formatMMT,

  /**
   * Format a duration for display.
   * @function
   * @param {number} v value in seconds
   * @return {string} formatted value
   */
  formatDuration: formatDuration,

  /**
   * Format a duration for display, with varying precision based on the value.
   * @function
   * @param {number} v value in seconds
   * @return {string} formatted value
   */
  formatDurationFine: formatDurationFine,

  /**
   * Format an ISP for display.
   * @function
   * @param {number} v value in MKS
   * @return {string} formatted value
   */
  formatIsp: formatIsp,

  /**
   * Format a coefficient of drag for display.
   * @function
   * @param {number} v value
   * @return {string} formatted value
   */
  formatCD: formatCD,

  /**
   * Format an integer value for display.
   * @function
   * @param {number} v value
   * @return {string} formatted value
   */
  formatInt: formatInt,

  /**
   * Format a positive integer value for display.
   * @function
   * @param {number} v value
   * @return {string} formatted value
   */
  formatPosInt: formatPosInt,

  /**
   * Produce a string with a representation of a number as a count.
   * @function
   * @param {number} value value to format
   * @return {string} formatted count
   */
  formatCount: formatCount,

  /**
   * Format a value for sorting, turning missing values into zero.
   * @function
   * @param {number} v numeric value
   * @return {string} fixed-precision representation
   */
  formatSort: formatSort,

  /**
   * Format a date for display.
   * @function
   * @param {number} v value in milliseconds or Date
   * @param {string} [fmt] format specifier
   * @return {string} formatted value
   */
  formatDate: formatDate,

  /**
   * Format a motor kind.
   * @function
   * @param {string} v stored value
   * @return {string} formatted value
   */
  formatType: formatType,

  /**
   * Format a ratio
   * @function
   * @param {string} v ratio value
   * @return {string} formatted value
   */
  formatRatio: formatRatio,

  /**
   * Format a full motor name, including the manufactur abbreviation.
   * @function
   * @param {object} [mfr] Manufacturer model
   * @param {object} mot Motor model
   * @return {string} manufacturer and designation
   */
  motorFullName: motorFullName,

  /**
   * Format a motor designation.
   * @function
   * @param {object} mot Motor model
   * @return {string} designation
   */
  motorDesignation: motorDesignation,

  /**
   * Format a motor common name.
   * @function
   * @param {object} mot Motor model
   * @return {string} common name
   */
  motorCommonName: motorCommonName,

  /**
   * Produce a link anchor for a URL.
   * @function
   * @param {string} v URL
   * @return {string} domain name
   */
  websiteAnchor: websiteAnchor,

  /**
   * Produce a link anchor for a download file.
   * @function
   * @param {string} v URL
   * @return {string} domain name
   */
  downloadAnchor: downloadAnchor,

  /**
   * Produce a link to the manufacturer page listing their motors.
   * @function
   * @param {object} mfr Manufacturer model
   * @return {string} link to manufacturer info page
   */
  manufacturerLink: manufacturerLink,

  /**
   * Produce a link to the motor information page for this manufacturer.
   * @function
   * @param {object} [mfr] Manufacturer model
   * @param {object} mot Motor model
   * @return {string} link to motor info page
   */
  motorLink: motorLink,

  /**
   * Produce a link to the information page for this contributor.
   * @function
   * @param {object} ct Contributor model or ID
   * @return {string} link to contributor page
   */
  contributorLink: contributorLink,

  /**
   * Produce a link to the information page for this simulator file.
   * @function
   * @param {object} sf SimFile model or ID
   * @return {string} link to simfile info page
   */
  simfileLink: simfileLink,

  /**
   * Produce a link to download this simulator file.
   * @function
   * @param {object} sf SimFile model or ID
   * @return {string} link to download simfile
   */
  simfileDownloadLink: simfileDownloadLink,

  /**
   * Produce a suffix showing how many files are in the outbox.
   * @function
   * @return {string} outbox suffix
   */
  outboxSuffix: outboxSuffix,

  /**
   * Produce a string with each word starting with an upper-case letter.
   * @function
   * @param {string} s original string
   * @return {string} capitalized string
   */
  capitalize: capitalize,

  /**
   * Produce a string with representation of a trend.
   * @function
   * @param {number} sigma number of standard deviations up/down
   * @return {string} formatted string
   */
  formatTrend: formatTrend,

  /**
   * Produce a string with a representation of an accuracy delta.
   * @function
   * @param {number} value value to compare
   * @param {number} reference reference to compare against
   * @param {number} [threshold] percentage threshold to flag as error
   * @return {string} HTML
   */
  formatAccuracy: formatAccuracy,

  /**
   * Produce HTML for a BBCode note.
   * @function
   * @param {string} text BBCode content
   * @return {string} HTML
   */
  renderBBCode: renderBBCode,

  /**
   * Produce serialized JSON for a value.
   * @function
   * @param {object} value
   * @return {string} JSON
   */
  json,

  /**
   * Compare two names, handling numeric subsequences in numeric order and
   * alphabetic sequences in case-insensitive order.
   * @function
   * @param {string} a first string
   * @param {string} b second string
   * @return {number} relative ordering
   */
  nameCompare,

  /**
   * Separator (non-breaking space) and seconds unit.
   */
  SEP_UNIT_S,

  /**
   * Register Handlebars helpers.
   * @function
   * @param {object} hbs Handlebars instance
   */
  help: function(hbs) {
    handlebars = hbs;
    Object.keys(module.exports).forEach(function(p) {
      var v = module.exports[p];
      if (p != 'help' && typeof v == 'function')
        hbs.registerHelper(p, v);
    });
  }
};
