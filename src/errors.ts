abstract class CustomError extends Error {
  public code: number;

  public constructor(code = 1, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class MissingSourceArgError extends CustomError {
  public constructor() {
    super(2, 'dems requires a valid source URL as the first argument');
  }
}

export class InvalidSourceError extends CustomError {
  public constructor() {
    super(
      3,
      'dems failed to parse the source URL. dems supports GitHub, BitBucket and GitLab. If your URL is for one of these SCM systems, it may have a typo',
    );
  }
}

export class DestExistsError extends CustomError {
  public constructor() {
    super(4, 'The destination directory already exists');
  }
}
