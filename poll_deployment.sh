#!/bin/bash

OPERATION_ID=$1

if [ -z "$OPERATION_ID" ]; then
    echo "Usage: $0 <operation_id>"
    exit 1
fi

echo "Monitoring Deployment Operation: $OPERATION_ID"

while true; do
    # Get the operation status
    RESULT=$(/opt/homebrew/bin/gcloud design-center operations describe $OPERATION_ID 2>&1)
    
    # Check if we got 'done: true' (this will also match DONE=True depending on API, but let's check for done: true)
    if echo "$RESULT" | grep -q "done: true"; then
        echo -e "\n✅ Operation Finished!"
        # Check for errors
        if echo "$RESULT" | grep -q "error:"; then
            echo "❌ Deployment Failed. Error Details:"
            echo "$RESULT" | grep -A 20 "error:"
            exit 1
        else
            echo "🎉 Deployment Succeeded!"
            exit 0
        fi
    fi
    
    # Print a loading indicator
    echo -n "⏳ "
    sleep 30
done
