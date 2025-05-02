#!/bin/bash

# Run backend tests
echo "Running backend tests..."
node --experimental-vm-modules node_modules/jest/bin/jest.js --config=jest.config.ts

# Run frontend tests
echo "Running frontend tests..."
node --experimental-vm-modules node_modules/jest/bin/jest.js --config=jest.client.config.ts
