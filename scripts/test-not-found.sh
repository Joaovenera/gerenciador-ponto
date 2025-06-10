#!/bin/bash

# Set up environment variables for testing
export NODE_OPTIONS="--experimental-vm-modules --max-old-space-size=4096"
export NODE_ENV=test

# Run only the not-found test file
echo "Running NotFound component tests..."
npx jest client/src/__tests__/components/not-found.test.tsx --config=jest.client.config.ts --verbose --testTimeout=60000 --forceExit
