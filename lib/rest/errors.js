'use strict';

class RestError extends Error {
    constructor(statusCode, ...args) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...args);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) Error.captureStackTrace(this, RestError);

        // Custom debugging information
        this.name = 'REST error'
        this.statusCode = statusCode;
    }
}

class TooManyAttemptsError extends RestError {
    constructor(error, operationName, ...args) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(error.statusCode, ...args);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) Error.captureStackTrace(this, RestError);

        // Custom debugging information
        this.name = 'Too many attempts error'
        this.message = `${operationName} failed too many times. Last error: ${error.message}`
    }
}

module.exports = {
    RestError,
    TooManyAttemptsError
}
