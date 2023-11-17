## Initial Setup

> [!NOTE]
>
> You'll need to have a reasonably modern version of [Node.js](https://nodejs.org) handy (20.x or later should work!).
> If you are using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), this template has a `.node-version` file at the root of the repository that
> will be used to automatically switch to the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node` actions.
> 
> If you're using [Volta](https://volta.sh) there is no need to do anything, as it will automatically detect the correct
> version.

1. :hammer_and_wrench: Install the dependencies

```bash
npm install
```

2:white_check_mark: Run tests

```bash
$ npm test

 PASS  __tests__/main.test.ts
  action
    √ errors on invalid input (6 ms)                                                                                                                                                                           
    √ does nothing with no libraries passed in (237 ms)                                                                                                                                                        
    √ does updates in only matched project (116 ms)                                                                                                                                                            
    √ does updates in all matched projects (111 ms)                                                                                                                                                            
    √ fails action when dotnet call fails (115 ms)

...
```

3:building_construction: Package the TypeScript for distribution

```bash
npm run package
```

## Actions

### `update-nuget-dependencies`

This action is used to update NuGet dependencies in all projects of a solution. It has limited checking to ensure it
does not accidentally add a new dependency to a project that does not already have it.

This action requires that `dotnet` is available in the environment. It is recommended to use the `actions/setup-dotnet`
action to ensure the correct version of `dotnet` is available.

The action accepts `libraries` as a JSON object. The object should be a mapping of library name to version. The version
can be a specific version, or a version range.

```json
{
  "library-name": "1.0.0",
  "other-library": "2.0.0"
}
```

<details>
<summary>Workflow example</summary>

```yaml
name: Library Updated

on:
  repository_dispatch:
    types:
      - library_updated

jobs:
  update_library:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup dotnet
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 7.x
          source-url: https://nuget.pkg.github.com/cfacorp/index.json
        env:
          NUGET_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Add updated libraries to solution
        uses: tehbilly/rex-actions/update-nuget-dependencies@v1
        with:
          libraries: ${{ toJSON(github.event.client_payload.libraries) }}
```
</details>

## Versioning

After testing, you can create version tag(s) that developers can use to reference different stable versions of your
action. For more information, see [Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.
