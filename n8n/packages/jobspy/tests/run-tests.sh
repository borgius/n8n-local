#!/usr/bin/env bash

# Script to run the jobspy tests

# Set default values
RUN_UNIT_TESTS=true
RUN_INTEGRATION_TESTS=false
SKIP_TYPE_CHECK=false

# Parse command line options
while [[ $# -gt 0 ]]; do
    case "$1" in
    --unit=*)
        RUN_UNIT_TESTS="${1#*=}"
        shift
        ;;
    --integration=*)
        RUN_INTEGRATION_TESTS="${1#*=}"
        shift
        ;;
    --skip-type-check)
        SKIP_TYPE_CHECK=true
        shift
        ;;
    --help)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --unit=true|false       Run unit tests (default: true)"
        echo "  --integration=true|false Run integration tests (default: false)"
        echo "  --skip-type-check       Skip TypeScript type checking (default: false)"
        echo "  --help                  Show this help message"
        exit 0
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information."
        exit 1
        ;;
    esac
done

# Build base command with permissions
BASE_CMD="deno test -A"

# Add type checking flag if needed
if [ "$SKIP_TYPE_CHECK" = true ]; then
    BASE_CMD="$BASE_CMD --no-check"
fi

# Run unit tests if requested
if [ "$RUN_UNIT_TESTS" = true ]; then
    echo "🧪 Running unit tests..."
    UNIT_CMD="$BASE_CMD ./index.test.ts"
    echo "> $UNIT_CMD"
    $UNIT_CMD
    UNIT_RESULT=$?
    echo ""
fi

# Run integration tests if requested
if [ "$RUN_INTEGRATION_TESTS" = true ]; then
    echo "🔄 Running integration tests..."
    INTEGRATION_CMD="$BASE_CMD ./integration.test.ts"
    echo "> $INTEGRATION_CMD"
    $INTEGRATION_CMD
    INTEGRATION_RESULT=$?
    echo ""
fi

# Determine final exit code
if [ "$RUN_UNIT_TESTS" = true ] && [ "$RUN_INTEGRATION_TESTS" = true ]; then
    # If both tests were run, fail if either failed
    if [ $UNIT_RESULT -ne 0 ] || [ $INTEGRATION_RESULT -ne 0 ]; then
        echo "❌ Tests failed"
        exit 1
    else
        echo "✅ All tests passed"
        exit 0
    fi
elif [ "$RUN_UNIT_TESTS" = true ]; then
    # If only unit tests were run, use their exit code
    if [ $UNIT_RESULT -ne 0 ]; then
        echo "❌ Unit tests failed"
        exit $UNIT_RESULT
    else
        echo "✅ Unit tests passed"
        exit 0
    fi
elif [ "$RUN_INTEGRATION_TESTS" = true ]; then
    # If only integration tests were run, use their exit code
    if [ $INTEGRATION_RESULT -ne 0 ]; then
        echo "❌ Integration tests failed"
        exit $INTEGRATION_RESULT
    else
        echo "✅ Integration tests passed"
        exit 0
    fi
else
    echo "No tests were run. Use --unit=true or --integration=true."
    exit 1
fi
