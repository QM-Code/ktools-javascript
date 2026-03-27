# Karma CLI Parsing SDK (JavaScript)

`kcli` is the JavaScript implementation of the ktools CLI parsing SDK.

It supports:

- top-level options such as `--verbose`
- inline roots such as `--trace-*` and `--build-*`
- alias rewrites
- deferred handler execution after full validation

## Documentation

- [API reference](docs/api.md)

## Build And Test

```bash
./kbuild.py --build-latest
./kbuild.py --build-demos
```

Direct source-level tests:

```bash
node --test tests/*.js demo/tests/*.js
```
