#!/bin/bash

# Run backend tests
echo "Running backend tests..."
NODE_OPTIONS="--experimental-vm-modules" npx jest --config=jest.config.ts --testTimeout=10000

# Run frontend tests
echo "Running frontend tests..."
NODE_OPTIONS="--experimental-vm-modules" npx jest --config=jest.client.config.ts --testTimeout=10000
