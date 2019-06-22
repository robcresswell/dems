# dems

![License: Apache-2.0](https://img.shields.io/npm/l/dems.svg?style=for-the-badge)
![npm download count](https://img.shields.io/npm/dt/dems.svg?style=for-the-badge)
![Dependency status for latest release](https://img.shields.io/librariesio/release/npm/dems.svg?style=for-the-badge)
![Vulnerability count from Snyk](https://img.shields.io/snyk/vulnerabilities/npm/dems.svg?style=for-the-badge)

> dems is currently at a 0.x release and it may break at any point. Feel free to
> use or test it for one-off bootstrapping, but do not rely on it as part of
> scripts until 1.x has been released.

A combination of `degit` and `ms` (for `mustache`). This is a scaffolding tool
that downloads a given repository from GitHub / GitLab / BitBucket and
optionally replaces any designated variables in it. Without variables, this acts
much the same as [degit](https://github.com/Rich-Harris/degit).

## Getting Started

```console
npx dems user/repo
```

That's it! This will copy the latest commit on the default branch into a local
directory that shares the name of the `repo`. As with `degit`, all git history
is removed during the process, so it appears as a clean repo.

You can also supply an alternate target with an optional second argument:

```console
npx dems user/repo new-dir
```

This will copy the repo to a local `new-dir` directory.

## Templating

During the cloning process, `dems` will parse each file looking for mustache
templating. If any variables are found, it will then launch a wizard asking you
to enter a value for each variable. Finally, the templated files are rendered
with mustache.

To see an example of this, take a look at
[the example repo](https://github.com/robcresswell/dems-example).

## Why should I use this?

This is an experiment for me; I really like the idea of `degit`, but it has some
under-explored concepts around "actions" and I thought I'd take it in a
different direction via templating. I usually find, when using `degit`, that I
have to replace several simple strings; package name and author fields for
example, so `dems` provides a solution. If you also find yourself experiencing
this, give `dems` a go.

## This code is really bad! It's missing \$FEATURE! I found a bug!

[Open an issue](https://github.com/robcresswell/dems/issues/new). If I agree
with you, I'll probably fix the bug / add the feature, but it'll be in my own
time. If you need it sooner, open a Pull Request or fork for your own needs.

## Credits

Big thanks to [Rich Harris](https://github.com/Rich-Harris) for
[degit](https://github.com/Rich-Harris/degit), which provided a bunch of code
and inspiration for this.
