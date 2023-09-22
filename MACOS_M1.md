# Installation of MacOS with M1 chip

- [Installation of MacOS with M1 chip](#installation-of-macos-with-m1-chip)
    - [Method 1: Rosetta Terminal](#method-1-rosetta-terminal)
    - [Method 2](#method-2)

For Apple M1, it's best to have Node v14.

There are two ways to install this package on a MacOS with M1 chip:

#### Method 1: Rosetta Terminal

1. If you don't have a Rosetta Terminal, go to Finder, then in the menu bar go to Go > Utilities. Duplicate "Terminal" and rename it to "Rosetta Terminal" or anything you want. Then click on the duplicate you create it and press "command + I" and choose "Open using Rosetta".
2. Open the Rosetta Terminal you created, uninstall and then install Node again.
3. Install this package again.

#### Method 2

1. In the terminal run: arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg
2. Try installing this package again.

You might also need to add the following to `~/.zshrc`:

```bash
export PKG_CONFIG_PATH="/opt/homebrew/Cellar:/opt/homebrew/lib/pkgconfig:/opt/homebrew/share/pkgconfig"
```