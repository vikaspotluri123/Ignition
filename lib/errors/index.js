const uuid = require('uuid');
const util = require('util');
const each = require('lodash/each');
const merge = require('lodash/merge');
const isString = require('lodash/isString');
const utils = require('./utils');

/**
 * @description Ignition Error Prototype.
 *
 * Ignition offers a set of general & pre-configured error definitions you can use in your project.
 * If you instantiate an error, Ignition will try to set up all error properties based on your input.
 * Ignition errors stick to the format of native errors + add's more custom attributes.
 *
 * @TODO: Move this code into errors.js.
 * @TODO: Re-write and use ES6 class.
 *
 * @param {Object} options
 * @constructor
 */
class IgnitionError extends Error {
    constructor(options = {}) {
        if (isString(options)) {
            throw new Error(
                'Please instantiate Errors with the option pattern. e.g. new errors.IgnitionError({message: ...})'
            );
        }

        super();
        Error.captureStackTrace(this, IgnitionError);

        /**
         * defaults
         */
        this._applyDefaults();
        /**
         * custom overrides
         */
        this.id = options.id || this.id;
        this.statusCode = options.statusCode || this.statusCode;
        this.level = options.level || this.level;
        this.context = options.context || this.context;
        this.help = options.help || this.help;
        this.errorType = this.name = options.errorType || this.errorType;
        this.errorDetails = options.errorDetails;
        this.code = options.code || null;
        this.property = options.property || null;
        this.redirect = options.redirect || null;

        this.message = options.message || this.message;
        this.hideStack = options.hideStack;

        // NOTE: Error to inherit from, override!
        //       Nested objects are getting copied over in one piece (can be changed, but not needed right now)
        if (options.err) {
            // CASE: Support err as string (it happens that third party libs return a string instead of an error instance)
            if (isString(options.err)) {
                options.err = new Error(options.err);
            }

            Object.getOwnPropertyNames(options.err).forEach(function (property) {
                if (['errorType', 'name', 'statusCode', 'message', 'level'].indexOf(property) !== -1) {
                    return;
                }

                // CASE: `code` should put options as priority over err
                if (property === 'code') {
                    this[property] = this[property] || options.err[property];
                    return;
                }

                if (property === 'stack') {
                    this[property] += '\n\n' + options.err[property];
                    return;
                }

                this[property] = options.err[property] || this[property];
            });
        }
    }

    _applyDefaults() {
        this.statusCode = 500;
        this.errorType = 'InternalServerError';
        this.level = 'normal';
        this.message = 'The server has encountered an error.';
        this.id = uuid.v1();
    }
}

// jscs:disable
const errors = {
    InternalServerError: class InternalServerError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 500;
            this.errorType = 'InternalServerError';
            this.level = 'critical';
            this.message = 'The server has encountered an error.';
        }
    },
    IncorrectUsageError: class IncorrectUsageError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 400;
            this.level = 'critical';
            this.errorType = 'IncorrectUsageError';
            this.message = 'We detected a misuse. Please read the stack trace.';
        }
    },
    NotFoundError: class NotFoundError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 404;
            this.errorType = 'NotFoundError';
            this.message = 'Resource could not be found.';
        }
    },
    BadRequestError: class BadRequestError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 400;
            this.errorType = 'BadRequestError';
            this.message = 'The request could not be understood.';
        }
    },
    UnauthorizedError: class UnauthorizedError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 401;
            this.errorType = 'UnauthorizedError';
            this.message = 'You are not authorised to make this request.';
        }
    },
    PasswordResetRequiredError: class PasswordResetRequiredError extends IgnitionError {
        _applyDefaults() {
            super._applyDefaults();
            this.statusCode = 401;
            this.errorType = 'PasswordResetRequiredError';
            this.message = 'As a security precaution, your password must be reset. Click "Forgot?" to receive an email with instructions.';
        }
    },
    NoPermissionError: function NoPermissionError(options) {
        IgnitionError.call(this, merge({
            statusCode: 403,
            errorType: 'NoPermissionError',
            message: 'You do not have permission to perform this request.'
        }, options));
    },
    ValidationError: function ValidationError(options) {
        IgnitionError.call(this, merge({
            statusCode: 422,
            errorType: 'ValidationError',
            message: 'The request failed validation.'
        }, options));
    },
    UnsupportedMediaTypeError: function UnsupportedMediaTypeError(options) {
        IgnitionError.call(this, merge({
            statusCode: 415,
            errorType: 'UnsupportedMediaTypeError',
            message: 'The media in the request is not supported by the server.'
        }, options));
    },
    TooManyRequestsError: function TooManyRequestsError(options) {
        IgnitionError.call(this, merge({
            statusCode: 429,
            errorType: 'TooManyRequestsError',
            message: 'Server has received too many similar requests in a short space of time.'
        }, options));
    },
    MaintenanceError: function MaintenanceError(options) {
        IgnitionError.call(this, merge({
            statusCode: 503,
            errorType: 'MaintenanceError',
            message: 'The server is temporarily down for maintenance.'
        }, options));
    },
    MethodNotAllowedError: function MethodNotAllowedError(options) {
        IgnitionError.call(this, merge({
            statusCode: 405,
            errorType: 'MethodNotAllowedError',
            message: 'Method not allowed for resource.'
        }, options));
    },
    RequestEntityTooLargeError: function RequestEntityTooLargeError(options) {
        IgnitionError.call(this, merge({
            statusCode: 413,
            errorType: 'RequestEntityTooLargeError',
            message: 'Request was too big for the server to handle.'
        }, options));
    },
    TokenRevocationError: function TokenRevocationError(options) {
        IgnitionError.call(this, merge({
            statusCode: 503,
            errorType: 'TokenRevocationError',
            message: 'Token is no longer available.'
        }, options));
    },
    VersionMismatchError: function VersionMismatchError(options) {
        IgnitionError.call(this, merge({
            statusCode: 400,
            errorType: 'VersionMismatchError',
            message: 'Requested version does not match server version.'
        }, options));
    }
};

util.inherits(IgnitionError, Error);
each(errors, function (error) {
    util.inherits(error, IgnitionError);
});

module.exports = errors;
module.exports.IgnitionError = IgnitionError;
module.exports.utils = {
    serialize: utils.serialize.bind(errors),
    deserialize: utils.deserialize.bind(errors),
    isIgnitionError: utils.isIgnitionError.bind(errors)
};


