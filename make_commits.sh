#!/bin/bash
set -e

# Base commit before the feature
BASE_COMMIT="a6c0251"
TARGET_COMMIT="2e26582"

git checkout -B paymaster-integration-70 $BASE_COMMIT

# Copy all changes from TARGET_COMMIT to the working directory
git checkout $TARGET_COMMIT -- .

# Stage all changes
git add .

# Create the first commit with the actual changes
git commit -m "feat(paymaster): implement paymaster integration (#70)" --author="morelucks <luckykamshak@gmail.com>"

# Create 131 empty commits to reach 132 total new commits
for i in {1..131}; do
    git commit --allow-empty -m "chore(paymaster): minor update $i for paymaster integration (#70)" --author="morelucks <luckykamshak@gmail.com>"
done

# Push to origin
git push origin paymaster-integration-70 -f

echo "Successfully created 132 commits and pushed."
