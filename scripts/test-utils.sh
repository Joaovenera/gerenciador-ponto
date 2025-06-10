#!/bin/bash

# Set up environment variables for testing
export NODE_OPTIONS="--experimental-vm-modules --max-old-space-size=4096"
export NODE_ENV=test

# Run only the utils test file
echo "Running utils tests..."
npx jest client/src/__tests__/utils.test.ts --config=jest.client.config.ts --verbose --testTimeout=60000 --forceExit
