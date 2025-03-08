#!/bin/bash

set -euxo pipefail

echo "Pruning local artifacts"
rm -rf "./artifacts"

echo "Pruning XCode artifacts"
rm -rf ~/Library/Developer/Xcode/DerivedData/WalkMate-*
