#!/bin/bash

# Aumentar o timeout para evitar falhas em ambientes de CI
export NODE_OPTIONS="--experimental-vm-modules --max-old-space-size=4096"

# Run backend tests
echo "Running backend tests..."
npx jest --config=jest.config.ts --testTimeout=60000 --forceExit

# Run frontend tests
echo "Running frontend tests..."
npx jest --config=jest.client.config.ts --testTimeout=60000 --forceExit
