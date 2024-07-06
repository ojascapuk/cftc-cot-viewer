/* 
This code defines an abstract class LibhackCustomError that extends the built-in Error class. It customizes the error 
name to match the class name and restores the prototype chain to ensure compatibility with older JavaScript environments. 
The class also ensures that stack traces work correctly by using 
Error.captureStackTrace if available. This setup allows for creating custom error 
classes that behave consistently across different environments.

*/

export abstract class LibhackCustomError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    // Calls the parent class (Error) constructor with the provided message and options

    // Set the error name as the constructor name
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      // Uses the name of the class that extends LibhackCustomError as the error name
      enumerable: false, // Ensures the name property is not enumerable
      configurable: true, // Allows the name property to be configurable
    });

    // Restore prototype chain
    // This is a workaround for extending built-in objects and for compatibility with ES5
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(this, new.target.prototype);
    } else {
      // For older environments like IE11
      (this as any).__proto__ = new.target.prototype;
    }

    // Make stack traces work correctly
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
