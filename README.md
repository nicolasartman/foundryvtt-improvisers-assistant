# FoundryVTT Improviser Assistant

This module helps generate tokens and assets when improvising in a tabletop RPG session. It aims to provide a smooth and efficient workflow that's so fast, you can feasibly generate assets on the fly.

It is not intended to be a replacement for good preparation or ethically sourcing quality assets. It seeks not to replace existing tools and artists but to enable a new kind of ad-hoc visual storytelling that is quick and improvisational—one that augments the many great ways to run TTRPGs by adding one more.

# Release Process

To create a new release, make a version tag in the format vx.y.z, push it up, then run a build like so `env MODULE_VERSION=1.0.0 GH_PROJECT=nicolasartman/foundryvtt-improvisers-assistant GH_TAG=v1.0.0 yarn build`, then create a new release (e.g. named `v1.0.0`) on GitHub and attach a zip of the dist directory named `module.zip` and `dist/module.json` as artifacts.
