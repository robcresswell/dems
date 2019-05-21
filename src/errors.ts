export {
  InvalidSourceError,
  UnsupportedScmError,
  MissingSourceArgError,
  DestExistsError,
};

class CustomError extends Error {
  code: number;

  constructor(code: number = 1, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

class MissingSourceArgError extends CustomError {
  constructor() {
    super(2, 'dems requires a valid source URL as the first argument');
  }
}

class InvalidSourceError extends CustomError {
  constructor() {
    super(
      3,
      'dems failed to parse the source URL. dems supports GitHub, BitBucket and GitLab. If your URL is for one of these SCM systems, it may have a typo',
    );
  }
}

class UnsupportedScmError extends CustomError {
  constructor() {
    super(4, 'dems supports GitHub, BitBucket and GitLab');
  }
}

class DestExistsError extends CustomError {
  constructor() {
    super(5, 'The destination directory already exists');
  }
}
