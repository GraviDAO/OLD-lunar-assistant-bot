export class UserDocMissingError extends Error {
  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UserDocMissingError.prototype);
  }
}

export class RandomEarthAPIError extends Error {
  constructor(m: string) {
    super(m);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RandomEarthAPIError.prototype);
  }
}
